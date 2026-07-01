import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const voiceFile = path.join(root, "pet-voices.js");
const audioRoot = path.join(root, "assets", "audio");
const audioExtensions = new Set([".mp3", ".ogg", ".wav", ".m4a"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (!audioExtensions.has(path.extname(entry.name).toLowerCase())) return [];
    return [fullPath];
  });
}

function flattenVoices(value, trail = []) {
  if (!value || typeof value !== "object") return [];
  if ("text" in value && "audio" in value) {
    return [{ label: trail.join("."), text: String(value.text || ""), audio: value.audio }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenVoices(item, trail.concat(String(index))));
  }
  return Object.entries(value).flatMap(([key, item]) => flattenVoices(item, trail.concat(key)));
}

const source = fs.readFileSync(voiceFile, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: voiceFile });

const entries = flattenVoices(sandbox.window.PET_VOICE_LIBRARY);
const audioFiles = walk(audioRoot);
const normalizedFiles = new Map(audioFiles.map((file) => [
  `./${path.relative(root, file).replaceAll(path.sep, "/")}`,
  file,
]));
const referenced = new Set(entries.map((entry) => entry.audio).filter(Boolean));
const missing = entries
  .filter((entry) => entry.audio && !normalizedFiles.has(entry.audio))
  .map((entry) => ({ label: entry.label, audio: entry.audio, text: entry.text }));
const nullAudio = entries
  .filter((entry) => !entry.audio)
  .map((entry) => ({ label: entry.label, text: entry.text }));
const unused = [...normalizedFiles.keys()].filter((file) => !referenced.has(file));

console.log(`Voice mappings: ${entries.length}`);
console.log(`Valid referenced files: ${referenced.size - missing.length}`);
console.log(`Audio files on disk: ${audioFiles.length}`);
console.log(`Missing files: ${missing.length}`);
missing.forEach((item) => console.log(`  - ${item.label}: ${item.audio} :: ${item.text}`));
console.log(`audio: null entries: ${nullAudio.length}`);
nullAudio.forEach((item) => console.log(`  - ${item.label}: ${item.text}`));
console.log(`Unused audio files: ${unused.length}`);
unused.forEach((file) => console.log(`  - ${file}`));

if (missing.length) process.exitCode = 1;

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const PART_SIZE = 10 * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg"]);

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({ ok: true }, 200, cors);
      }
      if (!cors["Access-Control-Allow-Origin"]) return text("Origin is not allowed", 403, cors);
      const user = await requireOwner(request, env);
      if (url.pathname === "/api/video/init" && request.method === "POST") return initUpload(request, env, user, cors);
      if (url.pathname === "/api/video/part" && request.method === "PUT") return uploadPart(request, env, cors);
      if (url.pathname === "/api/video/complete" && request.method === "POST") return completeUpload(request, env, cors);
      if (url.pathname === "/api/video/abort" && request.method === "POST") return abortUpload(request, env, cors);
      return text("Not found", 404, cors);
    } catch (error) {
      const status = error.status || 500;
      return text(error.message || "Upload failed", status, cors);
    }
  },
};

async function requireOwner(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw httpError(401, "Missing Supabase access token");
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_ANON_KEY,
    },
  });
  if (!response.ok) throw httpError(401, "Invalid Supabase session");
  const user = await response.json();
  if (user.id !== env.OWNER_USER_ID) throw httpError(403, "Only the blog owner can upload videos");
  return user;
}

async function initUpload(request, env, user, cors) {
  const body = await request.json();
  const filename = safeFilename(body.filename || "video");
  const contentType = String(body.contentType || "");
  const size = Number(body.size || 0);
  if (!VIDEO_TYPES.has(contentType)) throw httpError(400, "Unsupported video type");
  if (!Number.isFinite(size) || size <= 0) throw httpError(400, "Invalid file size");
  if (size > MAX_VIDEO_SIZE) throw httpError(400, "Video exceeds 500MB");
  const key = `videos/${user.id}/${crypto.randomUUID()}-${filename}`;
  const upload = await env.VIDEO_BUCKET.createMultipartUpload(key, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  return json({ key, uploadId: upload.uploadId, partSize: PART_SIZE }, 200, cors);
}

async function uploadPart(request, env, cors) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const uploadId = url.searchParams.get("uploadId");
  const partNumber = Number(url.searchParams.get("partNumber"));
  if (!key || !uploadId || !Number.isInteger(partNumber) || partNumber < 1) throw httpError(400, "Invalid part request");
  const upload = env.VIDEO_BUCKET.resumeMultipartUpload(key, uploadId);
  const part = await upload.uploadPart(partNumber, request.body);
  return json({ partNumber, etag: part.etag }, 200, cors);
}

async function completeUpload(request, env, cors) {
  const body = await request.json();
  const parts = [...(body.parts || [])].sort((a, b) => a.partNumber - b.partNumber);
  const seen = new Set();
  for (const part of parts) {
    if (!Number.isInteger(part.partNumber) || !part.etag) throw httpError(400, "Invalid multipart list");
    if (seen.has(part.partNumber)) throw httpError(400, "Duplicate part number");
    seen.add(part.partNumber);
  }
  const upload = env.VIDEO_BUCKET.resumeMultipartUpload(body.key, body.uploadId);
  await upload.complete(parts);
  const base = String(env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  return json({ key: body.key, url: `${base}/${body.key}`, provider: "cloudflare-r2" }, 200, cors);
}

async function abortUpload(request, env, cors) {
  const body = await request.json();
  if (!body.key || !body.uploadId) throw httpError(400, "Invalid abort request");
  await env.VIDEO_BUCKET.resumeMultipartUpload(body.key, body.uploadId).abort();
  return json({ ok: true }, 200, cors);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean);
  const headers = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
  };
  if (allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function safeFilename(value) {
  return String(value).normalize("NFKD").replace(/[^\w.\-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "video";
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
}

function text(message, status, headers) {
  return new Response(message, { status, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

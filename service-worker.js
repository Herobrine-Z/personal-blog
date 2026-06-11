const CACHE_NAME = "hutao-blog-v16";
const APP_SHELL = [
  "./",
  "./index.html",
  "./articles.html",
  "./article.html",
  "./videos.html",
  "./kurumi.html",
  "./pet.html",
  "./styles.css",
  "./pet.css",
  "./article-pages.css",
  "./script.js",
  "./articles.js",
  "./article-detail.js",
  "./videos.js",
  "./article-service.js",
  "./markdown.js",
  "./theme.js",
  "./kurumi.js",
  "./pet-rig.js",
  "./pet.js",
  "./assets/icon.png",
  "./assets/ink-hero.png",
  "./assets/ink-scroll.png",
  "./assets/kurumi-portrait-red-moon.png",
  "./assets/kurumi-tiger.png",
  "./assets/kurumi-spring-smile.png",
  "./assets/kurumi-mountains.png",
  "./assets/kurumi-vertical.png",
  "./assets/hutao.png",
  "./assets/hutao-rig/body.png",
  "./assets/hutao-rig/calf-left.png",
  "./assets/hutao-rig/calf-right.png",
  "./assets/hutao-rig/eye-left.png",
  "./assets/hutao-rig/eye-right.png",
  "./assets/hutao-rig/face.png",
  "./assets/hutao-rig/forearm-left.png",
  "./assets/hutao-rig/forearm-right.png",
  "./assets/hutao-rig/hair.png",
  "./assets/hutao-rig/hat.png",
  "./assets/hutao-rig/mouth.png",
  "./assets/hutao-rig/thigh-left.png",
  "./assets/hutao-rig/thigh-right.png",
  "./assets/hutao-rig/upper-arm-left.png",
  "./assets/hutao-rig/upper-arm-right.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html"))),
  );
});

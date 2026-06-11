const CACHE_NAME = "hutao-blog-v13";
const APP_SHELL = [
  "./",
  "./index.html",
  "./articles.html",
  "./article.html",
  "./videos.html",
  "./kurumi.html",
  "./styles.css",
  "./article-pages.css",
  "./script.js",
  "./articles.js",
  "./article-detail.js",
  "./videos.js",
  "./article-service.js",
  "./markdown.js",
  "./theme.js",
  "./kurumi.js",
  "./assets/icon.png",
  "./assets/ink-hero.png",
  "./assets/ink-scroll.png",
  "./assets/kurumi-portrait-red-moon.png",
  "./assets/kurumi-tiger.png",
  "./assets/kurumi-spring-smile.png",
  "./assets/kurumi-mountains.png",
  "./assets/kurumi-vertical.png"
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

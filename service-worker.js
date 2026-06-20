const CACHE_NAME = "hutao-blog-v46";
const APP_SHELL = [
  "./",
  "./index.html",
  "./articles.html",
  "./article.html",
  "./videos.html",
  "./kurumi.html",
  "./pet.html",
  "./manifest.webmanifest",
  "./styles.css",
  "./phase1-effects.css",
  "./phase2-effects.css",
  "./next-effects.css",
  "./minimal-ink.css",
  "./art-scroll.css",
  "./hutao-exhibit.css",
  "./page-motion.css",
  "./pet.css",
  "./article-pages.css",
  "./script.js",
  "./phase1-effects.js",
  "./phase2-effects.js",
  "./next-effects.js",
  "./minimal-ink.js",
  "./art-scroll.js",
  "./hutao-exhibit.js",
  "./page-motion.js",
  "./articles.js",
  "./article-detail.js",
  "./videos.js",
  "./article-service.js",
  "./markdown.js",
  "./theme.js",
  "./kurumi.js",
  "./pet-rig.js",
  "./pet.js",
  "./assets/vendor/live2dcubismcore.min.js",
  "./assets/vendor/pixi.min.js",
  "./assets/vendor/pixi-live2d-display.min.js",
  "./assets/models/HutaoSeethrough/seethrough_output.model3.json",
  "./assets/models/HutaoSeethrough/seethrough_output.moc3",
  "./assets/models/HutaoSeethrough/seethrough_output.physics3.json",
  "./assets/models/HutaoSeethrough/seethrough_output.cdi3.json",
  "./assets/models/HutaoSeethrough/seethrough_output.motionsync3.json",
  "./assets/models/HutaoSeethrough/seethrough_output.2048/texture_00.png",
  "./assets/models/Fireman/Fireman.model3.json",
  "./assets/models/Fireman/Fireman.moc3",
  "./assets/models/Fireman/Fireman.physics3.json",
  "./assets/models/Fireman/Fireman.cdi3.json",
  "./assets/models/Fireman/Fireman.motionsync3.json",
  "./assets/models/Fireman/Fireman.2048/texture_00.png",
  "./assets/models/Zhang/Zhang.model3.json",
  "./assets/models/Zhang/Zhang.moc3",
  "./assets/models/Zhang/Zhang.physics3.json",
  "./assets/models/Zhang/Zhang.cdi3.json",
  "./assets/models/Zhang/Zhang.2048/texture_00.png",
  "./assets/icon.png",
  "./assets/hutao-entry-shanshui.png",
  "./assets/ink-hero.png",
  "./assets/ink-scroll.png",
  "./assets/phase1/scroll_paper_full.png",
  "./assets/phase1/scroll_rod_left.png",
  "./assets/phase1/scroll_rod_right.png",
  "./assets/phase1/ink_splash_mask.png",
  "./assets/phase1/peach_petals_sprites.png",
  "./assets/phase1/ink_mountain_bg.png",
  "./assets/phase1/decor_corner_peach.png",
  "./assets/next/favicon.ico",
  "./assets/next/favicon_hutao_tigerhat_ink_16.png",
  "./assets/next/favicon_hutao_tigerhat_ink_32.png",
  "./assets/next/favicon_hutao_tigerhat_ink_64.png",
  "./assets/next/favicon_hutao_tigerhat_ink_128.png",
  "./assets/next/favicon_hutao_tigerhat_ink_180.png",
  "./assets/next/favicon_hutao_tigerhat_ink_256.png",
  "./assets/next/favicon_hutao_tigerhat_ink_512.png",
  "./assets/next/favicon_hutao_tigerhat_ink_1024.png",
  "./assets/next/hero_bg_from_mp4_optimized.gif",
  "./assets/next/palette.png",
  "./assets/next/parallax_mist_foreground.png",
  "./assets/next/parallax_mountain_mid.png",
  "./assets/next/parallax_peach_branch_foreground.png",
  "./assets/next/ui_input_brush_frame.png",
  "./assets/next/ui_speech_bubble_jianghu.png",
  "./assets/next/ui_toast_ink_banner.png",
  "./assets/minimal-ink/article_card_minimal.png",
  "./assets/minimal-ink/comment_input_minimal.png",
  "./assets/minimal-ink/petals_minimal_sprite.png",
  "./assets/minimal-ink/toast_seal_banner_minimal.png",
  "./assets/art-scroll/floating_mist_layer.png",
  "./assets/art-scroll/parallax_mountain_layer_1.png",
  "./assets/art-scroll/parallax_mountain_layer_2.png",
  "./assets/art-scroll/parallax_mountain_layer_3.png",
  "./assets/art-scroll/section_divider_scroll.png",
  "./assets/art-scroll/transition_brush_wave.png",
  "./assets/art-scroll/transition_ink_ribbon.png",
  "./assets/art-scroll/transition_scroll_reveal.png",
  "./assets/hutao-ink/BambooLeaf_01.png",
  "./assets/hutao-ink/InkCardFrame.png",
  "./assets/hutao-ink/InkFog_01.png",
  "./assets/hutao-ink/InkFog_02.png",
  "./assets/hutao-ink/InkFog_03.png",
  "./assets/hutao-ink/InkMountain_01.png",
  "./assets/hutao-ink/InkMountain_02.png",
  "./assets/hutao-ink/InkMountain_03.png",
  "./assets/hutao-ink/InkParticle_01.png",
  "./assets/hutao-ink/InkParticle_02.png",
  "./assets/hutao-ink/JadePlayButton.png",
  "./assets/hutao-ink/PaperTexture.png",
  "./assets/kurumi-portrait-red-moon.png",
  "./assets/kurumi-tiger.png",
  "./assets/kurumi-spring-smile.png",
  "./assets/kurumi-mountains.png",
  "./assets/kurumi-vertical.png",
  "./assets/hutao.png",
  "./assets/live2d/reference_sheets/character_full_reference.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL.map((asset) => cache.add(asset))),
    ),
  );
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

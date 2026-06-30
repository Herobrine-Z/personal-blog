(function () {
  "use strict";

  if (window.InkLottie?.ready) return;

  const script = document.currentScript;
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarseQuery = window.matchMedia("(max-width: 840px), (pointer: coarse)");
  const saveData = (navigator.connection || navigator.mozConnection || navigator.webkitConnection)?.saveData === true;
  const animationCache = new Map();
  const instances = new Set();
  const config = {
    inkLoading: "ink-loading.json",
    inkDrop: "ink-drop-loading.json",
    scrollOpen: "scroll-open.json",
    bambooLeaves: "bamboo-leaf-fall.json",
    inkSplash: "ink-splash-transition.json",
    sealStamp: "red-seal-stamp.json",
  };

  function asset(path) {
    return new URL(path, script?.src || document.baseURI).href;
  }

  function lottiePath(name) {
    return asset(`./assets/lottie/${name}`);
  }

  function isReduced() {
    return reduceQuery.matches;
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function loadData(name) {
    if (!animationCache.has(name)) {
      animationCache.set(
        name,
        fetch(lottiePath(name), { cache: "force-cache" }).then((response) => {
          if (!response.ok) throw new Error(`Lottie not found: ${name}`);
          return response.json();
        }),
      );
    }
    return animationCache.get(name);
  }

  async function createAnimation(container, options = {}) {
    if (!container || isReduced() || typeof window.lottie === "undefined") return null;
    const data = options.animationData || await loadData(options.name);
    const instance = window.lottie.loadAnimation({
      container,
      renderer: options.renderer || "svg",
      loop: Boolean(options.loop),
      autoplay: options.autoplay !== false,
      animationData: data,
      rendererSettings: {
        preserveAspectRatio: options.preserveAspectRatio || "xMidYMid meet",
        progressiveLoad: true,
      },
    });
    instance.__inkLottieLoop = Boolean(options.loop);
    if (options.speed) instance.setSpeed(options.speed);
    instances.add(instance);
    instance.addEventListener("destroy", () => instances.delete(instance));
    if (typeof options.onComplete === "function") {
      instance.addEventListener("complete", options.onComplete);
    }
    return instance;
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function withTimeout(promise, ms) {
    return Promise.race([promise, wait(ms)]);
  }

  function criticalImagesReady() {
    const images = Array.from(document.images || []).filter((image) => {
      const rect = image.getBoundingClientRect();
      return image.getAttribute("fetchpriority") === "high" || rect.top < window.innerHeight * 1.15;
    });
    return Promise.allSettled(
      images.map((image) => {
        if (image.complete && image.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }),
    );
  }

  function fontsReady() {
    return document.fonts?.ready?.catch(() => {}) || Promise.resolve();
  }

  async function setupSiteLoader() {
    if (document.querySelector(".ink-site-loader")) return;
    const loader = document.createElement("div");
    loader.className = "ink-site-loader";
    loader.setAttribute("aria-hidden", "true");
    loader.innerHTML = [
      '<div class="ink-site-loader__inner">',
      '<div class="ink-site-loader__animation"></div>',
      '<p class="ink-site-loader__text">墨卷初开</p>',
      "</div>",
    ].join("");
    document.body.prepend(loader);

    const animationNode = loader.querySelector(".ink-site-loader__animation");
    let animation = null;
    try {
      animation = await createAnimation(animationNode, {
        name: config.inkLoading,
        loop: true,
        preserveAspectRatio: "xMidYMid meet",
      });
    } catch (error) {
      console.warn("[InkLottie] loading animation failed", error);
      animationNode.classList.add("ink-site-loader__fallback");
    }

    await Promise.allSettled([
      wait(isReduced() ? 120 : 680),
      withTimeout(Promise.allSettled([criticalImagesReady(), fontsReady()]), 3600),
    ]);
    await wait(saveData || isReduced() ? 80 : 120);
    loader.classList.add("is-leaving");
    loader.addEventListener("transitionend", () => {
      animation?.destroy();
      loader.remove();
    }, { once: true });
    window.setTimeout(() => {
      animation?.destroy();
      loader.remove();
    }, 900);
  }

  function ensureTransitionLayer() {
    let veil = document.querySelector(".ink-page-transition");
    if (!veil) {
      veil = document.createElement("div");
      veil.className = "ink-page-transition";
      veil.setAttribute("aria-hidden", "true");
      document.body.prepend(veil);
    }
    let lottieNode = veil.querySelector(".ink-page-transition__lottie");
    if (!lottieNode) {
      lottieNode = document.createElement("div");
      lottieNode.className = "ink-page-transition__lottie";
      veil.appendChild(lottieNode);
    }
    return { veil, lottieNode };
  }

  async function playPageTransition() {
    if (isReduced()) return wait(10);
    const { lottieNode } = ensureTransitionLayer();
    document.body.classList.add("lottie-transition-active");
    try {
      const animation = await createAnimation(lottieNode, {
        name: config.inkSplash,
        loop: false,
        preserveAspectRatio: "xMidYMid slice",
        speed: 1.2,
      });
      await wait(coarseQuery.matches ? 380 : 430);
      window.setTimeout(() => animation?.destroy(), 1100);
    } catch (error) {
      console.warn("[InkLottie] transition animation failed", error);
      await wait(160);
    }
  }

  function resetPageTransition() {
    document.body.classList.remove("lottie-transition-active");
    document.querySelector(".ink-page-transition__lottie")?.replaceChildren();
  }

  async function setupBambooLeaves() {
    if (!document.body.classList.contains("home-page") || isReduced() || saveData) return;
    const hero = document.querySelector(".home-page .hero");
    if (!hero || hero.querySelector(".lottie-bamboo-leaves")) return;
    const node = document.createElement("div");
    node.className = "lottie-bamboo-leaves";
    node.setAttribute("aria-hidden", "true");
    hero.prepend(node);
    try {
      const animation = await createAnimation(node, {
        name: config.bambooLeaves,
        loop: true,
        preserveAspectRatio: "xMidYMid slice",
        speed: coarseQuery.matches ? 0.68 : 0.82,
      });
      const observer = new IntersectionObserver(([entry]) => {
        if (!animation) return;
        if (entry.isIntersecting && !document.hidden) animation.play();
        else animation.pause();
      }, { threshold: 0.08 });
      observer.observe(hero);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) animation?.pause();
        else if (hero.getBoundingClientRect().bottom > 0) animation?.play();
      });
    } catch (error) {
      console.warn("[InkLottie] bamboo animation failed", error);
      node.remove();
    }
  }

  async function setupScrollOpening() {
    if (!document.body.classList.contains("home-page") || isReduced()) return;
    const key = "hutao-home-opened";
    if (sessionStorage.getItem(key) === "true") return;
    const hero = document.querySelector(".home-page .hero");
    if (!hero || hero.querySelector(".lottie-scroll-opening")) return;
    const node = document.createElement("div");
    node.className = "lottie-scroll-opening";
    node.setAttribute("aria-hidden", "true");
    hero.appendChild(node);
    try {
      const animation = await createAnimation(node, {
        name: config.scrollOpen,
        loop: false,
        preserveAspectRatio: "xMidYMid meet",
        speed: coarseQuery.matches ? 0.9 : 1,
        onComplete: () => {
          node.classList.add("is-complete");
          window.setTimeout(() => node.remove(), 520);
        },
      });
      window.setTimeout(() => {
        if (!node.isConnected) return;
        animation?.destroy();
        node.remove();
      }, 2800);
    } catch (error) {
      console.warn("[InkLottie] scroll opening failed", error);
      node.remove();
    }
  }

  async function attachDropLoader(target) {
    if (!target || target.querySelector(".ink-drop-loader") || isReduced()) return;
    const text = target.textContent || "";
    if (!/正在|加载|读取|翻阅|展开|查看/.test(text)) return;
    const node = document.createElement("span");
    node.className = "ink-drop-loader";
    node.setAttribute("aria-hidden", "true");
    target.prepend(node);
    try {
      await createAnimation(node, {
        name: config.inkDrop,
        loop: true,
        preserveAspectRatio: "xMidYMid meet",
        speed: 0.92,
      });
    } catch {
      node.remove();
    }
  }

  function setupDropLoaders(root = document) {
    root.querySelectorAll?.(".article-state, .comment-status, .achievement-status").forEach(attachDropLoader);
  }

  async function attachSeal(target) {
    if (!target || target.querySelector(".lottie-seal-stamp") || isReduced()) return;
    const node = document.createElement("div");
    node.className = "lottie-seal-stamp";
    node.setAttribute("aria-hidden", "true");
    target.appendChild(node);
    let played = false;
    let animation = null;
    try {
      animation = await createAnimation(node, {
        name: config.sealStamp,
        loop: false,
        autoplay: false,
        preserveAspectRatio: "xMidYMid meet",
      });
    } catch (error) {
      console.warn("[InkLottie] seal animation failed", error);
      node.remove();
      return;
    }
    const playOnce = () => {
      if (played) return;
      played = true;
      animation.goToAndPlay(0, true);
    };
    if (!("IntersectionObserver" in window)) {
      playOnce();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        playOnce();
        observer.disconnect();
      }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
    observer.observe(node);
  }

  function setupSealStamps(root = document) {
    root.querySelectorAll?.("footer, .article-actions, .message-inner").forEach(attachSeal);
  }

  function observeDynamicContent() {
    if (!("MutationObserver" in window)) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          setupDropLoaders(node);
          if (node.matches?.(".article-state, .comment-status, .achievement-status")) attachDropLoader(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("visibilitychange", () => {
    instances.forEach((instance) => {
      if (document.hidden) instance.pause();
      else if (instance.__inkLottieLoop) instance.play();
    });
  });

  window.InkLottie = {
    ready: true,
    asset,
    lottiePath,
    loadData,
    createAnimation,
    playPageTransition,
    resetPageTransition,
    setupDropLoaders,
  };

  if (document.body) setupSiteLoader();

  onReady(() => {
    setupBambooLeaves();
    setupScrollOpening();
    setupDropLoaders();
    setupSealStamps();
    observeDynamicContent();
  });
}());

(function () {
  "use strict";

  if (window.InkLottie?.ready) return;

  const script = document.currentScript;
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animationCache = new Map();
  const instances = new Set();
  const config = {
    inkLoading: "ink-loading.json",
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

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function withTimeout(promise, ms) {
    return Promise.race([promise, wait(ms)]);
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
    return instance;
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
    if (!document.body || document.querySelector(".ink-site-loader")) return;
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
    await wait(isReduced() ? 80 : 120);
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
  };

  setupSiteLoader();
}());

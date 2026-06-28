(function () {
  "use strict";

  if (window.MotionCore?.ready) return;

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarseQuery = window.matchMedia("(max-width: 840px), (pointer: coarse)");
  const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const state = {
    ready: true,
    reduced: reduceQuery.matches,
    coarse: coarseQuery.matches,
    fine: fineQuery.matches,
    observers: new Set(),
    mutationObservers: new Set(),
    leaving: false,
    hidden: document.hidden,
  };

  const revealSelector = [
    ".reveal",
    ".page-title",
    ".article-filters",
    ".filter-summary",
    ".all-articles-grid > *",
    ".video-grid > *",
    ".article-detail-shell > *",
    ".kurumi-profile-card",
    ".kurumi-art-card",
    ".pet-notes > *",
  ].join(",");

  const dynamicContainers = [
    "#latestArticles",
    "#latestVideos",
    "#articleList",
    "#videoList",
    "#relatedArticles",
    "#commentList",
    "#guestbookList",
  ].join(",");

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function ensureVeil() {
    let veil = document.querySelector(".ink-page-transition");
    if (!veil) {
      veil = document.createElement("div");
      veil.className = "ink-page-transition";
      veil.setAttribute("aria-hidden", "true");
      document.body.prepend(veil);
    }
    return veil;
  }

  function enterPage() {
    ensureVeil();
    document.body.classList.remove("page-motion-leaving");
    document.body.classList.add("page-motion-entering");
    window.setTimeout(() => {
      document.body.classList.remove("page-motion-entering");
      state.leaving = false;
    }, state.reduced ? 20 : 460);
  }

  function shouldTransition(anchor, event) {
    if (!anchor || event.defaultPrevented || state.leaving) return false;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return false;
    }

    if (url.origin !== window.location.origin) return false;
    const sameDocument = url.pathname === location.pathname && url.search === location.search;
    if (sameDocument) return false;
    return true;
  }

  function setupPageTransition() {
    enterPage();

    document.addEventListener("click", (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!shouldTransition(anchor, event)) return;

      event.preventDefault();
      state.leaving = true;
      ensureVeil();
      document.body.classList.add("page-motion-leaving");
      window.setTimeout(() => {
        window.location.href = anchor.href;
      }, state.reduced ? 10 : 320);
    });

    window.addEventListener("pageshow", () => {
      state.leaving = false;
      document.body.classList.remove("page-motion-leaving", "page-motion-entering");
      enterPage();
    });
  }

  function addReveal(element, index = 0) {
    if (!(element instanceof HTMLElement)) return;
    if (element.closest(".hero, .pet-entry") || element.classList.contains("motion-reveal")) return;
    element.classList.add("motion-reveal");
    element.style.transitionDelay = `${Math.min(index % 5, 4) * 55}ms`;
  }

  function setupReveal(root = document) {
    const elements = Array.from(root.querySelectorAll?.(revealSelector) || []);
    elements.forEach(addReveal);

    if (state.reduced || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible", "visible"));
      return null;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible", "visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -9% 0px", threshold: 0.08 });

    elements.forEach((element) => observer.observe(element));
    state.observers.add(observer);
    return observer;
  }

  function revealInserted(node) {
    if (!(node instanceof HTMLElement)) return;
    const candidates = [];
    if (node.matches(revealSelector) || node.matches("article, a, figure, .article-card, .video-card, .comment-item")) {
      candidates.push(node);
    }
    candidates.push(...node.querySelectorAll?.(revealSelector) || []);
    candidates.forEach((element, index) => {
      addReveal(element, index);
      if (state.reduced) element.classList.add("is-visible", "visible");
    });

    if (!state.reduced) {
      const observer = [...state.observers].at(-1);
      if (observer) candidates.forEach((element) => observer.observe(element));
    }
  }

  function setupDynamicReveal() {
    if (!("MutationObserver" in window)) return;
    document.querySelectorAll(dynamicContainers).forEach((container) => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => mutation.addedNodes.forEach(revealInserted));
      });
      observer.observe(container, { childList: true, subtree: true });
      state.mutationObservers.add(observer);
    });
  }

  function setupScrollProgress() {
    if (state.coarse) return;
    const progress = document.createElement("div");
    progress.className = "motion-scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    progress.innerHTML = '<span class="motion-scroll-progress__dot"></span>';
    document.body.appendChild(progress);
    const dot = progress.querySelector("span");
    let ticking = false;

    function update() {
      ticking = false;
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.max(0, Math.min(1, window.scrollY / scrollable));
      dot.style.top = `${ratio * 100}%`;
      document.body.classList.toggle("is-scrolled", window.scrollY > 16);
      document.querySelector("[data-site-header]")?.classList.toggle("scrolled", window.scrollY > 40);
    }

    function requestUpdate() {
      if (ticking || state.hidden) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  }

  function createClickEffect(x, y, source) {
    if (typeof x !== "number" || typeof y !== "number") return;
    const target = source instanceof Element ? source : null;
    if (target?.closest(".click-petal, .falling-piece, input, textarea, select, option, video, audio, iframe, canvas, [contenteditable='true']")) return;

    const interactive = Boolean(target?.closest("button, a, summary, [role='button'], .ink-button, .text-button, .seal-button"));
    const duration = state.reduced ? 180 : interactive ? 340 : state.coarse ? 360 : 430;
    const size = state.reduced ? 34 : interactive ? 46 : state.coarse ? 68 : 96;
    const root = document.createDocumentFragment();

    const ripple = document.createElement("i");
    ripple.className = "ink-click-ripple";
    ripple.style.setProperty("--click-x", `${x}px`);
    ripple.style.setProperty("--click-y", `${y}px`);
    ripple.style.setProperty("--click-size", `${size}px`);
    ripple.style.setProperty("--click-duration", `${duration}ms`);
    root.appendChild(ripple);

    if (!state.reduced) {
      const core = document.createElement("i");
      core.className = "ink-click-core";
      core.style.setProperty("--click-x", `${x}px`);
      core.style.setProperty("--click-y", `${y}px`);
      core.style.setProperty("--click-duration", `${duration - 30}ms`);
      root.appendChild(core);
    }

    const count = state.reduced ? 0 : interactive ? 1 : state.coarse ? 1 : 3;
    for (let index = 0; index < count; index += 1) {
      const petal = document.createElement("i");
      petal.className = "click-petal";
      petal.style.setProperty("--click-x", `${x}px`);
      petal.style.setProperty("--click-y", `${y}px`);
      petal.style.setProperty("--click-duration", `${duration + 20}ms`);
      petal.style.setProperty("--petal-x", `${(Math.random() - 0.5) * (interactive ? 24 : 48)}px`);
      petal.style.setProperty("--petal-y", `${-8 - Math.random() * (interactive ? 14 : 28)}px`);
      petal.style.setProperty("--petal-r", `${Math.random() * 140 - 70}deg`);
      root.appendChild(petal);
    }

    const nodes = Array.from(root.children);
    document.body.appendChild(root);
    window.setTimeout(() => nodes.forEach((node) => node.remove()), duration + 80);
  }

  function setupClickFeedback() {
    if (document.body.classList.contains("home-page")) return;
    window.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      createClickEffect(event.clientX, event.clientY, event.target);
    }, { passive: true });
  }

  function setupCardHover() {
    if (!state.fine) return;
    const selector = ".article-card, .article-list-card, .video-card, .home-video-card, .friend-card, .portal-card, .achievement-cards article";
    document.addEventListener("pointermove", (event) => {
      const card = event.target.closest?.(selector);
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--motion-ink-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--motion-ink-y", `${event.clientY - rect.top}px`);
    }, { passive: true });
  }

  function cleanup() {
    state.observers.forEach((observer) => observer.disconnect());
    state.mutationObservers.forEach((observer) => observer.disconnect());
    state.observers.clear();
    state.mutationObservers.clear();
  }

  document.addEventListener("visibilitychange", () => {
    state.hidden = document.hidden;
    document.documentElement.classList.toggle("page-hidden", state.hidden);
  });

  window.MotionCore = {
    state,
    ready: true,
    createClickEffect,
    revealInserted,
    cleanup,
  };

  onReady(() => {
    document.documentElement.classList.add("motion-core-ready");
    setupPageTransition();
    setupReveal();
    setupDynamicReveal();
    setupScrollProgress();
    setupClickFeedback();
    setupCardHover();
  });
}());

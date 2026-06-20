(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function enhanceHero() {
    const hero = document.querySelector(".hero#home");
    if (!hero || hero.dataset.hutaoExhibitEnhanced === "true") return;
    hero.dataset.hutaoExhibitEnhanced = "true";
    hero.classList.remove("phase1-ink-home");

    const fog = document.createElement("div");
    fog.className = "hutao-fog-layer";
    fog.setAttribute("aria-hidden", "true");

    const leaves = document.createElement("div");
    leaves.className = "hutao-bamboo-leaves";
    leaves.setAttribute("aria-hidden", "true");

    const copy = hero.querySelector(".hero-copy");
    hero.insertBefore(fog, copy || null);
    hero.insertBefore(leaves, copy || null);
  }

  function setupHeroParallax() {
    const hero = document.querySelector(".hero#home");
    if (!hero || reducedMotion || !finePointer) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;

    function render() {
      frame = 0;
      hero.style.setProperty("--hutao-bg-x", `${targetX * 10}px`);
      hero.style.setProperty("--hutao-bg-y", `${targetY * 7}px`);
      hero.style.setProperty("--hutao-fog-x", `${targetX * -18}px`);
      hero.style.setProperty("--hutao-fog-y", `${targetY * -10}px`);
    }

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width - 0.5;
      targetY = (event.clientY - rect.top) / rect.height - 0.5;
      if (!frame) frame = window.requestAnimationFrame(render);
    }, { passive: true });

    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      if (!frame) frame = window.requestAnimationFrame(render);
    });
  }

  function setupCardTilt() {
    if (reducedMotion || !finePointer) return;
    const selector = [
      ".article-card",
      ".home-video-card",
      ".achievement-cards article",
      ".friend-card",
      ".portal-card",
    ].join(",");

    document.addEventListener("pointermove", (event) => {
      const card = event.target.closest(selector);
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--hutao-tilt-x", `${(-y * 1.4).toFixed(2)}deg`);
      card.style.setProperty("--hutao-tilt-y", `${(x * 1.4).toFixed(2)}deg`);
    }, { passive: true });

    document.addEventListener("pointerout", (event) => {
      const card = event.target.closest(selector);
      if (!card || card.contains(event.relatedTarget)) return;
      card.style.removeProperty("--hutao-tilt-x");
      card.style.removeProperty("--hutao-tilt-y");
    });
  }

  function setupStickyHeaderState() {
    const update = () => document.body.classList.toggle("is-scrolled", window.scrollY > 16);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function ensurePageVeil() {
    let veil = document.querySelector(".hutao-page-veil");
    if (veil) return veil;
    veil = document.createElement("div");
    veil.className = "hutao-page-veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.prepend(veil);
    return veil;
  }

  function scrollToSection(target) {
    const header = document.querySelector(".site-header, .kurumi-header");
    const offset = (header?.getBoundingClientRect().height || 74) + 14;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  }

  function setupPageMotion() {
    const veil = ensurePageVeil();
    document.body.classList.add("hutao-page-entering");
    window.requestAnimationFrame(() => {
      window.setTimeout(() => document.body.classList.remove("hutao-page-entering"), reducedMotion ? 40 : 820);
    });

    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (anchor.target || anchor.hasAttribute("download")) return;

      let url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch (error) {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const samePath = url.pathname === window.location.pathname && url.search === window.location.search;
      if (samePath && url.hash) {
        const target = document.querySelector(decodeURIComponent(url.hash));
        if (!target) return;
        event.preventDefault();
        scrollToSection(target);
        history.pushState(null, "", url.hash);
        document.querySelector(".site-nav.open")?.classList.remove("open");
        document.querySelector(".menu-toggle.open")?.classList.remove("open");
        return;
      }

      if (samePath) return;
      event.preventDefault();
      veil.style.setProperty("--hutao-transition-x", `${event.clientX}px`);
      veil.style.setProperty("--hutao-transition-y", `${event.clientY}px`);
      document.body.classList.add("hutao-page-leaving");
      window.setTimeout(() => {
        window.location.href = url.href;
      }, reducedMotion ? 20 : 510);
    });
  }

  function setupSectionFocus() {
    const sections = Array.from(document.querySelectorAll("main > section[id]"));
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const navLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = entry.target;
        const progress = entry.isIntersecting ? Math.min(1, Math.max(0, entry.intersectionRatio * 1.6)) : 0;
        section.style.setProperty("--section-progress", progress.toFixed(2));
        section.classList.toggle("is-current", entry.isIntersecting && entry.intersectionRatio > 0.42);
        if (!entry.isIntersecting || entry.intersectionRatio < 0.42) return;
        navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${section.id}`));
      });
    }, { threshold: [0, 0.18, 0.42, 0.62, 0.82], rootMargin: "-18% 0px -46% 0px" });
    sections.forEach((section) => observer.observe(section));
  }

  function revealExistingElements() {
    const candidates = document.querySelectorAll(".phase2-reveal, .art-scroll-reveal, .reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      candidates.forEach((element) => element.classList.add("is-visible", "visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible", "visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    candidates.forEach((element) => observer.observe(element));
  }

  function init() {
    enhanceHero();
    setupHeroParallax();
    setupCardTilt();
    setupStickyHeaderState();
    setupSectionFocus();
    revealExistingElements();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());

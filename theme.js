(function () {
  const storageKey = "hutao-theme";
  const saved = localStorage.getItem(storageKey);
  const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (preferredDark ? "dark" : "light");
  document.documentElement.dataset.theme = theme;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.setAttribute("aria-label", "切换明暗主题");

  function render() {
    const dark = document.documentElement.dataset.theme === "dark";
    button.textContent = dark ? "昼" : "夜";
    button.title = dark ? "切换为日间主题" : "切换为夜间主题";
  }

  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(storageKey, next);
    render();
  });

  render();
  document.body.appendChild(button);

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (finePointer && !reducedMotion && !document.querySelector(".ink-cursor")) {
    const cursor = document.createElement("div");
    cursor.className = "ink-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="ink-cursor-ring"></span><span class="ink-cursor-dot"></span>';
    document.body.appendChild(cursor);
    document.documentElement.classList.add("cursor-ready");

    let trailAt = 0;

    window.addEventListener("pointermove", (event) => {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursor.style.opacity = "1";

      const now = performance.now();
      if (now - trailAt < 42 || window.innerWidth <= 840) return;
      trailAt = now;

      const trail = document.createElement("i");
      trail.className = "ink-cursor-trail";
      trail.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      document.body.appendChild(trail);
      trail.animate(
        [
          { opacity: 0.4, transform: trail.style.transform },
          {
            opacity: 0,
            transform: `translate3d(${event.clientX - 9}px, ${event.clientY + 8}px, 0) translate(-50%, -50%) scale(.2)`,
          },
        ],
        { duration: 580, easing: "ease-out" },
      ).onfinish = () => trail.remove();
    });

    document.addEventListener("pointerover", (event) => {
      cursor.classList.toggle(
        "is-interactive",
        Boolean(event.target.closest("a, button, input, textarea, select")),
      );
    });

    document.documentElement.addEventListener("mouseleave", () => {
      cursor.style.opacity = "0";
    });

    window.addEventListener("pointerdown", (event) => {
      if (window.innerWidth <= 840) return;
      const ripple = document.createElement("i");
      const core = document.createElement("i");
      ripple.className = "ink-click-ripple";
      core.className = "ink-click-core";
      [ripple, core].forEach((mark) => {
        mark.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
        document.body.appendChild(mark);
      });
      ripple.animate(
        [
          { opacity: 0.72, transform: `${ripple.style.transform} scale(.25)` },
          { opacity: 0, transform: `${ripple.style.transform} scale(2.8) rotate(38deg)` },
        ],
        { duration: 720, easing: "ease-out" },
      ).onfinish = () => ripple.remove();
      core.animate(
        [
          { opacity: 0.8, transform: core.style.transform },
          { opacity: 0, transform: `${core.style.transform} scale(0)` },
        ],
        { duration: 460, easing: "ease-out" },
      ).onfinish = () => core.remove();
    });
  }

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
})();

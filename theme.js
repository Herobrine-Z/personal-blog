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

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
})();

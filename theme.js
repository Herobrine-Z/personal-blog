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

  const header = document.querySelector(".site-header");
  const searchButton = document.createElement("button");
  searchButton.type = "button";
  searchButton.className = "site-search-trigger";
  searchButton.setAttribute("aria-label", "搜索全站内容");
  searchButton.innerHTML = '<span aria-hidden="true">⌕</span><span>搜索</span><kbd>/</kbd>';
  if (header) {
    const navigation = header.querySelector("nav");
    header.insertBefore(searchButton, navigation || null);
  }

  const searchDialog = document.createElement("dialog");
  searchDialog.className = "site-search-dialog";
  searchDialog.innerHTML = `
    <div class="site-search-shell">
      <header>
        <div><small>QUICK ACCESS</small><strong>寻卷</strong></div>
        <button type="button" data-search-close aria-label="关闭搜索">×</button>
      </header>
      <label class="site-search-field">
        <span aria-hidden="true">⌕</span>
        <input type="search" placeholder="搜索文章、视频或标签……" autocomplete="off" />
        <kbd>ESC</kbd>
      </label>
      <nav class="site-quick-links" aria-label="快捷入口">
        <a href="./index.html">首页</a>
        <a href="./articles.html">文章</a>
        <a href="./videos.html">视频</a>
        <a href="./kurumi.html">胡桃绘卷</a>
      </nav>
      <div class="site-search-results" aria-live="polite">
        <p>输入关键词开始搜索，也可以使用上方快捷入口。</p>
      </div>
    </div>`;
  document.body.appendChild(searchDialog);

  const searchInput = searchDialog.querySelector("input");
  const searchResults = searchDialog.querySelector(".site-search-results");
  let searchableWorks = null;

  function workTypeLabel(work) {
    return work.content_type === "video" ? "视频" : "文章";
  }

  function renderSearchResults(query) {
    const keyword = query.trim().toLowerCase();
    searchResults.replaceChildren();
    if (!keyword) {
      let bookmarks = [];
      try {
        bookmarks = JSON.parse(localStorage.getItem("hutao-bookmarked-articles") || "[]");
      } catch {}
      if (!bookmarks.length) {
        searchResults.innerHTML = "<p>输入关键词开始搜索，也可以使用上方快捷入口。</p>";
        return;
      }
      const heading = document.createElement("p");
      heading.className = "site-search-caption";
      heading.textContent = "最近收藏";
      searchResults.appendChild(heading);
      bookmarks.slice(0, 4).forEach((item) => {
        const link = document.createElement("a");
        link.href = `./article.html?slug=${encodeURIComponent(item.slug)}`;
        link.innerHTML = `<span>收藏</span><strong></strong><small>继续阅读 →</small>`;
        link.querySelector("strong").textContent = item.title;
        searchResults.appendChild(link);
      });
      return;
    }
    const matches = (searchableWorks || []).filter((work) => {
      const text = [work.title, work.excerpt, work.category, ...(work.tags || [])].join(" ").toLowerCase();
      return text.includes(keyword);
    }).slice(0, 8);
    if (!matches.length) {
      searchResults.innerHTML = `<p>没有找到与“${keyword.replace(/[<>&]/g, "")}”相关的内容。</p>`;
      return;
    }
    matches.forEach((work) => {
      const link = document.createElement("a");
      link.href = window.articleService?.articleUrl(work) || `./article.html?slug=${encodeURIComponent(work.slug)}`;
      link.innerHTML = `<span></span><strong></strong><small></small>`;
      link.querySelector("span").textContent = workTypeLabel(work);
      link.querySelector("strong").textContent = work.title;
      link.querySelector("small").textContent = work.category || "随笔";
      searchResults.appendChild(link);
    });
  }

  async function openSearch() {
    if (!searchDialog.open) searchDialog.showModal();
    searchInput.value = "";
    renderSearchResults("");
    searchInput.focus();
    if (searchableWorks === null && window.articleService?.configured) {
      searchResults.innerHTML = "<p>正在整理全站内容……</p>";
      try {
        searchableWorks = await window.articleService.listPublished();
      } catch {
        searchableWorks = [];
      }
      renderSearchResults(searchInput.value);
    }
  }

  searchButton.addEventListener("click", openSearch);
  searchDialog.querySelector("[data-search-close]").addEventListener("click", () => searchDialog.close());
  searchDialog.addEventListener("click", (event) => {
    if (event.target === searchDialog) searchDialog.close();
  });
  searchInput.addEventListener("input", () => renderSearchResults(searchInput.value));
  window.addEventListener("keydown", (event) => {
    const editing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
    if (event.key === "/" && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      openSearch();
    }
  });

  const backToTop = document.createElement("button");
  backToTop.type = "button";
  backToTop.className = "back-to-top";
  backToTop.setAttribute("aria-label", "返回顶部");
  backToTop.textContent = "↑";
  document.body.appendChild(backToTop);
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("visible", window.scrollY > 650);
  }, { passive: true });

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

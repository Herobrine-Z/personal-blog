const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = typeof window.gsap !== "undefined";
const field = document.querySelector("#petalField");
const header = document.querySelector(".site-header");
const windToggle = document.querySelector("#windToggle");
const windLabel = windToggle.querySelector(".wind-label");
const summonButton = document.querySelector("#summonPetals");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const cursor = document.querySelector(".ink-cursor");
const cursorRing = document.querySelector(".ink-cursor-ring");
const cursorDot = document.querySelector(".ink-cursor-dot");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

let windActive = false;
let windStrength = 0;
let ownerSession = null;
const pieces = new Set();
const pointer = { x: -1000, y: -1000 };
let lastCursorTrailAt = 0;

const random = (min, max) => Math.random() * (max - min) + min;

function createHomepageArticleCard(article, index) {
  const card = document.createElement("article");
  const cover = articleService.firstImage(article);
  card.className = `article-card ${index === 0 ? "featured" : ""} reveal`;

  const visual = document.createElement("div");
  visual.className = `card-visual ${cover ? "article-cover" : index === 0 ? "peach-mountain" : "moon-lake"}`;
  if (cover) {
    const image = document.createElement("img");
    image.src = cover.url;
    image.alt = "";
    image.loading = "lazy";
    visual.appendChild(image);
  } else if (index === 0) {
    const mountain = document.createElement("div");
    mountain.className = "ink-mountain";
    mountain.setAttribute("aria-hidden", "true");
    visual.appendChild(mountain);
  } else {
    const moon = document.createElement("div");
    moon.className = "moon";
    moon.setAttribute("aria-hidden", "true");
    visual.appendChild(moon);
  }

  const badge = document.createElement("span");
  badge.className = "card-index";
  badge.textContent = index === 0 ? "新" : "次";
  visual.prepend(badge);

  const content = document.createElement("div");
  content.className = "card-content";
  const meta = document.createElement("div");
  meta.className = "article-meta";
  const category = document.createElement("span");
  category.textContent = article.category || "最新文章";
  const time = document.createElement("time");
  time.dateTime = article.published_at;
  time.textContent = articleService.formatDate(article.published_at);
  meta.append(category, time);

  const title = document.createElement("h3");
  title.textContent = article.title;
  const excerpt = document.createElement("p");
  excerpt.textContent = article.excerpt;
  const link = document.createElement("a");
  link.href = articleService.articleUrl(article);
  link.innerHTML = "展开此卷 <span>→</span>";
  content.append(meta, title, excerpt, link);
  card.append(visual, content);
  return card;
}

async function loadHomepageArticles() {
  const container = document.querySelector("#latestArticles");
  if (!container || !window.articleService) return;

  if (!articleService.configured) {
    container.innerHTML = '<p class="article-state">文章功能尚待站长完成配置。</p>';
    return;
  }

  try {
    const articles = await articleService.listPublished(2);
    container.replaceChildren();
    if (!articles.length) {
      container.innerHTML = '<p class="article-state">还没有发布文章，第一卷正在酝酿中。</p>';
      return;
    }
    articles.forEach((article, index) => container.appendChild(createHomepageArticleCard(article, index)));
  } catch (error) {
    container.innerHTML = `<p class="article-state">文章读取失败：${error.message}</p>`;
  }
}

function createClickEffect(x, y) {
  if (!hasGsap || reducedMotion) return;

  const ripple = document.createElement("span");
  const core = document.createElement("span");
  ripple.className = "ink-click-ripple";
  core.className = "ink-click-core";
  document.body.append(ripple, core);

  gsap.set([ripple, core], { x, y, xPercent: -50, yPercent: -50 });
  gsap.fromTo(
    ripple,
    { scale: 0.25, rotation: random(-18, 18), opacity: 0.75 },
    {
      scale: 2.8,
      rotation: random(20, 55),
      opacity: 0,
      duration: 0.75,
      ease: "power2.out",
      onComplete: () => ripple.remove(),
    },
  );
  gsap.to(core, {
    scale: 0,
    opacity: 0,
    duration: 0.5,
    ease: "power2.out",
    onComplete: () => core.remove(),
  });

  for (let i = 0; i < 8; i += 1) {
    const petal = document.createElement("i");
    const angle = (Math.PI * 2 * i) / 8 + random(-0.22, 0.22);
    const distance = random(28, 62);
    petal.className = "click-petal";
    document.body.appendChild(petal);
    gsap.set(petal, {
      x,
      y,
      xPercent: -50,
      yPercent: -50,
      rotation: (angle * 180) / Math.PI,
      scale: random(0.65, 1.15),
    });
    gsap.to(petal, {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance + random(5, 18),
      rotation: `+=${random(80, 220)}`,
      scale: 0.15,
      opacity: 0,
      duration: random(0.55, 0.9),
      ease: "power2.out",
      onComplete: () => petal.remove(),
    });
  }
}

function createCursorTrail(x, y) {
  const now = performance.now();
  if (now - lastCursorTrailAt < 38) return;
  lastCursorTrailAt = now;

  const trail = document.createElement("i");
  trail.className = "ink-cursor-trail";
  document.body.appendChild(trail);

  gsap.set(trail, {
    x: x + random(-3, 3),
    y: y + random(-2, 2),
    xPercent: -50,
    yPercent: -50,
    rotation: random(-35, 35),
    scale: random(0.65, 1.05),
    opacity: 0.42,
  });
  gsap.to(trail, {
    x: `-=${random(5, 12)}`,
    y: `+=${random(4, 10)}`,
    scale: 0.2,
    opacity: 0,
    duration: 0.58,
    ease: "power2.out",
    onComplete: () => trail.remove(),
  });
}

function createPiece(options = {}) {
  if (reducedMotion || !hasGsap || pieces.size > 42) return;

  const piece = document.createElement("span");
  const isPetal = options.type ? options.type === "petal" : Math.random() > 0.28;
  piece.className = `falling-piece ${isPetal ? "petal" : "leaf"}`;
  field.appendChild(piece);
  pieces.add(piece);

  const startX = options.x ?? random(-20, window.innerWidth + 20);
  const duration = options.duration ?? random(8, 16);
  const drift = random(-100, 150) + windStrength * random(0.6, 1.3);
  const rotation = random(180, 780) * (Math.random() > 0.5 ? 1 : -1);

  gsap.set(piece, {
    x: startX,
    y: options.y ?? -40,
    rotation: random(0, 180),
    scale: random(0.65, 1.3),
    opacity: random(0.45, 0.9),
  });

  const sway = gsap.to(piece, {
    x: `+=${drift}`,
    duration,
    ease: "sine.inOut",
  });

  const fall = gsap.to(piece, {
    y: window.innerHeight + 80,
    rotation: `+=${rotation}`,
    duration,
    ease: "none",
    onComplete: () => {
      sway.kill();
      pieces.delete(piece);
      piece.remove();
    },
  });

  piece._fallTween = fall;
  piece.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    burstPiece(piece);
  });
}

function burstPiece(piece) {
  if (!piece.isConnected) return;
  const rect = piece.getBoundingClientRect();
  pieces.delete(piece);
  gsap.killTweensOf(piece);
  piece.remove();

  for (let i = 0; i < 6; i += 1) {
    const dot = document.createElement("i");
    dot.style.cssText = `
      position: fixed;
      z-index: 16;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      width: ${random(2, 5)}px;
      height: ${random(2, 5)}px;
      border-radius: 50%;
      background: ${piece.classList.contains("petal") ? "#b95c5b" : "#48513f"};
      pointer-events: none;
    `;
    document.body.appendChild(dot);
    gsap.to(dot, {
      x: random(-48, 48),
      y: random(-45, 40),
      scale: 0,
      opacity: 0,
      duration: random(0.5, 0.9),
      ease: "power2.out",
      onComplete: () => dot.remove(),
    });
  }
}

function summonPetals() {
  for (let i = 0; i < 18; i += 1) {
    window.setTimeout(
      () =>
        createPiece({
          type: "petal",
          x: random(window.innerWidth * 0.15, window.innerWidth * 0.85),
          y: random(-120, -20),
          duration: random(5, 9),
        }),
      i * 55,
    );
  }
}

function setWind(active) {
  windActive = active;
  windStrength = active ? 170 : 0;
  windToggle.setAttribute("aria-pressed", String(active));
  windLabel.textContent = active ? "风起" : "风止";

  if (hasGsap) {
    gsap.to(".wind-icon", {
      rotation: active ? 12 : 0,
      x: active ? 3 : 0,
      duration: 0.35,
    });
  }
}

function nudgeNearbyPieces() {
  if (!hasGsap || reducedMotion) return;
  pieces.forEach((piece) => {
    const rect = piece.getBoundingClientRect();
    const dx = rect.left - pointer.x;
    const dy = rect.top - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 90) {
      const force = (90 - distance) / 90;
      gsap.to(piece, {
        x: `+=${(dx || 1) * force * 0.5}`,
        rotation: `+=${random(-70, 70)}`,
        duration: 0.45,
        overwrite: "auto",
      });
    }
  });
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  nudgeNearbyPieces();
});

window.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  createClickEffect(event.clientX, event.clientY);
});

window.addEventListener(
  "scroll",
  () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  },
  { passive: true },
);

windToggle.addEventListener("click", () => setWind(!windActive));
summonButton.addEventListener("click", summonPetals);

menuToggle.addEventListener("click", () => {
  const open = !nav.classList.contains("open");
  nav.classList.toggle("open", open);
  menuToggle.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    nav.classList.remove("open");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

function renderGuestbook(messages) {
  const list = document.querySelector("#guestbookList");
  list.replaceChildren();
  messages.forEach((message) => {
    const item = document.createElement("article");
    const header = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = message.visitor_name;
    const time = document.createElement("time");
    time.dateTime = message.created_at;
    time.textContent = articleService.formatDate(message.created_at);
    const meta = document.createElement("span");
    meta.className = "guestbook-meta";
    meta.appendChild(time);
    if (articleService.isOwner(ownerSession)) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "guestbook-delete";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute("aria-label", `删除 ${message.visitor_name} 的留言`);
      deleteButton.addEventListener("click", () => removeGuestbookMessage(message, deleteButton));
      meta.appendChild(deleteButton);
    }
    header.append(name, meta);
    const body = document.createElement("p");
    body.textContent = message.body;
    item.append(header, body);
    list.appendChild(item);
  });
}

async function removeGuestbookMessage(message, button) {
  if (!window.confirm(`确定删除 ${message.visitor_name} 的这条留言吗？`)) return;
  const note = document.querySelector("#formNote");
  button.disabled = true;
  note.textContent = "正在拂去这笔墨迹……";
  try {
    await articleService.deleteMessage(message.id);
    note.textContent = "留言已删除。";
    await loadGuestbook();
  } catch (error) {
    note.textContent = `删除失败：${error.message}`;
    button.disabled = false;
  }
}

async function loadGuestbook() {
  if (!articleService.configured) return;
  try {
    renderGuestbook(await articleService.listMessages());
  } catch (error) {
    document.querySelector("#formNote").textContent = `留言读取失败：${error.message}`;
  }
}

async function initializeGuestbook() {
  if (!articleService.configured) return;
  try {
    ownerSession = await articleService.getSession();
  } catch {
    ownerSession = null;
  }
  await loadGuestbook();
}

document.querySelector("#messageForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const note = document.querySelector("#formNote");
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const values = new FormData(form);
  const name = values.get("name").trim();
  button.disabled = true;
  note.textContent = "正在落印……";
  try {
    await articleService.createMessage({
      visitor_name: name,
      body: values.get("message").trim(),
      visitor_token: articleService.getVisitorToken(),
    });
    note.textContent = `${name}的墨迹，已留在这卷江湖里。`;
    form.reset();
    await loadGuestbook();
  } catch (error) {
    note.textContent = `留言失败：${error.message}`;
  } finally {
    button.disabled = false;
  }

  if (hasGsap && !reducedMotion) {
    gsap.fromTo(note, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45 });
  }
});

const lightbox = document.querySelector("#imageLightbox");
const lightboxImage = lightbox.querySelector("img");

document.querySelectorAll("[data-gallery-src]").forEach((button) => {
  button.addEventListener("click", () => {
    lightboxImage.src = button.dataset.gallerySrc;
    lightboxImage.alt = button.dataset.galleryAlt;
    lightbox.showModal();
  });
});

lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

if (hasGsap && !reducedMotion) {
  if (finePointer) {
    document.documentElement.classList.add("cursor-ready");
    const cursorX = gsap.quickTo(cursor, "x", { duration: 0.12, ease: "power3.out" });
    const cursorY = gsap.quickTo(cursor, "y", { duration: 0.12, ease: "power3.out" });

    window.addEventListener("pointermove", (event) => {
      cursorX(event.clientX);
      cursorY(event.clientY);
      createCursorTrail(event.clientX, event.clientY);
      gsap.to(cursor, { autoAlpha: 1, duration: 0.15, overwrite: "auto" });
    });

    document.addEventListener("pointerover", (event) => {
      const interactive = event.target.closest("a, button, input, textarea, .falling-piece");
      gsap.to(cursorRing, {
        scale: interactive ? 1.55 : 1,
        rotation: interactive ? 18 : 0,
        borderColor: interactive ? "var(--cinnabar)" : "var(--ink)",
        duration: 0.25,
        overwrite: "auto",
      });
      gsap.to(cursorDot, {
        scale: interactive ? 0.72 : 1,
        backgroundColor: interactive ? "var(--cinnabar)" : "var(--ink)",
        duration: 0.2,
        overwrite: "auto",
      });
    });

    document.documentElement.addEventListener("mouseleave", () => {
      gsap.to(cursor, { autoAlpha: 0, duration: 0.2 });
    });
  }

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .from(".brand", { y: -20, autoAlpha: 0, duration: 0.7 })
    .from(".site-nav a", { y: -14, autoAlpha: 0, stagger: 0.08, duration: 0.45 }, "<0.12")
    .from(".hero .eyebrow", { x: -25, autoAlpha: 0, duration: 0.55 }, "<0.1")
    .from(".hero h1 > span", { y: 45, autoAlpha: 0, stagger: 0.13, duration: 0.85 }, "<0.08")
    .from(".hero-verse", { y: 22, autoAlpha: 0, duration: 0.65 }, "-=0.35")
    .from(".hero-actions", { y: 18, autoAlpha: 0, duration: 0.55 }, "-=0.35");

  gsap.to(".scroll-cue i", {
    scaleY: 0.45,
    transformOrigin: "top",
    repeat: -1,
    yoyo: true,
    duration: 1.25,
    ease: "sine.inOut",
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        gsap.fromTo(
          entry.target,
          { y: 38, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.85, ease: "power3.out" },
        );
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 },
  );

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

  window.setInterval(() => {
    if (!document.hidden) createPiece();
  }, 750);

  for (let i = 0; i < 9; i += 1) {
    window.setTimeout(createPiece, i * 280);
  }
}

loadHomepageArticles();
initializeGuestbook();

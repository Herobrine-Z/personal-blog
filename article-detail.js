let currentArticle = null;
let currentComments = [];

function setMeta(name, content, property = false) {
  let element = document.head.querySelector(`meta[${property ? "property" : "name"}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function renderArticle(article) {
  const root = document.querySelector("#articleDetail");
  root.replaceChildren();
  const header = document.createElement("header");
  header.className = "article-detail-header";
  header.innerHTML = `
    <p class="eyebrow"></p>
    <h1></h1>
    <div class="article-detail-meta">
      <time datetime="${article.published_at}">${articleService.formatDate(article.published_at)}</time>
      <span></span>
    </div>
    <p class="article-detail-excerpt"></p>`;
  header.querySelector(".eyebrow").textContent = article.category || "Jianghu Notes";
  header.querySelector("h1").textContent = article.title;
  header.querySelector(".article-detail-meta span").textContent = (article.tags || [])
    .map((tag) => `#${tag}`)
    .join(" ");
  header.querySelector(".article-detail-excerpt").textContent = article.excerpt;

  const body = document.createElement("div");
  body.className = "article-body";
  body.innerHTML = window.blogMarkdown.render(article.content);

  const attachments = article.attachments || [];
  const images = attachments.filter((file) => file.type?.startsWith("image/"));
  const files = attachments.filter((file) => !file.type?.startsWith("image/"));
  if (images.length) {
    const gallery = document.createElement("div");
    gallery.className = "article-image-gallery";
    images.forEach((file) => {
      const figure = document.createElement("figure");
      figure.innerHTML = `<img loading="lazy"><figcaption></figcaption>`;
      figure.querySelector("img").src = file.url;
      figure.querySelector("img").alt = file.name;
      figure.querySelector("figcaption").textContent = file.name;
      gallery.appendChild(figure);
    });
    body.appendChild(gallery);
  }
  if (files.length) {
    const box = document.createElement("section");
    box.className = "article-attachments";
    box.innerHTML = "<h2>附件</h2>";
    files.forEach((file) => box.appendChild(createAttachmentLink(file)));
    body.appendChild(box);
  }
  root.append(header, body);

  document.title = `${article.title} | 虎桃不会振刀`;
  setMeta("description", article.excerpt);
  setMeta("og:title", article.title, true);
  setMeta("og:description", article.excerpt, true);
  setMeta("og:url", location.href, true);
  const cover = articleService.firstImage(article);
  if (cover) setMeta("og:image", cover.url, true);
  createToc(body);
}

function createToc(body) {
  const toc = document.querySelector("#articleToc");
  const headings = [...body.querySelectorAll("h1, h2, h3")];
  if (headings.length < 2) return;
  toc.innerHTML = "<strong>此卷目录</strong>";
  const list = document.createElement("ol");
  headings.forEach((heading) => {
    const item = document.createElement("li");
    item.className = `toc-level-${heading.tagName.slice(1)}`;
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.appendChild(link);
    list.appendChild(item);
  });
  toc.appendChild(list);
  toc.hidden = false;
}

function createAttachmentLink(file) {
  const link = document.createElement("a");
  link.href = file.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
  return link;
}

function commentFloorMap(comments) {
  const roots = comments.filter((comment) => !comment.parent_id);
  return new Map(roots.map((comment, index) => [comment.id, index + 1]));
}

function renderComments(comments) {
  currentComments = comments;
  const list = document.querySelector("#commentList");
  const floors = commentFloorMap(comments);
  const roots = comments.filter((comment) => !comment.parent_id);
  list.replaceChildren();
  if (!roots.length) {
    list.innerHTML = '<p class="article-state">还没有评论，来写下第一句吧。</p>';
    return;
  }

  roots.forEach((comment) => {
    const item = createCommentItem(comment, floors.get(comment.id), false);
    const replies = comments.filter((reply) => reply.parent_id === comment.id);
    if (replies.length) {
      const replyList = document.createElement("div");
      replyList.className = "comment-replies";
      replies.forEach((reply) => replyList.appendChild(createCommentItem(reply, floors.get(comment.id), true)));
      item.appendChild(replyList);
    }
    list.appendChild(item);
  });
}

function createCommentItem(comment, floor, isReply) {
  const item = document.createElement("article");
  item.className = `comment-item${isReply ? " comment-reply" : ""}`;
  const header = document.createElement("header");
  const name = document.createElement("strong");
  name.textContent = comment.visitor_name;
  const meta = document.createElement("span");
  const time = document.createElement("time");
  time.dateTime = comment.created_at;
  time.textContent = articleService.formatDate(comment.created_at);
  meta.textContent = isReply ? `回复 ${floor} 楼 · ` : `${floor} 楼 · `;
  meta.appendChild(time);
  header.append(name, meta);
  const body = document.createElement("p");
  body.textContent = comment.body;
  const reply = document.createElement("button");
  reply.type = "button";
  reply.className = "comment-reply-button";
  reply.textContent = "回复";
  reply.addEventListener("click", () => beginReply(isReply ? comment.parent_id : comment.id, floor));
  item.append(header, body);
  if (comment.attachments?.length) {
    const files = document.createElement("div");
    files.className = "comment-files";
    comment.attachments.forEach((file) => files.appendChild(createAttachmentLink(file)));
    item.appendChild(files);
  }
  item.appendChild(reply);
  return item;
}

function beginReply(parentId, floor) {
  const form = document.querySelector("#commentForm");
  form.elements.parentId.value = parentId;
  const context = document.querySelector("#replyContext");
  context.hidden = false;
  context.textContent = `正在回复 ${floor} 楼，点击此处取消。`;
  context.onclick = () => {
    form.elements.parentId.value = "";
    context.hidden = true;
  };
  form.elements.body.focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function loadComments(articleId) {
  renderComments(await articleService.listComments(articleId));
}

function setupComments(article) {
  const section = document.querySelector("#comments");
  const form = document.querySelector("#commentForm");
  const status = document.querySelector("#commentStatus");
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "text/plain", "application/pdf"]);
  section.hidden = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const values = new FormData(form);
    const files = [...form.elements.attachments.files];
    if (files.length > 3 || files.some((file) => file.size > 5 * 1024 * 1024 || !allowedTypes.has(file.type))) {
      status.textContent = "附件须为图片、TXT 或 PDF；最多 3 个，单个不超过 5 MB。";
      status.classList.add("error");
      return;
    }
    button.disabled = true;
    status.classList.remove("error");
    status.textContent = "正在留下评论……";
    try {
      const attachments = files.length ? await articleService.uploadCommentFiles(files, article.id) : [];
      await articleService.createComment({
        article_id: article.id,
        parent_id: values.get("parentId") || null,
        visitor_name: values.get("visitorName").trim(),
        visitor_token: articleService.getVisitorToken(),
        body: values.get("body").trim(),
        attachments,
      });
      form.reset();
      document.querySelector("#replyContext").hidden = true;
      status.textContent = "评论已留下。";
      await loadComments(article.id);
    } catch (error) {
      status.textContent = `评论失败：${error.message}`;
      status.classList.add("error");
    } finally {
      button.disabled = false;
    }
  });
}

async function setupArticleExtras(article) {
  const actions = document.querySelector("#articleActions");
  const viewCount = document.querySelector("#viewCount");
  actions.hidden = false;
  let views = article.view_count || 0;
  const viewKey = `hutao-view-${article.id}`;
  if (!sessionStorage.getItem(viewKey)) {
    try {
      views = await articleService.recordView(article.id);
      sessionStorage.setItem(viewKey, "1");
    } catch {}
  }
  viewCount.textContent = `${views} 次阅读`;

  actions.querySelectorAll("[data-reaction]").forEach((button) => {
    const type = button.dataset.reaction;
    const count = type === "like" ? article.like_count : article.favorite_count;
    button.querySelector("span").textContent = count || 0;
    button.classList.toggle("active", articleService.hasReaction(article.id, type));
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const result = await articleService.toggleReaction(article.id, type);
        button.classList.toggle("active", result.active);
        button.querySelector("span").textContent = result.count;
      } catch {
        button.title = "请先执行最新的 Supabase 数据库迁移";
      } finally {
        button.disabled = false;
      }
    });
  });

  document.querySelector("#shareArticle").addEventListener("click", async () => {
    const data = { title: article.title, text: article.excerpt, url: location.href };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(location.href);
      document.querySelector("#shareArticle").textContent = "链接已复制";
    }
  });

  const all = await articleService.listPublished();
  const index = all.findIndex((item) => item.id === article.id);
  const neighbors = document.querySelector("#articleNeighbors");
  const previous = all[index + 1];
  const next = all[index - 1];
  if (previous || next) {
    if (previous) neighbors.appendChild(neighborLink(previous, "上一篇"));
    if (next) neighbors.appendChild(neighborLink(next, "下一篇"));
    neighbors.hidden = false;
  }
  const related = await articleService.listRelated(article);
  if (related.length) {
    const section = document.querySelector("#relatedArticles");
    related.forEach((item) => section.querySelector("div").appendChild(neighborLink(item, item.category || "相关文章")));
    section.hidden = false;
  }
}

function neighborLink(article, label) {
  const link = document.createElement("a");
  link.href = articleService.articleUrl(article);
  const small = document.createElement("small");
  small.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = article.title;
  link.append(small, strong);
  return link;
}

window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  document.querySelector("#readingProgress").style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}, { passive: true });

async function loadArticle() {
  const slug = new URLSearchParams(location.search).get("slug");
  const root = document.querySelector("#articleDetail");
  if (!slug || !articleService.configured) {
    root.innerHTML = '<p class="article-state">没有找到要展开的文章。</p>';
    return;
  }
  try {
    currentArticle = await articleService.getPublished(slug);
    renderArticle(currentArticle);
    setupComments(currentArticle);
    await Promise.all([loadComments(currentArticle.id), setupArticleExtras(currentArticle)]);
  } catch {
    root.innerHTML = '<p class="article-state">文章不存在、尚未发布，或数据库迁移尚未执行。</p>';
  }
}

loadArticle();

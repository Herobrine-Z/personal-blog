function renderParagraphs(container, content) {
  content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .forEach((paragraph) => {
      const element = document.createElement("p");
      element.textContent = paragraph;
      container.appendChild(element);
    });
}

function renderArticle(article) {
  const root = document.querySelector("#articleDetail");
  root.replaceChildren();

  const header = document.createElement("header");
  header.className = "article-detail-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Jianghu Notes";
  const title = document.createElement("h1");
  title.textContent = article.title;
  const meta = document.createElement("time");
  meta.dateTime = article.published_at;
  meta.textContent = articleService.formatDate(article.published_at);
  const excerpt = document.createElement("p");
  excerpt.className = "article-detail-excerpt";
  excerpt.textContent = article.excerpt;
  header.append(eyebrow, title, meta, excerpt);

  const body = document.createElement("div");
  body.className = "article-body";
  renderParagraphs(body, article.content);

  const attachments = article.attachments || [];
  const images = attachments.filter((file) => file.type?.startsWith("image/"));
  const files = attachments.filter((file) => !file.type?.startsWith("image/"));

  if (images.length) {
    const gallery = document.createElement("div");
    gallery.className = "article-image-gallery";
    images.forEach((file) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = file.url;
      image.alt = file.name;
      image.loading = "lazy";
      const caption = document.createElement("figcaption");
      caption.textContent = file.name;
      figure.append(image, caption);
      gallery.appendChild(figure);
    });
    body.appendChild(gallery);
  }

  if (files.length) {
    const fileBox = document.createElement("section");
    fileBox.className = "article-attachments";
    const heading = document.createElement("h2");
    heading.textContent = "附件";
    fileBox.appendChild(heading);
    files.forEach((file) => {
      const link = document.createElement("a");
      link.href = file.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
      fileBox.appendChild(link);
    });
    body.appendChild(fileBox);
  }

  root.append(header, body);
  document.title = `${article.title} | 虎桃不会振刀`;
}

function createAttachmentLink(file) {
  const link = document.createElement("a");
  link.href = file.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
  return link;
}

function renderComments(comments) {
  const list = document.querySelector("#commentList");
  list.replaceChildren();
  if (!comments.length) {
    list.innerHTML = '<p class="article-state">还没有评论，来写下第一句吧。</p>';
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement("article");
    item.className = "comment-item";
    const header = document.createElement("header");
    const name = document.createElement("strong");
    name.textContent = comment.visitor_name;
    const time = document.createElement("time");
    time.dateTime = comment.created_at;
    time.textContent = articleService.formatDate(comment.created_at);
    header.append(name, time);
    const body = document.createElement("p");
    body.textContent = comment.body;
    item.append(header, body);

    if (comment.attachments?.length) {
      const files = document.createElement("div");
      files.className = "comment-files";
      comment.attachments.forEach((file) => files.appendChild(createAttachmentLink(file)));
      item.appendChild(files);
    }
    list.appendChild(item);
  });
}

async function loadComments(articleId) {
  renderComments(await articleService.listComments(articleId));
}

function setupComments(article) {
  const section = document.querySelector("#comments");
  const form = document.querySelector("#commentForm");
  const status = document.querySelector("#commentStatus");
  section.hidden = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const values = new FormData(form);
    const files = [...form.elements.attachments.files];
    if (files.length > 3 || files.some((file) => file.size > 10 * 1024 * 1024)) {
      status.textContent = "最多上传 3 个文件，且单个文件不能超过 10 MB。";
      status.classList.add("error");
      return;
    }

    button.disabled = true;
    status.classList.remove("error");
    status.textContent = "正在留下评论……";
    try {
      const attachments = files.length
        ? await articleService.uploadCommentFiles(files, article.id)
        : [];
      await articleService.createComment({
        article_id: article.id,
        visitor_name: values.get("visitorName").trim(),
        body: values.get("body").trim(),
        attachments,
      });
      form.reset();
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

async function loadArticle() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const root = document.querySelector("#articleDetail");
  if (!slug) {
    root.innerHTML = '<p class="article-state">没有找到要展开的文章。</p>';
    return;
  }
  if (!articleService.configured) {
    root.innerHTML = '<p class="article-state">文章功能尚未配置。</p>';
    return;
  }

  try {
    const article = await articleService.getPublished(slug);
    renderArticle(article);
    setupComments(article);
    await loadComments(article.id);
  } catch (error) {
    root.innerHTML = `<p class="article-state">文章不存在或尚未发布。</p>`;
  }
}

loadArticle();

const authPanel = document.querySelector("#authPanel");
const editorPanel = document.querySelector("#editorPanel");
const loginForm = document.querySelector("#loginForm");
const articleForm = document.querySelector("#articleForm");
const logoutButton = document.querySelector("#logoutButton");
const newArticleButton = document.querySelector("#newArticleButton");
const articleList = document.querySelector("#adminArticleList");
const commentList = document.querySelector("#adminCommentList");
const messageList = document.querySelector("#adminMessageList");
const commentCount = document.querySelector("#commentCount");
const messageCount = document.querySelector("#messageCount");
const existingAttachments = document.querySelector("#existingAttachments");
const editorTitle = document.querySelector("#editorTitle");
const statusElement = document.querySelector("#adminStatus");
const markdownPreview = document.querySelector("#markdownPreview");

let articles = [];
let comments = [];
let messages = [];
let editingArticle = null;

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("error", isError);
}

function showEditor(session) {
  const owner = articleService.isOwner(session);
  authPanel.hidden = owner;
  editorPanel.hidden = !owner;
  return owner;
}

function resetEditor() {
  editingArticle = null;
  articleForm.reset();
  articleForm.elements.articleId.value = "";
  articleForm.elements.category.value = "随笔";
  articleForm.elements.published.value = "true";
  editorTitle.textContent = "写文章";
  articleForm.querySelector(".publish-button").textContent = "发布文章";
  existingAttachments.hidden = true;
  existingAttachments.replaceChildren();
  renderMarkdownPreview();
}

function renderExistingAttachments(article) {
  existingAttachments.replaceChildren();
  const attachments = article.attachments || [];
  existingAttachments.hidden = !attachments.length;
  if (!attachments.length) return;

  const heading = document.createElement("strong");
  heading.textContent = "已上传附件（勾选后保存将删除）";
  existingAttachments.appendChild(heading);
  attachments.forEach((file, index) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "removeAttachment";
    checkbox.value = String(index);
    const text = document.createElement("span");
    text.textContent = file.name;
    label.append(checkbox, text);
    existingAttachments.appendChild(label);
  });
}

function beginEdit(article) {
  editingArticle = article;
  editorTitle.textContent = "编辑文章";
  articleForm.elements.articleId.value = article.id;
  articleForm.elements.title.value = article.title;
  articleForm.elements.slug.value = article.slug;
  articleForm.elements.excerpt.value = article.excerpt;
  articleForm.elements.content.value = article.content;
  articleForm.elements.category.value = article.category || "随笔";
  articleForm.elements.tags.value = (article.tags || []).join(", ");
  articleForm.elements.published.value = String(article.published);
  articleForm.elements.scheduledAt.value = article.scheduled_at
    ? new Date(article.scheduled_at).toISOString().slice(0, 16)
    : "";
  articleForm.querySelector(".publish-button").textContent = "保存修改";
  renderExistingAttachments(article);
  renderMarkdownPreview();
  articleForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderArticleList() {
  articleList.replaceChildren();
  if (!articles.length) {
    articleList.innerHTML = '<p class="article-state">还没有文章。</p>';
    return;
  }

  articles.forEach((article) => {
    const row = document.createElement("article");
    row.className = "admin-article-row";
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = article.title;
    const meta = document.createElement("p");
    meta.textContent = `${article.published ? "已发布" : "草稿"} · ${articleService.formatDate(article.updated_at)}`;
    copy.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "admin-row-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "text-button";
    editButton.textContent = "编辑";
    editButton.addEventListener("click", () => beginEdit(article));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "text-button danger";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => removeArticle(article, deleteButton));
    actions.append(editButton, deleteButton);
    row.append(copy, actions);
    articleList.appendChild(row);
  });
  document.querySelector("#articleMetric").textContent = articles.length;
  document.querySelector("#viewMetric").textContent = articles.reduce((sum, article) => sum + Number(article.view_count || 0), 0);
  document.querySelector("#reactionMetric").textContent = articles.reduce(
    (sum, article) => sum + Number(article.like_count || 0) + Number(article.favorite_count || 0),
    0,
  );
}

async function loadAdminArticles() {
  articleList.innerHTML = '<p class="article-state">正在读取文章……</p>';
  articles = await articleService.listAllArticles();
  renderArticleList();
}

function createModerationRow(item, type) {
  const row = document.createElement("article");
  row.className = "admin-moderation-row";
  const copy = document.createElement("div");
  const meta = document.createElement("p");
  const source = type === "comment" ? `《${item.articles?.title || "已删除文章"}》` : "主页留言";
  meta.textContent = `${item.visitor_name} · ${source} · ${articleService.formatDate(item.created_at)}`;
  const body = document.createElement("p");
  body.className = "admin-moderation-body";
  body.textContent = item.body;
  copy.append(meta, body);

  if (type === "comment" && item.attachments?.length) {
    const files = document.createElement("p");
    files.className = "admin-moderation-files";
    files.textContent = `附件：${item.attachments.map((file) => file.name).join("、")}`;
    copy.appendChild(files);
  }

  const actions = document.createElement("div");
  actions.className = "admin-row-actions";
  if (type === "comment") {
    const approvalButton = document.createElement("button");
    approvalButton.type = "button";
    approvalButton.className = "text-button";
    approvalButton.textContent = item.approved ? "隐藏" : "通过";
    approvalButton.addEventListener("click", async () => {
      approvalButton.disabled = true;
      try {
        await articleService.updateCommentApproval(item.id, !item.approved);
        await loadModerationContent();
        setStatus(item.approved ? "评论已隐藏。" : "评论已通过。");
      } catch (error) {
        setStatus(`操作失败：${error.message}`, true);
        approvalButton.disabled = false;
      }
    });
    actions.appendChild(approvalButton);
  }
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "text-button danger";
  deleteButton.textContent = "删除";
  deleteButton.addEventListener("click", () => {
    if (type === "comment") removeComment(item, deleteButton);
    else removeMessage(item, deleteButton);
  });
  actions.appendChild(deleteButton);
  row.append(copy, actions);
  return row;
}

function renderModerationLists() {
  commentList.replaceChildren();
  messageList.replaceChildren();
  commentCount.textContent = `${comments.length} 条`;
  messageCount.textContent = `${messages.length} 条`;
  document.querySelector("#pendingMetric").textContent = comments.filter((comment) => !comment.approved).length;

  if (!comments.length) {
    commentList.innerHTML = '<p class="article-state">暂无评论。</p>';
  } else {
    comments.forEach((comment) => commentList.appendChild(createModerationRow(comment, "comment")));
  }

  if (!messages.length) {
    messageList.innerHTML = '<p class="article-state">暂无留言。</p>';
  } else {
    messages.forEach((message) => messageList.appendChild(createModerationRow(message, "message")));
  }
}

async function loadModerationContent() {
  commentList.innerHTML = '<p class="article-state">正在读取评论……</p>';
  messageList.innerHTML = '<p class="article-state">正在读取留言……</p>';
  [comments, messages] = await Promise.all([
    articleService.listAllComments(),
    articleService.listMessages(100),
  ]);
  renderModerationLists();
}

async function removeComment(comment, button) {
  if (!window.confirm(`确定删除 ${comment.visitor_name} 的这条评论吗？`)) return;
  button.disabled = true;
  setStatus("正在删除评论……");
  try {
    await articleService.deleteComment(comment.id);
    if (comment.attachments?.length) {
      try {
        await articleService.removeCommentFiles(comment.attachments);
      } catch {
        // The comment is deleted; attachment cleanup can be retried later.
      }
    }
    await loadModerationContent();
    setStatus("评论已删除。");
  } catch (error) {
    setStatus(`删除评论失败：${error.message}`, true);
    button.disabled = false;
  }
}

async function removeMessage(message, button) {
  if (!window.confirm(`确定删除 ${message.visitor_name} 的这条留言吗？`)) return;
  button.disabled = true;
  setStatus("正在删除留言……");
  try {
    await articleService.deleteMessage(message.id);
    await loadModerationContent();
    setStatus("留言已删除。");
  } catch (error) {
    setStatus(`删除留言失败：${error.message}`, true);
    button.disabled = false;
  }
}

async function loadOwnerConsole() {
  await Promise.all([loadAdminArticles(), loadModerationContent()]);
}

async function removeArticle(article, button) {
  if (!window.confirm(`确定删除《${article.title}》吗？此操作无法撤销。`)) return;
  button.disabled = true;
  setStatus("正在删除文章……");
  try {
    const commentAttachments = comments
      .filter((comment) => comment.article_id === article.id)
      .flatMap((comment) => comment.attachments || []);
    await articleService.deleteArticle(article.id);
    if (article.attachments?.length) {
      try {
        await articleService.removeFiles(article.attachments);
      } catch {
        // The article is already deleted; stale files can be cleaned up later.
      }
    }
    if (commentAttachments.length) {
      try {
        await articleService.removeCommentFiles(commentAttachments);
      } catch {
        // The comments are already deleted; attachment cleanup can be retried later.
      }
    }
    if (editingArticle?.id === article.id) resetEditor();
    await loadOwnerConsole();
    setStatus("文章已删除。");
  } catch (error) {
    setStatus(`删除失败：${error.message}`, true);
    button.disabled = false;
  }
}

async function initialize() {
  if (!articleService.configured) {
    setStatus("请先在 supabase-config.js 中填写项目地址和 anon key。", true);
    loginForm.querySelector("button").disabled = true;
    return;
  }

  try {
    const session = await articleService.getSession();
    if (session && !showEditor(session)) {
      await articleService.signOut();
      setStatus("当前账号不是站长，无法进入文章管理。", true);
      return;
    }
    if (session) await loadOwnerConsole();
  } catch (error) {
    setStatus(error.message, true);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button");
  button.disabled = true;
  setStatus("正在验证身份……");
  try {
    const form = new FormData(loginForm);
    const { session } = await articleService.signIn(form.get("email").trim(), form.get("password"));
    if (!showEditor(session)) {
      await articleService.signOut();
      throw new Error("当前账号不是站长。");
    }
    loginForm.reset();
    await loadOwnerConsole();
    setStatus("登录成功。");
  } catch (error) {
    setStatus(`登录失败：${error.message}`, true);
  } finally {
    button.disabled = false;
  }
});

articleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = articleForm.querySelector(".publish-button");
  const form = new FormData(articleForm);
  const slug = form.get("slug").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    setStatus("网址标识只能包含小写字母、数字和连字符。", true);
    return;
  }

  button.disabled = true;
  setStatus(editingArticle ? "正在保存修改……" : "正在上传附件并发布……");
  let newAttachments = [];
  try {
    const session = await articleService.getSession();
    if (!session) throw new Error("登录已过期，请重新登录。");

    const files = [...articleForm.elements.attachments.files];
    newAttachments = files.length ? await articleService.uploadFiles(files, session.user.id) : [];
    const removedIndexes = new Set(form.getAll("removeAttachment").map(Number));
    const oldAttachments = editingArticle?.attachments || [];
    const removedAttachments = oldAttachments.filter((_, index) => removedIndexes.has(index));
    const attachments = oldAttachments
      .filter((_, index) => !removedIndexes.has(index))
      .concat(newAttachments);
    const values = {
      title: form.get("title").trim(),
      slug,
      excerpt: form.get("excerpt").trim(),
      content: form.get("content").trim(),
      category: form.get("category").trim() || "随笔",
      tags: form.get("tags").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      attachments,
      published: form.get("published") === "true",
      scheduled_at: form.get("scheduledAt")
        ? new Date(form.get("scheduledAt")).toISOString()
        : null,
      published_at:
        editingArticle?.published_at ||
        (form.get("scheduledAt") ? new Date(form.get("scheduledAt")).toISOString() : new Date().toISOString()),
    };

    const wasEditing = Boolean(editingArticle);
    const article = wasEditing
      ? await articleService.updateArticle(editingArticle.id, values)
      : await articleService.publishArticle({ ...values, author_id: session.user.id });
    if (removedAttachments.length) {
      try {
        await articleService.removeFiles(removedAttachments);
      } catch {
        // The article no longer references these files; cleanup can be retried later.
      }
    }

    resetEditor();
    await loadAdminArticles();
    setStatus(wasEditing ? "修改已保存。" : values.published ? "文章已发布。" : "草稿已保存。");
    if (values.published && (!values.scheduled_at || new Date(values.scheduled_at) <= new Date())) {
      window.location.href = articleService.articleUrl(article);
    }
  } catch (error) {
    if (newAttachments.length) {
      try {
        await articleService.removeFiles(newAttachments);
      } catch {
        // Preserve the original error message.
      }
    }
    setStatus(`保存失败：${error.message}`, true);
  } finally {
    button.disabled = false;
  }
});

newArticleButton.addEventListener("click", resetEditor);

function renderMarkdownPreview() {
  markdownPreview.innerHTML = window.blogMarkdown.render(articleForm.elements.content.value);
  if (!markdownPreview.textContent.trim()) {
    markdownPreview.innerHTML = '<p class="article-state">预览会随正文输入实时更新。</p>';
  }
}

articleForm.elements.content.addEventListener("input", renderMarkdownPreview);

logoutButton.addEventListener("click", async () => {
  try {
    await articleService.signOut();
    resetEditor();
    showEditor(null);
    setStatus("已退出登录。");
  } catch (error) {
    setStatus(error.message, true);
  }
});

initialize();
renderMarkdownPreview();

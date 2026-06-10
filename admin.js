const authPanel = document.querySelector("#authPanel");
const editorPanel = document.querySelector("#editorPanel");
const loginForm = document.querySelector("#loginForm");
const articleForm = document.querySelector("#articleForm");
const logoutButton = document.querySelector("#logoutButton");
const newArticleButton = document.querySelector("#newArticleButton");
const articleList = document.querySelector("#adminArticleList");
const existingAttachments = document.querySelector("#existingAttachments");
const editorTitle = document.querySelector("#editorTitle");
const statusElement = document.querySelector("#adminStatus");

let articles = [];
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
  editorTitle.textContent = "写文章";
  articleForm.querySelector(".publish-button").textContent = "发布文章";
  existingAttachments.hidden = true;
  existingAttachments.replaceChildren();
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
  articleForm.querySelector(".publish-button").textContent = "保存修改";
  renderExistingAttachments(article);
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
}

async function loadAdminArticles() {
  articleList.innerHTML = '<p class="article-state">正在读取文章……</p>';
  articles = await articleService.listAllArticles();
  renderArticleList();
}

async function removeArticle(article, button) {
  if (!window.confirm(`确定删除《${article.title}》吗？此操作无法撤销。`)) return;
  button.disabled = true;
  setStatus("正在删除文章……");
  try {
    await articleService.deleteArticle(article.id);
    if (article.attachments?.length) {
      try {
        await articleService.removeFiles(article.attachments);
      } catch {
        // The article is already deleted; stale files can be cleaned up later.
      }
    }
    if (editingArticle?.id === article.id) resetEditor();
    await loadAdminArticles();
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
    if (session) await loadAdminArticles();
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
    await loadAdminArticles();
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
      attachments,
      published: true,
      published_at: editingArticle?.published_at || new Date().toISOString(),
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
    setStatus(wasEditing ? "修改已保存。" : "文章已发布。");
    window.location.href = articleService.articleUrl(article);
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

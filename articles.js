const articleContainer = document.querySelector("#articleList");
const searchInput = document.querySelector("#articleSearch");
const categoryFilter = document.querySelector("#categoryFilter");
const tagFilters = document.querySelector("#tagFilters");
const clearFilters = document.querySelector("#clearFilters");

let allArticles = [];
let activeTag = "";

function createListCard(article) {
  const link = document.createElement("a");
  link.className = "article-list-card";
  link.href = articleService.articleUrl(article);

  const cover = articleService.firstImage(article);
  const visual = document.createElement("div");
  visual.className = `article-list-cover ${cover ? "" : "placeholder-cover"}`;
  if (cover) {
    const image = document.createElement("img");
    image.src = cover.url;
    image.alt = "";
    image.loading = "lazy";
    visual.appendChild(image);
  } else {
    visual.innerHTML = '<span aria-hidden="true">文</span>';
  }

  const copy = document.createElement("div");
  copy.className = "article-list-copy";
  const meta = document.createElement("div");
  meta.className = "article-card-meta";
  const category = document.createElement("span");
  category.textContent = article.category || "随笔";
  const time = document.createElement("time");
  time.dateTime = article.published_at;
  time.textContent = articleService.formatDate(article.published_at);
  meta.append(category, time);
  const title = document.createElement("h2");
  title.textContent = article.title;
  const excerpt = document.createElement("p");
  excerpt.textContent = article.excerpt;
  const tags = document.createElement("div");
  tags.className = "article-tags";
  (article.tags || []).forEach((tag) => {
    const chip = document.createElement("span");
    chip.textContent = `# ${tag}`;
    tags.appendChild(chip);
  });
  const stats = document.createElement("span");
  stats.className = "article-card-stats";
  stats.textContent = `${article.view_count || 0} 阅 · ${article.like_count || 0} 赞`;
  copy.append(meta, title, excerpt, tags, stats);
  link.append(visual, copy);
  return link;
}

function renderFilters() {
  const categories = [...new Set(allArticles.map((article) => article.category).filter(Boolean))];
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  const tags = [...new Set(allArticles.flatMap((article) => article.tags || []))];
  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `# ${tag}`;
    button.addEventListener("click", () => {
      activeTag = activeTag === tag ? "" : tag;
      renderArticles();
    });
    tagFilters.appendChild(button);
  });
}

function renderArticles() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const filtered = allArticles.filter((article) => {
    const matchesKeyword =
      !keyword ||
      article.title.toLowerCase().includes(keyword) ||
      article.excerpt.toLowerCase().includes(keyword);
    return matchesKeyword &&
      (!category || article.category === category) &&
      (!activeTag || (article.tags || []).includes(activeTag));
  });

  [...tagFilters.children].forEach((button) => {
    button.classList.toggle("active", button.textContent === `# ${activeTag}`);
  });
  articleContainer.replaceChildren();
  if (!filtered.length) {
    articleContainer.innerHTML = '<p class="article-state">没有找到相合的文章。</p>';
    return;
  }
  filtered.forEach((article) => articleContainer.appendChild(createListCard(article)));
}

async function loadArticles() {
  if (!articleService.configured) {
    articleContainer.innerHTML = '<p class="article-state">文章功能尚未配置，请站长查看 README.md。</p>';
    return;
  }
  try {
    allArticles = await articleService.listPublished();
    renderFilters();
    renderArticles();
  } catch (error) {
    articleContainer.innerHTML = `<p class="article-state">读取失败：${error.message}</p>`;
  }
}

searchInput.addEventListener("input", renderArticles);
categoryFilter.addEventListener("change", renderArticles);
clearFilters.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "";
  activeTag = "";
  renderArticles();
});

loadArticles();

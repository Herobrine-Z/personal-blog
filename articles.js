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
  const time = document.createElement("time");
  time.dateTime = article.published_at;
  time.textContent = articleService.formatDate(article.published_at);
  const title = document.createElement("h2");
  title.textContent = article.title;
  const excerpt = document.createElement("p");
  excerpt.textContent = article.excerpt;
  const more = document.createElement("span");
  more.className = "read-more";
  more.textContent = "阅读全文 →";
  copy.append(time, title, excerpt, more);
  link.append(visual, copy);
  return link;
}

async function loadArticles() {
  const container = document.querySelector("#articleList");
  if (!articleService.configured) {
    container.innerHTML = '<p class="article-state">文章功能尚未配置，请站长查看 README.md。</p>';
    return;
  }

  try {
    const articles = await articleService.listPublished();
    container.replaceChildren();
    if (!articles.length) {
      container.innerHTML = '<p class="article-state">尚无文章。</p>';
      return;
    }
    articles.forEach((article) => container.appendChild(createListCard(article)));
  } catch (error) {
    container.innerHTML = `<p class="article-state">读取失败：${error.message}</p>`;
  }
}

loadArticles();

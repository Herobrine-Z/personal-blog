const videoList = document.querySelector("#videoList");
const videoSearch = document.querySelector("#videoSearch");
const videoCategory = document.querySelector("#videoCategory");
const clearVideoFilters = document.querySelector("#clearVideoFilters");
let videos = [];

function createVideoCard(video) {
  const link = document.createElement("a");
  link.className = "video-card";
  link.href = articleService.articleUrl(video);

  const visual = document.createElement("div");
  visual.className = "video-card-visual";
  const poster = video.video_poster || articleService.firstImage(video)?.url;
  if (poster) {
    const image = document.createElement("img");
    image.src = poster;
    image.alt = "";
    image.loading = "lazy";
    visual.appendChild(image);
  }
  const play = document.createElement("span");
  play.className = "video-play-mark";
  play.setAttribute("aria-hidden", "true");
  play.textContent = "▶";
  visual.appendChild(play);

  const copy = document.createElement("div");
  copy.className = "video-card-copy";
  const meta = document.createElement("p");
  const series = video.series_name
    ? ` · ${video.series_name}${video.episode_number ? ` 第 ${video.episode_number} 集` : ""}`
    : "";
  meta.textContent = `${video.category || "视频"} · ${articleService.formatDate(video.published_at)}${series}`;
  const title = document.createElement("h2");
  title.textContent = video.title;
  const excerpt = document.createElement("p");
  excerpt.textContent = video.excerpt;
  const stats = document.createElement("span");
  const duration = video.duration_seconds
    ? ` · ${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, "0")}`
    : "";
  stats.textContent = `${video.view_count || 0} 次播放 · ${video.like_count || 0} 人点赞${duration}`;
  copy.append(meta, title, excerpt, stats);
  link.append(visual, copy);
  return link;
}

function renderVideos() {
  const keyword = videoSearch.value.trim().toLowerCase();
  const category = videoCategory.value;
  const filtered = videos.filter((video) =>
    (!keyword || video.title.toLowerCase().includes(keyword) || video.excerpt.toLowerCase().includes(keyword)) &&
    (!category || video.category === category),
  );
  videoList.replaceChildren();
  if (!filtered.length) {
    videoList.innerHTML = '<p class="article-state">没有找到符合条件的视频。</p>';
    return;
  }
  filtered.forEach((video) => videoList.appendChild(createVideoCard(video)));
}

async function loadVideos() {
  if (!articleService.configured) {
    videoList.innerHTML = '<p class="article-state">视频服务尚未配置。</p>';
    return;
  }
  try {
    videos = await articleService.listPublished(null, { contentType: "video" });
    [...new Set(videos.map((video) => video.category).filter(Boolean))].forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      videoCategory.appendChild(option);
    });
    renderVideos();
  } catch (error) {
    videoList.innerHTML = `<p class="article-state">读取失败：${error.message}</p>`;
  }
}

videoSearch.addEventListener("input", renderVideos);
videoCategory.addEventListener("change", renderVideos);
clearVideoFilters.addEventListener("click", () => {
  videoSearch.value = "";
  videoCategory.value = "";
  renderVideos();
});
loadVideos();

# Cloudflare R2 大视频上传部署指南

本项目本地代码已经支持两种模式：

- `videoUploadApi` 为空：继续使用 Supabase Storage 兼容上传，限制 50MB。
- `videoUploadApi` 填写 Worker 地址：使用 Cloudflare R2 分片上传，限制 500MB。

## 1. 创建 R2 Bucket

在 Cloudflare 后台进入 R2，创建 Bucket，例如：

```text
personal-blog-videos
```

不要把 R2 Access Key 或 Secret Key 写进本仓库。Worker 使用 R2 Binding，不需要前端持有密钥。

## 2. 设置公开视频域名

为 Bucket 配置公开访问域名，例如：

```text
https://video.example.com
```

这个域名会作为 `R2_PUBLIC_BASE_URL`，上传完成后返回的公开视频地址形如：

```text
https://video.example.com/videos/{ownerUserId}/{uuid}-example.mp4
```

确认公开视频响应带正确 `Content-Type`，并支持 Range 请求，HTML5 `<video>` 才能边下边播。

## 3. 创建 Worker 配置

```powershell
cd cloudflare-video-worker
copy wrangler.toml.example wrangler.toml
npm install
npx wrangler login
```

编辑 `wrangler.toml`：

- `bucket_name` 改成你的 R2 Bucket 名称。
- `SUPABASE_URL` 填博客正在使用的 Supabase URL。
- `SUPABASE_ANON_KEY` 填 Supabase anon/publishable key。
- `R2_PUBLIC_BASE_URL` 填公开视频域名。
- `ALLOWED_ORIGINS` 保留 GitHub Pages 域名和本地调试域名，按需追加你的自定义域名。

站长用户 ID 使用 secret：

```powershell
npx wrangler secret put OWNER_USER_ID
```

输入 `supabase-config.js` 里的 `ownerUserId`，不要提交到 Git。

## 4. 本地调试 Worker

```powershell
npx wrangler dev
```

健康检查：

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/health
```

## 5. 部署 Worker

```powershell
npx wrangler deploy
```

部署完成后得到 Worker URL，例如：

```text
https://personal-blog-video-upload.example.workers.dev
```

## 6. 配置博客前端

编辑项目根目录的 `supabase-config.js`：

```js
window.BLOG_CONFIG = {
  supabaseUrl: "...",
  supabaseAnonKey: "...",
  ownerUserId: "...",
  videoUploadApi: "https://personal-blog-video-upload.example.workers.dev",
  videoPublicBaseUrl: "https://video.example.com",
  maxVideoSizeMb: 500,
};
```

`videoUploadApi` 留空时会自动回到 Supabase 50MB 兼容上传。

## 7. 验收测试

先启动博客本地服务器：

```powershell
cd ..
python -m http.server 8000
```

登录后台后依次测试：

1. 10MB MP4：应上传成功。
2. 60MB MP4：R2 模式应上传成功；Supabase 兼容模式应在上传前拒绝。
3. 200MB MP4：R2 模式应显示分片进度并上传成功。
4. 超过 500MB MP4：应在上传前拒绝。
5. 错误格式文件：应在上传前拒绝。
6. 上传中取消：应调用 Worker `/api/video/abort` 并停止继续上传。
7. 断网后恢复：可重试的网络错误和 408/429/5xx 会自动重试。
8. 未登录状态：Worker 返回 401。
9. 非站长账号：Worker 返回 403。
10. 发布文章成功后，视频 URL 写入 `articles.video_url`，前台播放器可播放。

测试完成后，到 R2 Bucket 删除测试文件。

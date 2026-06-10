# 虎桃不会振刀

一个水墨武侠风格的个人博客，使用原生 HTML、CSS 和 JavaScript 构建，并通过 GitHub Pages 发布。文章、评论、留言、登录和附件存储由 Supabase 提供。

## 本地预览

直接打开 `index.html`，或在项目目录运行：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 配置网站数据

1. 创建一个 Supabase 项目。
2. 在 Authentication 的 Users 页面创建唯一的站长用户，关闭公开注册，并复制用户 UUID。
3. 检查 `supabase-schema.sql` 中的站长 UUID，然后在 Supabase SQL Editor 执行完整脚本。已有项目也需要重新执行，以添加分类、标签、定时发布、阅读互动、评论楼层与审核字段。
4. 在 Supabase 的 Project Settings > API 中复制 Project URL 和 anon public key，填写到 `supabase-config.js`。
5. 部署后访问 `admin.html`，使用站长邮箱和密码登录，可编辑 Markdown、保存草稿、定时发布并管理评论。

`anon key` 可以公开在前端；真正的文章管理权限由 `supabase-schema.sql` 中的 RLS 策略限制为唯一站长。评论附件仅在前端允许图片、TXT 和 PDF，单个不超过 5 MB；生产环境还应在 Supabase Storage 中配置相同的 MIME 限制。不要把 `service_role key` 写入本项目。

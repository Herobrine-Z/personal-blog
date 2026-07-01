# Haoxuan Zhang（张颢轩） Blog & Portfolio

一个基于 Next.js App Router 的本地个人博客与作品集前端。第一阶段只包含完整可浏览界面，不接数据库、登录系统、真实 CMS 或线上部署。

## 本地运行

```bash
npm install
npm run dev
```

默认地址：

```text
http://localhost:3000
```

构建检查：

```bash
npm run build
```

## 已完成页面

- `/` 首页
- `/projects` 项目列表与分类筛选
- `/projects/[slug]` 项目详情
- `/blog` 博客列表、分类、标签与本地搜索
- `/blog/[slug]` 文章详情、阅读进度和目录
- `/resume` 在线简历与时间轴
- `/lab` 实验室
- `/about` 关于与联系
- `/lottie-preview` 内部 Lottie 动画预览
- `/robots.txt`、`/sitemap.xml` 基础 SEO 预留

## 主要依赖

- Next.js / React / TypeScript
- Tailwind CSS v4 / CSS Variables
- Motion for React
- GSAP / ScrollTrigger
- lottie-react
- lucide-react
- next-themes
- ESLint / Prettier

## 内容替换位置

- 个人信息：`src/data/profile.ts`
- 社交链接：`src/data/socials.ts`
- 项目数据：`src/data/projects.ts`
- 文章数据：`src/data/posts.ts`
- 简历经历：`src/data/experience.ts`
- 技能与能力：`src/data/skills.ts`
- 实验室数据：`src/data/lab.ts`

## 资源替换

- 项目、文章和实验室封面：`public/images/`
- Lottie 文件：
  - `public/lottie/shared/*.json`
  - `public/lottie/light/*.json`
  - `public/lottie/dark/*.json`
- PDF 简历：
  - 放入 `public/resume/haoxuan-zhang-resume.pdf`
  - 文件不存在时，下载按钮会显示合理提示，不会跳转到错误地址。

## MDX 预留

目录已预留：

```text
content/posts
content/projects
```

当前正文仍来自 TypeScript 模拟数据。后续可接入 MDX frontmatter 和正文渲染。

## 动效位置

- Motion：按钮按压、卡片交互、移动菜单、筛选切换、搜索框反馈、进入视口 Reveal。
- GSAP ScrollTrigger：项目详情页封面视差与图片出现、简历时间轴线条延展与节点出现。
- Lottie：首页品牌开场、Hero Orbit、项目/文章/简历/实验室图形、联系状态、404 与内部预览页；组件支持缺失文件降级、进入视口播放、离开视口暂停、页面隐藏暂停和 reduced motion 静态占位。

## 第二阶段可接入

- MDX 内容读取与目录生成
- 真实文章归档、RSS 和 sitemap 动态日期
- 图片压缩流水线与 AVIF/WebP
- 简历 PDF 生成或多语言简历
- CMS 或 Git-based content workflow
- 更完整的 WebGL / Live2D 展示模块

## 当前检查结果

`npm run build` 已通过，所有主要页面均已静态生成。

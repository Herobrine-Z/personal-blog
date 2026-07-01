export type LottieItem = {
  key: string;
  name: string;
  description: string;
  shared: string;
  light: string;
  dark: string;
  loop: boolean;
  speed: number;
  placement: string;
};

export const lottieItems: LottieItem[] = [
  {
    key: "brand-intro",
    name: "Brand Intro",
    description: "首页品牌开场与个人标识。",
    shared: "/lottie/shared/brand-intro.json",
    light: "/lottie/light/brand-intro.json",
    dark: "/lottie/dark/brand-intro.json",
    loop: false,
    speed: 1,
    placement: "首页首次进入、About 品牌区域",
  },
  {
    key: "hero-orbit",
    name: "Hero Orbit",
    description: "首页 Hero 区域的低干扰循环图形。",
    shared: "/lottie/shared/hero-orbit.json",
    light: "/lottie/light/hero-orbit.json",
    dark: "/lottie/dark/hero-orbit.json",
    loop: true,
    speed: 0.72,
    placement: "首页首屏姓名侧后方",
  },
  {
    key: "projects-stack",
    name: "Projects Stack",
    description: "项目区域标题旁的轻量图形。",
    shared: "/lottie/shared/projects-stack.json",
    light: "/lottie/light/projects-stack.json",
    dark: "/lottie/dark/projects-stack.json",
    loop: false,
    speed: 0.9,
    placement: "首页精选项目、Projects 页面顶部",
  },
  {
    key: "resume-timeline",
    name: "Resume Timeline",
    description: "简历首屏与时间轴的辅助图形。",
    shared: "/lottie/shared/resume-timeline.json",
    light: "/lottie/light/resume-timeline.json",
    dark: "/lottie/dark/resume-timeline.json",
    loop: false,
    speed: 0.9,
    placement: "Resume 页面首屏右侧",
  },
  {
    key: "article-writing",
    name: "Article Writing",
    description: "文章区域的写作状态图形。",
    shared: "/lottie/shared/article-writing.json",
    light: "/lottie/light/article-writing.json",
    dark: "/lottie/dark/article-writing.json",
    loop: false,
    speed: 0.9,
    placement: "首页最新文章、Blog 页面 Hero",
  },
  {
    key: "lab-modules",
    name: "Lab Modules",
    description: "实验室模块的低速循环图形。",
    shared: "/lottie/shared/lab-modules.json",
    light: "/lottie/light/lab-modules.json",
    dark: "/lottie/dark/lab-modules.json",
    loop: true,
    speed: 0.6,
    placement: "Lab 页面首屏",
  },
  {
    key: "message-success",
    name: "Message Success",
    description: "联系表单成功状态动画，仅在真实成功状态播放。",
    shared: "/lottie/shared/message-success.json",
    light: "/lottie/light/message-success.json",
    dark: "/lottie/dark/message-success.json",
    loop: false,
    speed: 1,
    placement: "About 联系状态区域、Lottie 预览页",
  },
  {
    key: "lost-dot-404",
    name: "Lost Dot 404",
    description: "404 页面未找到状态动画。",
    shared: "/lottie/shared/lost-dot-404.json",
    light: "/lottie/light/lost-dot-404.json",
    dark: "/lottie/dark/lost-dot-404.json",
    loop: true,
    speed: 0.65,
    placement: "not-found.tsx",
  },
];

export function getLottieItem(key: string) {
  return lottieItems.find((item) => item.key === key);
}

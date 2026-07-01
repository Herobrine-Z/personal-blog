import { Atom, Braces, Clapperboard, Cuboid, Palette, Sparkles } from "lucide-react";

export const capabilities = [
  { title: "Web 开发", icon: Braces, text: "React、Next.js、TypeScript 与工程化落地。" },
  { title: "交互设计", icon: Atom, text: "信息层级、反馈节奏和多端体验设计。" },
  { title: "动效设计", icon: Sparkles, text: "Motion、GSAP、Lottie 的克制组合。" },
  { title: "AI 视觉创作", icon: Palette, text: "从生成到筛选、修图和页面整合。" },
  { title: "Manim 科普动画", icon: Clapperboard, text: "用程序化镜头解释数学与物理概念。" },
  { title: "Live2D 与数字角色", icon: Cuboid, text: "角色展示、状态交互和叙事界面原型。" },
];

export const skillGroups = [
  { title: "前端", items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "MDX"] },
  { title: "动效", items: ["Motion for React", "GSAP", "ScrollTrigger", "Lottie"] },
  { title: "视觉", items: ["Figma", "AI Image Workflow", "Photoshop", "Typography"] },
  { title: "创作", items: ["Manim", "Live2D", "Video Editing", "Prompt Design"] },
];

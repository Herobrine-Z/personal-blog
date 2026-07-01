export type ProjectCategory =
  | "Web 与 H5"
  | "Manim 与科普动画"
  | "AI 影像与视觉设计"
  | "Live2D 与虚拟角色"
  | "开源工具与代码"
  | "比赛作品";

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: ProjectCategory;
  year: string;
  cover: string;
  featured: boolean;
  tags: string[];
  responsibilities: string[];
  background: string;
  goals: string[];
  process: string[];
  challenges: string[];
  results: string[];
  gallery: string[];
  github?: string;
  demo?: string;
};

export type PostCategory =
  | "技术开发"
  | "视觉设计"
  | "物理与数学"
  | "AI 创作"
  | "项目复盘"
  | "随笔思考";

export type Post = {
  slug: string;
  title: string;
  description: string;
  category: PostCategory;
  tags: string[];
  date: string;
  readingTime: string;
  cover?: string;
  featured: boolean;
  headings: string[];
};

export type Experience = {
  time: string;
  title: string;
  place: string;
  description: string;
  points: string[];
};

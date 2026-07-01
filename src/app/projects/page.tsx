import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProjectExplorer } from "@/components/project/ProjectExplorer";
import { ThemedLottie } from "@/components/animation/ThemedLottie";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getLottieItem } from "@/data/lottie";

export const metadata: Metadata = {
  title: "项目",
  description: "Haoxuan Zhang（张颢轩）的项目与作品集。",
};

export default function ProjectsPage() {
  const projectsStack = getLottieItem("projects-stack")!;

  return (
    <PageContainer>
      <section className="container-shell section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_260px] lg:items-end">
          <SectionHeading
            eyebrow="Projects"
            title="作品不是截图集合，而是问题、过程和结果。"
            text="按方向筛选项目，查看每个作品背后的设计目标、实现过程和技术方案。"
          />
          <ThemedLottie
            light={projectsStack.light}
            dark={projectsStack.dark}
            loop={false}
            speed={projectsStack.speed}
            className="pointer-events-none aspect-square w-48 lg:ml-auto lg:w-64"
            decorative
          />
        </div>
        <ProjectExplorer />
      </section>
    </PageContainer>
  );
}

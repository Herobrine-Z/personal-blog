import type { Metadata } from "next";
import Image from "next/image";
import { ThemedLottie } from "@/components/animation/ThemedLottie";
import { LottieDemo } from "@/components/lab/LottieDemo";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getLottieItem } from "@/data/lottie";
import { labItems } from "@/data/lab";

export const metadata: Metadata = {
  title: "实验室",
  description: "GSAP、Lottie、WebGL、AI 影像和 Manim 的创意实验集合。",
};

export default function LabPage() {
  const labModules = getLottieItem("lab-modules")!;

  return (
    <PageContainer>
      <section className="container-shell section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-end">
          <SectionHeading
            eyebrow="Lab"
            title="还没有定型的东西，也值得被认真摆放。"
            text="实验室展示动效、视觉和概念原型。第一阶段使用本地模拟数据和轻量预览。"
          />
          <ThemedLottie
            light={labModules.light}
            dark={labModules.dark}
            loop
            speed={labModules.speed}
            className="pointer-events-none aspect-square w-52 lg:ml-auto lg:w-72"
            decorative
            hideWhenReducedMotion
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <LottieDemo />
          <div className="grid gap-5 sm:grid-cols-2">
            {labItems.filter((item) => !item.lottie).slice(0, 4).map((item) => (
              <article className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-solid)] p-4" key={item.title}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[var(--surface-muted)]">
                  <Image src={item.preview} alt={`${item.title} 预览`} fill sizes="(max-width: 768px) 50vw, 280px" className="object-cover" />
                </div>
                <p className="mt-4 text-sm text-[var(--text-secondary)]">{item.type} · {item.year}</p>
                <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

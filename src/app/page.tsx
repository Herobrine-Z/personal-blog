import { ArrowRight, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemedLottie } from "@/components/animation/ThemedLottie";
import { Reveal } from "@/components/animation/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { posts } from "@/data/posts";
import { getLottieItem } from "@/data/lottie";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { capabilities } from "@/data/skills";
import { socials } from "@/data/socials";

export default function Home() {
  const featuredProjects = projects.filter((project) => project.featured).slice(0, 4);
  const latestPosts = posts.slice(0, 4);
  const heroOrbit = getLottieItem("hero-orbit")!;
  const projectsStack = getLottieItem("projects-stack")!;
  const articleWriting = getLottieItem("article-writing")!;

  return (
    <PageContainer>
      <section className="container-shell grid min-h-[calc(100svh-var(--nav-height))] items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <p className="mb-4 text-sm font-medium text-[var(--accent)]">{profile.role}</p>
          <h1 className="text-5xl font-semibold tracking-normal sm:text-7xl lg:text-8xl">
            {profile.name}
          </h1>
          <p className="mt-3 text-3xl font-semibold sm:text-5xl">{profile.chineseName}</p>
          <p className="mt-7 max-w-2xl text-xl leading-9 text-[var(--text-secondary)] sm:text-2xl">
            {profile.summary}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/projects">
              查看作品 <ArrowRight size={16} />
            </Button>
            <Button href="/about" variant="secondary">
              了解我
            </Button>
          </div>
        </Reveal>
        <Reveal className="relative">
          <div className="relative mx-auto aspect-square max-w-[540px] rounded-[36px] border border-[var(--border)] bg-[var(--surface-solid)] p-5 shadow-[var(--shadow-soft)]">
            <ThemedLottie
              className="pointer-events-none h-full opacity-80"
              light={heroOrbit.light}
              dark={heroOrbit.dark}
              loop
              speed={heroOrbit.speed}
              decorative
              hideWhenReducedMotion
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur">
              <p className="text-sm text-[var(--text-secondary)]">{profile.status}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="section-space container-shell">
        <div className="flex items-start justify-between gap-6">
          <SectionHeading
            eyebrow="精选项目"
            title="把想法做成可以被触摸的界面。"
            text="这里展示第一阶段的模拟项目数据。每个项目都可进入详情页，结构为后续 MDX 内容预留。"
          />
          <ThemedLottie
            light={projectsStack.light}
            dark={projectsStack.dark}
            loop={false}
            speed={projectsStack.speed}
            className="pointer-events-none hidden aspect-square w-28 shrink-0 md:block"
            decorative
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {featuredProjects.map((project) => (
            <Link
              className="group focus-ring surface block overflow-hidden rounded-[28px]"
              href={`/projects/${project.slug}`}
              key={project.slug}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-muted)]">
                <Image
                  src={project.cover}
                  alt={`${project.title} 项目封面`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
                  <span>{project.category}</span>
                  <span>{project.year}</span>
                </div>
                <h3 className="mt-3 flex items-center gap-2 text-2xl font-semibold">
                  {project.title}
                  <ArrowRight
                    className="transition-transform group-hover:translate-x-1"
                    size={18}
                  />
                </h3>
                <p className="mt-3 leading-7 text-[var(--text-secondary)]">{project.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-space bg-[var(--surface-solid)]">
        <div className="container-shell">
          <SectionHeading eyebrow="能力方向" title="工程、审美和叙事放在同一张桌上。" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item) => (
              <Reveal
                className="rounded-[24px] border border-[var(--border)] p-6"
                key={item.title}
              >
                <item.icon className="mb-8 text-[var(--accent)]" size={24} />
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-[var(--text-secondary)]">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space container-shell">
        <div className="flex items-start justify-between gap-6">
          <SectionHeading eyebrow="最新文章" title="记录每次取舍背后的判断。" />
          <ThemedLottie
            light={articleWriting.light}
            dark={articleWriting.dark}
            loop={false}
            speed={articleWriting.speed}
            className="pointer-events-none hidden aspect-square w-28 shrink-0 md:block"
            decorative
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {latestPosts.map((post) => (
            <Link
              className="focus-ring group rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-5 transition-transform hover:-translate-y-1"
              href={`/blog/${post.slug}`}
              key={post.slug}
            >
              <p className="text-sm text-[var(--text-secondary)]">
                {post.category} · {post.readingTime}
              </p>
              <h3 className="mt-4 text-xl font-semibold leading-7">{post.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-space container-shell grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="rounded-[32px] bg-[var(--text-primary)] p-8 text-[var(--background)]">
          <Download className="mb-10" size={28} />
          <h2 className="text-3xl font-semibold">简历摘要</h2>
          <p className="mt-4 leading-8 opacity-80">
            {profile.current}。教育方向：{profile.education}。主要关注前端工程、交互动效、
            AI 视觉创作与科普动画。
          </p>
          <div className="mt-8">
            <Button href="/resume" variant="secondary">
              查看完整简历
            </Button>
          </div>
        </Reveal>
        <Reveal className="rounded-[32px] border border-[var(--border)] p-8">
          <h2 className="text-3xl font-semibold">保持联系</h2>
          <p className="mt-4 max-w-2xl leading-8 text-[var(--text-secondary)]">
            如果你对前端、视觉叙事、动画解释或虚拟角色项目感兴趣，可以从这些入口找到我。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {socials.map((social) => (
              <Button href={social.href} variant="secondary" key={social.label}>
                <social.icon size={16} />
                {social.label}
              </Button>
            ))}
          </div>
        </Reveal>
      </section>
    </PageContainer>
  );
}

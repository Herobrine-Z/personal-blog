import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, GitBranch } from "lucide-react";
import { ProjectStoryMotion } from "@/components/project/ProjectStoryMotion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { projects } from "@/data/projects";
import { getAdjacentBySlug, getProject } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: project.title, description: project.description };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const adjacent = getAdjacentBySlug(projects, project.slug);

  return (
    <ProjectStoryMotion>
      <main className="pt-[var(--nav-height)]">
        <section className="container-shell section-space pb-12">
          <Link className="focus-ring mb-10 inline-flex items-center gap-2 rounded-full text-sm text-[var(--text-secondary)]" href="/projects">
            <ArrowLeft size={16} /> 返回项目
          </Link>
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-medium text-[var(--accent)]">{project.category} · {project.year}</p>
            <h1 className="text-5xl font-semibold tracking-normal sm:text-7xl">{project.title}</h1>
            <p className="mt-6 text-2xl leading-10 text-[var(--text-secondary)]">{project.subtitle}</p>
          </div>
          <div data-story-hero className="relative mt-12 aspect-[16/9] overflow-hidden rounded-[36px] bg-[var(--surface-muted)]">
            <Image src={project.cover} alt={`${project.title} 项目封面`} fill priority sizes="100vw" className="object-cover" />
          </div>
        </section>

        <section className="container-shell grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold">我负责的内容</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {project.responsibilities.map((item) => <Badge key={item}>{item}</Badge>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {project.github ? <Button href={project.github} variant="secondary"><GitBranch size={16} /> GitHub</Button> : null}
              {project.demo ? <Button href={project.demo}><ExternalLink size={16} /> 在线预览</Button> : null}
            </div>
          </div>
          <div className="prose-custom">
            <h2 id="背景">项目背景</h2>
            <p>{project.background}</p>
            <h2 id="设计目标">设计目标</h2>
            <ul>{project.goals.map((item) => <li key={item}>{item}</li>)}</ul>
            <h2 id="技术方案">技术方案与过程</h2>
            <ul>{project.process.map((item) => <li key={item}>{item}</li>)}</ul>
            <h2 id="问题">遇到的问题</h2>
            <ul>{project.challenges.map((item) => <li key={item}>{item}</li>)}</ul>
            <h2 id="成果">最终成果</h2>
            <ul>{project.results.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </section>

        <section className="container-shell section-space" data-story-gallery>
          <div className="mb-8 flex flex-wrap gap-2">
            {project.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {project.gallery.map((image) => (
              <div data-story-image className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-[var(--surface-muted)]" key={image}>
                <Image src={image} alt={`${project.title} 展示图`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
        </section>

        <nav className="container-shell mb-20 grid gap-4 border-t border-[var(--border)] pt-8 md:grid-cols-2" aria-label="项目导航">
          {adjacent.previous ? (
            <Link className="focus-ring rounded-[24px] border border-[var(--border)] p-5" href={`/projects/${adjacent.previous.slug}`}>
              <span className="text-sm text-[var(--text-secondary)]">上一个项目</span>
              <p className="mt-2 text-xl font-semibold">{adjacent.previous.title}</p>
            </Link>
          ) : <div />}
          {adjacent.next ? (
            <Link className="focus-ring rounded-[24px] border border-[var(--border)] p-5 text-right" href={`/projects/${adjacent.next.slug}`}>
              <span className="text-sm text-[var(--text-secondary)]">下一个项目</span>
              <p className="mt-2 inline-flex items-center gap-2 text-xl font-semibold">{adjacent.next.title}<ArrowRight size={18} /></p>
            </Link>
          ) : null}
        </nav>
      </main>
    </ProjectStoryMotion>
  );
}

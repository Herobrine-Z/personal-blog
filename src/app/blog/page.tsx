import type { Metadata } from "next";
import { ThemedLottie } from "@/components/animation/ThemedLottie";
import { BlogExplorer } from "@/components/blog/BlogExplorer";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getLottieItem } from "@/data/lottie";
import { posts } from "@/data/posts";

export const metadata: Metadata = {
  title: "文章",
  description: "技术、视觉、动效与创作复盘文章。",
};

export default function BlogPage() {
  const featured = posts.filter((post) => post.featured).slice(0, 3);
  const articleWriting = getLottieItem("article-writing")!;

  return (
    <PageContainer>
      <section className="container-shell section-space">
        <div className="grid gap-8 lg:grid-cols-[1fr_260px] lg:items-end">
          <SectionHeading
            eyebrow="Blog"
            title="写下方法，也写下判断。"
            text="文章系统目前使用本地数据，支持分类、标签和关键词搜索，为后续 MDX 内容接入预留结构。"
          />
          <ThemedLottie
            light={articleWriting.light}
            dark={articleWriting.dark}
            loop={false}
            speed={articleWriting.speed}
            className="pointer-events-none aspect-square w-48 lg:ml-auto lg:w-64"
            decorative
          />
        </div>
        <div className="mb-12 grid gap-4 lg:grid-cols-3">
          {featured.map((post) => (
            <a className="focus-ring rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-6" href={`/blog/${post.slug}`} key={post.slug}>
              <span className="text-sm text-[var(--accent)]">{post.category}</span>
              <h2 className="mt-5 text-2xl font-semibold">{post.title}</h2>
              <p className="mt-3 leading-7 text-[var(--text-secondary)]">{post.description}</p>
            </a>
          ))}
        </div>
        <BlogExplorer />
        <div id="archive" className="mt-16 rounded-[28px] border border-[var(--border)] p-6">
          <h2 className="text-2xl font-semibold">文章归档</h2>
          <div className="mt-5 grid gap-3">
            {posts.map((post) => (
              <a className="focus-ring flex flex-col justify-between gap-2 rounded-2xl py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:flex-row" href={`/blog/${post.slug}`} key={post.slug}>
                <span>{post.title}</span>
                <span>{post.date}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

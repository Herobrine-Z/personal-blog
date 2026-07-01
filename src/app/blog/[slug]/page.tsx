import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronUp } from "lucide-react";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { Badge } from "@/components/ui/Badge";
import { posts } from "@/data/posts";
import { profile } from "@/data/profile";
import { getAdjacentBySlug, getPost } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const adjacent = getAdjacentBySlug(posts, post.slug);
  const related = posts.filter((item) => item.slug !== post.slug && item.category === post.category).slice(0, 2);

  return (
    <main className="pt-[var(--nav-height)]">
      <ReadingProgress />
      <article className="container-shell section-space">
        <Link className="focus-ring mb-10 inline-flex items-center gap-2 rounded-full text-sm text-[var(--text-secondary)]" href="/blog">
          <ArrowLeft size={16} /> 返回文章
        </Link>
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 flex justify-center gap-2">
            <Badge>{post.category}</Badge>
            <Badge>{post.readingTime}</Badge>
          </div>
          <h1 className="text-4xl font-semibold tracking-normal sm:text-6xl">{post.title}</h1>
          <p className="mt-6 text-xl leading-9 text-[var(--text-secondary)]">{post.description}</p>
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">{post.date} · {profile.name}</p>
        </div>
        {post.cover ? (
          <div className="relative mt-12 aspect-[16/8] overflow-hidden rounded-[36px] bg-[var(--surface-muted)]">
            <Image src={post.cover} alt={`${post.title} 封面`} fill priority sizes="100vw" className="object-cover" />
          </div>
        ) : null}
      </article>

      <div className="container-shell grid gap-10 pb-24 xl:grid-cols-[1fr_minmax(0,720px)_1fr]">
        <div />
        <div className="prose-custom">
          {post.headings.map((heading, index) => (
            <section key={heading}>
              <h2 id={heading}>{heading}</h2>
              <p>
                这是一段为第一阶段准备的本地模拟正文。它保留了真实文章需要的阅读密度、段落节奏和排版结构，
                后续可以用 MDX 文件替换，而无需改变页面骨架。
              </p>
              {index === 1 ? (
                <>
                  <blockquote>好的界面不会把所有能力同时推到读者面前，而是让下一步自然出现。</blockquote>
                  <pre><code>{`const motionRule = {
  purpose: "feedback first",
  duration: 0.32,
  properties: ["transform", "opacity"],
};`}</code></pre>
                </>
              ) : null}
              <p>
                在项目写作里，我更关心判断的可复盘性：为什么这样组织信息，为什么减少装饰，为什么让动效停在这里。
                这些问题比单纯罗列技术名词更能说明作品的质量。
              </p>
            </section>
          ))}
          <h2 id="公式预留">数学公式样式预留</h2>
          <p>公式区域后续可接入 rehype-katex。当前先保留排版位置：E = mc^2，f(x) = ax + b。</p>
        </div>
        <TableOfContents headings={[...post.headings, "公式预留"]} />
      </div>

      <section className="container-shell mb-20">
        <div className="grid gap-4 border-t border-[var(--border)] pt-8 md:grid-cols-2">
          {adjacent.previous ? <Link className="focus-ring rounded-[24px] border border-[var(--border)] p-5" href={`/blog/${adjacent.previous.slug}`}><span className="text-sm text-[var(--text-secondary)]">上一篇</span><p className="mt-2 text-xl font-semibold">{adjacent.previous.title}</p></Link> : <div />}
          {adjacent.next ? <Link className="focus-ring rounded-[24px] border border-[var(--border)] p-5 text-right" href={`/blog/${adjacent.next.slug}`}><span className="text-sm text-[var(--text-secondary)]">下一篇</span><p className="mt-2 inline-flex items-center gap-2 text-xl font-semibold">{adjacent.next.title}<ArrowRight size={18} /></p></Link> : null}
        </div>
        {related.length ? (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold">相关文章</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {related.map((item) => <Link className="focus-ring rounded-[22px] border border-[var(--border)] p-5" href={`/blog/${item.slug}`} key={item.slug}>{item.title}</Link>)}
            </div>
          </div>
        ) : null}
        <a className="focus-ring mt-10 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm" href="#">
          <ChevronUp size={16} /> 返回顶部
        </a>
      </section>
    </main>
  );
}

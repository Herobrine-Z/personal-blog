import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/types/content";
import { Badge } from "@/components/ui/Badge";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="focus-ring group grid gap-5 rounded-[26px] border border-[var(--border)] bg-[var(--surface-solid)] p-4 transition-transform hover:-translate-y-1 sm:grid-cols-[180px_1fr]"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-[var(--surface-muted)] sm:aspect-square">
        {post.cover ? (
          <Image
            src={post.cover}
            alt={`${post.title} 文章封面`}
            fill
            sizes="(max-width: 640px) 100vw, 180px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        ) : null}
      </div>
      <div className="py-1">
        <div className="flex flex-wrap gap-2">
          <Badge>{post.category}</Badge>
          <Badge>{post.readingTime}</Badge>
        </div>
        <h2 className="mt-4 text-2xl font-semibold">{post.title}</h2>
        <p className="mt-3 leading-7 text-[var(--text-secondary)]">{post.description}</p>
        <p className="mt-5 text-sm text-[var(--text-tertiary)]">{post.date}</p>
      </div>
    </Link>
  );
}

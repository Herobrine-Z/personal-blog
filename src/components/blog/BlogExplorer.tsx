"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { postCategories, posts } from "@/data/posts";
import { cn } from "@/lib/utils";
import { PostCard } from "./PostCard";

const allTags = Array.from(new Set(posts.flatMap((post) => post.tags)));

export function BlogExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof postCategories)[number]>("全部");
  const [tag, setTag] = useState("全部");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuery("");
        setFocused(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return posts.filter((post) => {
      const categoryMatch = category === "全部" || post.category === category;
      const tagMatch = tag === "全部" || post.tags.includes(tag);
      const queryMatch =
        !term ||
        [post.title, post.description, post.category, ...post.tags]
          .join(" ")
          .toLowerCase()
          .includes(term);
      return categoryMatch && tagMatch && queryMatch;
    });
  }, [category, query, tag]);

  return (
    <div>
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <motion.div
          animate={{ scale: focused ? 1.01 : 1 }}
          className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3"
        >
          <Search
            className={cn("text-[var(--text-tertiary)] transition-transform", focused && "translate-x-1")}
            size={18}
          />
          <input
            aria-label="搜索文章"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-tertiary)]"
            placeholder="搜索标题、分类或标签"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {query ? (
            <button
              aria-label="清空搜索"
              className="focus-ring grid size-8 place-items-center rounded-full"
              type="button"
              onClick={() => setQuery("")}
            >
              <X size={16} />
            </button>
          ) : null}
        </motion.div>
        <LinkArchive />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {postCategories.map((item) => (
          <button
            className={cn(
              "focus-ring shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm",
              category === item
                ? "bg-[var(--text-primary)] text-[var(--background)]"
                : "text-[var(--text-secondary)]",
            )}
            key={item}
            type="button"
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {["全部", ...allTags].map((item) => (
          <button
            className={cn(
              "focus-ring shrink-0 rounded-full px-3 py-1 text-sm",
              tag === item ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text-secondary)]",
            )}
            key={item}
            type="button"
            onClick={() => setTag(item)}
          >
            #{item}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length ? (
          <motion.div layout className="grid gap-4">
            {filtered.map((post) => (
              <motion.div layout key={post.slug}>
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState title="没有找到文章" text="试着减少关键词或切换分类。搜索仅使用本地模拟数据。" />
        )}
      </AnimatePresence>
    </div>
  );
}

function LinkArchive() {
  return (
    <a
      className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm text-[var(--text-secondary)]"
      href="#archive"
    >
      文章归档
    </a>
  );
}

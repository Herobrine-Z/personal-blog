"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { projectCategories, projects } from "@/data/projects";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./ProjectCard";

export function ProjectExplorer() {
  const [active, setActive] = useState<(typeof projectCategories)[number]>("全部");
  const filtered = useMemo(
    () => (active === "全部" ? projects : projects.filter((project) => project.category === active)),
    [active],
  );

  return (
    <div>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {projectCategories.map((category) => (
          <button
            className={cn(
              "focus-ring relative shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)]",
              active === category && "text-[var(--text-primary)]",
            )}
            key={category}
            type="button"
            onClick={() => setActive(category)}
          >
            {active === category ? (
              <motion.span
                className="absolute inset-0 rounded-full bg-[var(--surface-muted)]"
                layoutId="project-filter"
              />
            ) : null}
            <span className="relative">{category}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div layout className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard project={project} key={project.slug} />
            ))}
          </motion.div>
        ) : (
          <EmptyState title="没有匹配项目" text="换一个分类试试，后续接入真实数据后会显示更多内容。" />
        )}
      </AnimatePresence>
    </div>
  );
}

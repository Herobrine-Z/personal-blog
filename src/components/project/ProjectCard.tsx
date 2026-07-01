"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { Project } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { motionTokens } from "@/lib/motion";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.article layout transition={motionTokens.gentleSpring}>
      <Link
        className="focus-ring group block overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--surface-solid)]"
        href={`/projects/${project.slug}`}
      >
        <motion.div whileTap={{ scale: 0.985 }}>
          <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-muted)]">
            <Image
              src={project.cover}
              alt={`${project.title} 项目封面`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            />
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
              <span>{project.category}</span>
              <span>{project.year}</span>
            </div>
            <h2 className="mt-3 flex items-center justify-between gap-3 text-2xl font-semibold">
              {project.title}
              <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" size={18} />
            </h2>
            <p className="mt-3 min-h-14 leading-7 text-[var(--text-secondary)]">
              {project.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {project.tags.slice(0, 4).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.article>
  );
}

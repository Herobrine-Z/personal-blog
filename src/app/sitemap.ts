import type { MetadataRoute } from "next";
import { posts } from "@/data/posts";
import { projects } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "http://localhost:3000";
  return [
    "",
    "/projects",
    "/blog",
    "/resume",
    "/lab",
    "/about",
    ...projects.map((project) => `/projects/${project.slug}`),
    ...posts.map((post) => `/blog/${post.slug}`),
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date("2026-07-01"),
  }));
}

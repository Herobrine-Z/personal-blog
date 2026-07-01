"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function ProjectStoryMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !scope.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-story-image]", {
        y: 46,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: "[data-story-gallery]",
          start: "top 78%",
        },
      });
      gsap.to("[data-story-hero]", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-story-hero]",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, scope);

    return () => ctx.revert();
  }, []);

  return <div ref={scope}>{children}</div>;
}

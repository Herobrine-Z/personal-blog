"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { experiences } from "@/data/experience";

gsap.registerPlugin(ScrollTrigger);

export function ExperienceTimeline() {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !scope.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".timeline-line", {
        scaleY: 0,
        transformOrigin: "top",
        ease: "none",
        scrollTrigger: {
          trigger: scope.current,
          start: "top 70%",
          end: "bottom 60%",
          scrub: true,
        },
      });
      gsap.from(".timeline-item", {
        opacity: 0,
        y: 28,
        stagger: 0.12,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: scope.current,
          start: "top 68%",
        },
      });
    }, scope);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={scope} className="relative">
      <div className="timeline-line absolute left-3 top-2 hidden h-full w-px bg-[var(--accent)] md:block" />
      <div className="grid gap-6">
        {experiences.map((item) => (
          <article className="timeline-item grid gap-4 md:grid-cols-[120px_1fr]" key={item.title}>
            <div className="relative">
              <span className="hidden size-6 rounded-full border-4 border-[var(--background)] bg-[var(--accent)] md:block" />
              <p className="mt-2 text-sm font-medium text-[var(--accent)] md:ml-10">{item.time}</p>
            </div>
            <div className="rounded-[26px] border border-[var(--border)] bg-[var(--surface-solid)] p-6">
              <p className="text-sm text-[var(--text-secondary)]">{item.place}</p>
              <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
              <p className="mt-3 leading-7 text-[var(--text-secondary)]">{item.description}</p>
              <ul className="mt-4 grid gap-2 text-sm text-[var(--text-secondary)]">
                {item.points.map((point) => <li key={point}>· {point}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

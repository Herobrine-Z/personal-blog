"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ThemedLottie } from "@/components/animation/ThemedLottie";
import { getLottieItem } from "@/data/lottie";
import { profile } from "@/data/profile";

const brandIntro = getLottieItem("brand-intro")!;

export function BrandIntro() {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const played = window.sessionStorage.getItem("haoxuan-brand-intro-played");
    if (played) return;
    window.sessionStorage.setItem("haoxuan-brand-intro-played", "true");
    const showTimer = window.setTimeout(() => setVisible(true), 0);
    const timer = window.setTimeout(() => setVisible(false), 1800);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(timer);
    };
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[70] grid place-items-center bg-[var(--background)]/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35 }}
        >
          <div className="grid place-items-center gap-4">
            <ThemedLottie
              light={brandIntro.light}
              dark={brandIntro.dark}
              loop={false}
              autoplay
              playOnView={false}
              className="aspect-square w-44"
              decorative
            />
            <div className="text-center">
              <p className="text-xl font-semibold">{profile.displayName}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{profile.role}</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/components/providers";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      aria-label="切换深浅色主题"
      className="focus-ring grid size-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] backdrop-blur"
      whileTap={{ scale: 0.92 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -40, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
      >
        {isDark ? <Moon size={18} /> : <Sun size={18} />}
      </motion.span>
    </motion.button>
  );
}

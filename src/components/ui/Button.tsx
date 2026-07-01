"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motionTokens } from "@/lib/motion";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
} & HTMLMotionProps<"button">;

export function Button({ children, href, variant = "primary", className, ...props }: ButtonProps) {
  const classes = cn(
    "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors",
    variant === "primary" && "bg-[var(--text-primary)] text-[var(--background)] hover:opacity-90",
    variant === "secondary" &&
      "border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
    variant === "ghost" && "text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
    className,
  );

  if (href) {
    return (
      <motion.span whileTap={{ scale: 0.975 }} transition={motionTokens.spring}>
        <Link className={classes} href={href}>
          {children}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.button
      className={classes}
      whileTap={{ scale: 0.975 }}
      transition={motionTokens.spring}
      {...props}
    >
      {children}
    </motion.button>
  );
}

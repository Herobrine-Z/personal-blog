import type { Transition, Variants } from "motion/react";

export const motionTokens = {
  duration: {
    fast: 0.18,
    normal: 0.32,
    slow: 0.55,
  },
  spring: {
    type: "spring",
    stiffness: 380,
    damping: 30,
    mass: 0.8,
  } satisfies Transition,
  gentleSpring: {
    type: "spring",
    stiffness: 220,
    damping: 26,
    mass: 1,
  } satisfies Transition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionTokens.gentleSpring,
  },
};

export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const scalePress = {
  whileTap: { scale: 0.975 },
  transition: motionTokens.spring,
};

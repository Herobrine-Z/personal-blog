"use client";

import { LottieAnimation, type LottieAnimationProps } from "@/components/animation/LottieAnimation";
import { useTheme } from "@/components/providers";

type ThemedLottieProps = Omit<LottieAnimationProps, "src"> & {
  light: string;
  dark: string;
  shared?: string;
};

export function ThemedLottie({ light, dark, shared, ...props }: ThemedLottieProps) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? dark : light;

  return <LottieAnimation key={src} src={src ?? shared ?? light} {...props} />;
}

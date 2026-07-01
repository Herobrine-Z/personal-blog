"use client";

import { LottieAnimation } from "./LottieAnimation";

type LottiePlayerProps = {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  playOnView?: boolean;
  replayOnHover?: boolean;
  label: string;
  className?: string;
};

export function LottiePlayer({
  label,
  replayOnHover,
  ...props
}: LottiePlayerProps) {
  return (
    <LottieAnimation
      {...props}
      ariaLabel={label}
      decorative={false}
      replayOnHover={replayOnHover}
    />
  );
}

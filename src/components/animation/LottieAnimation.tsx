"use client";

import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { assetPath } from "@/lib/assets";

export type LottieAnimationProps = {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  playOnView?: boolean;
  pauseWhenHidden?: boolean;
  ariaLabel?: string;
  decorative?: boolean;
  replayOnHover?: boolean;
  hideWhenReducedMotion?: boolean;
  onLoadStateChange?: (state: "idle" | "loading" | "success" | "error") => void;
};

type LottieData = Record<string, unknown>;

const lottieCache = new Map<string, Promise<LottieData>>();

function loadLottie(src: string, signal: AbortSignal) {
  if (!lottieCache.has(src)) {
    lottieCache.set(
      src,
      fetch(src, { signal }).then((res) => {
        if (!res.ok) throw new Error(`Unable to load Lottie: ${src}`);
        return res.json() as Promise<LottieData>;
      }),
    );
  }

  return lottieCache.get(src)!;
}

export function LottieAnimation({
  src,
  className,
  loop = true,
  autoplay = true,
  speed = 1,
  playOnView = true,
  pauseWhenHidden = true,
  ariaLabel,
  decorative = true,
  replayOnHover = false,
  hideWhenReducedMotion = false,
  onLoadStateChange,
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const inView = useInView(containerRef, { margin: "-80px" });
  const reducedMotion = useReducedMotion();
  const [data, setData] = useState<LottieData | null>(null);
  const [failed, setFailed] = useState(false);
  const shouldLoad = !playOnView || inView;
  const resolvedSrc = useMemo(() => assetPath(src), [src]);

  useEffect(() => {
    if (!shouldLoad || reducedMotion) return;
    const controller = new AbortController();
    onLoadStateChange?.("loading");

    loadLottie(resolvedSrc, controller.signal)
      .then((json) => {
        setData(json);
        onLoadStateChange?.("success");
      })
      .catch((error: unknown) => {
        if ((error as Error).name === "AbortError") return;
        setFailed(true);
        onLoadStateChange?.("error");
      });

    return () => controller.abort();
  }, [onLoadStateChange, reducedMotion, resolvedSrc, shouldLoad]);

  useEffect(() => {
    lottieRef.current?.setSpeed(speed);
  }, [data, speed]);

  useEffect(() => {
    if (!pauseWhenHidden || !lottieRef.current) return;

    const syncVisibility = () => {
      if (document.hidden) lottieRef.current?.pause();
      else if ((!playOnView || inView) && autoplay) lottieRef.current?.play();
    };

    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, [autoplay, inView, pauseWhenHidden, playOnView]);

  useEffect(() => {
    if (!lottieRef.current || reducedMotion || !playOnView) return;
    if (inView && autoplay) lottieRef.current.play();
    else lottieRef.current.pause();
  }, [autoplay, inView, playOnView, reducedMotion]);

  if ((reducedMotion && hideWhenReducedMotion) || failed) {
    return <div ref={containerRef} className={className} aria-hidden="true" />;
  }

  if (reducedMotion || !data) {
    return (
      <div
        ref={containerRef}
        className={className}
        aria-hidden={decorative ? "true" : undefined}
        aria-label={!decorative ? ariaLabel : undefined}
      >
        <div className="grid size-full min-h-40 place-items-center rounded-[28px] border border-[var(--border)] bg-[var(--surface-muted)]">
          <div className="relative aspect-square w-24 rounded-full border border-[var(--border)]">
            <span className="absolute inset-5 rounded-full border border-[var(--accent)] opacity-55" />
            <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={!decorative ? ariaLabel : undefined}
      onMouseEnter={() => {
        if (replayOnHover) lottieRef.current?.goToAndPlay(0, true);
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={data}
        loop={loop}
        autoplay={autoplay && (!playOnView || inView)}
      />
    </div>
  );
}

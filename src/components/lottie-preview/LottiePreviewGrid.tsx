"use client";

import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/assets";
import { lottieItems, type LottieItem } from "@/data/lottie";
import { Button } from "@/components/ui/Button";

type LoadedAnimation = {
  data: Record<string, unknown>;
  status: "success" | "error" | "loading";
  bytes: number;
  size: string;
};

export function LottiePreviewGrid() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-3">
        <Button variant={theme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>
          浅色动画
        </Button>
        <Button variant={theme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>
          深色动画
        </Button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {lottieItems.map((item) => (
          <PreviewCard item={item} theme={theme} key={item.key} />
        ))}
      </div>
    </div>
  );
}

function PreviewCard({ item, theme }: { item: LottieItem; theme: "light" | "dark" }) {
  const ref = useRef<LottieRefCurrentProps>(null);
  const [speed, setSpeed] = useState(item.speed);
  const [loop, setLoop] = useState(item.loop);
  const [loaded, setLoaded] = useState<LoadedAnimation>({
    data: {},
    status: "loading",
    bytes: 0,
    size: "未知",
  });
  const src = theme === "dark" ? item.dark : item.light;
  const resolvedSrc = assetPath(src);

  const load = useCallback(() => {
    const controller = new AbortController();
    window.setTimeout(() => {
      setLoaded((current) => ({ ...current, status: "loading" }));
    }, 0);
    fetch(resolvedSrc, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("load failed");
        const text = await res.text();
        const json = JSON.parse(text) as Record<string, unknown>;
        setLoaded({
          data: json,
          status: "success",
          bytes: new Blob([text]).size,
          size: `${json.w ?? "?"} × ${json.h ?? "?"}`,
        });
      })
      .catch(() => setLoaded({ data: {}, status: "error", bytes: 0, size: "未知" }));
    return () => controller.abort();
  }, [resolvedSrc]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  useEffect(() => {
    ref.current?.setSpeed(speed);
  }, [speed, loaded.status]);

  return (
    <article className="flex min-h-[520px] flex-col rounded-[28px] border border-[var(--border)] bg-[var(--surface-solid)] p-5">
      <div className="aspect-square overflow-hidden rounded-[24px] bg-[var(--surface-muted)]">
        {loaded.status === "success" ? (
          <Lottie lottieRef={ref} animationData={loaded.data} loop={loop} autoplay className="size-full" />
        ) : (
          <div className="grid size-full place-items-center text-sm text-[var(--text-secondary)]">
            {loaded.status === "loading" ? "加载中" : "加载失败"}
          </div>
        )}
      </div>
      <div className="mt-5 flex-1">
        <h2 className="text-xl font-semibold">{item.name}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.description}</p>
        <dl className="mt-4 grid gap-2 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between gap-3"><dt>路径</dt><dd className="truncate">{src}</dd></div>
          <div className="flex justify-between gap-3"><dt>状态</dt><dd>{loaded.status}</dd></div>
          <div className="flex justify-between gap-3"><dt>尺寸</dt><dd>{loaded.size}</dd></div>
          <div className="flex justify-between gap-3"><dt>大小</dt><dd>{Math.round(loaded.bytes / 1024)} KB</dd></div>
          <div className="flex justify-between gap-3"><dt>循环</dt><dd>{loop ? "是" : "否"}</dd></div>
        </dl>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => ref.current?.play()}><Play size={15} />播放</Button>
        <Button type="button" variant="secondary" onClick={() => ref.current?.pause()}><Pause size={15} />暂停</Button>
        <Button type="button" variant="secondary" onClick={() => ref.current?.goToAndPlay(0, true)}><RotateCcw size={15} />重播</Button>
        {[0.5, 1, 1.5].map((value) => (
          <Button type="button" variant={speed === value ? "primary" : "secondary"} onClick={() => setSpeed(value)} key={value}>
            {value}×
          </Button>
        ))}
        <Button type="button" variant={loop ? "primary" : "secondary"} onClick={() => setLoop((value) => !value)}>
          loop
        </Button>
      </div>
    </article>
  );
}

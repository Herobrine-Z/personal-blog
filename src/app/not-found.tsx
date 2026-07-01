import Link from "next/link";
import { ThemedLottie } from "@/components/animation/ThemedLottie";
import { getLottieItem } from "@/data/lottie";

export default function NotFound() {
  const lostDot = getLottieItem("lost-dot-404")!;

  return (
    <main className="grid min-h-svh place-items-center px-5 pt-[var(--nav-height)]">
      <section className="max-w-xl text-center">
        <ThemedLottie
          light={lostDot.light}
          dark={lostDot.dark}
          loop
          speed={lostDot.speed}
          className="pointer-events-none mx-auto aspect-square w-56"
          ariaLabel="页面未找到动画"
          decorative={false}
        />
        <p className="mt-6 text-sm font-medium text-[var(--accent)]">404</p>
        <h1 className="mt-3 text-4xl font-semibold">页面未找到</h1>
        <p className="mt-4 leading-7 text-[var(--text-secondary)]">
          这个地址暂时没有内容。你可以返回首页，继续查看项目、文章和实验室。
        </p>
        <Link
          href="/"
          className="focus-ring mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--text-primary)] px-5 text-sm font-medium text-[var(--background)]"
        >
          返回首页
        </Link>
      </section>
    </main>
  );
}

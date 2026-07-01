import { ThemedLottie } from "@/components/animation/ThemedLottie";
import { getLottieItem } from "@/data/lottie";

export function LottieDemo() {
  const labModules = getLottieItem("lab-modules")!;

  return (
    <div className="rounded-[30px] border border-[var(--border)] bg-[var(--surface-solid)] p-5">
      <ThemedLottie
        light={labModules.light}
        dark={labModules.dark}
        loop
        speed={labModules.speed}
        ariaLabel="实验室模块动画"
        decorative={false}
        replayOnHover
        className="overflow-hidden rounded-[24px]"
      />
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Lab Modules</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            低速循环，进入视口播放，离开视口暂停，桌面端悬停可重播。
          </p>
        </div>
      </div>
    </div>
  );
}

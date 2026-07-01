"use client";

import { useState } from "react";
import { ThemedLottie } from "@/components/animation/ThemedLottie";
import { Button } from "@/components/ui/Button";
import { getLottieItem } from "@/data/lottie";

type ContactState = "idle" | "submitting" | "success" | "error";

const successAnimation = getLottieItem("message-success")!;

export function ContactStatus() {
  const [state, setState] = useState<ContactState>("idle");

  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-solid)] p-6">
      <h2 className="text-2xl font-semibold">联系状态</h2>
      <p className="mt-3 leading-7 text-[var(--text-secondary)]">
        演示表单暂未接入邮件服务，因此不会伪装发送成功。成功动画只在真实成功状态下播放。
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
        <div className="aspect-square overflow-hidden rounded-[24px] bg-[var(--surface-muted)]">
          {state === "success" ? (
            <ThemedLottie
              light={successAnimation.light}
              dark={successAnimation.dark}
              loop={false}
              autoplay
              playOnView={false}
              className="size-full"
              ariaLabel="消息发送成功"
              decorative={false}
            />
          ) : (
            <div className="grid size-full place-items-center text-sm text-[var(--text-secondary)]">
              {state === "submitting" ? "等待服务" : "未提交"}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">当前状态：{state}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setState("idle")}>
              idle
            </Button>
            <Button type="button" variant="secondary" onClick={() => setState("submitting")}>
              submitting
            </Button>
            <Button type="button" variant="secondary" onClick={() => setState("error")}>
              error
            </Button>
          </div>
          {state === "error" ? (
            <p className="mt-3 text-sm text-[var(--accent)]">邮件服务未接入，请通过 GitHub 或 Bilibili 联系。</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

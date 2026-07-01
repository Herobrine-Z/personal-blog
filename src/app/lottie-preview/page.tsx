import type { Metadata } from "next";
import { LottiePreviewGrid } from "@/components/lottie-preview/LottiePreviewGrid";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Lottie Preview",
  description: "内部 Lottie 动画预览与验收页面。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LottiePreviewPage() {
  return (
    <PageContainer>
      <section className="container-shell section-space">
        <SectionHeading
          eyebrow="Internal Preview"
          title="Lottie 动画验收台"
          text="这里展示已接入的全部动画、主题版本、加载状态、尺寸、文件大小和基本播放控制。该页面不加入正式导航。"
        />
        <LottiePreviewGrid />
      </section>
    </PageContainer>
  );
}

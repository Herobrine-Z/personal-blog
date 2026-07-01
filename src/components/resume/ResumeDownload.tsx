"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function ResumeDownload() {
  const [exists, setExists] = useState<boolean | null>(null);
  const path = "/resume/haoxuan-zhang-resume.pdf";

  useEffect(() => {
    fetch(path, { method: "HEAD" }).then((res) => setExists(res.ok)).catch(() => setExists(false));
  }, []);

  if (exists) {
    return (
      <Button href={path}>
        <Download size={16} /> 下载 PDF 简历
      </Button>
    );
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <Button disabled variant="secondary">
        <Download size={16} /> PDF 暂未放入
      </Button>
      <p className="text-sm text-[var(--text-secondary)]">
        将 PDF 放到 <code className="font-mono">public/resume/haoxuan-zhang-resume.pdf</code> 后按钮会自动启用。
      </p>
    </div>
  );
}

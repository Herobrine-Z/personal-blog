import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="pt-[var(--nav-height)]">{children}</main>;
}

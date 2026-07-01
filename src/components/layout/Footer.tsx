import Link from "next/link";
import { profile } from "@/data/profile";
import { socials } from "@/data/socials";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-12">
      <div className="container-shell flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="text-lg font-semibold">{profile.displayName}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
            用代码和视觉系统整理想法。这个站点保持本地数据驱动，后续可接入 MDX、CMS 或部署流程。
          </p>
          <p className="mt-4 text-xs text-[var(--text-tertiary)]">© 2026 Haoxuan Zhang. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {socials.map((social) => (
            <Link
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)]"
              href={social.href}
              key={social.label}
            >
              <social.icon size={16} />
              {social.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

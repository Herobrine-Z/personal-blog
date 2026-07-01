export function TableOfContents({ headings }: { headings: string[] }) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-28 rounded-[22px] border border-[var(--border)] p-5">
        <p className="mb-4 text-sm font-medium">目录</p>
        <nav className="grid gap-3 text-sm text-[var(--text-secondary)]">
          {headings.map((heading) => (
            <a className="hover:text-[var(--text-primary)]" href={`#${encodeURIComponent(heading)}`} key={heading}>
              {heading}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

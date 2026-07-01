import { SearchX } from "lucide-react";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-solid)] p-10 text-center">
      <div>
        <SearchX className="mx-auto mb-4 text-[var(--text-tertiary)]" size={34} />
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-[var(--text-secondary)]">{text}</p>
      </div>
    </div>
  );
}

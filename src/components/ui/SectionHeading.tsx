export function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mb-10 max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-sm font-medium text-[var(--accent)]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-normal sm:text-5xl">{title}</h2>
      {text ? <p className="mt-4 text-lg leading-8 text-[var(--text-secondary)]">{text}</p> : null}
    </div>
  );
}

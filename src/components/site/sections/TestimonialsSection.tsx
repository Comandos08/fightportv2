import { useT } from "@/lib/i18n";

export function TestimonialsSection() {
  const t = useT();
  const items = [
    { q: t("test.q1"), a: t("test.a1") },
    { q: t("test.q2"), a: t("test.a2") },
    { q: t("test.q3"), a: t("test.a3") },
  ];
  return (
    <section className="py-20 sm:py-28 bg-[var(--color-bg-soft)]/50 border-y border-border">
      <div className="fp-container">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("test.title")}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <figure key={i} className="rounded-2xl border border-border bg-background p-7">
              <blockquote className="text-base leading-relaxed">“{it.q}”</blockquote>
              <figcaption className="mt-5 text-xs text-muted-foreground uppercase tracking-wider">{it.a}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

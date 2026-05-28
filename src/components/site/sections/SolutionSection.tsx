import { useT } from "@/lib/i18n";
import { Zap, Lock, IdCard } from "lucide-react";

export function SolutionSection() {
  const t = useT();
  const cards = [
    { icon: Zap, title: t("solution.c1.title"), desc: t("solution.c1.desc") },
    { icon: Lock, title: t("solution.c2.title"), desc: t("solution.c2.desc") },
    { icon: IdCard, title: t("solution.c3.title"), desc: t("solution.c3.desc") },
  ];
  return (
    <section className="py-20 sm:py-28 bg-[var(--color-bg-soft)]/50 border-y border-border">
      <div className="fp-container">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">{t("solution.title")}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <div key={i} className="rounded-2xl border border-border bg-background p-7">
              <div className="inline-flex size-10 items-center justify-center rounded-lg" style={{ background: "color-mix(in oklab, var(--fp-accent) 15%, transparent)" }}>
                <c.icon className="size-5 fp-accent" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

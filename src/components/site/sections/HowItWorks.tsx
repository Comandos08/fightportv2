import { useT } from "@/lib/i18n";

export function HowItWorks() {
  const t = useT();
  const steps = [
    { title: t("how.s1.title"), desc: t("how.s1.desc") },
    { title: t("how.s2.title"), desc: t("how.s2.desc") },
    { title: t("how.s3.title"), desc: t("how.s3.desc") },
  ];
  return (
    <section id="como" className="py-20 sm:py-28">
      <div className="fp-container">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("how.title")}</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i} className="relative">
              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                <span className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-background font-semibold text-foreground">
                  {i + 1}
                </span>
                Etapa {i + 1}
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

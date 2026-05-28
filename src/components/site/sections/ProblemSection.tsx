import { useT } from "@/lib/i18n";

export function ProblemSection() {
  const t = useT();
  const stats = [
    { n: t("problem.s1.num"), text: t("problem.s1.text"), src: t("problem.s1.source") },
    { n: t("problem.s2.num"), text: t("problem.s2.text"), src: t("problem.s2.source") },
    { n: t("problem.s3.num"), text: t("problem.s3.text"), src: t("problem.s3.source") },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="fp-container">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">{t("problem.title")}</h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-bold tracking-tight fp-accent" style={{ fontSize: "clamp(48px, 6vw, 72px)", lineHeight: 1 }}>
                {s.n}
              </div>
              <p className="mt-4 text-base text-foreground">{s.text}</p>
              <p className="mt-2 text-xs text-muted-foreground">{s.src}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

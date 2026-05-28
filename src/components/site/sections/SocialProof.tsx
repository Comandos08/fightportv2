import { useT } from "@/lib/i18n";

const ORGS = [
  "Gracie Barra · São Paulo",
  "CT Phoenix · Rio de Janeiro",
  "Equipe Alliance · Belo Horizonte",
  "Checkmat · Curitiba",
  "Cordeiro JJ · Porto Alegre",
  "Atos JJ · Brasília",
  "Nova União · Recife",
  "Brasa CTA · Salvador",
];

export function SocialProof() {
  const t = useT();
  const items = [...ORGS, ...ORGS];
  return (
    <section className="border-y border-border bg-[var(--color-bg-soft)]/40 py-8">
      <div className="fp-container flex items-center gap-6 overflow-hidden">
        <div className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("social.title")}
        </div>
        <div className="relative flex-1 overflow-hidden mask-fade">
          <div className="flex w-max gap-10 animate-marquee">
            {items.map((it, i) => (
              <span key={i} className="text-sm text-muted-foreground whitespace-nowrap">
                {it}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

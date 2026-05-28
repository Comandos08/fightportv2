import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n";

const PACKAGES = [
  { id: "starter", credits: 10, brl: "97" },
  { id: "equipe", credits: 50, brl: "397", popular: true },
  { id: "org", credits: 150, brl: "990" },
];

export function PricingSection() {
  const t = useT();
  const names = [t("pricing.p1.name"), t("pricing.p2.name"), t("pricing.p3.name")];
  return (
    <section id="planos" className="py-20 sm:py-28">
      <div className="fp-container">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("pricing.title")}</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">{t("pricing.subtitle")}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PACKAGES.map((p, i) => (
            <div
              key={p.id}
              className="relative rounded-2xl border bg-background p-7"
              style={p.popular ? { borderColor: "var(--fp-accent)", boxShadow: "0 10px 30px -10px color-mix(in oklab, var(--fp-accent) 30%, transparent)" } : {}}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider text-background" style={{ background: "var(--fp-accent)" }}>
                  {t("pricing.popular")}
                </div>
              )}
              <h3 className="text-lg font-semibold">{names[i]}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">R$ {p.brl}</span>
                <span className="text-xs text-muted-foreground">à vista</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{p.credits}</span> {t("pricing.credits")}
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {[t("pricing.included.1"), t("pricing.included.2"), t("pricing.included.3"), t("pricing.included.4")].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="size-4 fp-accent shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/cadastro" className="mt-7 block">
                <Button className="w-full" variant={p.popular ? "default" : "outline"}>
                  {t("pricing.cta")}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

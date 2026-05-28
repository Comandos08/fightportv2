import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n";

export function HeroSection() {
  const t = useT();
  return (
    <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--fp-accent) 18%, transparent), transparent 60%)",
        }}
      />
      <div className="fp-container">
        <div className="animate-fadeup inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <ShieldCheck className="size-3 fp-accent" />
          {t("hero.badge")}
        </div>
        <h1
          className="animate-fadeup delay-100 mt-6 font-bold tracking-tight"
          style={{ fontSize: "clamp(40px, 6vw, 76px)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
        >
          {t("hero.title.1")}
          <br />
          {t("hero.title.2")}
          <br />
          <span className="fp-accent">{t("hero.title.3")}</span>
        </h1>
        <p className="animate-fadeup delay-200 mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <div className="animate-fadeup delay-300 mt-8 flex flex-wrap items-center gap-3">
          <Link to="/cadastro">
            <Button size="lg" className="gap-2">
              {t("hero.cta.primary")} <ArrowRight className="size-4" />
            </Button>
          </Link>
          <a href="#busca">
            <Button size="lg" variant="outline">
              {t("hero.cta.secondary")}
            </Button>
          </a>
        </div>
        <div className="animate-fadeup delay-400 mt-14 grid grid-cols-3 gap-6 max-w-2xl">
          <Stat n="12,8k" label={t("hero.stats.athletes")} />
          <Stat n="180+" label={t("hero.stats.orgs")} />
          <Stat n="34k" label={t("hero.stats.grads")} />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight">{n}</div>
      <div className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

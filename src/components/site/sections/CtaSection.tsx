import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export function CtaSection() {
  const t = useT();
  return (
    <section className="py-20 sm:py-28">
      <div className="fp-container">
        <div className="rounded-3xl border border-border bg-background p-10 sm:p-16 text-center" style={{ background: "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--fp-accent) 12%, transparent), transparent 70%)" }}>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">{t("cta.title")}</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t("cta.subtitle")}</p>
          <Link to="/cadastro" className="mt-7 inline-block">
            <Button size="lg" className="gap-2">
              {t("cta.button")} <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

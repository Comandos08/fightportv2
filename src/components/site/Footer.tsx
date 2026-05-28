import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useT } from "@/lib/i18n";

export function FooterSection() {
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-[var(--color-bg-soft)]/40">
      <div className="fp-container py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="size-5 fp-accent" />
            FightPort
          </div>
          <p className="mt-3 text-xs text-muted-foreground max-w-xs">
            Plataforma de certificação esportiva da SportCombat.
          </p>
        </div>
        <FooterCol title={t("footer.product")} items={[
          { label: t("footer.product.how"), href: "/#como" },
          { label: t("footer.product.pricing"), href: "/#planos" },
          { label: t("footer.product.verify"), href: "/#busca" },
        ]} />
        <FooterCol title={t("footer.company")} items={[
          { label: t("footer.company.about"), href: "/sobre" },
          { label: t("footer.company.contact"), href: "/contato" },
        ]} />
        <FooterCol title={t("footer.legal")} items={[
          { label: t("footer.legal.terms"), href: "/termos" },
          { label: t("footer.legal.privacy"), href: "/privacidade" },
        ]} />
      </div>
      <div className="fp-container border-t border-border py-6 text-xs text-muted-foreground">
        {t("footer.copy", { year })}
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.href}>
            {i.href.startsWith("/#") ? (
              <a href={i.href} className="text-muted-foreground hover:text-foreground">{i.label}</a>
            ) : (
              <Link to={i.href} className="text-muted-foreground hover:text-foreground">{i.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

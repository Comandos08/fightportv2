import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";
import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";

export function Navbar() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const links: Array<{ label: string; href: string }> = [
    { label: t("nav.verify"), href: "/#busca" },
    { label: t("nav.how"), href: "/#como" },
    { label: t("nav.forOrgs"), href: "/#planos" },
    { label: t("nav.orgs"), href: "/#organizacoes" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="fp-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Shield className="size-5 fp-accent" />
          <span>FightPort</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link to="/cadastro">
            <Button variant="ghost" size="sm">{t("nav.login")}</Button>
          </Link>
          <Link to="/cadastro">
            <Button size="sm">{t("nav.cta")}</Button>
          </Link>
        </div>
        <button className="md:hidden p-2" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="fp-container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-muted-foreground">
                {l.label}
              </a>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link to="/cadastro" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">{t("nav.login")}</Button>
            </Link>
            <Link to="/cadastro" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full">{t("nav.cta")}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

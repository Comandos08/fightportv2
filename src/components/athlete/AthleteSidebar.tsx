import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { User, Award, CreditCard, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AthleteSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items: Item[] = [
    { to: "/minha-conta/perfil", label: t("athlete.nav.profile"), icon: User },
    { to: "/minha-conta/graduacoes", label: t("athlete.nav.graduations"), icon: Award },
    { to: "/minha-conta/carteirinha", label: t("athlete.nav.card"), icon: CreditCard },
  ];

  const isActive = (to: string) => path.startsWith(to);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/cadastro" });
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="px-5 py-5 border-b border-border">
        <Link to="/minha-conta/perfil" className="text-lg font-bold tracking-tight" onClick={onNavigate}>
          FightPort
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border-l-2",
                active
                  ? "border-foreground bg-muted text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
              ].join(" ")}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-2">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <LogOut className="h-4 w-4" />
          {t("athlete.nav.logout")}
        </button>
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

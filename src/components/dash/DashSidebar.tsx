import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Users, Award, ListOrdered,
  DollarSign, LifeBuoy, Mail, Shield, LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";

const items = [
  { to: "/dash", k: "dash.nav.dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dash/organizacoes", k: "dash.nav.orgs", icon: Building2 },
  { to: "/dash/atletas", k: "dash.nav.athletes", icon: Users },
  { to: "/dash/graduacoes", k: "dash.nav.graduations", icon: Award },
  { to: "/dash/modelos", k: "dash.nav.models", icon: ListOrdered },
  { to: "/dash/financeiro", k: "dash.nav.finance", icon: DollarSign },
  { to: "/dash/suporte", k: "dash.nav.support", icon: LifeBuoy, badge: "support" as const },
  { to: "/dash/contatos", k: "dash.nav.contacts", icon: Mail, badge: "contacts" as const },
  { to: "/dash/auditoria", k: "dash.nav.audit", icon: Shield },
];

export function DashSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [supportCount, setSupportCount] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const s = await db.rpc("admin_awaiting_admin_count");
        const c = await db.rpc("admin_open_tickets_count");
        if (cancelled) return;
        setSupportCount(Number(s.data) || 0);
        setContactsCount(Number(c.data) || 0);
      } catch { /* ignore */ }
    };
    refresh();
    const ch = supabase
      .channel("dash-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_submissions" }, refresh)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path.startsWith(to);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/cadastro" });
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="px-5 py-5 border-b border-border">
        <Link to="/dash" className="text-lg font-bold tracking-tight" onClick={onNavigate}>
          FightPort <span className="text-muted-foreground text-xs font-normal">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item.to, item.exact);
          const count = item.badge === "support" ? supportCount : item.badge === "contacts" ? contactsCount : 0;
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
              <span className="flex-1 truncate">{t(item.k)}</span>
              {item.badge && count > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold animate-pulse-dot"
                  style={{ backgroundColor: "#0D0D0D", color: "#C8F135" }}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
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
          {t("dash.nav.logout")}
        </button>
        <div className="flex justify-end"><ThemeToggle /></div>
      </div>
    </div>
  );
}

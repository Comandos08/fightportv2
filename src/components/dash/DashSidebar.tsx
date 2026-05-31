import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Users, Award, ListOrdered,
  DollarSign, LifeBuoy, Mail, Shield, LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
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
    <div className="flex h-full w-full flex-col bg-[#0d0d0d]">
      <div className="px-5 py-5 border-b border-[#1f1f1f]">
        <Link
          to="/dash"
          className="text-lg font-normal tracking-tight text-white [font-family:'Space_Grotesk',sans-serif]"
          onClick={onNavigate}
        >
          FightPort
        </Link>
        <div className="mt-0.5 text-[10.5px] text-[#444444]">Administração Global</div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item.to, item.exact);
          const count = item.badge === "support" ? supportCount : item.badge === "contacts" ? contactsCount : 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-[#3d2200] text-[#E07B20]"
                  : "text-[#888888] hover:bg-[#161616] hover:text-[#cccccc]",
              ].join(" ")}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{t(item.k)}</span>
              {item.badge && count > 0 && (
                <span className={[
                  "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[9.5px] font-semibold ml-auto animate-pulse-dot",
                  item.badge === "support"
                    ? "bg-[#0d2340] text-[#5ba3f5]"
                    : "bg-[#1f1f1f] text-[#888888]",
                ].join(" ")}>
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-[#1f1f1f]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-[#3d2200] border-2 border-[#E07B20] text-[#E07B20] flex items-center justify-center text-[11px] font-semibold shrink-0">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#dddddd] text-sm font-medium truncate leading-tight">Admin</div>
            <div className="text-[#444444] text-[10.5px] leading-tight">Administração Global</div>
          </div>
          <button
            onClick={logout}
            className="text-[#444444] hover:text-[#cccccc] transition-colors p-1 shrink-0"
            aria-label={t("dash.nav.logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

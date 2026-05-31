import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Award,
  Coins,
  LifeBuoy,
  Settings,
  LogOut,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { getInitials } from "@/lib/belts";

interface Item {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PanelSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const [unread, setUnread] = useState(0);
  const [stale, setStale] = useState(0);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    db.from("schools").select("name").eq("id", user.id).maybeSingle().then(({ data }: { data: { name: string } | null }) => {
      if (data?.name) setSchoolName(data.name);
    });
  }, [user?.id]);

  const items: Item[] = [
    { to: "/painel", label: t("panel.nav.dashboard"), icon: LayoutDashboard },
    { to: "/painel/praticantes", label: t("panel.nav.practitioners"), icon: Users },
    { to: "/painel/conquistas/nova", label: t("panel.nav.newAchievement"), icon: Award },
    { to: "/painel/creditos", label: t("panel.nav.credits"), icon: Coins },
    { to: "/painel/suporte", label: t("panel.nav.support"), icon: LifeBuoy },
    { to: "/painel/configuracoes", label: t("panel.nav.settings"), icon: Settings },
  ];

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const u = await db.rpc("school_unread_messages_count");
        const s = await db.rpc("school_stale_tickets_count");
        if (!cancelled) {
          setUnread(Number(u.data) || 0);
          setStale(Number(s.data) || 0);
        }
      } catch {
        // RPCs may not exist yet — silently ignore.
      }
    };
    refresh();
    const ch = supabase
      .channel("support-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, refresh)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [user]);

  const isActive = (to: string) =>
    to === "/painel" ? path === "/painel" : path.startsWith(to);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/cadastro" });
  };

  const initials = schoolName ? getInitials(schoolName) : "FP";

  return (
    <div className="flex h-full w-full flex-col bg-[#0d0d0d]">
      <div className="px-5 py-5 border-b border-[#1f1f1f]">
        <Link
          to="/painel"
          className="text-lg font-normal tracking-tight text-white [font-family:'Space_Grotesk',sans-serif]"
          onClick={onNavigate}
        >
          FightPort
        </Link>
        {schoolName && (
          <div className="mt-0.5 text-[10.5px] text-[#444444] truncate">{schoolName}</div>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = isActive(item.to);
          const isSupport = item.to === "/painel/suporte";
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
              <span className="flex-1 truncate">{item.label}</span>
              {isSupport && unread > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[9.5px] font-semibold bg-[#0d2340] text-[#5ba3f5] ml-auto animate-pulse-dot">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
              {isSupport && stale > 0 && (
                <Clock className="h-3.5 w-3.5 text-[#E07B20]" aria-label="stale" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-[#1f1f1f]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-[#3d2200] border-2 border-[#E07B20] text-[#E07B20] flex items-center justify-center text-[11px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#dddddd] text-sm font-medium truncate leading-tight">
              {schoolName ?? "Escola"}
            </div>
            <div className="text-[#444444] text-[10.5px] leading-tight">Organização</div>
          </div>
          <button
            onClick={logout}
            className="text-[#444444] hover:text-[#cccccc] transition-colors p-1 shrink-0"
            aria-label={t("panel.nav.logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

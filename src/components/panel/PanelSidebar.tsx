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
import { ThemeToggle } from "@/components/ThemeToggle";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";

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

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="px-5 py-5 border-b border-border">
        <Link to="/painel" className="text-lg font-bold tracking-tight" onClick={onNavigate}>
          FightPort
        </Link>
        {schoolName && (
          <div className="mt-0.5 text-xs text-muted-foreground truncate">{schoolName}</div>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {items.map((item) => {
          const active = isActive(item.to);
          const isSupport = item.to === "/painel/suporte";
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                "border-l-2",
                active
                  ? "border-foreground bg-muted text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
              ].join(" ")}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {isSupport && unread > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold animate-pulse-dot"
                  style={{ backgroundColor: "#0D0D0D", color: "#C8F135" }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
              {isSupport && stale > 0 && (
                <Clock className="h-3.5 w-3.5 text-amber-500" aria-label="stale" />
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
          {t("panel.nav.logout")}
        </button>
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

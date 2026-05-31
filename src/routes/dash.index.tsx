import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { beltRank } from "@/lib/belts";
import { Topbar, TopbarGhostBtn } from "@/components/Topbar";
import { getBeltTailwindClasses } from "@/components/BeltBadge";

export const Route = createFileRoute("/dash/")({
  component: DashOverview,
});

function DashBeltBadge({ belt }: { belt: string | null | undefined }) {
  if (!belt) return <span className="text-[11px] text-[#bbbbbb]">—</span>;
  const { wrapper, dot, gradientStyle } = getBeltTailwindClasses(belt);
  return (
    <span
      className={`inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-[20px] text-[11px] font-medium whitespace-nowrap ${wrapper}`}
      style={gradientStyle ? { background: gradientStyle } : undefined}
    >
      <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${dot}`} />
      {belt}
    </span>
  );
}

function DashOverview() {
  const t = useT();
  const [overview, setOverview] = useState<any>(null);
  const [topAthletes, setTopAthletes] = useState<any[]>([]);
  const [topOrgs, setTopOrgs] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());

  useEffect(() => {
    const now = new Date();
    const from = new Date(now); from.setDate(1); const fromStr = from.toISOString();
    const toStr = now.toISOString();
    (async () => {
      try {
        const o = await db.rpc("admin_get_overview", { p_from: fromStr, p_to: toStr });
        if (!o.error) setOverview(o.data ?? null);
      } catch { /* ignore */ }
      try {
        const r = await db.rpc("admin_list_people", { p_search: null, p_martial_art: null, p_belt: null, p_page: 1, p_page_size: 20 });
        const data = Array.isArray(r.data?.rows) ? r.data.rows : Array.isArray(r.data) ? r.data : [];
        const sorted = [...data].sort((a: any, b: any) => {
          const beltA = a.current_belt ?? a.belt ?? "";
          const beltB = b.current_belt ?? b.belt ?? "";
          return beltRank(beltB) - beltRank(beltA);
        });
        setTopAthletes(sorted.slice(0, 5));
      } catch { /* ignore */ }
      try {
        const r = await db.rpc("admin_list_schools", { p_search: null, p_martial_art: null, p_state: null, p_status: null, p_credits: null, p_page: 1, p_page_size: 10 });
        const data = Array.isArray(r.data?.rows) ? r.data.rows : Array.isArray(r.data) ? r.data : [];
        const sorted = [...data].sort((a: any, b: any) => (Number(b.balance) || 0) - (Number(a.balance) || 0));
        setTopOrgs(sorted.slice(0, 5));
      } catch { /* ignore */ }
      try {
        const r = await (db.from as any)("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(4);
        if (!r.error && Array.isArray(r.data)) setRecentActivity(r.data);
      } catch { /* ignore */ }
    })();
  }, []);

  const o = overview ?? {};
  const schoolsDelta = o.schools_total != null && o.schools_prev != null ? o.schools_total - o.schools_prev : null;
  const peopleDelta = o.people_total != null && o.people_prev != null ? o.people_total - o.people_prev : null;
  const totalCredits = useMemo(() => topOrgs.reduce((s, x) => s + (Number(x.balance) || 0), 0), [topOrgs]);
  const topCreditOrgs = topOrgs.slice(0, 2);

  const sectionCardCls = "bg-white rounded-[10px] border border-[#E8E6E1] overflow-hidden";
  const thCls = "bg-[#fafaf8] text-[10px] font-semibold text-[#999999] uppercase tracking-[0.07em] px-3.5 py-2 text-left";
  const tdCls = "px-3.5 py-2.5 border-b border-[#ededea] text-[12.5px] text-[#555555] align-middle";

  function orgStatusDot(status: string, balance: number): { color: string; label: string } {
    if (balance <= 0) return { color: "#e53e3e", label: "Sem créditos" };
    if (status === "suspended") return { color: "var(--color-accent)", label: "Teste" };
    return { color: "#22a05a", label: "Ativa" };
  }

  function activityIcon(event: any): { bg: string; color: string; icon: string } {
    const type = String(event?.event_type ?? event?.type ?? "").toLowerCase();
    if (type.includes("graduation") || type.includes("achievement") || type.includes("belt"))
      return { bg: "#FEF3C7", color: "#92400e", icon: "🏅" };
    if (type.includes("org") || type.includes("school") || type.includes("credit"))
      return { bg: "#DBEAFE", color: "#1e40af", icon: "💳" };
    return { bg: "#D1FAE5", color: "#065f46", icon: "🏢" };
  }

  return (
    <>
      <Topbar
        title={t("dash.title")}
        subtitle={`Plataforma SportCombat · ${monthLabel}`}
      >
        <TopbarGhostBtn onClick={() => {}}>
          Exportar
        </TopbarGhostBtn>
      </Topbar>

      <div className="p-5 px-6">

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-2.5 mb-[18px]">
          {/* Organizações */}
          <div className="bg-white border border-[#E8E6E1] rounded-[10px] p-4">
            <div className="text-[10.5px] font-medium text-[#999999] uppercase tracking-[0.07em] mb-2">
              {t("dash.kpi.orgs")}
            </div>
            <div className="[font-family:'Space_Grotesk',sans-serif] font-bold text-[26px] text-[#0f0f0f] tracking-[-0.5px] leading-none">
              {o.schools_total ?? 0}
            </div>
            {schoolsDelta != null && (
              <div className={`text-[11px] mt-1.5 flex items-center gap-1 ${schoolsDelta >= 0 ? "text-[#22a05a]" : "text-[#999999]"}`}>
                {schoolsDelta >= 0 && <TrendingUp className="w-3 h-3" />}
                {schoolsDelta >= 0 ? "+" : ""}{schoolsDelta} vs mês anterior
              </div>
            )}
          </div>

          {/* Atletas */}
          <div className="bg-white border border-[#E8E6E1] rounded-[10px] p-4">
            <div className="text-[10.5px] font-medium text-[#999999] uppercase tracking-[0.07em] mb-2">
              {t("dash.kpi.athletes")}
            </div>
            <div className="[font-family:'Space_Grotesk',sans-serif] font-bold text-[26px] text-[#0f0f0f] tracking-[-0.5px] leading-none">
              {o.people_total ?? 0}
            </div>
            {peopleDelta != null && (
              <div className={`text-[11px] mt-1.5 flex items-center gap-1 ${peopleDelta >= 0 ? "text-[#22a05a]" : "text-[#999999]"}`}>
                {peopleDelta >= 0 && <TrendingUp className="w-3 h-3" />}
                {peopleDelta >= 0 ? "+" : ""}{peopleDelta} vs mês anterior
              </div>
            )}
          </div>

          {/* Graduações */}
          <div className="bg-white border border-[#E8E6E1] rounded-[10px] p-4">
            <div className="text-[10.5px] font-medium text-[#999999] uppercase tracking-[0.07em] mb-2">
              {t("dash.kpi.achievements")}
            </div>
            <div className="[font-family:'Space_Grotesk',sans-serif] font-bold text-[26px] text-[#0f0f0f] tracking-[-0.5px] leading-none">
              {o.achievements_month ?? 0}
            </div>
            <div className="text-[11px] mt-1.5 text-[#999999]">este mês</div>
          </div>

          {/* Créditos em circulação — inverted card */}
          <div className="bg-[#0f0f0f] border border-[#0f0f0f] rounded-[10px] p-4">
            <div className="text-[10.5px] font-medium text-[#666666] uppercase tracking-[0.07em] mb-2">
              Créditos circulação
            </div>
            <div className="[font-family:'Space_Grotesk',sans-serif] font-bold text-[26px] text-[#E07B20] tracking-[-0.5px] leading-none">
              {totalCredits.toLocaleString("pt-BR")}
            </div>
            {topCreditOrgs.length > 0 && (
              <div className="text-[11px] mt-1.5 text-[#555555]">
                {topCreditOrgs.map((o: any) => `${o.name?.split(" ")[0] ?? "—"}: ${o.balance ?? 0}`).join(" · ")}
              </div>
            )}
          </div>
        </div>

        {/* Main content — 2 column */}
        <div className="grid gap-3 mb-3.5" style={{ gridTemplateColumns: "1.4fr 1fr" }}>

          {/* Left — Atletas mais graduados */}
          <div className={sectionCardCls}>
            <div className="px-[18px] py-3.5 border-b border-[#ededea] flex justify-between items-center">
              <span className="[font-family:'Space_Grotesk',sans-serif] text-[13.5px] font-normal text-[#0f0f0f]">
                Atletas mais graduados
              </span>
              <Link to="/dash/atletas" className="text-[11.5px] text-[#E07B20] font-medium no-underline">
                Ver todos →
              </Link>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={thCls}>Atleta</th>
                  <th className={thCls}>Organização</th>
                  <th className={thCls}>Graduação</th>
                </tr>
              </thead>
              <tbody>
                {topAthletes.length === 0 && (
                  <tr><td colSpan={3} className={`${tdCls} text-center text-[#bbbbbb]`}>—</td></tr>
                )}
                {topAthletes.map((ath: any, i: number) => (
                  <tr key={ath.id ?? i} className={i % 2 === 1 ? "bg-[#fffcf5]" : "bg-white"}>
                    <td className={tdCls}>
                      <div className="font-medium text-[#0f0f0f] text-[12.5px]">
                        {ath.first_name} {ath.last_name}
                      </div>
                      <div className="font-mono text-[10px] text-[#bbbbbb] mt-px">
                        {ath.fp_id}
                      </div>
                    </td>
                    <td className={`${tdCls} text-[12px]`}>{ath.school_name ?? ath.org ?? "—"}</td>
                    <td className={tdCls}>
                      <DashBeltBadge belt={ath.current_belt ?? ath.belt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right — Organizações */}
          <div className={sectionCardCls}>
            <div className="px-[18px] py-3.5 border-b border-[#ededea] flex justify-between items-center">
              <span className="[font-family:'Space_Grotesk',sans-serif] text-[13.5px] font-normal text-[#0f0f0f]">
                Organizações
              </span>
              <Link to="/dash/organizacoes" className="text-[11.5px] text-[#E07B20] font-medium no-underline">
                Ver todas →
              </Link>
            </div>
            {topOrgs.map((org: any, i: number) => {
              const { color: dotColor, label: statusLabel } = orgStatusDot(org.status, Number(org.balance) || 0);
              return (
                <div
                  key={org.id ?? i}
                  className={`px-[18px] py-[11px] flex justify-between items-center ${i < topOrgs.length - 1 ? "border-b border-[#ededea]" : ""}`}
                >
                  <div>
                    <div className="text-[12.5px] font-medium text-[#0f0f0f]">{org.name}</div>
                    <div className="text-[11px] text-[#999999] mt-[3px] flex items-center gap-[5px]">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                      {statusLabel}
                      {org.athletes_count != null && ` · ${org.athletes_count} atletas`}
                    </div>
                  </div>
                  <div className="font-mono text-[12px] font-medium text-[#555555]">
                    {(Number(org.balance) || 0).toLocaleString("pt-BR")}
                  </div>
                </div>
              );
            })}
            {topOrgs.length === 0 && (
              <div className="px-[18px] py-6 text-center text-[#bbbbbb] text-[12px]">—</div>
            )}
          </div>
        </div>

        {/* Atividade recente */}
        <div className={sectionCardCls}>
          <div className="px-[18px] py-3.5 border-b border-[#ededea] flex justify-between items-center">
            <span className="[font-family:'Space_Grotesk',sans-serif] text-[13.5px] font-normal text-[#0f0f0f]">
              Atividade recente
            </span>
            <span className="text-[11.5px] text-[#999999] font-medium">Ver auditoria →</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-[#bbbbbb] text-[12px]">
              Sem atividade registrada
            </div>
          ) : (
            <div className="grid grid-cols-2">
              {recentActivity.slice(0, 4).map((ev: any, i: number) => {
                const { bg, color, icon } = activityIcon(ev);
                return (
                  <div
                    key={ev.id ?? i}
                    className={`px-[18px] py-3 flex gap-3 items-start ${i % 2 === 0 ? "border-r border-[#ededea]" : ""} ${i < 2 ? "border-b border-[#ededea]" : ""}`}
                  >
                    <div
                      className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-[14px] flex-shrink-0"
                      style={{ background: bg, color }}
                    >
                      {icon}
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-[#0f0f0f] leading-[1.3]">
                        {ev.description ?? ev.event_type ?? ev.type ?? "Evento"}
                      </div>
                      <div className="text-[11px] text-[#999999] mt-[3px]">
                        {ev.created_at ? new Date(ev.created_at).toLocaleDateString("pt-BR") : "—"}
                        {ev.actor_name ? ` · ${ev.actor_name}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}

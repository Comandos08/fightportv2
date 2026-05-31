import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { beltRank } from "@/lib/belts";
import { Topbar, TopbarGhostBtn } from "@/components/Topbar";

export const Route = createFileRoute("/dash/")({
  component: DashOverview,
});

function getBeltTokens(belt: string | null | undefined) {
  const x = (belt ?? "").toLowerCase().trim();
  if (x.includes("vermelha") || x.includes("red"))
    return { bg: "var(--color-belt-verm-bg)", text: "var(--color-belt-verm-text)", dot: "var(--color-belt-verm-dot)" };
  if (x.includes("coral"))
    return { bg: "var(--color-belt-coral-bg)", text: "var(--color-belt-coral-text)", dot: "var(--color-belt-coral-dot)" };
  if (x.includes("preta") || x.includes("black"))
    return { bg: "var(--color-belt-preta-bg)", text: "var(--color-belt-preta-text)", dot: "var(--color-belt-preta-dot)", border: "1px solid #333" };
  if (x.includes("marrom") || x.includes("brown"))
    return { bg: "var(--color-belt-marrom-bg)", text: "var(--color-belt-marrom-text)", dot: "var(--color-belt-marrom-dot)" };
  if (x.includes("roxa") || x.includes("purple"))
    return { bg: "var(--color-belt-roxa-bg)", text: "var(--color-belt-roxa-text)", dot: "var(--color-belt-roxa-dot)" };
  if (x.includes("azul") || x.includes("blue"))
    return { bg: "var(--color-belt-azul-bg)", text: "var(--color-belt-azul-text)", dot: "var(--color-belt-azul-dot)" };
  if (x.includes("verde") || x.includes("green"))
    return { bg: "var(--color-belt-verde-bg)", text: "var(--color-belt-verde-text)", dot: "var(--color-belt-verde-dot)" };
  if (x.includes("laranja") || x.includes("orange"))
    return { bg: "var(--color-belt-laranja-bg)", text: "var(--color-belt-laranja-text)", dot: "var(--color-belt-laranja-dot)" };
  if (x.includes("amarela") || x.includes("yellow"))
    return { bg: "var(--color-belt-amarela-bg)", text: "var(--color-belt-amarela-text)", dot: "var(--color-belt-amarela-dot)" };
  if (x.includes("cinza") || x.includes("grey") || x.includes("gray"))
    return { bg: "var(--color-belt-cinza-bg)", text: "var(--color-belt-cinza-text)", dot: "var(--color-belt-cinza-dot)" };
  return { bg: "var(--color-belt-branca-bg)", text: "var(--color-belt-branca-text)", dot: "var(--color-belt-branca-dot)", border: "1px solid #e5e5e5" };
}

function DashBeltBadge({ belt }: { belt: string | null | undefined }) {
  if (!belt) return <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>—</span>;
  const tk = getBeltTokens(belt);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px 3px 7px", borderRadius: 20,
      fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
      background: tk.bg, color: tk.text, border: tk.border ?? "none",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: tk.dot, flexShrink: 0 }} />
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

  const cardBase: React.CSSProperties = {
    background: "var(--color-surface)",
    borderRadius: "var(--radius-md)",
    padding: 16,
    border: "1px solid var(--color-border)",
  };

  const sectionCard: React.CSSProperties = {
    background: "var(--color-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--color-border)",
    overflow: "hidden",
  };

  const thStyle: React.CSSProperties = {
    background: "#fafaf8",
    fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)",
    textTransform: "uppercase", padding: "8px 14px", textAlign: "left",
    letterSpacing: "0.05em",
  };
  const tdStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderBottom: "1px solid var(--color-border-subtle)",
    fontSize: 12.5,
    color: "var(--color-text-secondary)",
    verticalAlign: "middle",
  };

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

      <div style={{ padding: "20px 24px", background: "var(--color-page-bg)" }}>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
          {/* Organizações */}
          <div style={cardBase}>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              {t("dash.kpi.orgs")}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, color: "var(--color-text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>
              {o.schools_total ?? 0}
            </div>
            {schoolsDelta != null && (
              <div style={{ fontSize: 11, marginTop: 5, display: "flex", alignItems: "center", gap: 4, color: schoolsDelta >= 0 ? "#22a05a" : "var(--color-text-muted)" }}>
                {schoolsDelta >= 0 && <TrendingUp style={{ width: 12, height: 12 }} />}
                {schoolsDelta >= 0 ? "+" : ""}{schoolsDelta} vs mês anterior
              </div>
            )}
          </div>

          {/* Atletas */}
          <div style={cardBase}>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              {t("dash.kpi.athletes")}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, color: "var(--color-text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>
              {o.people_total ?? 0}
            </div>
            {peopleDelta != null && (
              <div style={{ fontSize: 11, marginTop: 5, display: "flex", alignItems: "center", gap: 4, color: peopleDelta >= 0 ? "#22a05a" : "var(--color-text-muted)" }}>
                {peopleDelta >= 0 && <TrendingUp style={{ width: 12, height: 12 }} />}
                {peopleDelta >= 0 ? "+" : ""}{peopleDelta} vs mês anterior
              </div>
            )}
          </div>

          {/* Graduações */}
          <div style={cardBase}>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              {t("dash.kpi.achievements")}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, color: "var(--color-text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>
              {o.achievements_month ?? 0}
            </div>
            <div style={{ fontSize: 11, marginTop: 5, color: "var(--color-text-muted)" }}>este mês</div>
          </div>

          {/* Créditos em circulação — inverted card */}
          <div style={{ ...cardBase, background: "var(--color-text-primary)", borderColor: "var(--color-text-primary)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: "#666666", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              Créditos circulação
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, color: "var(--color-accent)", letterSpacing: "-0.5px", lineHeight: 1 }}>
              {totalCredits.toLocaleString("pt-BR")}
            </div>
            {topCreditOrgs.length > 0 && (
              <div style={{ fontSize: 11, marginTop: 5, color: "#555555" }}>
                {topCreditOrgs.map((o: any) => `${o.name?.split(" ")[0] ?? "—"}: ${o.balance ?? 0}`).join(" · ")}
              </div>
            )}
          </div>
        </div>

        {/* Main content — 2 column */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 14 }}>

          {/* Left — Atletas mais graduados */}
          <div style={sectionCard}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 13.5, fontWeight: 400, color: "var(--color-text-primary)" }}>
                Atletas mais graduados
              </span>
              <Link to="/dash/atletas" style={{ fontSize: 11.5, color: "var(--color-accent)", fontWeight: 500, textDecoration: "none" }}>
                Ver todos →
              </Link>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Atleta</th>
                  <th style={thStyle}>Organização</th>
                  <th style={thStyle}>Graduação</th>
                </tr>
              </thead>
              <tbody>
                {topAthletes.length === 0 && (
                  <tr><td colSpan={3} style={{ ...tdStyle, textAlign: "center", color: "var(--color-text-faint)" }}>—</td></tr>
                )}
                {topAthletes.map((ath: any, i: number) => (
                  <tr key={ath.id ?? i} style={{ background: i % 2 === 1 ? "#fffcf5" : "var(--color-surface)" }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: 12.5 }}>
                        {ath.first_name} {ath.last_name}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-faint)", marginTop: 1 }}>
                        {ath.fp_id}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{ath.school_name ?? ath.org ?? "—"}</td>
                    <td style={tdStyle}>
                      <DashBeltBadge belt={ath.current_belt ?? ath.belt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right — Organizações */}
          <div style={sectionCard}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 13.5, fontWeight: 400, color: "var(--color-text-primary)" }}>
                Organizações
              </span>
              <Link to="/dash/organizacoes" style={{ fontSize: 11.5, color: "var(--color-accent)", fontWeight: 500, textDecoration: "none" }}>
                Ver todas →
              </Link>
            </div>
            {topOrgs.map((org: any, i: number) => {
              const { color: dotColor, label: statusLabel } = orgStatusDot(org.status, Number(org.balance) || 0);
              return (
                <div
                  key={org.id ?? i}
                  style={{
                    padding: "11px 18px",
                    borderBottom: i < topOrgs.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--color-text-primary)" }}>{org.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                      {statusLabel}
                      {org.athletes_count != null && ` · ${org.athletes_count} atletas`}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)" }}>
                    {(Number(org.balance) || 0).toLocaleString("pt-BR")}
                  </div>
                </div>
              );
            })}
            {topOrgs.length === 0 && (
              <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--color-text-faint)", fontSize: 12 }}>—</div>
            )}
          </div>
        </div>

        {/* Atividade recente */}
        <div style={sectionCard}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 13.5, fontWeight: 400, color: "var(--color-text-primary)" }}>
              Atividade recente
            </span>
            <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", fontWeight: 500 }}>Ver auditoria →</span>
          </div>
          {recentActivity.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-faint)", fontSize: 12 }}>
              Sem atividade registrada
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {recentActivity.slice(0, 4).map((ev: any, i: number) => {
                const { bg, color, icon } = activityIcon(ev);
                const hasRightBorder = i % 2 === 0;
                const hasBottomBorder = i < 2;
                return (
                  <div
                    key={ev.id ?? i}
                    style={{
                      padding: "12px 18px",
                      borderRight: hasRightBorder ? "1px solid var(--color-border-subtle)" : "none",
                      borderBottom: hasBottomBorder ? "1px solid var(--color-border-subtle)" : "none",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 9,
                      background: bg, color, fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                        {ev.description ?? ev.event_type ?? ev.type ?? "Evento"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3 }}>
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

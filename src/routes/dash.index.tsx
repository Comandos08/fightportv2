import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { DashPageHeader, DashSection, DashKpiCard, DashTable } from "@/components/dash/DashCommon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/dash/")({
  component: DashOverview,
});

type Period = "today" | "7d" | "30d" | "month" | "year";

function periodToDates(p: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  const f = new Date(now);
  if (p === "today") f.setHours(0, 0, 0, 0);
  else if (p === "7d") f.setDate(f.getDate() - 7);
  else if (p === "30d") f.setDate(f.getDate() - 30);
  else if (p === "month") f.setDate(1);
  else if (p === "year") { f.setMonth(0); f.setDate(1); }
  return { from: f.toISOString(), to };
}

function DashOverview() {
  const t = useT();
  const [period, setPeriod] = useState<Period>("30d");
  const [overview, setOverview] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [zero, setZero] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { from, to } = periodToDates(period);
      try {
        const o = await db.rpc("admin_get_overview", { p_from: from, p_to: to });
        if (o.error) throw o.error;
        setOverview(o.data ?? null);
      } catch (e) { console.error("[dash] admin_get_overview:", e); }
      try {
        const g = await db.rpc("admin_growth_monthly");
        if (g.error) throw g.error;
        setGrowth(Array.isArray(g.data) ? g.data : []);
      } catch (e) { console.error("[dash] admin_growth_monthly:", e); }
      try {
        const r = await db.rpc("admin_revenue_monthly");
        if (r.error) throw r.error;
        setRevenue(Array.isArray(r.data) ? r.data : []);
      } catch (e) { console.error("[dash] admin_revenue_monthly:", e); }
      try {
        const rs = await db.rpc("admin_recent_schools");
        if (rs.error) throw rs.error;
        setRecent(Array.isArray(rs.data) ? rs.data : []);
      } catch (e) { console.error("[dash] admin_recent_schools:", e); }
      try {
        const z = await db.rpc("admin_zero_balance_schools");
        if (z.error) throw z.error;
        setZero(Array.isArray(z.data) ? z.data : []);
      } catch (e) { console.error("[dash] admin_zero_balance_schools:", e); }
    })();
  }, [period]);

  const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

  const kpis = useMemo(() => {
    const o = overview ?? {};
    // RPC returns: schools_total, schools_prev, people_total, people_prev, achievements_month, revenue_month
    const schoolsDelta = o.schools_total != null && o.schools_prev != null ? o.schools_total - o.schools_prev : null;
    const peopleDelta = o.people_total != null && o.people_prev != null ? o.people_total - o.people_prev : null;
    return [
      { k: t("dash.kpi.orgs"), v: o.schools_total ?? 0, d: schoolsDelta != null ? `${schoolsDelta > 0 ? "+" : ""}${schoolsDelta} vs mês anterior` : undefined },
      { k: t("dash.kpi.athletes"), v: o.people_total ?? 0, d: peopleDelta != null ? `${peopleDelta > 0 ? "+" : ""}${peopleDelta}` : undefined },
      { k: t("dash.kpi.achievements"), v: o.achievements_month ?? 0 },
      { k: t("dash.kpi.revenue"), v: fmtBRL(o.revenue_month ?? 0) },
    ];
  }, [overview, t]);

  return (
    <div>
      <DashPageHeader
        title={t("dash.title")}
        actions={
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("dash.period.today")}</SelectItem>
              <SelectItem value="7d">{t("dash.period.7d")}</SelectItem>
              <SelectItem value="30d">{t("dash.period.30d")}</SelectItem>
              <SelectItem value="month">{t("dash.period.month")}</SelectItem>
              <SelectItem value="year">{t("dash.period.year")}</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => <DashKpiCard key={k.k} label={k.k} value={k.v} delta={k.d} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <DashSection title={t("dash.chart.growth")}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="schools" stroke="hsl(var(--primary))" />
                <Line type="monotone" dataKey="athletes" stroke="#22c55e" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashSection>
        <DashSection title={t("dash.chart.revenue")}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashSection>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <DashSection title={t("dash.recent.schools")}>
          <DashTable
            rows={recent}
            columns={[
              { key: "name", label: t("dash.orgs.col.name"), render: (r: any) => (
                <Link to="/dash/organizacoes/$id" params={{ id: r.id }} className="hover:underline">{r.name}</Link>
              ) },
              { key: "city", label: t("dash.orgs.col.city") },
              { key: "created_at", label: t("dash.orgs.col.created"), render: (r: any) => new Date(r.created_at).toLocaleDateString("pt-BR") },
            ]}
          />
        </DashSection>
        <DashSection title={t("dash.zero.schools")}>
          <DashTable
            rows={zero}
            columns={[
              { key: "name", label: t("dash.orgs.col.name"), render: (r: any) => (
                <Link to="/dash/organizacoes/$id" params={{ id: r.id }} className="hover:underline">{r.name}</Link>
              ) },
              { key: "credits", label: t("dash.orgs.col.credits"), render: (r: any) => r.balance ?? 0 },
            ]}
          />
        </DashSection>
      </div>
    </div>
  );
}

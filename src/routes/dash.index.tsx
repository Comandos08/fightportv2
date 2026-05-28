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
        setOverview(o.data ?? null);
      } catch { /* ignore */ }
      try {
        const g = await db.rpc("admin_growth_monthly");
        setGrowth(Array.isArray(g.data) ? g.data : []);
      } catch { /* ignore */ }
      try {
        const r = await db.rpc("admin_revenue_monthly");
        setRevenue(Array.isArray(r.data) ? r.data : []);
      } catch { /* ignore */ }
      try {
        const rs = await db.rpc("admin_recent_schools");
        setRecent(Array.isArray(rs.data) ? rs.data : []);
      } catch { /* ignore */ }
      try {
        const z = await db.rpc("admin_zero_balance_schools");
        setZero(Array.isArray(z.data) ? z.data : []);
      } catch { /* ignore */ }
    })();
  }, [period]);

  const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

  const kpis = useMemo(() => {
    const o = overview ?? {};
    return [
      { k: t("dash.kpi.orgs"), v: o.orgs_total ?? 0, d: o.orgs_delta != null ? `${o.orgs_delta > 0 ? "+" : ""}${o.orgs_delta} vs mês anterior` : undefined },
      { k: t("dash.kpi.athletes"), v: o.athletes_total ?? 0, d: o.athletes_delta != null ? `${o.athletes_delta > 0 ? "+" : ""}${o.athletes_delta}` : undefined },
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

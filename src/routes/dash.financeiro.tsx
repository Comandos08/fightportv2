import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashPageHeader, DashKpiCard, DashSection } from "@/components/dash/DashCommon";

export const Route = createFileRoute("/dash/financeiro")({
  component: FinancePage,
});

const COLORS = ["#0D0D0D","#C8F135","#22c55e","#3b82f6","#f59e0b","#ef4444"];
const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

function FinancePage() {
  const t = useT();
  const [period, setPeriod] = useState("30d");
  const [overview, setOverview] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [byPkg, setByPkg] = useState<any[]>([]);
  const [topSchools, setTopSchools] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try { const r = await db.rpc("admin_finance_overview", { p_period: period }); setOverview(r.data ?? null); } catch { /* ignore */ }
      try { const r = await db.rpc("admin_revenue_monthly"); setMonthly(Array.isArray(r.data) ? r.data : []); } catch { /* ignore */ }
      try { const r = await db.rpc("admin_finance_by_package"); setByPkg(Array.isArray(r.data) ? r.data : []); } catch { /* ignore */ }
      try { const r = await db.rpc("admin_finance_top_schools"); setTopSchools(Array.isArray(r.data) ? r.data : []); } catch { /* ignore */ }
    })();
  }, [period]);

  const o = overview ?? {};
  const kpis = [
    { k: t("dash.fin.kpi.revenue"), v: fmtBRL(o.revenue ?? 0) },
    { k: t("dash.fin.kpi.transactions"), v: o.transactions ?? 0 },
    { k: t("dash.fin.kpi.avgTicket"), v: fmtBRL(o.avg_ticket ?? 0) },
    { k: t("dash.fin.kpi.schools"), v: o.schools ?? 0 },
    { k: t("dash.fin.kpi.mrr"), v: fmtBRL(o.mrr ?? 0) },
    { k: t("dash.fin.kpi.ltv"), v: fmtBRL(o.ltv ?? 0) },
    { k: t("dash.fin.kpi.repurchase"), v: o.repurchase_rate != null ? `${(Number(o.repurchase_rate) * 100).toFixed(1)}%` : "—" },
    { k: t("dash.fin.kpi.buyers"), v: o.buyers ?? 0 },
    { k: t("dash.fin.kpi.repeatBuyers"), v: o.repeat_buyers ?? 0 },
    { k: t("dash.fin.kpi.avgPurchases"), v: o.avg_purchases != null ? Number(o.avg_purchases).toFixed(1) : "—" },
  ];

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text("Financeiro · FightPort", 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["KPI", "Valor"]],
      body: kpis.map((k) => [k.k, String(k.v)]),
    });
    doc.save(`financeiro-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(monthly);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Receita mensal");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(byPkg), "Por pacote");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topSchools), "Top escolas");
    XLSX.writeFile(wb, `financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div>
      <DashPageHeader
        title={t("dash.fin.title")}
        actions={
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t("dash.period.today")}</SelectItem>
                <SelectItem value="7d">{t("dash.period.7d")}</SelectItem>
                <SelectItem value="30d">{t("dash.period.30d")}</SelectItem>
                <SelectItem value="month">{t("dash.period.month")}</SelectItem>
                <SelectItem value="year">{t("dash.period.year")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download className="h-4 w-4 mr-2" />PDF</Button>
            <Button variant="outline" size="sm" onClick={exportXlsx}><Download className="h-4 w-4 mr-2" />XLSX</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {kpis.map((k) => <DashKpiCard key={k.k} label={k.k} value={k.v} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <DashSection title={t("dash.fin.chart.monthly")}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashSection>
        <DashSection title={t("dash.fin.chart.byPackage")}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPkg} dataKey="revenue" nameKey="package" outerRadius={90} label>
                  {byPkg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DashSection>
      </div>

      <DashSection title={t("dash.fin.chart.topSchools")}>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSchools}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="school_name" fontSize={10} angle={-20} textAnchor="end" height={60} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashSection>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashPageHeader, DashTable, DashFiltersBar, DashSearch, DashPagination, DashTableSkeleton } from "@/components/dash/DashCommon";
import { MARTIAL_ARTS } from "@/lib/belts";
import { Download } from "lucide-react";

export const Route = createFileRoute("/dash/organizacoes")({
  component: OrgsPage,
});

const PAGE_SIZE = 20;
const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function OrgsPage() {
  const t = useT();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [art, setArt] = useState<string>("all");
  const [state, setState] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [credits, setCredits] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await db.rpc("admin_list_schools", {
          p_search: search || null,
          p_martial_art: art === "all" ? null : art,
          p_state: state === "all" ? null : state,
          p_status: status === "all" ? null : status,
          p_credits: credits === "all" ? null : credits,
          p_page: page,
          p_page_size: PAGE_SIZE,
        });
        if (cancelled) return;
        const data = r.data ?? {};
        setRows(Array.isArray(data.rows) ? data.rows : Array.isArray(data) ? data : []);
        setTotal(Number(data.total ?? (Array.isArray(data) ? data.length : 0)));
      } catch {
        if (!cancelled) { setRows([]); setTotal(0); }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [search, art, state, status, credits, page]);

  const exportCsv = () => {
    const csv = Papa.unparse(rows.map((r) => ({
      Nome: r.name, Email: r.email, Cidade: r.city, Estado: r.state,
      Modalidade: r.martial_art, Status: r.status, Creditos: r.balance, "Criada em": r.created_at,
    })));
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `organizacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const cols = useMemo(() => [
    { key: "name", label: t("dash.orgs.col.name") },
    { key: "city", label: t("dash.orgs.col.city"), render: (r: any) => `${r.city ?? "—"}${r.state ? "/" + r.state : ""}` },
    { key: "martial_art", label: t("dash.orgs.col.art") },
    { key: "status", label: t("dash.orgs.col.status"), render: (r: any) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.status === "suspended" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
        {r.status === "suspended" ? t("dash.orgs.status.suspended") : t("dash.orgs.status.active")}
      </span>
    ) },
    { key: "balance", label: t("dash.orgs.col.credits") },
    { key: "created_at", label: t("dash.orgs.col.created"), render: (r: any) => r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : "—" },
  ], [t]);

  return (
    <div>
      <DashPageHeader
        title={t("dash.orgs.title")}
        actions={<Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />{t("dash.export.csv")}</Button>}
      />
      <DashFiltersBar>
        <DashSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        <Select value={art} onValueChange={(v) => { setArt(v); setPage(1); }}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder={t("dash.orgs.filter.art")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dash.orgs.filter.art")}</SelectItem>
            {MARTIAL_ARTS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={(v) => { setState(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder={t("dash.orgs.filter.state")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dash.orgs.filter.state")}</SelectItem>
            {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder={t("dash.orgs.filter.status")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dash.orgs.filter.status")}</SelectItem>
            <SelectItem value="active">{t("dash.orgs.status.active")}</SelectItem>
            <SelectItem value="suspended">{t("dash.orgs.status.suspended")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={credits} onValueChange={(v) => { setCredits(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder={t("dash.orgs.filter.credits")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dash.orgs.filter.credits")}</SelectItem>
            <SelectItem value="with">{t("dash.orgs.filter.withCredits")}</SelectItem>
            <SelectItem value="without">{t("dash.orgs.filter.noCredits")}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setArt("all"); setState("all"); setStatus("all"); setCredits("all"); setPage(1); }}>
          {t("dash.filters.clear")}
        </Button>
      </DashFiltersBar>

      <div className="border border-border rounded-lg bg-card">
        {loading ? <div className="p-4"><DashTableSkeleton /></div> : (
          <DashTable rows={rows} columns={cols} onRowClick={(r: any) => navigate({ to: "/dash/organizacoes/$id", params: { id: r.id } })} />
        )}
      </div>
      <DashPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}

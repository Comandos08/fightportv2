import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { DashPageHeader, DashTable, DashFiltersBar, DashSearch, DashPagination, DashTableSkeleton } from "@/components/dash/DashCommon";
import { BeltBadge } from "@/components/BeltBadge";
import { formatDateBR } from "@/lib/utils";

export const Route = createFileRoute("/dash/graduacoes")({
  component: GradsPage,
});

const PAGE_SIZE = 20;

function GradsPage() {
  const t = useT();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await db.rpc("admin_list_achievements", {
          p_search: search || null, p_page: page, p_page_size: PAGE_SIZE,
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
  }, [search, page]);

  const exportCsv = () => {
    const csv = Papa.unparse(rows.map((r: any) => ({
      Data: r.achievement_date, Atleta: `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim(),
      FP_ID: r.fp_id, Escola: r.school_name, Modalidade: r.martial_art, Faixa: r.belt,
      Graduado_por: r.graduated_by, Hash: r.hash,
    })));
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `graduacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <DashPageHeader title={t("dash.grad.title")}
        actions={<Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />{t("dash.export.csv")}</Button>} />
      <DashFiltersBar>
        <DashSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
      </DashFiltersBar>

      <div className="border border-border rounded-lg bg-card">
        {loading ? <div className="p-4"><DashTableSkeleton /></div> : (
          <DashTable
            rows={rows}
            columns={[
              { key: "achievement_date", label: t("dash.grad.col.date"), render: (r: any) => formatDateBR(r.achievement_date) },
              { key: "athlete", label: t("dash.grad.col.athlete"), render: (r: any) => (
                <div className="flex flex-col">
                  <span>{r.first_name} {r.last_name}</span>
                  <code className="text-[10px] text-muted-foreground">{r.fp_id}</code>
                </div>
              ) },
              { key: "school_name", label: t("dash.grad.col.school") },
              { key: "martial_art", label: t("dash.grad.col.modality") },
              { key: "belt", label: t("dash.grad.col.belt"), render: (r: any) => <BeltBadge belt={r.belt} size="sm" /> },
              { key: "graduated_by", label: t("dash.grad.col.by") },
              { key: "hash", label: t("dash.grad.col.hash"), render: (r: any) => r.hash ? (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span>{r.hash.slice(0,8)}…{r.hash.slice(-8)}</span>
                  <button onClick={() => { navigator.clipboard.writeText(r.hash); toast.success("Copiado."); }}>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              ) : "—" },
            ]}
          />
        )}
      </div>
      <DashPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { DashPageHeader, DashTable, DashFiltersBar, DashSearch, DashPagination, DashTableSkeleton } from "@/components/dash/DashCommon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MARTIAL_ARTS } from "@/lib/belts";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/belts";

export const Route = createFileRoute("/dash/atletas")({
  component: AthletesPage,
});

const PAGE_SIZE = 20;
const BELTS = ["Branca","Cinza","Amarela","Laranja","Verde","Azul","Roxa","Marrom","Preta","Coral","Vermelha"];

function maskCpf(c: string | null) {
  if (!c) return "—";
  const d = c.replace(/\D/g, "");
  if (d.length < 11) return "***.***.***-**";
  return `***.***.***-${d.slice(-2)}`;
}

function AthletesPage() {
  const t = useT();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [art, setArt] = useState("all");
  const [belt, setBelt] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await db.rpc("admin_list_people", {
          p_search: search || null,
          p_martial_art: art === "all" ? null : art,
          p_belt: belt === "all" ? null : belt,
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
  }, [search, art, belt, page]);

  return (
    <div>
      <DashPageHeader title={t("dash.ath.title")} />
      <DashFiltersBar>
        <DashSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        <Select value={art} onValueChange={(v) => { setArt(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={t("dash.orgs.filter.art")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dash.orgs.filter.art")}</SelectItem>
            {MARTIAL_ARTS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={belt} onValueChange={(v) => { setBelt(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Faixa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Faixa</SelectItem>
            {BELTS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setArt("all"); setBelt("all"); setPage(1); }}>
          {t("dash.filters.clear")}
        </Button>
      </DashFiltersBar>

      <div className="border border-border rounded-lg bg-card">
        {loading ? <div className="p-4"><DashTableSkeleton /></div> : (
          <DashTable
            rows={rows}
            onRowClick={(r: any) => navigate({ to: "/dash/atletas/$id", params: { id: r.id } })}
            columns={[
              { key: "name", label: t("dash.ath.col.name"), render: (r: any) => (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold overflow-hidden">
                    {r.photo_url ? <img src={r.photo_url} alt="" className="h-full w-full object-cover" /> : getInitials(`${r.first_name ?? ""} ${r.last_name ?? ""}`)}
                  </div>
                  <span>{r.first_name} {r.last_name}</span>
                </div>
              ) },
              { key: "fp_id", label: t("dash.ath.col.fpid"), render: (r: any) => <code className="text-xs">{r.fp_id}</code> },
              { key: "cpf", label: t("dash.ath.col.cpf"), render: (r: any) => maskCpf(r.cpf) },
              { key: "schools", label: t("dash.ath.col.schools"), render: (r: any) => r.schools_count ?? (Array.isArray(r.schools) ? r.schools.length : "—") },
              { key: "achievements", label: t("dash.ath.col.achievements"), render: (r: any) => r.achievements_count ?? "—" },
            ]}
          />
        )}
      </div>
      <DashPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}

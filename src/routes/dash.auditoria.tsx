import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashPageHeader, DashTable, DashFiltersBar, DashSearch, DashPagination, DashTableSkeleton } from "@/components/dash/DashCommon";

export const Route = createFileRoute("/dash/auditoria")({
  component: AuditPage,
});

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  "school.suspend": "Suspendeu organização",
  "school.reactivate": "Reativou organização",
  "school.grant_bonus": "Concedeu créditos de cortesia",
  "person.update": "Editou atleta",
  "reveal_cpf": "Revelou CPF",
  "reveal_birth_date": "Revelou data de nascimento",
  "belt_model.create": "Criou modelo de graduação",
  "belt_model.update": "Atualizou modelo de graduação",
  "belt_model.deactivate": "Desativou modelo de graduação",
};

function AuditPage() {
  const t = useT();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");
  const [targetType, setTargetType] = useState("all");
  const [targetId, setTargetId] = useState("");
  const [search, setSearch] = useState("");
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await db.rpc("admin_audit_log_actions");
        setActions(Array.isArray(r.data) ? r.data.map((x: any) => typeof x === "string" ? x : x.action) : []);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await db.rpc("admin_list_audit_log", {
          p_action: action === "all" ? null : action,
          p_target_type: targetType === "all" ? null : targetType,
          p_target_id: targetId || null,
          p_search: search || null,
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
  }, [action, targetType, targetId, search, page]);

  return (
    <div>
      <DashPageHeader title={t("dash.audit.title")} />
      <DashFiltersBar>
        <DashSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{ACTION_LABELS[a] ?? a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={targetType} onValueChange={(v) => { setTargetType(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo de alvo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="school">Escola</SelectItem>
            <SelectItem value="person">Atleta</SelectItem>
            <SelectItem value="belt_model">Modelo</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Target ID" value={targetId} onChange={(e) => { setTargetId(e.target.value); setPage(1); }} className="w-[200px]" />
      </DashFiltersBar>

      <div className="border border-border rounded-lg bg-card">
        {loading ? <div className="p-4"><DashTableSkeleton /></div> : (
          <DashTable
            rows={rows}
            columns={[
              { key: "created_at", label: t("dash.audit.col.when"), render: (r: any) => new Date(r.created_at).toLocaleString("pt-BR") },
              { key: "admin", label: t("dash.audit.col.admin"), render: (r: any) => r.admin_name ?? r.admin_email ?? r.admin_id ?? "—" },
              { key: "action", label: t("dash.audit.col.action"), render: (r: any) => ACTION_LABELS[r.action] ?? r.action },
              { key: "target", label: t("dash.audit.col.target"), render: (r: any) => {
                if (r.target_type === "school" && r.target_id) return <a className="underline" href={`/dash/organizacoes/${r.target_id}`}>{r.target_name ?? r.target_id}</a>;
                if (r.target_type === "person" && r.target_id) return <a className="underline" href={`/dash/atletas/${r.target_id}`}>{r.target_name ?? r.target_id}</a>;
                return r.target_id ?? "—";
              } },
              { key: "metadata", label: t("dash.audit.col.meta"), render: (r: any) => r.metadata ? (
                <pre className="text-[10px] bg-muted/40 px-2 py-1 rounded max-w-[300px] overflow-x-auto">{JSON.stringify(r.metadata, null, 0)}</pre>
              ) : "—" },
            ]}
          />
        )}
      </div>
      <DashPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}

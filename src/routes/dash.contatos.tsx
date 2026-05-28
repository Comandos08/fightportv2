import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashPageHeader, DashTable, DashFiltersBar, DashTableSkeleton } from "@/components/dash/DashCommon";

export const Route = createFileRoute("/dash/contatos")({
  component: ContactsPage,
});

function ContactsPage() {
  const t = useT();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [active, setActive] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      let q = db.from("contact_submissions").select("*").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      const r = await q;
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch { setRows([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [status]);

  const update = async (id: string, newStatus: string) => {
    try {
      await db.from("contact_submissions").update({ status: newStatus }).eq("id", id);
      toast.success("Atualizado."); load();
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  return (
    <div>
      <DashPageHeader title={t("dash.contacts.title")} />
      <DashFiltersBar>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="read">Lidos</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>
      </DashFiltersBar>

      <div className="border border-border rounded-lg bg-card">
        {loading ? <div className="p-4"><DashTableSkeleton /></div> : (
          <DashTable
            rows={rows}
            onRowClick={setActive}
            columns={[
              { key: "created_at", label: t("dash.contacts.col.date"), render: (r: any) => new Date(r.created_at).toLocaleString("pt-BR") },
              { key: "name", label: t("dash.contacts.col.name") },
              { key: "email", label: t("dash.contacts.col.email") },
              { key: "subject", label: t("dash.contacts.col.subject") },
              { key: "status", label: t("dash.contacts.col.status"), render: (r: any) => (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-muted">{r.status}</span>
              ) },
            ]}
          />
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{active?.subject}</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {active.name} · <a href={`mailto:${active.email}`} className="underline">{active.email}</a>
              </div>
              <div className="whitespace-pre-wrap text-sm bg-muted/50 p-3 rounded">{active.message}</div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => update(active.id, "read")}>{t("dash.contacts.action.read")}</Button>
                <Button size="sm" variant="outline" onClick={() => update(active.id, "archived")}>{t("dash.contacts.action.archive")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashPageHeader, DashTable, DashKpiCard } from "@/components/dash/DashCommon";

export const Route = createFileRoute("/dash/organizacoes/$id")({
  component: OrgDetail,
});

function OrgDetail() {
  const { id } = useParams({ from: "/dash/organizacoes/$id" });
  const t = useT();
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState("athletes");
  const [tabRows, setTabRows] = useState<any[]>([]);
  const [suspendReason, setSuspendReason] = useState("");
  const [grantAmount, setGrantAmount] = useState(0);
  const [grantReason, setGrantReason] = useState("");
  const [openSuspend, setOpenSuspend] = useState(false);
  const [openGrant, setOpenGrant] = useState(false);

  const load = async () => {
    try {
      const r = await db.rpc("admin_get_school", { p_school_id: id });
      setSchool(r.data ?? null);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const fn = ({
      athletes: "admin_school_people",
      grads: "admin_school_achievements",
      tickets: "admin_school_tickets",
      transactions: "admin_school_transactions",
      audit: "admin_school_audit",
      school_audit: "admin_school_action_log",
    } as Record<string, string>)[tab];
    if (!fn) return;
    (async () => {
      try {
        const r = tab === "school_audit"
          ? await db.from("school_audit_log").select("*").eq("school_id", id).order("created_at", { ascending: false }).limit(100)
          : await db.rpc(fn, { p_school_id: id });
        setTabRows(Array.isArray(r.data) ? r.data : []);
      } catch { setTabRows([]); }
    })();
  }, [tab, id]);

  const suspend = async () => {
    if (!suspendReason.trim()) return;
    try {
      await db.rpc("admin_suspend_school", { p_school_id: id, p_reason: suspendReason });
      toast.success(t("dash.orgs.action.suspend"));
      setOpenSuspend(false); setSuspendReason(""); load();
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  const reactivate = async () => {
    try {
      await db.rpc("admin_reactivate_school", { p_school_id: id });
      toast.success(t("dash.orgs.action.reactivate")); load();
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  const grant = async () => {
    if (!grantAmount || !grantReason.trim()) return;
    try {
      await db.rpc("admin_grant_bonus_credits", { p_school_id: id, p_amount: grantAmount, p_reason: grantReason });
      try {
        await db.from("notifications").insert({
          recipient_type: "school", school_id: id, type: "courtesy_credits",
          title: "Créditos de cortesia", body: `Você recebeu ${grantAmount} créditos.`,
        });
      } catch { /* ignore */ }
      toast.success("Créditos concedidos.");
      setOpenGrant(false); setGrantAmount(0); setGrantReason(""); load();
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  if (!school) {
    return <div className="text-sm text-muted-foreground">{t("common.loading")}</div>;
  }

  const isSuspended = school.status === "suspended";

  return (
    <div>
      <DashPageHeader
        title={school.name ?? "—"}
        description={`${school.city ?? "—"}${school.state ? "/" + school.state : ""} · ${school.martial_art ?? ""}`}
        actions={
          <div className="flex gap-2">
            {isSuspended ? (
              <Button size="sm" onClick={reactivate}>{t("dash.orgs.action.reactivate")}</Button>
            ) : (
              <Dialog open={openSuspend} onOpenChange={setOpenSuspend}>
                <DialogTrigger asChild><Button size="sm" variant="destructive">{t("dash.orgs.action.suspend")}</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t("dash.orgs.action.suspend")}</DialogTitle></DialogHeader>
                  <Label>{t("dash.orgs.suspend.reason")}</Label>
                  <Textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={4} />
                  <DialogFooter><Button variant="destructive" onClick={suspend}>{t("common.confirm")}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={openGrant} onOpenChange={setOpenGrant}>
              <DialogTrigger asChild><Button size="sm" variant="outline">{t("dash.orgs.action.grant")}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("dash.orgs.action.grant")}</DialogTitle></DialogHeader>
                <Label>{t("dash.orgs.grant.amount")}</Label>
                <Input type="number" value={grantAmount} onChange={(e) => setGrantAmount(Number(e.target.value))} />
                <Label className="mt-2">{t("dash.orgs.grant.reason")}</Label>
                <Textarea value={grantReason} onChange={(e) => setGrantReason(e.target.value)} rows={3} />
                <DialogFooter><Button onClick={grant}>{t("common.confirm")}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashKpiCard label="E-mail" value={<span className="text-sm break-all">{school.email ?? "—"}</span>} />
        <DashKpiCard label={t("dash.orgs.col.status")} value={isSuspended ? t("dash.orgs.status.suspended") : t("dash.orgs.status.active")} />
        <DashKpiCard label={t("dash.orgs.col.credits")} value={school.balance ?? 0} />
        <DashKpiCard label="Atletas" value={school.athletes_count ?? 0} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="athletes">{t("dash.orgs.tab.athletes")}</TabsTrigger>
          <TabsTrigger value="grads">{t("dash.orgs.tab.grads")}</TabsTrigger>
          <TabsTrigger value="tickets">{t("dash.orgs.tab.tickets")}</TabsTrigger>
          <TabsTrigger value="transactions">{t("dash.orgs.tab.transactions")}</TabsTrigger>
          <TabsTrigger value="audit">{t("dash.orgs.tab.audit")}</TabsTrigger>
          <TabsTrigger value="school_audit">{t("dash.orgs.tab.school_audit")}</TabsTrigger>
        </TabsList>
        {["athletes","grads","tickets","transactions","audit","school_audit"].map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            <div className="border border-border rounded-lg bg-card">
              <DashTable
                rows={tabRows}
                columns={
                  tabRows[0]
                    ? Object.keys(tabRows[0]).slice(0, 6).map((kk) => ({
                        key: kk, label: kk,
                        render: (r: any) => {
                          const v = r[kk];
                          if (v == null) return "—";
                          if (typeof v === "object") return <code className="text-xs">{JSON.stringify(v)}</code>;
                          if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v).toLocaleString("pt-BR");
                          return String(v);
                        },
                      }))
                    : [{ key: "_", label: "—" }]
                }
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

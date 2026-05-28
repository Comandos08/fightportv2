import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashPageHeader, DashSection, DashTable } from "@/components/dash/DashCommon";
import { BeltBadge } from "@/components/BeltBadge";
import { getInitials } from "@/lib/belts";

export const Route = createFileRoute("/dash/atletas/$id")({
  component: AthleteDetail,
});

const EDITABLE = ["first_name","last_name","cpf","birth_date","gender","father_name","mother_name","photo_url","phone"] as const;

function maskCpf(c: string | null) {
  if (!c) return "—";
  const d = c.replace(/\D/g, "");
  return d.length < 11 ? "***.***.***-**" : `***.***.***-${d.slice(-2)}`;
}
function maskBirth(d: string | null) {
  if (!d) return "—";
  return `**/**/${d.slice(0,4)}`;
}

function AthleteDetail() {
  const { id } = useParams({ from: "/dash/atletas/$id" });
  const t = useT();
  const [person, setPerson] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showCpf, setShowCpf] = useState(false);
  const [showBirth, setShowBirth] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [reason, setReason] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const r = await db.rpc("admin_get_person", { p_person_id: id });
      setPerson(r.data ?? null);
      if (r.data) {
        const f: Record<string, string> = {};
        for (const k of EDITABLE) f[k] = (r.data[k] ?? "") as string;
        setForm(f);
      }
    } catch { /* ignore */ }
    try {
      const a = await db.rpc("admin_practitioner_achievements", { p_person_id: id });
      setAchievements(Array.isArray(a.data) ? a.data : []);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, [id]);

  const reveal = async (field: "cpf" | "birth_date") => {
    try {
      await db.rpc("admin_log_action", { p_action: field === "cpf" ? "reveal_cpf" : "reveal_birth_date", p_target_type: "person", p_target_id: id });
    } catch { /* ignore */ }
    if (field === "cpf") setShowCpf(true); else setShowBirth(true);
  };

  const save = async () => {
    if (!reason.trim()) { toast.error(t("dash.ath.edit.reason")); return; }
    try {
      await db.rpc("admin_update_person", { p_person_id: id, p_changes: form, p_reason: reason });
      toast.success("Atleta atualizado.");
      setOpenEdit(false); setReason(""); load();
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  if (!person) return <div className="text-sm text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div>
      <DashPageHeader
        title={`${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || "—"}
        description={person.fp_id}
        actions={
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogTrigger asChild><Button>{t("dash.ath.edit")}</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{t("dash.ath.edit")}</DialogTitle></DialogHeader>
              <div className="grid sm:grid-cols-2 gap-3">
                {EDITABLE.map((k) => (
                  <div key={k}>
                    <Label className="text-xs">{k}</Label>
                    <Input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
              <Label className="mt-3">{t("dash.ath.edit.reason")}</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid md:grid-cols-[120px_1fr] gap-6 mb-6">
        <div className="h-28 w-28 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xl font-semibold border border-border">
          {person.photo_url ? <img src={person.photo_url} alt="" className="h-full w-full object-cover" /> : getInitials(`${person.first_name ?? ""} ${person.last_name ?? ""}`)}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">CPF:</span> {showCpf ? person.cpf : maskCpf(person.cpf)}
            {!showCpf && <Button size="sm" variant="ghost" className="ml-2 h-6 px-2" onClick={() => reveal("cpf")}><Eye className="h-3 w-3 mr-1" />{t("dash.ath.reveal.cpf")}</Button>}
            {showCpf && <Button size="sm" variant="ghost" className="ml-2 h-6 px-2" onClick={() => setShowCpf(false)}><EyeOff className="h-3 w-3" /></Button>}
          </div>
          <div><span className="text-muted-foreground">Nascimento:</span> {showBirth ? person.birth_date : maskBirth(person.birth_date)}
            {!showBirth && <Button size="sm" variant="ghost" className="ml-2 h-6 px-2" onClick={() => reveal("birth_date")}><Eye className="h-3 w-3 mr-1" />{t("dash.ath.reveal.birth")}</Button>}
          </div>
          <div><span className="text-muted-foreground">Telefone:</span> {person.phone ?? "—"}</div>
          <div><span className="text-muted-foreground">Sexo:</span> {person.gender ?? "—"}</div>
          <div><span className="text-muted-foreground">Pai:</span> {person.father_name ?? "—"}</div>
          <div><span className="text-muted-foreground">Mãe:</span> {person.mother_name ?? "—"}</div>
        </div>
      </div>

      <DashSection title="Vínculos com organizações">
        <DashTable
          rows={Array.isArray(person.schools) ? person.schools : []}
          columns={[
            { key: "school_name", label: "Escola" },
            { key: "martial_art", label: "Modalidade" },
            { key: "current_belt", label: "Faixa", render: (r: any) => <BeltBadge belt={r.current_belt} size="sm" /> },
          ]}
        />
      </DashSection>

      <div className="mt-6">
        <DashSection title="Conquistas">
          <DashTable
            rows={achievements}
            columns={[
              { key: "achievement_date", label: "Data", render: (r: any) => new Date(r.achievement_date).toLocaleDateString("pt-BR") },
              { key: "school_name", label: "Escola" },
              { key: "martial_art", label: "Modalidade" },
              { key: "belt", label: "Faixa", render: (r: any) => <BeltBadge belt={r.belt} size="sm" /> },
              { key: "graduated_by", label: "Graduado por" },
            ]}
          />
        </DashSection>
      </div>
    </div>
  );
}

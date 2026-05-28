import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { MARTIAL_ARTS } from "@/lib/belts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashPageHeader, DashTable, DashFiltersBar, DashTableSkeleton } from "@/components/dash/DashCommon";

export const Route = createFileRoute("/dash/modelos")({
  component: ModelsPage,
});

type Model = {
  id?: string;
  name: string;
  martial_art: string;
  federation?: string | null;
  belts: string[];
  is_default: boolean;
  is_active: boolean;
};

function emptyModel(): Model {
  return { name: "", martial_art: MARTIAL_ARTS[0], federation: "", belts: [""], is_default: false, is_active: true };
}

function ModelsPage() {
  const t = useT();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArt, setFilterArt] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Model>(emptyModel());

  const load = async () => {
    setLoading(true);
    try {
      const r = await db.rpc("admin_list_belt_models", { p_martial_art: filterArt === "all" ? null : filterArt });
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch { setRows([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterArt]);

  const openNew = () => { setEditing(emptyModel()); setOpen(true); };
  const openEdit = (m: any) => {
    setEditing({
      id: m.id, name: m.name, martial_art: m.martial_art, federation: m.federation ?? "",
      belts: Array.isArray(m.belts) ? m.belts : [""], is_default: !!m.is_default, is_active: m.is_active !== false,
    });
    setOpen(true);
  };

  const save = async () => {
    const cleanBelts = editing.belts.map((b) => b.trim()).filter(Boolean);
    if (!editing.name.trim() || !cleanBelts.length) { toast.error("Preencha nome e ao menos uma faixa."); return; }
    const payload = {
      p_name: editing.name, p_martial_art: editing.martial_art,
      p_federation: editing.federation || null, p_belts: cleanBelts, p_is_default: editing.is_default,
    };
    try {
      if (editing.id) {
        await db.rpc("admin_update_belt_model", { p_id: editing.id, ...payload });
      } else {
        await db.rpc("admin_create_belt_model", payload);
      }
      toast.success("Modelo salvo.");
      setOpen(false); load();
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  const setDefault = async (id: string) => {
    try { await db.rpc("admin_set_default_belt_model", { p_id: id }); toast.success("Definido como padrão."); load(); }
    catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };
  const toggleActive = async (m: any) => {
    try {
      await db.rpc("admin_update_belt_model", { p_id: m.id, p_is_active: !m.is_active });
      toast.success(!m.is_active ? "Ativado." : "Desativado."); load();
    } catch (e: any) { toast.error(e.message ?? t("common.error")); }
  };

  const move = (i: number, dir: -1 | 1) => {
    const arr = [...editing.belts];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setEditing({ ...editing, belts: arr });
  };

  return (
    <div>
      <DashPageHeader
        title={t("dash.mod.title")}
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />{t("dash.mod.new")}</Button>}
      />
      <DashFiltersBar>
        <Select value={filterArt} onValueChange={setFilterArt}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as modalidades</SelectItem>
            {MARTIAL_ARTS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </DashFiltersBar>

      <div className="border border-border rounded-lg bg-card">
        {loading ? <div className="p-4"><DashTableSkeleton /></div> : (
          <DashTable
            rows={rows}
            columns={[
              { key: "name", label: t("dash.mod.col.name") },
              { key: "martial_art", label: t("dash.mod.col.modality") },
              { key: "federation", label: t("dash.mod.col.federation"), render: (r: any) => r.federation ?? "—" },
              { key: "belts", label: t("dash.mod.col.belts"), render: (r: any) => Array.isArray(r.belts) ? r.belts.length : 0 },
              { key: "is_default", label: t("dash.mod.col.default"), render: (r: any) => r.is_default ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-foreground text-background">PADRÃO</span>
              ) : "—" },
              { key: "is_active", label: t("dash.mod.col.status"), render: (r: any) => r.is_active !== false ? "Ativo" : "Inativo" },
              { key: "_actions", label: "", render: (r: any) => (
                <div className="flex gap-1 justify-end">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>{t("common.edit")}</Button>
                  {!r.is_default && <Button size="sm" variant="ghost" onClick={() => setDefault(r.id)}>{t("dash.mod.action.setDefault")}</Button>}
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
                    {r.is_active !== false ? t("dash.mod.action.deactivate") : t("dash.mod.action.activate")}
                  </Button>
                </div>
              ) },
            ]}
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing.id ? t("dash.mod.edit") : t("dash.mod.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("dash.mod.form.name")}</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <Label>{t("dash.mod.form.modality")}</Label>
              <Select value={editing.martial_art} onValueChange={(v) => setEditing({ ...editing, martial_art: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARTIAL_ARTS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("dash.mod.form.federation")}</Label>
              <Input value={editing.federation ?? ""} onChange={(e) => setEditing({ ...editing, federation: e.target.value })} />
            </div>
            <div>
              <Label>{t("dash.mod.form.belts")}</Label>
              <div className="space-y-2 mt-2">
                {editing.belts.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground text-xs">▲</button>
                      <button type="button" onClick={() => move(i, 1)} className="text-muted-foreground hover:text-foreground text-xs">▼</button>
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={b}
                      placeholder={t("dash.mod.form.beltLabel")}
                      onChange={(e) => {
                        const arr = [...editing.belts]; arr[i] = e.target.value;
                        setEditing({ ...editing, belts: arr });
                      }}
                    />
                    <Button type="button" size="icon" variant="ghost" onClick={() => {
                      const arr = editing.belts.filter((_, j) => j !== i);
                      setEditing({ ...editing, belts: arr.length ? arr : [""] });
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing({ ...editing, belts: [...editing.belts, ""] })}>
                  <Plus className="h-4 w-4 mr-2" />{t("dash.mod.form.addBelt")}
                </Button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={editing.is_default} onCheckedChange={(v) => setEditing({ ...editing, is_default: !!v })} />
              {t("dash.mod.form.default")}
            </label>
          </div>
          <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

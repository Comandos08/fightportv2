import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { BELT_COLORS } from "@/lib/belts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/painel/praticantes/$id/editar")({ component: EditPracPage });

function EditPracPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { user } = useSession();
  const schoolId = user?.id;

  const [loaded, setLoaded] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [gender, setGender] = useState("");
  const [belt, setBelt] = useState("Branca");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const p = await db.from("people").select("first_name, last_name, gender").eq("id", id).maybeSingle();
      const link = await db
        .from("person_schools")
        .select("current_belt")
        .eq("person_id", id)
        .eq("school_id", schoolId)
        .maybeSingle();
      if (p.data) {
        setFirst(p.data.first_name);
        setLast(p.data.last_name);
        setGender(p.data.gender ?? "");
      }
      if (link.data) setBelt(link.data.current_belt);
      setLoaded(true);
    })();
  }, [id, schoolId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const upd = await db.from("people").update({ first_name: first, last_name: last, gender: gender || null }).eq("id", id);
      if (upd.error) throw upd.error;
      const lnk = await db
        .from("person_schools")
        .update({ current_belt: belt })
        .eq("person_id", id)
        .eq("school_id", schoolId);
      if (lnk.error) throw lnk.error;
      await db.from("school_audit_log").insert({
        school_id: schoolId,
        action: "practitioner_updated",
        target_person_id: id,
        fields_changed: { first_name: first, last_name: last, gender, current_belt: belt },
      });
      toast.success("Alterações salvas.");
      navigate({ to: "/painel/praticantes" });
    } catch (err: any) {
      toast.error(err?.message ?? t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("prac.form.title.edit")}</h1>

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{t("prac.form.firstName")}</Label>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} required />
          </div>
          <div>
            <Label>{t("prac.form.lastName")}</Label>
            <Input value={last} onChange={(e) => setLast(e.target.value)} required />
          </div>
          <div>
            <Label>{t("prac.form.gender")}</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">{t("prac.form.gender.M")}</SelectItem>
                <SelectItem value="F">{t("prac.form.gender.F")}</SelectItem>
                <SelectItem value="O">{t("prac.form.gender.O")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("prac.form.belt")}</Label>
            <Select value={belt} onValueChange={setBelt}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(BELT_COLORS).map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => navigate({ to: "/painel/praticantes" })}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={submitting}>
          {t("prac.form.submit.edit")}
        </Button>
      </div>
    </form>
  );
}

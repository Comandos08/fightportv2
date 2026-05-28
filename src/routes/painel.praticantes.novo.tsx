import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { BELT_COLORS } from "@/lib/belts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/painel/praticantes/novo")({ component: NewPracPage });

function NewPracPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useSession();
  const schoolId = user?.id;

  const [cpf, setCpf] = useState("");
  const [foundPerson, setFoundPerson] = useState<any | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [verified, setVerified] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState("");
  const [father, setFather] = useState("");
  const [mother, setMother] = useState("");
  const [belt, setBelt] = useState("Branca");
  const [submitting, setSubmitting] = useState(false);

  const { data: school } = useQuery({
    queryKey: ["school", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db.from("schools").select("name, martial_art").eq("id", schoolId).maybeSingle();
      return res.data;
    },
  });

  const verifyCpf = async () => {
    const clean = cpf.replace(/\D/g, "");
    if (!clean) return;
    const res = await db.rpc("find_person_by_cpf", { p_cpf: clean });
    if (res.data) {
      const p = await db.from("people").select("id, first_name, last_name").eq("id", res.data).maybeSingle();
      setFoundPerson(p.data);
      setShowLinkModal(true);
    } else {
      setVerified(true);
      toast.info("CPF disponível — preencha o cadastro.");
    }
  };

  const linkExisting = async () => {
    if (!foundPerson || !schoolId || !school) return;
    const res = await db.from("person_schools").insert({
      person_id: foundPerson.id,
      school_id: schoolId,
      martial_art: school.martial_art,
      current_belt: "Branca",
    });
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(t("prac.form.cpf.linked"));
    navigate({ to: "/painel/praticantes" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t("common.required"));
      return;
    }
    if (!schoolId || !school) return;
    setSubmitting(true);
    try {
      const fpRes = await db.rpc("generate_fp_id");
      const personIns = await db
        .from("people")
        .insert({
          fp_id: fpRes.data,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          cpf: cpf.replace(/\D/g, "") || null,
          birth_date: birth || null,
          gender: gender || null,
          father_name: father || null,
          mother_name: mother || null,
        })
        .select("id")
        .single();
      if (personIns.error) throw personIns.error;
      const personId = personIns.data.id;
      const linkIns = await db.from("person_schools").insert({
        person_id: personId,
        school_id: schoolId,
        martial_art: school.martial_art,
        current_belt: belt,
      });
      if (linkIns.error) throw linkIns.error;

      // Create athlete account via edge function (best-effort; ignore failure here)
      try {
        await supabase.functions.invoke("create-athlete-account", {
          body: { person_id: personId, fp_id: fpRes.data, first_name: firstName, last_name: lastName },
        });
      } catch {
        // edge function may not exist yet
      }

      await db.from("school_audit_log").insert({
        school_id: schoolId,
        action: "practitioner_created",
        target_person_id: personId,
      });

      toast.success("Praticante cadastrado.");
      navigate({ to: "/painel/praticantes" });
    } catch (err: any) {
      toast.error(err?.message ?? t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("prac.form.title.new")}</h1>

      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <Label>{t("prac.form.cpf")} <span className="text-muted-foreground font-normal">({t("common.optional")})</span></Label>
        <div className="flex gap-2">
          <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          <Button type="button" variant="outline" onClick={verifyCpf}>
            {t("prac.form.cpf.verify")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("prac.form.cpf.hint")}</p>
      </div>

      {(verified || !cpf) && (
        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">{t("prac.form.section.personal")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("prac.form.firstName")} *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label>{t("prac.form.lastName")} *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div>
                <Label>{t("prac.form.birth")}</Label>
                <Input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
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
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">{t("prac.form.section.affil")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("prac.form.father")}</Label>
                <Input value={father} onChange={(e) => setFather(e.target.value)} />
              </div>
              <div>
                <Label>{t("prac.form.mother")}</Label>
                <Input value={mother} onChange={(e) => setMother(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">{t("prac.form.section.art")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("prac.form.art")}</Label>
                <Input value={school?.martial_art ?? ""} disabled />
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
              {t("prac.form.submit.new")}
            </Button>
          </div>
        </form>
      )}

      <AlertDialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("prac.form.cpf.found", { name: `${foundPerson?.first_name} ${foundPerson?.last_name}` })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={linkExisting}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Textarea className="hidden" />
    </div>
  );
}

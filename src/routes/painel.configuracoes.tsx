import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MARTIAL_ARTS } from "@/lib/belts";

export const Route = createFileRoute("/painel/configuracoes")({ component: ConfigPage });

function ConfigPage() {
  const t = useT();
  const { user } = useSession();
  const schoolId = user?.id;

  const [school, setSchool] = useState<any>({ name: "", martial_art: "", city: "", state: "", logo_url: "" });
  const [coach, setCoach] = useState<any>({ name: "", graduation: "" });
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const s = await db.from("schools").select("*").eq("id", schoolId).maybeSingle();
      if (s.data) setSchool(s.data);
      const c = await db.from("head_coaches").select("*").eq("school_id", schoolId).maybeSingle();
      if (c.data) setCoach(c.data);
    })();
  }, [schoolId]);

  const saveSchool = async () => {
    const res = await db
      .from("schools")
      .update({ name: school.name, martial_art: school.martial_art, city: school.city, state: school.state })
      .eq("id", schoolId);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo.");
  };

  const uploadLogo = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) return toast.error("Máx 2MB.");
    const path = `${schoolId}/${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("school-logos").upload(path, file, { upsert: true });
    if (up.error) return toast.error(up.error.message);
    const { data: pub } = supabase.storage.from("school-logos").getPublicUrl(path);
    await db.from("schools").update({ logo_url: pub.publicUrl }).eq("id", schoolId);
    setSchool({ ...school, logo_url: pub.publicUrl });
    toast.success("Logo atualizado.");
  };

  const saveCoach = async () => {
    const res = await db.from("head_coaches").upsert({
      school_id: schoolId,
      name: coach.name,
      graduation: coach.graduation,
    });
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo.");
  };

  const changePass = async () => {
    if (newPass.length < 8) return toast.error("Mínimo 8 caracteres.");
    if (newPass !== confirmPass) return toast.error("Senhas não coincidem.");
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return toast.error(error.message);
    toast.success("Senha alterada.");
    setNewPass("");
    setConfirmPass("");
  };

  const changeEmail = async () => {
    const email = prompt("Novo e-mail:");
    if (!email) return;
    const { error } = await supabase.auth.updateUser({ email });
    if (error) return toast.error(error.message);
    toast.success("Confirme no novo e-mail.");
  };

  return (
    <>
      <Topbar title={t("cfg.title")} subtitle="Escola, Head Coach e conta" />
      <div className="p-5 px-6 flex-1">
      <div className="max-w-2xl space-y-6">

      <Tabs defaultValue="school">
        <TabsList>
          <TabsTrigger value="school">{t("cfg.tab.school")}</TabsTrigger>
          <TabsTrigger value="coach">{t("cfg.tab.coach")}</TabsTrigger>
          <TabsTrigger value="account">{t("cfg.tab.account")}</TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="space-y-4 mt-4">
          <div>
            <Label>{t("cfg.school.name")}</Label>
            <Input value={school.name ?? ""} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
          </div>
          <div>
            <Label>{t("cfg.school.art")}</Label>
            <Select value={school.martial_art ?? ""} onValueChange={(v) => setSchool({ ...school, martial_art: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MARTIAL_ARTS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("cfg.school.city")}</Label>
              <Input value={school.city ?? ""} onChange={(e) => setSchool({ ...school, city: e.target.value })} />
            </div>
            <div>
              <Label>{t("cfg.school.state")}</Label>
              <Input value={school.state ?? ""} onChange={(e) => setSchool({ ...school, state: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>{t("cfg.school.logo")}</Label>
            <div className="flex items-center gap-3 mt-1">
              {school.logo_url && <img src={school.logo_url} alt="" className="h-12 w-12 rounded object-cover" />}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </div>
          </div>
          <Button onClick={saveSchool}>{t("common.save")}</Button>
        </TabsContent>

        <TabsContent value="coach" className="space-y-4 mt-4">
          <div>
            <Label>{t("cfg.coach.name")}</Label>
            <Input value={coach.name ?? ""} onChange={(e) => setCoach({ ...coach, name: e.target.value })} />
          </div>
          <div>
            <Label>{t("cfg.coach.grad")}</Label>
            <Input value={coach.graduation ?? ""} onChange={(e) => setCoach({ ...coach, graduation: e.target.value })} />
          </div>
          <Button onClick={saveCoach}>{t("common.save")}</Button>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 mt-4">
          <div>
            <Label>{t("cfg.account.email")}</Label>
            <Input value={user?.email ?? ""} disabled />
            <Button variant="outline" size="sm" className="mt-2" onClick={changeEmail}>
              {t("cfg.account.changeEmail")}
            </Button>
          </div>
          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-sm font-semibold">{t("cfg.account.changePass")}</h3>
            <div>
              <Label>{t("cfg.account.newPass")}</Label>
              <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            </div>
            <div>
              <Label>{t("cfg.account.confirmPass")}</Label>
              <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
            </div>
            <Button onClick={changePass}>{t("common.save")}</Button>
          </div>
        </TabsContent>
      </Tabs>
      </div>
      </div>
    </>
  );
}

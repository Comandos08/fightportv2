import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Lock, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { getInitials } from "@/lib/belts";

export const Route = createFileRoute("/minha-conta/perfil")({
  component: ProfilePage,
});

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  photo_url: string | null;
};

function maskCpf(cpf: string | null) {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length < 11) return "***.***.***-**";
  return `***.***.***-${digits.slice(-2)}`;
}
function maskBirth(d: string | null) {
  if (!d) return "—";
  const year = d.slice(0, 4);
  return `**/**/${year}`;
}

function ProfilePage() {
  const t = useT();
  const { user } = useSession();
  const [person, setPerson] = useState<Person | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    (async () => {
      const { data } = await db
        .from("people")
        .select("id, first_name, last_name, phone, cpf, birth_date, photo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPerson(data as Person);
        setFirst(data.first_name ?? "");
        setLast(data.last_name ?? "");
        setPhone(data.phone ?? "");
      }
    })();
  }, [user]);

  const save = async () => {
    if (!person) return;
    setSaving(true);
    const { error } = await db
      .from("people")
      .update({ first_name: first, last_name: last, phone: phone || null })
      .eq("id", person.id);
    setSaving(false);
    if (error) {
      toast.error(t("common.error"));
      return;
    }
    toast.success(t("athlete.profile.saved"));
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !person) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("athlete.profile.photo.tooLarge"));
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("athlete.profile.photo.invalidType"));
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${person.id}/photo.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("people-photos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error(t("common.error"));
      return;
    }
    const { data: pub } = supabase.storage.from("people-photos").getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;
    await db.from("people").update({ photo_url: url }).eq("id", person.id);
    setPerson({ ...person, photo_url: url });
    setUploading(false);
    toast.success(t("athlete.profile.photo.uploaded"));
  };

  const changeEmail = async () => {
    if (!newEmail) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("athlete.profile.changeEmail.sent", { email: newEmail }));
  };

  return (
    <TooltipProvider>
      <div className="max-w-2xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("athlete.profile.title")}</h1>

        {/* Photo */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xl font-semibold border border-border">
              {person?.photo_url ? (
                <img src={person.photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{getInitials(`${first} ${last}`) || "?"}</span>
              )}
            </div>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onPhoto}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Camera className="h-4 w-4 mr-2" />
              {uploading ? t("common.loading") : t("athlete.profile.photo.upload")}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">JPG/PNG · 5MB</p>
          </div>
        </div>

        {/* Editable */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{t("athlete.profile.field.firstName")}</Label>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div>
            <Label>{t("athlete.profile.field.lastName")}</Label>
            <Input value={last} onChange={(e) => setLast(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("athlete.profile.field.phone")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label>{t("athlete.profile.field.email")}</Label>
          <div className="flex gap-2">
            <Input value={email} disabled className="flex-1" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Input
              type="email"
              placeholder="novo@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={changeEmail} disabled={!newEmail}>
              {t("athlete.profile.changeEmail")}
            </Button>
          </div>
        </div>

        {/* Read-only */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1">
              {t("athlete.profile.field.cpf")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{t("athlete.profile.locked")}</TooltipContent>
              </Tooltip>
            </Label>
            <Input value={maskCpf(person?.cpf ?? null)} disabled />
          </div>
          <div>
            <Label className="flex items-center gap-1">
              {t("athlete.profile.field.birth")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{t("athlete.profile.locked")}</TooltipContent>
              </Tooltip>
            </Label>
            <Input value={maskBirth(person?.birth_date ?? null)} disabled />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving || !person}>
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

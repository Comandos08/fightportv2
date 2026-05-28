import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Definir nova senha — FightPort" },
      { name: "description", content: "Defina uma nova senha para sua conta FightPort." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const t = useT();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error(t("reset.weak"));
      return;
    }
    if (pwd !== confirm) {
      toast.error(t("reset.mismatch"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      toast.success(t("reset.success"));
      setTimeout(() => navigate({ to: "/cadastro" }), 1200);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center gap-2 font-semibold">
          <Shield className="size-5 fp-accent" /> FightPort
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("reset.title")}</h1>
        <div className="space-y-1.5">
          <Label htmlFor="np">{t("reset.new")}</Label>
          <Input id="np" type="password" minLength={8} required value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp">{t("reset.confirm")}</Label>
          <Input id="cp" type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("common.loading") : t("reset.submit")}
        </Button>
      </form>
    </div>
  );
}

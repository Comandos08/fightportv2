import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { FooterSection } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — FightPort" },
      { name: "description", content: "Entre em contato com a equipe FightPort. Envie sua dúvida, sugestão ou solicitação de suporte pelo formulário." },
      { property: "og:title", content: "Contato — FightPort" },
      { property: "og:description", content: "Fale com a equipe FightPort. Dúvidas, sugestões e suporte via formulário de contato." },
      { property: "og:url", content: "/contato" },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  const t = useT();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.functions.invoke("send-contact-email", { body: form });
      setSent(true);
      toast.success(t("contato.sent"));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 fp-container py-16 max-w-xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("sobre.back")}
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">{t("contato.title")}</h1>
        {sent ? (
          <p className="mt-8 rounded-xl border border-border bg-card p-6 text-sm">{t("contato.sent")}</p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5"><Label htmlFor="n">{t("contato.name")}</Label><Input id="n" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="e">{t("contato.email")}</Label><Input id="e" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="s">{t("contato.subject")}</Label><Input id="s" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="m">{t("contato.message")}</Label><Textarea id="m" rows={6} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <Button type="submit" disabled={loading}>{loading ? t("common.loading") : t("contato.send")}</Button>
          </form>
        )}
      </main>
      <FooterSection />
    </div>
  );
}

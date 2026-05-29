import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { getCurrentRole, targetForRole } from "@/lib/role";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Shield, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { MARTIAL_ARTS, COACH_GRADUATIONS } from "@/lib/belts";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastre sua organização — FightPort" },
      { name: "description", content: "Crie sua conta no FightPort e comece a emitir graduações verificáveis." },
      { property: "og:title", content: "Cadastre sua organização — FightPort" },
      { property: "og:description", content: "Cadastre sua academia ou federação no FightPort e comece a emitir graduações verificáveis." },
      { property: "og:url", content: "/cadastro" },
    ],
    links: [{ rel: "canonical", href: "/cadastro" }],
  }),
  validateSearch: (s: Record<string, unknown>): { tab?: string } => ({ tab: s.tab as string | undefined }),
  beforeLoad: async () => {
    const { userId, role } = await getCurrentRole();
    if (userId && role) throw redirect({ to: targetForRole(role) });
  },
  component: CadastroPage,
});

type Mode = "signup" | "login" | "forgot";

function CadastroPage() {
  const { tab } = Route.useSearch();
  const t = useT();
  const [mode, setMode] = useState<Mode>(tab === "entrar" ? "login" : "signup");
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <aside className="hidden md:flex flex-col justify-between p-12 text-white" style={{ background: "#1C1C1C" }}>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Shield className="size-5" style={{ color: "var(--fp-accent)" }} /> FightPort
        </Link>
        <div className="max-w-md">
          <div className="inline-flex rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70">
            SportCombat · Certificação esportiva
          </div>
          <h1 className="mt-6 font-bold tracking-tight" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            {t("cad.left.title")}
          </h1>
          <ul className="mt-8 space-y-3 text-white/85 text-sm">
            {[t("cad.left.b1"), t("cad.left.b2"), t("cad.left.b3"), t("cad.left.b4")].map((b) => (
              <li key={b} className="flex gap-2">
                <ArrowRight className="size-4 mt-0.5" style={{ color: "var(--fp-accent)" }} /> {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/50 max-w-sm">{t("cad.left.quote")}</p>
      </aside>

      <section className="flex flex-col px-6 py-10 sm:px-12 sm:py-14 bg-background">
        <div className="md:hidden mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold">
            <Shield className="size-5 fp-accent" /> FightPort
          </Link>
        </div>

        {sentEmail ? (
          <ConfirmSent email={sentEmail} onBack={() => { setSentEmail(null); setMode("login"); }} />
        ) : (
          <div className="w-full max-w-md mx-auto md:mx-0">
            <div className="flex gap-1 rounded-lg border border-border p-1 text-sm">
              <button
                onClick={() => setMode("signup")}
                className="flex-1 rounded-md px-3 py-1.5 transition-colors data-[a=true]:bg-foreground data-[a=true]:text-background"
                data-a={mode === "signup"}
              >
                {t("cad.tab.signup")}
              </button>
              <button
                onClick={() => setMode("login")}
                className="flex-1 rounded-md px-3 py-1.5 transition-colors data-[a=true]:bg-foreground data-[a=true]:text-background"
                data-a={mode !== "signup"}
              >
                {t("cad.tab.login")}
              </button>
            </div>

            <div key={mode} className="mt-8 animate-fadeup">
              {mode === "signup" && <SignupForm onSent={(e) => setSentEmail(e)} />}
              {mode === "login" && <LoginForm onForgot={() => setMode("forgot")} />}
              {mode === "forgot" && <ForgotForm onBack={() => setMode("login")} />}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ConfirmSent({ email, onBack }: { email: string; onBack: () => void }) {
  const t = useT();
  return (
    <div className="w-full max-w-md mx-auto md:mx-0 text-center md:text-left">
      <div className="inline-flex size-12 items-center justify-center rounded-full" style={{ background: "color-mix(in oklab, var(--fp-accent) 18%, transparent)" }}>
        <MailCheck className="size-6 fp-accent" />
      </div>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">{t("cad.confirm.title")}</h2>
      <p className="mt-2 text-muted-foreground">{t("cad.confirm.desc", { email })}</p>
      <Button className="mt-6" onClick={onBack}>{t("cad.confirm.cta")}</Button>
    </div>
  );
}

function SignupForm({ onSent }: { onSent: (email: string) => void }) {
  const t = useT();
  const [orgName, setOrgName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [martialArt, setMartialArt] = useState<string>("");
  const [coachGrad, setCoachGrad] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t("cad.signup.passwordHint"));
      return;
    }
    if (!martialArt || !coachGrad) {
      toast.error("Selecione modalidade e graduação.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/cadastro`,
          data: {
            school_name: orgName,
            coach_name: coachName,
            coach_graduation: coachGrad,
            martial_art: martialArt,
          },
        },
      });
      if (error) throw error;
      onSent(email);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t("cad.signup.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("cad.signup.subtitle")}</p>
      <div className="space-y-3 pt-2">
        <Field id="org" label={t("cad.signup.org")}>
          <Input id="org" required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field id="coach" label={t("cad.signup.coach")}>
            <Input id="coach" required value={coachName} onChange={(e) => setCoachName(e.target.value)} />
          </Field>
          <Field id="art" label={t("cad.signup.art")}>
            <Select value={martialArt} onValueChange={setMartialArt}>
              <SelectTrigger id="art"><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {MARTIAL_ARTS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field id="grad" label={t("cad.signup.grad")}>
          <Select value={coachGrad} onValueChange={setCoachGrad}>
            <SelectTrigger id="grad"><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>
              {COACH_GRADUATIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field id="email" label={t("cad.signup.email")}>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="pwd" label={t("cad.signup.password")} hint={t("cad.signup.passwordHint")}>
          <div className="relative">
            <Input id="pwd" type={showPwd ? "text" : "password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}>
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
      </div>
      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? t("common.loading") : t("cad.signup.submit")}
      </Button>
    </form>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { role } = await getCurrentRole();
      navigate({ to: targetForRole(role) });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t("cad.login.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("cad.login.subtitle")}</p>
      <div className="space-y-3 pt-2">
        <Field id="login-email" label={t("cad.login.email")}>
          <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="login-pwd" label={t("cad.login.password")}>
          <div className="relative">
            <Input id="login-pwd" type={showPwd ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onForgot} className="text-xs text-muted-foreground hover:text-foreground">
          {t("cad.login.forgot")}
        </button>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("common.loading") : t("cad.login.submit")}
      </Button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t("cad.forgot.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("cad.forgot.desc")}</p>
      <Field id="forgot-email" label={t("cad.login.email")}>
        <Input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {sent && <p className="text-sm fp-accent">{t("cad.forgot.sent")}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? t("common.loading") : t("cad.forgot.cta")}</Button>
        <Button type="button" variant="ghost" onClick={onBack}>{t("cad.forgot.back")}</Button>
      </div>
    </form>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

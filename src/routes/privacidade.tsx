import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { FooterSection } from "@/components/site/Footer";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade & LGPD — FightPort" },
      { name: "description", content: "Política de privacidade e tratamento de dados em conformidade com a LGPD." },
      { property: "og:title", content: "Privacidade & LGPD — FightPort" },
      { property: "og:description", content: "Saiba como o FightPort protege seus dados pessoais e respeita a LGPD." },
      { property: "og:url", content: "/privacidade" },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: PrivPage,
});

function PrivPage() {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 fp-container py-16 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("sobre.back")}
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">{t("priv.title")}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{t("priv.updated")}</p>
        <div className="mt-8 text-sm leading-relaxed text-muted-foreground space-y-4">
          <p>O FightPort coleta apenas os dados necessários para registrar graduações esportivas: nome, CPF, data de nascimento, organização vinculada e histórico de faixas.</p>
          <p>Dados pessoais sensíveis (CPF, data de nascimento, filiação) são acessíveis apenas pelo próprio atleta e pelas organizações às quais ele está vinculado. O passaporte público exibe apenas nome, FP-ID, organização e graduação.</p>
          <p>Em conformidade com a LGPD (Lei 13.709/2018), o titular pode solicitar acesso, correção, anonimização ou exclusão de seus dados a qualquer momento por meio do canal de contato.</p>
          <p>Não compartilhamos dados com terceiros para fins publicitários. Pagamentos são processados por parceiros (Mercado Pago, PayPal) sem que o FightPort armazene dados de cartão.</p>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}

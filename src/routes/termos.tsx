import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { FooterSection } from "@/components/site/Footer";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — FightPort" },
      { name: "description", content: "Leia os termos de uso da plataforma FightPort. Ao usar o sistema de certificação esportiva, você concorda com estas condições." },
      { property: "og:url", content: "/termos" },
    ],
    links: [{ rel: "canonical", href: "/termos" }],
  }),
  component: TermosPage,
});

function TermosPage() {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 fp-container py-16 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("sobre.back")}
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight">{t("termos.title")}</h1>
        <p className="mt-2 text-xs text-muted-foreground">{t("termos.updated")}</p>
        <div className="mt-8 prose prose-neutral dark:prose-invert text-muted-foreground space-y-4 text-sm leading-relaxed">
          <p>Estes termos regem o uso da plataforma FightPort, operada pela SportCombat. Ao criar uma conta, você concorda com as condições aqui descritas.</p>
          <p>O FightPort fornece um sistema de registro de graduações esportivas. Cada graduação registrada é vinculada à organização emissora e gera um certificado verificável publicamente.</p>
          <p>O atleta cadastrado tem direito ao acesso ao próprio passaporte digital e à carteirinha emitida pela organização. A organização é responsável pela veracidade das informações registradas.</p>
          <p>Créditos de graduação são adquiridos via compra única e não expiram. Em caso de descumprimento destes termos a conta pode ser suspensa.</p>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}

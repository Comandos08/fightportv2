import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { FooterSection } from "@/components/site/Footer";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — FightPort" },
      { name: "description", content: "Conheça o FightPort, a plataforma de certificação esportiva da SportCombat." },
      { property: "og:title", content: "Sobre — FightPort" },
      { property: "og:description", content: "Descubra como o FightPort transforma graduações em certificados verificáveis e imutáveis." },
      { property: "og:url", content: "/sobre" },
    ],
    links: [{ rel: "canonical", href: "/sobre" }],
  }),
  component: SobrePage,
});

function SobrePage() {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 fp-container py-16 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("sobre.back")}
        </Link>
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight">{t("sobre.title")}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t("sobre.body")}</p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("sobre.mission")}</p>
      </main>
      <FooterSection />
    </div>
  );
}

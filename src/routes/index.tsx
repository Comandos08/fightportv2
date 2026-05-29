import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { HeroSection } from "@/components/site/sections/HeroSection";
import { SocialProof } from "@/components/site/sections/SocialProof";
import { ProblemSection } from "@/components/site/sections/ProblemSection";
import { SolutionSection } from "@/components/site/sections/SolutionSection";
import { HowItWorks } from "@/components/site/sections/HowItWorks";
import { AthleteSearch } from "@/components/AthleteSearch";
import { PricingSection } from "@/components/site/sections/PricingSection";
import { TestimonialsSection } from "@/components/site/sections/TestimonialsSection";
import { CtaSection } from "@/components/site/sections/CtaSection";
import { FooterSection } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FightPort — Passaporte digital de graduações" },
      { name: "description", content: "Certificação esportiva imutável para academias e federações. Registre graduações, gere passaportes públicos verificáveis e carteirinhas digitais." },
      { property: "og:title", content: "FightPort — Passaporte digital de graduações" },
      { property: "og:description", content: "Cada faixa registrada vira um certificado verificável publicamente." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <SocialProof />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <AthleteSearch />
        <PricingSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <FooterSection />
    </div>
  );
}

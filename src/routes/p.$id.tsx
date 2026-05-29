import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Share2, QrCode, Download, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { BeltBadge } from "@/components/BeltBadge";
import { BELT_COLORS, getInitials } from "@/lib/belts";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { formatDateBR } from "@/lib/utils";

export const Route = createFileRoute("/p/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Passaporte ${params.id} | fightport.pro` },
      { name: "description", content: `Passaporte digital verificado de graduações no FightPort. ID ${params.id}.` },
      { property: "og:title", content: `Passaporte FightPort · ${params.id}` },
      { property: "og:url", content: `/p/${params.id}` },
      { property: "og:type", content: "profile" },
    ],
    links: [{ rel: "canonical", href: `/p/${params.id}` }],
  }),
  component: PassportPage,
});

type Person = { fp_id: string; full_name: string; photo_url: string | null };
type SchoolLink = { school_id: string; school_name: string; martial_art: string; current_belt: string };
type Achievement = {
  id: string;
  school_id: string;
  martial_art: string;
  belt: string;
  achievement_date: string;
  graduated_by: string | null;
  notes: string | null;
  hash: string | null;
  school_name?: string | null;
};

function PassportPage() {
  const { id } = useParams({ from: "/p/$id" });
  const t = useT();
  const [person, setPerson] = useState<Person | null>(null);
  const [links, setLinks] = useState<SchoolLink[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: p } = await db.from("people_public").select("fp_id, full_name, photo_url").eq("fp_id", id).maybeSingle();
        if (!p) {
          if (!cancelled) setPerson(null);
          return;
        }
        if (!cancelled) setPerson(p as Person);
        const { data: ps } = await db
          .from("person_schools_public")
          .select("school_id, school_name, martial_art, current_belt")
          .eq("fp_id", id);
        if (!cancelled) setLinks((ps ?? []) as SchoolLink[]);
        const { data: ach } = await db
          .from("achievements_public")
          .select("id, school_id, martial_art, belt, achievement_date, graduated_by, notes, hash, school_name")
          .eq("fp_id", id)
          .order("achievement_date", { ascending: false });
        if (!cancelled) setAchievements((ach ?? []) as Achievement[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("common.loading")}</div>;
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold">{t("pass.notFound.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("pass.notFound.desc")}</p>
          <Link to="/" className="mt-6 inline-block">
            <Button>{t("pass.notFound.cta")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const url = typeof window !== "undefined" ? window.location.href : `https://fightport.pro/p/${id}`;

  const personJsonLd = person
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Person",
        name: person.full_name,
        image: person.photo_url ?? undefined,
        url,
        memberOf: links.map((l) => ({
          "@type": "SportsActivityLocation",
          name: l.school_name,
          sport: l.martial_art,
        })),
        hasCredential: achievements.map((a) => ({
          "@type": "EducationalOccupationalCredential",
          credentialCategory: `Graduação ${a.belt} — ${a.martial_art}`,
          recognizedBy: {
            "@type": "Organization",
            name: a.school_name ?? links.find((l) => l.school_id === a.school_id)?.school_name ?? "FightPort",
          },
          dateCreated: a.achievement_date,
        })),
      })
    : null;

  function copyShare() {
    navigator.clipboard.writeText(url);
    toast.success(t("pass.shareCopied"));
  }

  function downloadCard() {
    const doc = new jsPDF({ format: [85.6, 53.98], unit: "mm", orientation: "landscape" });
    doc.setFillColor(28, 28, 28);
    doc.rect(0, 0, 85.6, 53.98, "F");
    doc.setTextColor(252, 211, 77);
    doc.setFontSize(7);
    doc.text("FIGHTPORT · SPORTCOMBAT", 4, 6);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(person!.full_name.toUpperCase(), 4, 14, { maxWidth: 60 });
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(`FP-ID ${id}`, 4, 22);
    let y = 28;
    links.slice(0, 3).forEach((l) => {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`${l.martial_art} · ${l.school_name}`, 4, y);
      doc.setTextColor(252, 211, 77);
      doc.text(`Faixa ${l.current_belt}`, 4, y + 3.5);
      y += 8;
    });
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 140);
    doc.text(`Verifique em fightport.pro/p/${id}`, 4, 50);
    doc.save(`fightport-${id}.pdf`);
  }

  // Group achievements by (school_id, martial_art)
  const groups = links.map((l) => ({
    link: l,
    items: achievements.filter((a) => a.school_id === l.school_id && a.martial_art === l.martial_art),
  }));

  return (
    <div className="min-h-screen bg-background">
      {personJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLd }}
        />
      )}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="fp-container h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Shield className="size-5 fp-accent" /> FightPort
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t("pass.verifyOther")}
          </Link>
        </div>
      </header>

      <main className="fp-container py-10 sm:py-14">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fp-accent)" }}>
          <CheckCircle2 className="size-4" /> {t("pass.verified")}
        </div>

        <div className="mt-6 flex items-start gap-5">
          <div
            className="size-20 rounded-full flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden"
            style={{ background: "var(--color-bg-soft)" }}
          >
            {person.photo_url ? (
              <img src={person.photo_url} alt={person.full_name} className="size-full object-cover" />
            ) : (
              getInitials(person.full_name)
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold tracking-tight" style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              {person.full_name}
            </h1>
            <div className="mt-3 inline-flex rounded-lg px-3 py-1.5 font-mono text-xs" style={{ background: "var(--color-bg-soft)" }}>
              {id}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyShare} className="gap-2">
            <Share2 className="size-4" /> {t("pass.share")}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <QrCode className="size-4" /> {t("pass.qr")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{t("pass.qr.title")}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-4">
                <QRCodeSVG value={url} size={192} />
              </div>
              <div className="text-center font-mono text-xs text-muted-foreground">{id}</div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={downloadCard} className="gap-2">
            <Download className="size-4" /> {t("pass.download")}
          </Button>
        </div>

        <div className="mt-12 space-y-12">
          {groups.length === 0 && (
            <p className="text-muted-foreground">{t("pass.empty")}</p>
          )}
          {groups.map(({ link, items }) => (
            <section key={`${link.school_id}-${link.martial_art}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{link.school_name}</h2>
                  <div className="text-sm text-muted-foreground">{link.martial_art}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("pass.currentBelt")}</div>
                  <div className="mt-1"><BeltBadge belt={link.current_belt} /></div>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">{t("pass.empty")}</p>
              ) : (
                <ol className="mt-6 relative border-l border-border pl-6 space-y-7">
                  {items.map((a, i) => (
                    <li key={a.id} className="relative">
                      <span
                        className="absolute -left-[29px] top-1 size-3 rounded-full ring-4 ring-background"
                        style={{ background: BELT_COLORS[a.belt] ?? "var(--belt-white)" }}
                      />
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <time>{formatDateBR(a.achievement_date)}</time>
                        <BeltBadge belt={a.belt} size="sm" />
                        {i === 0 && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider" style={{ background: "color-mix(in oklab, var(--fp-accent) 20%, transparent)", color: "var(--fp-accent)" }}>
                            {t("pass.mostRecent")}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-sm">
                        {a.school_name ?? link.school_name}
                        {a.graduated_by && <> · {t("pass.gradBy")} <span className="font-medium">{a.graduated_by}</span></>}
                      </div>
                      {a.hash && (
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {a.hash.slice(0, 8)}…{a.hash.slice(-8)}
                        </div>
                      )}
                      {a.notes && <p className="mt-1 text-xs italic text-muted-foreground">{a.notes}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
          {t("pass.footer", { school: links[0]?.school_name ?? "—" })}
        </footer>
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { BeltBadge } from "@/components/BeltBadge";
import { getInitials } from "@/lib/belts";

export const Route = createFileRoute("/minha-conta/carteirinha")({
  component: CardPage,
});

type Link = {
  id: string;
  school_id: string;
  school_name: string;
  martial_art: string;
  current_belt: string;
};
type Person = { id: string; fp_id: string; first_name: string; last_name: string; photo_url: string | null };

function CardPage() {
  const t = useT();
  const { user } = useSession();
  const [person, setPerson] = useState<Person | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await db
        .from("people")
        .select("id, fp_id, first_name, last_name, photo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!p) return;
      setPerson(p as Person);
      const { data: ls } = await db
        .from("person_schools")
        .select("id, school_id, martial_art, current_belt, schools:school_id ( name )")
        .eq("person_id", p.id);
      const mapped: Link[] = (ls ?? []).map((r: any) => ({
        id: r.id,
        school_id: r.school_id,
        school_name: r.schools?.name ?? "",
        martial_art: r.martial_art,
        current_belt: r.current_belt,
      }));
      setLinks(mapped);
      if (mapped[0]) setSelected(mapped[0].id);
    })();
  }, [user]);

  const link = useMemo(() => links.find((l) => l.id === selected) ?? null, [links, selected]);
  const fullName = person ? `${person.first_name} ${person.last_name}`.trim() : "";
  const issuedOn = new Date().toLocaleDateString("pt-BR");
  const passportUrl = person ? `https://fightport.pro/p/${person.fp_id}` : "";

  const download = async () => {
    if (!person || !link) return;
    setDownloading(true);
    try {
      // Try edge function; fall back to local data if unavailable.
      try {
        await supabase.functions.invoke("generate-card", {
          body: { person_id: person.id, person_school_id: link.id },
        });
      } catch {
        /* ignore */
      }

      // A6 landscape: 148 x 105 mm
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a6" });
      const W = 148;
      const H = 105;

      // Background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, W, H, "F");

      // Header bar
      pdf.setFillColor(13, 13, 13);
      pdf.rect(0, 0, W, 14, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("FIGHTPORT", 8, 9);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("PASSAPORTE DE GRADUAÇÕES", W - 8, 9, { align: "right" });

      // Photo (circular clip)
      const photoX = 10;
      const photoY = 22;
      const photoSize = 32; // mm
      if (person.photo_url) {
        try {
          const img = await loadImage(person.photo_url);
          const canvas = document.createElement("canvas");
          const px = 240;
          canvas.width = px;
          canvas.height = px;
          const ctx = canvas.getContext("2d")!;
          ctx.beginPath();
          ctx.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          const ratio = Math.max(px / img.width, px / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          ctx.drawImage(img, (px - w) / 2, (px - h) / 2, w, h);
          const dataUrl = canvas.toDataURL("image/png");
          pdf.addImage(dataUrl, "PNG", photoX, photoY, photoSize, photoSize);
        } catch {
          drawAvatarFallback(pdf, photoX, photoY, photoSize, fullName);
        }
      } else {
        drawAvatarFallback(pdf, photoX, photoY, photoSize, fullName);
      }

      // Info column
      const infoX = photoX + photoSize + 8;
      pdf.setTextColor(13, 13, 13);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(fullName, infoX, 28);

      pdf.setFont("courier", "normal");
      pdf.setFontSize(10);
      pdf.text(person.fp_id, infoX, 36);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(link.martial_art, infoX, 44);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Faixa ${link.current_belt}`, infoX, 50);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(link.school_name, infoX, 57);

      // QR code (rendered via canvas from a temporary SVG -> PNG)
      const qrPng = await renderQrPng(passportUrl, 240);
      const qrSize = 26;
      pdf.addImage(qrPng, "PNG", W - qrSize - 8, H - qrSize - 12, qrSize, qrSize);

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);
      pdf.text(t("athlete.card.issuedOn", { date: issuedOn }), 8, H - 6);
      pdf.text("fightport.pro", W - 8, H - 6, { align: "right" });

      pdf.save(`fightport-carteirinha-${person.fp_id}.pdf`);
    } catch (e) {
      toast.error(t("common.error"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("athlete.card.title")}</h1>

      {links.length === 0 ? (
        <p className="text-muted-foreground">{t("athlete.card.empty")}</p>
      ) : (
        <>
          {links.length > 1 && (
            <div className="max-w-sm">
              <Label>{t("athlete.card.selectModality")}</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {links.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.school_name} · {l.martial_art}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Card preview */}
          {link && person && (
            <div
              className="rounded-xl border border-border bg-white text-[#0d0d0d] shadow-sm overflow-hidden"
              style={{ aspectRatio: "1.414 / 1", maxWidth: 520 }}
            >
              <div className="bg-[#0d0d0d] text-white flex items-center justify-between px-4 py-2">
                <span className="font-bold tracking-wide text-sm">FIGHTPORT</span>
                <span className="text-[10px] tracking-widest opacity-80">PASSAPORTE DE GRADUAÇÕES</span>
              </div>
              <div className="p-4 flex gap-4 h-[calc(100%-32px)]">
                <div className="h-[60px] w-[60px] sm:h-[80px] sm:w-[80px] rounded-full overflow-hidden bg-muted flex items-center justify-center text-sm font-bold shrink-0 border border-border">
                  {person.photo_url ? (
                    <img src={person.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[#0d0d0d]">{getInitials(fullName)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base sm:text-lg truncate">{fullName}</div>
                  <div className="font-mono text-xs sm:text-sm">{person.fp_id}</div>
                  <div className="text-xs sm:text-sm mt-1">{link.martial_art}</div>
                  <div className="mt-1">
                    <BeltBadge belt={link.current_belt} size="sm" />
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{link.school_name}</div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div />
                  <div className="bg-white p-1 rounded">
                    <QRCodeSVG value={passportUrl} size={64} />
                  </div>
                </div>
              </div>
              <div className="px-4 pb-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{t("athlete.card.issuedOn", { date: issuedOn })}</span>
                <span>fightport.pro</span>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">{t("athlete.card.instruction")}</p>

          <Button onClick={download} disabled={downloading || !link}>
            {downloading ? t("common.loading") : t("athlete.card.download")}
          </Button>
        </>
      )}
    </div>
  );
}

function drawAvatarFallback(pdf: jsPDF, x: number, y: number, size: number, name: string) {
  pdf.setFillColor(230, 230, 230);
  pdf.circle(x + size / 2, y + size / 2, size / 2, "F");
  pdf.setTextColor(80, 80, 80);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(getInitials(name) || "?", x + size / 2, y + size / 2 + 2, { align: "center" });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function renderQrPng(value: string, size: number): Promise<string> {
  const QR = await import("qrcode");
  return await QR.toDataURL(value, { width: size, margin: 1 });
}

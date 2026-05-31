import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { BELT_COLORS } from "@/lib/belts";
import { BeltBadge } from "@/components/BeltBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { notify } from "@/lib/notifications";
import { formatDateBR } from "@/lib/utils";

const BASIC = ["Branca", "Cinza", "Amarela", "Laranja", "Verde", "Azul", "Roxa", "Marrom"];
const BLACK = ["Preta", "Coral", "Vermelha"];

export const Route = createFileRoute("/painel/conquistas/nova")({
  validateSearch: (s: Record<string, unknown>) => ({ person: (s.person as string) ?? "" }),
  component: NewAchPage,
});

function NewAchPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useSession();
  const schoolId = user?.id;
  const { person: personParam } = Route.useSearch();

  const [search, setSearch] = useState("");
  const [personId, setPersonId] = useState(personParam || "");
  const [martialArt, setMartialArt] = useState("");
  const [belt, setBelt] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [gradBy, setGradBy] = useState("");
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [success, setSuccess] = useState<{ hash: string; fp_id: string } | null>(null);
  const [suggestionModel, setSuggestionModel] = useState<string | null>(null);

  const { data: balance = 0 } = useQuery({
    queryKey: ["bal", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db.from("credits").select("balance").eq("school_id", schoolId).maybeSingle();
      return Number(res.data?.balance ?? 0);
    },
  });

  const { data: coach } = useQuery({
    queryKey: ["coach", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db.from("head_coaches").select("name").eq("school_id", schoolId).maybeSingle();
      return res.data;
    },
  });

  useEffect(() => {
    if (coach?.name && !gradBy) setGradBy(`Prof. ${coach.name}`);
  }, [coach, gradBy]);

  const { data: candidates = [] } = useQuery({
    queryKey: ["ath-search", schoolId, search],
    enabled: !!schoolId && search.length >= 3,
    queryFn: async () => {
      const res = await db
        .from("person_schools")
        .select("person_id, martial_art, people:person_id ( first_name, last_name, fp_id )")
        .eq("school_id", schoolId);
      return (res.data ?? []).filter((r: any) =>
        `${r.people?.first_name ?? ""} ${r.people?.last_name ?? ""}`.toLowerCase().includes(search.toLowerCase()),
      );
    },
  });

  const { data: athleteModalities = [] } = useQuery({
    queryKey: ["mods", personId, schoolId],
    enabled: !!personId && !!schoolId,
    queryFn: async () => {
      const res = await db
        .from("person_schools")
        .select("martial_art")
        .eq("person_id", personId)
        .eq("school_id", schoolId);
      return (res.data ?? []).map((r: any) => r.martial_art);
    },
  });

  useEffect(() => {
    if (athleteModalities.length === 1) setMartialArt(athleteModalities[0]);
  }, [athleteModalities]);

  useEffect(() => {
    if (!personId || !schoolId || !martialArt) return;
    (async () => {
      try {
        const res = await db.rpc("get_next_belt_suggestion", {
          p_person_id: personId,
          p_school_id: schoolId,
          p_martial_art: martialArt,
        });
        if (res.data?.belt) {
          setBelt(res.data.belt);
          setSuggestionModel(res.data.model_name ?? null);
        }
      } catch {
        // optional
      }
    })();
  }, [personId, schoolId, martialArt]);

  const selectedPerson = useMemo(
    () => candidates.find((c: any) => c.person_id === personId),
    [candidates, personId],
  );

  const submit = async () => {
    if (!schoolId || !personId || !martialArt || !belt) {
      toast.error(t("common.required"));
      return;
    }
    try {
      const school = await db.from("schools").select("name").eq("id", schoolId).maybeSingle();
      const person = await db.from("people").select("fp_id").eq("id", personId).maybeSingle();
      const fp_id = person.data?.fp_id;
      const hashRes = await db.rpc("generate_achievement_hash", {
        p_fp_id: fp_id,
        p_belt: belt,
        p_date: date,
        p_school_name: school.data?.name,
        p_graduated_by: gradBy,
      });
      const ins = await db
        .from("achievements")
        .insert({
          person_id: personId,
          school_id: schoolId,
          martial_art: martialArt,
          belt,
          achieved_at: date,
          graduated_by: gradBy,
          notes: notes || null,
          verification_hash: hashRes.data,
        })
        .select("verification_hash")
        .single();
      if (ins.error) throw ins.error;

      await db.from("school_audit_log").insert({
        school_id: schoolId,
        action: "achievement_created",
        target_person_id: personId,
      });

      // notify athlete
      const acct = await db
        .from("athlete_accounts")
        .select("user_id")
        .eq("person_id", personId)
        .maybeSingle();
      if (acct.data?.user_id) {
        await notify({
          user_id: acct.data.user_id,
          type: "graduation_registered",
          title: "Nova graduação registrada",
          body: `${belt} — ${formatDateBR(date)}`,
          link: `/p/${fp_id}`,
        });
      }

      setSuccess({ hash: ins.data.verification_hash, fp_id });
      setConfirm(false);
    } catch (err: any) {
      toast.error(err?.message ?? t("common.error"));
    }
  };

  if (success) {
    return (
      <>
        <Topbar title={t("ach.title")} subtitle="Registrar graduação de atleta" />
        <div className="p-5 px-6 flex-1">
        <div className="max-w-xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <h1 className="text-2xl font-bold">{t("ach.success.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("ach.success.hash")}</p>
          <div className="mt-3 p-3 bg-muted rounded font-mono text-xs break-all">{success.hash}</div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              navigator.clipboard.writeText(success.hash);
              toast.success(t("ach.success.copied"));
            }}
          >
            <Copy className="h-4 w-4 mr-1" /> {t("ach.success.copy")}
          </Button>
          <div className="mt-6 flex gap-2 justify-center">
            <Link to="/p/$id" params={{ id: success.fp_id }}>
              <Button variant="outline">{t("ach.success.viewPass")}</Button>
            </Link>
            <Button
              onClick={() => {
                setSuccess(null);
                setPersonId("");
                setSearch("");
                setBelt("");
              }}
            >
              {t("ach.success.another")}
            </Button>
          </div>
        </div>
        </div>
        </div>
        </>
    );
  }

  if (balance === 0) {
    return (
      <>
        <Topbar title={t("ach.title")} subtitle="Registrar graduação de atleta" />
        <div className="p-5 px-6 flex-1">
          <div className="max-w-xl">
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-center">
              <p className="mb-4">{t("ach.banner.zero")}</p>
              <Link to="/painel/creditos">
                <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                  {t("dash.credits.buyMore")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <Topbar title={t("ach.title")} subtitle="Registrar graduação de atleta" />
    <div className="max-w-4xl space-y-6 p-5 px-6">
      <div className="rounded-md bg-muted/60 border border-border px-4 py-3 text-sm">
        {t("ach.banner.balance", { n: balance })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirm(true);
          }}
          className="space-y-4"
        >
          <div>
            <Label>{t("ach.field.athlete")}</Label>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPersonId("");
              }}
              placeholder={t("ach.field.athlete.ph")}
            />
            {search.length >= 3 && candidates.length > 0 && !personId && (
              <div className="mt-1 border border-border rounded bg-popover max-h-48 overflow-y-auto">
                {candidates.slice(0, 8).map((c: any) => (
                  <button
                    key={c.person_id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setPersonId(c.person_id);
                      setSearch(`${c.people.first_name} ${c.people.last_name}`);
                    }}
                  >
                    {c.people.first_name} {c.people.last_name}{" "}
                    <span className="text-xs text-muted-foreground font-mono">{c.people.fp_id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {personId && athleteModalities.length > 0 && (
            <div>
              <Label>{t("ach.field.modality")}</Label>
              <Select value={martialArt} onValueChange={setMartialArt}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {athleteModalities.map((m: string) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {suggestionModel && (
            <div className="text-xs text-muted-foreground italic">
              {t("ach.suggestion", { model: suggestionModel })}
            </div>
          )}

          <div>
            <Label>{t("ach.field.belt")}</Label>
            <Select value={belt} onValueChange={setBelt}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("ach.field.belt.basic")}</SelectLabel>
                  {BASIC.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>{t("ach.field.belt.black")}</SelectLabel>
                  {BLACK.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("ach.field.date")}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <Label>{t("ach.field.gradBy")}</Label>
            <Input value={gradBy} onChange={(e) => setGradBy(e.target.value)} />
          </div>

          <div>
            <Label>{t("ach.field.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <Button type="submit" disabled={!personId || !belt}>
            {t("common.confirm")}
          </Button>
        </form>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">{t("ach.preview.title")}</h2>
          {!personId || !belt ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="space-y-3">
              <div className="text-lg font-bold">{selectedPerson ? `${selectedPerson.people.first_name} ${selectedPerson.people.last_name}` : search}</div>
              <BeltBadge belt={belt} />
              <div className="text-xs text-muted-foreground">{formatDateBR(date)} · {gradBy}</div>
              <div className="h-2 w-full rounded" style={{ backgroundColor: BELT_COLORS[belt] }} />
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ach.confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("ach.confirm.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>{t("common.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { BeltBadge } from "@/components/BeltBadge";

export const Route = createFileRoute("/minha-conta/graduacoes")({
  component: GraduationsPage,
});

type Ach = {
  id: string;
  person_id: string;
  school_id: string;
  school_name: string | null;
  martial_art: string;
  belt: string;
  achievement_date: string;
  graduated_by: string | null;
  hash: string | null;
};

function GraduationsPage() {
  const t = useT();
  const { user } = useSession();
  const [fpId, setFpId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Record<string, Ach[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: person } = await db
        .from("people")
        .select("id, fp_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!person) {
        setLoading(false);
        return;
      }
      setFpId(person.fp_id);
      const { data } = await db
        .from("achievements_public")
        .select("*")
        .eq("person_id", person.id)
        .order("achievement_date", { ascending: false });
      const list = (data ?? []) as Ach[];
      const g: Record<string, Ach[]> = {};
      for (const a of list) {
        const key = `${a.school_name ?? a.school_id} · ${a.martial_art}`;
        (g[key] ??= []).push(a);
      }
      setGroups(g);
      setLoading(false);
    })();
  }, [user]);

  const copyHash = async (h: string) => {
    await navigator.clipboard.writeText(h);
    toast.success(t("athlete.grad.hashCopied"));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const shortHash = (h: string | null) => (h ? `${h.slice(0, 8)}…${h.slice(-8)}` : "—");

  const keys = Object.keys(groups);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("athlete.grad.title")}</h1>
        {fpId && (
          <Link to="/p/$id" params={{ id: fpId }} className="text-sm font-medium underline-offset-4 hover:underline">
            {t("athlete.grad.viewPassport")}
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : keys.length === 0 ? (
        <p className="text-muted-foreground">{t("athlete.grad.empty")}</p>
      ) : (
        <div className="space-y-8">
          {keys.map((k) => (
            <div key={k} className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <h2 className="font-semibold">{k}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">{t("athlete.grad.col.date")}</th>
                      <th className="px-4 py-2">{t("athlete.grad.col.belt")}</th>
                      <th className="px-4 py-2">{t("athlete.grad.col.by")}</th>
                      <th className="px-4 py-2">{t("athlete.grad.col.hash")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups[k].map((a) => (
                      <tr key={a.id} className="border-t border-border">
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(a.achievement_date)}</td>
                        <td className="px-4 py-3"><BeltBadge belt={a.belt} size="sm" /></td>
                        <td className="px-4 py-3">{a.graduated_by ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span>{shortHash(a.hash)}</span>
                            {a.hash && (
                              <button
                                onClick={() => copyHash(a.hash!)}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={t("athlete.grad.copyHash")}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

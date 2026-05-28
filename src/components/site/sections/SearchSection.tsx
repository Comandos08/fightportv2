import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useState } from "react";
import { db } from "@/lib/db";
import { BeltBadge } from "@/components/BeltBadge";

type Row = {
  fp_id: string;
  full_name: string;
  school_name: string | null;
  martial_art: string | null;
  current_belt: string | null;
};

const PAGE_SIZE = 8;

export function SearchSection() {
  const t = useT();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setPage(0);
    try {
      const term = `%${q.trim()}%`;
      // Try the public search view first; fall back to people_public + person_schools.
      const { data, error } = await db
        .from("people_public")
        .select("fp_id, full_name")
        .or(`full_name.ilike.${term},fp_id.ilike.${term}`)
        .limit(200);
      if (error) throw error;
      const people = (data ?? []) as Array<{ fp_id: string; full_name: string }>;
      const ids = people.map((p) => p.fp_id);
      let merged: Row[] = people.map((p) => ({
        fp_id: p.fp_id,
        full_name: p.full_name,
        school_name: null,
        martial_art: null,
        current_belt: null,
      }));
      if (ids.length) {
        const { data: links } = await db
          .from("person_schools_public")
          .select("fp_id, school_name, martial_art, current_belt")
          .in("fp_id", ids);
        const linkRows = (links ?? []) as Array<{ fp_id: string; school_name: string | null; martial_art: string | null; current_belt: string | null }>;
        if (linkRows.length) {
          merged = linkRows.map((l) => ({
            fp_id: l.fp_id,
            full_name: people.find((p) => p.fp_id === l.fp_id)?.full_name ?? l.fp_id,
            school_name: l.school_name,
            martial_art: l.martial_art,
            current_belt: l.current_belt,
          }));
        }
      }
      setRows(merged);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const paged = rows ? rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : [];
  const pages = rows ? Math.max(1, Math.ceil(rows.length / PAGE_SIZE)) : 0;

  return (
    <section id="busca" className="py-20 sm:py-28 bg-[var(--color-bg-soft)]/50 border-y border-border">
      <div className="fp-container">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("search.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("search.subtitle")}</p>
        <form onSubmit={runSearch} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder")}
              className="pl-9 h-11"
            />
          </div>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? t("common.loading") : t("search.button")}
          </Button>
        </form>

        {rows && (
          <div className="mt-8">
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-border bg-background p-10 text-center">
                <h3 className="text-lg font-semibold">{t("search.empty.title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t("search.empty.desc")}</p>
                <Link to="/cadastro" className="mt-5 inline-block">
                  <Button>{t("search.empty.cta")}</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-bg-soft)]/70 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">{t("search.col.athlete")}</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">{t("search.col.id")}</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">{t("search.col.org")}</th>
                      <th className="text-left px-4 py-3">{t("search.col.belt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r, i) => (
                      <tr key={`${r.fp_id}-${i}`} className="border-t border-border hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <Link to="/p/$id" params={{ id: r.fp_id }} className="font-medium hover:underline">
                            {r.full_name}
                          </Link>
                          {r.martial_art && <div className="text-xs text-muted-foreground">{r.martial_art}</div>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs hidden sm:table-cell">{r.fp_id}</td>
                        <td className="px-4 py-3 hidden md:table-cell">{r.school_name ?? "—"}</td>
                        <td className="px-4 py-3">
                          {r.current_belt ? <BeltBadge belt={r.current_belt} size="sm" /> : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs">
                    <span className="text-muted-foreground">{rows.length} resultados</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                      <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

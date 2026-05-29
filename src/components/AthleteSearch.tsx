import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { db } from "@/lib/db";
import { BELT_COLORS } from "@/lib/belts";
import { getBeltLabel } from "@/lib/beltLabels";
import { useLocale } from "@/lib/i18n";

type Row = {
  fp_id: string;
  full_name: string;
  organization: string | null;
  modality: string | null;
  current_belt: string | null;
  photo_url: string | null;
};

type Facets = {
  modalities: string[];
  belts: { modality: string; belt: string }[];
  organizations: { name: string; count: number }[];
};

const PAGE_SIZE = 20;

export function AthleteSearch() {
  const navigate = useNavigate();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState("");
  const [belt, setBelt] = useState("");
  const [org, setOrg] = useState("");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState<Facets>({ modalities: [], belts: [], organizations: [] });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    db.rpc("search_facets_public").then(({ data }) => {
      if (data) setFacets(data as Facets);
    });
    runSearch("", "", "", "", 0);
  }, []);

  function runSearch(q: string, mod: string, b: string, o: string, off: number) {
    setLoading(true);
    db.rpc("search_athletes_public", {
      p_query: q || null,
      p_modality: mod || null,
      p_belt: b || null,
      p_org: o || null,
      p_limit: PAGE_SIZE,
      p_offset: off,
    })
      .then(({ data, error }) => {
        if (error) console.error("[AthleteSearch] RPC error:", error);
        setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error("[AthleteSearch] fetch error:", e);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }

  function handleQuery(v: string) {
    setQuery(v);
    setOffset(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v, modality, belt, org, 0), 350);
  }

  function handleModality(v: string) {
    setModality(v);
    setBelt("");
    setOffset(0);
    clearTimeout(debounceRef.current);
    runSearch(query, v, "", org, 0);
  }

  function handleBelt(v: string) {
    setBelt(v);
    setOffset(0);
    clearTimeout(debounceRef.current);
    runSearch(query, modality, v, org, 0);
  }

  function handleOrg(v: string) {
    setOrg(v);
    setOffset(0);
    clearTimeout(debounceRef.current);
    runSearch(query, modality, belt, v, 0);
  }

  function handlePage(newOff: number) {
    setOffset(newOff);
    clearTimeout(debounceRef.current);
    runSearch(query, modality, belt, org, newOff);
    document.getElementById("busca")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const beltsForModality = modality
    ? facets.belts.filter((b) => b.modality === modality).map((b) => b.belt)
    : [...new Set(facets.belts.map((b) => b.belt))];

  const hasPrev = offset > 0;
  const hasNext = rows.length === PAGE_SIZE;

  return (
    <section id="busca" className="py-20 sm:py-28 border-y border-border bg-muted/20">
      <div className="fp-container">
        <div className="text-center mb-8">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'DM Sans', var(--font-sans)" }}
          >
            Busca de Atletas
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Pesquise por nome, FP-ID ou organização
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder="Nome ou FP-ID..."
            className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
          <select
            value={modality}
            onChange={(e) => handleModality(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
          >
            <option value="">Modalidade</option>
            {facets.modalities.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={belt}
            onChange={(e) => handleBelt(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
          >
            <option value="">Graduação</option>
            {beltsForModality.map((b) => (
              <option key={b} value={b}>{getBeltLabel(b, locale)}</option>
            ))}
          </select>
          <select
            value={org}
            onChange={(e) => handleOrg(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
          >
            <option value="">Organização</option>
            {facets.organizations.map((o) => (
              <option key={o.name} value={o.name}>{o.name}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <SearchSkeleton />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-background p-10 text-center">
            <p className="font-semibold">Nenhum atleta encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente outros termos ou ajuste os filtros.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-background">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Atleta</th>
                    <th className="text-left px-4 py-3">FP-ID</th>
                    <th className="text-left px-4 py-3">Organização</th>
                    <th className="text-left px-4 py-3">Modalidade</th>
                    <th className="text-left px-4 py-3">Graduação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.fp_id}
                      className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() =>
                        navigate({ to: "/p/$id", params: { id: r.fp_id } })
                      }
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          to="/p/$id"
                          params={{ id: r.fp_id }}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {r.full_name}
                        </Link>
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-muted-foreground"
                        style={{ fontFamily: "'Space Mono', var(--font-mono)" }}
                      >
                        {r.fp_id}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.organization ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.modality ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <BeltDot belt={r.current_belt} locale={locale} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {rows.map((r) => (
                <Link
                  key={r.fp_id}
                  to="/p/$id"
                  params={{ id: r.fp_id }}
                  className="block rounded-xl border border-border bg-background p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold leading-tight">{r.full_name}</span>
                    <BeltDot belt={r.current_belt} locale={locale} />
                  </div>
                  <div
                    className="mt-1 text-xs text-muted-foreground"
                    style={{ fontFamily: "'Space Mono', var(--font-mono)" }}
                  >
                    {r.fp_id}
                  </div>
                  {(r.organization || r.modality) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[r.organization, r.modality].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {(hasPrev || hasNext) && (
              <div className="flex items-center justify-between mt-4">
                <button
                  disabled={!hasPrev}
                  onClick={() => handlePage(Math.max(0, offset - PAGE_SIZE))}
                  className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted/40 disabled:opacity-40 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-muted-foreground">
                  Página {Math.floor(offset / PAGE_SIZE) + 1}
                </span>
                <button
                  disabled={!hasNext}
                  onClick={() => handlePage(offset + PAGE_SIZE)}
                  className="px-4 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted/40 disabled:opacity-40 transition-colors"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function BeltDot({ belt, locale }: { belt: string | null; locale: string }) {
  if (!belt) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-black/10 flex-shrink-0"
        style={{ background: BELT_COLORS[belt] ?? "#aaa" }}
      />
      <span className="text-muted-foreground">{getBeltLabel(belt, locale)}</span>
    </span>
  );
}

function SearchSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-t border-border first:border-0"
        >
          <div className="h-4 bg-muted rounded w-36" />
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-28" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-2.5 w-2.5 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

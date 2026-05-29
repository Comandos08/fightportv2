import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { db } from "@/lib/db";
import { beltRank } from "@/lib/belts";
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

// fp_id removed — stacked in the Atleta cell, no longer a standalone sort column
type SortCol = "full_name" | "modality" | "current_belt" | "organization";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;
// Fetch enough rows for client-side sort; a value of 500 covers all realistic search results.
const FETCH_LIMIT = 500;

export function AthleteSearch() {
  const navigate = useNavigate();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [modality, setModality] = useState("");
  const [belt, setBelt] = useState("");
  const [org, setOrg] = useState("");
  const [offset, setOffset] = useState(0);
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState<Facets>({ modalities: [], belts: [], organizations: [] });
  const [sortCol, setSortCol] = useState<SortCol | null>("current_belt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    db.rpc("search_facets_public").then(({ data }) => {
      if (data) setFacets(data as Facets);
    });
    runSearch("", "", "", "");
  }, []);

  function runSearch(q: string, mod: string, b: string, o: string) {
    setLoading(true);
    db.rpc("search_athletes_public", {
      p_query: q || null,
      p_modality: mod || null,
      p_belt: b || null,
      p_org: o || null,
      p_limit: FETCH_LIMIT,
      p_offset: 0,
    })
      .then(({ data, error }) => {
        if (error) console.error("[AthleteSearch] RPC error:", error);
        setAllRows(Array.isArray(data) ? data : []);
        setOffset(0);
      })
      .catch((e) => {
        console.error("[AthleteSearch] fetch error:", e);
        setAllRows([]);
      })
      .finally(() => setLoading(false));
  }

  function handleQuery(v: string) {
    setQuery(v);
    setOffset(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(v, modality, belt, org), 350);
  }

  function handleModality(v: string) {
    setModality(v);
    setBelt("");
    setOffset(0);
    clearTimeout(debounceRef.current);
    runSearch(query, v, "", org);
  }

  function handleBelt(v: string) {
    setBelt(v);
    setOffset(0);
    clearTimeout(debounceRef.current);
    runSearch(query, modality, v, org);
  }

  function handleOrg(v: string) {
    setOrg(v);
    setOffset(0);
    clearTimeout(debounceRef.current);
    runSearch(query, modality, belt, v);
  }

  function handlePage(newOff: number) {
    setOffset(newOff);
    document.getElementById("busca")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setOffset(0);
  }

  // Sort the full result set client-side; paginate the sorted slice.
  const sortedRows = useMemo(() => {
    if (!sortCol) return allRows;
    return [...allRows].sort((a, b) => {
      if (sortCol === "current_belt") {
        // Null/empty belts always pin to the bottom, regardless of direction.
        const aNull = !a.current_belt;
        const bNull = !b.current_belt;
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;
        // asc = highest rank first; desc = lowest rank first.
        const diff = beltRank(b.current_belt) - beltRank(a.current_belt);
        return sortDir === "asc" ? diff : -diff;
      }
      const cmp = (a[sortCol] ?? "").localeCompare(b[sortCol] ?? "", undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allRows, sortCol, sortDir]);

  const pageRows = sortedRows.slice(offset, offset + PAGE_SIZE);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < sortedRows.length;

  const beltsForModality = modality
    ? facets.belts.filter((b) => b.modality === modality).map((b) => b.belt)
    : [...new Set(facets.belts.map((b) => b.belt))];

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

        {/* Filters — order: search · Modalidade · Graduação · Organização */}
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
        ) : sortedRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-background p-10 text-center">
            <p className="font-semibold">Nenhum atleta encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente outros termos ou ajuste os filtros.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table — FP-ID stacked under name; columns: Atleta · Organização · Modalidade · Graduação */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-border bg-background">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <SortTh col="full_name" label="Atleta" sortCol={sortCol} dir={sortDir} onSort={handleSort} />
                    <SortTh col="organization" label="Organização" sortCol={sortCol} dir={sortDir} onSort={handleSort} />
                    <SortTh col="modality" label="Modalidade" sortCol={sortCol} dir={sortDir} onSort={handleSort} />
                    <SortTh col="current_belt" label="Graduação" sortCol={sortCol} dir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr
                      key={r.fp_id}
                      className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate({ to: "/p/$id", params: { id: r.fp_id } })}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/p/$id"
                          params={{ id: r.fp_id }}
                          className="hover:underline block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="font-medium text-[15px] tracking-[-0.01em] truncate">{r.full_name}</div>
                          <div className="font-['Space_Mono',monospace] text-xs text-[#8f8e86]">{r.fp_id}</div>
                        </Link>
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
              {pageRows.map((r) => (
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
                  {sortedRows.length > 0 && ` · ${sortedRows.length} resultados`}
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

function SortTh({
  col,
  label,
  sortCol,
  dir,
  onSort,
}: {
  col: SortCol;
  label: string;
  sortCol: SortCol | null;
  dir: SortDir;
  onSort: (col: SortCol) => void;
}) {
  const active = sortCol === col;
  return (
    <th
      className="text-left px-4 py-3 cursor-pointer select-none hover:bg-muted/60 transition-colors"
      onClick={() => onSort(col)}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-[10px]" aria-hidden="true">
          {active ? (dir === "asc" ? "↑" : "↓") : <span className="opacity-30">↕</span>}
        </span>
      </span>
    </th>
  );
}

/** Returns the CSS background for the belt color dot; compound red belts get a bicolor gradient. */
function beltDotStyle(belt: string | null): React.CSSProperties {
  const x = (belt ?? "").toLowerCase().trim();
  if (x.includes("vermelha e preta"))
    return { background: "linear-gradient(90deg, #b21e1e 50%, #1c1c1f 50%)" };
  if (x.includes("vermelha e branca"))
    return { background: "linear-gradient(90deg, #b21e1e 50%, #eceae4 50%)" };
  if (x.includes("vermelha")) return { background: "#b21e1e" };
  if (x.includes("preta") || x.includes("black")) return { background: "#1c1c1f" };
  if (x.includes("marrom")) return { background: "#6b3f1d" };
  if (x.includes("roxa")) return { background: "#6d28d9" };
  if (x.includes("azul")) return { background: "#1d4ed8" };
  if (x.includes("verde")) return { background: "#15803d" };
  if (x.includes("laranja")) return { background: "#ea580c" };
  if (x.includes("amarela")) return { background: "#ca8a04" };
  if (x.includes("coral")) return { background: "#f87171" };
  if (x.includes("cinza")) return { background: "#9ca3af" };
  if (x.includes("branca")) return { background: "#eceae4" };
  return { background: "#b8b6ad" };
}

function BeltDot({ belt, locale }: { belt: string | null; locale: string }) {
  if (!belt) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-black/10 flex-shrink-0"
        style={beltDotStyle(belt)}
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
          <div className="h-2.5 w-2.5 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

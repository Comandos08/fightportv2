import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useRef } from "react";
import { Copy, Download, Upload, Plus, Eye, Award, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { BELT_COLORS, MARTIAL_ARTS, beltRank, getInitials } from "@/lib/belts";
import { Button } from "@/components/ui/button";
import { formatDateBR } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Topbar, TopbarGhostBtn } from "@/components/Topbar";

export const Route = createFileRoute("/painel/praticantes")({ component: PracsPage });

const PAGE = 20;

function getBeltTokens(belt: string | null | undefined) {
  const x = (belt ?? "").toLowerCase().trim();
  if (x.includes("vermelha") || x.includes("red"))
    return { bg: "var(--color-belt-verm-bg)", text: "var(--color-belt-verm-text)", dot: "var(--color-belt-verm-dot)" };
  if (x.includes("coral"))
    return { bg: "var(--color-belt-coral-bg)", text: "var(--color-belt-coral-text)", dot: "var(--color-belt-coral-dot)" };
  if (x.includes("preta") || x.includes("black"))
    return { bg: "var(--color-belt-preta-bg)", text: "var(--color-belt-preta-text)", dot: "var(--color-belt-preta-dot)", border: "1px solid #333" };
  if (x.includes("marrom") || x.includes("brown"))
    return { bg: "var(--color-belt-marrom-bg)", text: "var(--color-belt-marrom-text)", dot: "var(--color-belt-marrom-dot)" };
  if (x.includes("roxa") || x.includes("purple"))
    return { bg: "var(--color-belt-roxa-bg)", text: "var(--color-belt-roxa-text)", dot: "var(--color-belt-roxa-dot)" };
  if (x.includes("azul") || x.includes("blue"))
    return { bg: "var(--color-belt-azul-bg)", text: "var(--color-belt-azul-text)", dot: "var(--color-belt-azul-dot)" };
  if (x.includes("verde") || x.includes("green"))
    return { bg: "var(--color-belt-verde-bg)", text: "var(--color-belt-verde-text)", dot: "var(--color-belt-verde-dot)" };
  if (x.includes("laranja") || x.includes("orange"))
    return { bg: "var(--color-belt-laranja-bg)", text: "var(--color-belt-laranja-text)", dot: "var(--color-belt-laranja-dot)" };
  if (x.includes("amarela") || x.includes("yellow"))
    return { bg: "var(--color-belt-amarela-bg)", text: "var(--color-belt-amarela-text)", dot: "var(--color-belt-amarela-dot)" };
  if (x.includes("cinza") || x.includes("grey") || x.includes("gray"))
    return { bg: "var(--color-belt-cinza-bg)", text: "var(--color-belt-cinza-text)", dot: "var(--color-belt-cinza-dot)" };
  return { bg: "var(--color-belt-branca-bg)", text: "var(--color-belt-branca-text)", dot: "var(--color-belt-branca-dot)", border: "1px solid #e5e5e5" };
}

function PracBeltBadge({ belt }: { belt: string | null | undefined }) {
  if (!belt) return <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>—</span>;
  const t = getBeltTokens(belt);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px 3px 7px", borderRadius: 20,
      fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
      background: t.bg, color: t.text, border: t.border ?? "none",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.dot, flexShrink: 0 }} />
      {belt}
    </span>
  );
}

function PracsPage() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/painel/praticantes") return <Outlet />;

  const t = useT();
  const qc = useQueryClient();
  const { user } = useSession();
  const schoolId = user?.id;
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"all" | "with" | "without">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["prac", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db
        .from("person_schools")
        .select(
          "id, person_id, school_id, martial_art, current_belt, people:person_id ( fp_id, first_name, last_name, cpf, gender, birth_date )",
        )
        .eq("school_id", schoolId);
      return (res.data ?? []).map((r: any) => ({
        link_id: r.id,
        person_id: r.person_id,
        martial_art: r.martial_art,
        current_belt: r.current_belt,
        fp_id: r.people?.fp_id,
        first_name: r.people?.first_name ?? "",
        last_name: r.people?.last_name ?? "",
        cpf: r.people?.cpf ?? "",
        gender: r.people?.gender ?? "",
        birth_date: r.people?.birth_date ?? "",
      }));
    },
  });

  const { data: achData = [] } = useQuery({
    queryKey: ["prac-achs", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db.from("achievements").select("person_id").eq("school_id", schoolId);
      return res.data ?? [];
    },
  });

  const { data: schoolMeta } = useQuery({
    queryKey: ["school-meta", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db.from("schools").select("name,martial_art,city,state").eq("id", schoolId).maybeSingle();
      return res.data ?? null;
    },
  });

  const achCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of achData as any[]) {
      map[a.person_id] = (map[a.person_id] || 0) + 1;
    }
    return map;
  }, [achData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = rows.filter((r: any) => {
      if (q && !`${r.first_name} ${r.last_name} ${r.fp_id ?? ""}`.toLowerCase().includes(q)) return false;
      if (beltFilter && r.current_belt !== beltFilter) return false;
      return true;
    });
    return result.sort((a: any, b: any) => {
      const ra = beltRank(a.current_belt);
      const rb = beltRank(b.current_belt);
      if (ra === -1 && rb === -1) return 0;
      if (ra === -1) return 1;
      if (rb === -1) return -1;
      return rb - ra;
    });
  }, [rows, search, beltFilter]);

  const filteredByTab = useMemo(() => {
    if (tab === "with") return filtered.filter((r: any) => (achCountMap[r.person_id] ?? 0) > 0);
    if (tab === "without") return filtered.filter((r: any) => (achCountMap[r.person_id] ?? 0) === 0);
    return filtered;
  }, [filtered, tab, achCountMap]);

  const countWith = useMemo(() => filtered.filter((r: any) => (achCountMap[r.person_id] ?? 0) > 0).length, [filtered, achCountMap]);
  const countWithout = useMemo(() => filtered.filter((r: any) => (achCountMap[r.person_id] ?? 0) === 0).length, [filtered, achCountMap]);

  const pageCount = Math.max(1, Math.ceil(filteredByTab.length / PAGE));
  const pageRows = filteredByTab.slice((page - 1) * PAGE, page * PAGE);

  const del = useMutation({
    mutationFn: async (linkId: string) => {
      const res = await db.from("person_schools").delete().eq("id", linkId);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Praticante removido.");
      qc.invalidateQueries({ queryKey: ["prac", schoolId] });
      setDeleteTarget(null);
    },
    onError: (e: any) => {
      if (String(e?.message ?? "").includes("foreign key")) {
        toast.error(t("prac.delete.fkError"));
      } else {
        toast.error(e?.message ?? t("common.error"));
      }
    },
  });

  const exportCsv = () => {
    const cols = ["Nome", "Sobrenome", "Arte Marcial", "Faixa Atual", "FP ID", "CPF", "Data de nascimento", "Sexo"];
    const lines = [cols.join(",")].concat(
      filtered.map((r: any) =>
        [r.first_name, r.last_name, r.martial_art, r.current_belt, r.fp_id, r.cpf, r.birth_date, r.gender]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    );
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `praticantes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    let parsed: any[] = [];
    if (file.name.endsWith(".csv")) {
      const text = await file.text();
      const result = Papa.parse<any>(text, { header: true, skipEmptyLines: true });
      parsed = result.data;
    } else {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      parsed = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    }
    const seenCpfs = new Set<string>();
    let created = 0;
    let linked = 0;
    let errors = 0;
    const schoolRes = await db.from("schools").select("martial_art").eq("id", schoolId).maybeSingle();
    const art = schoolRes.data?.martial_art ?? "Jiu-Jitsu Brasileiro";

    for (const row of parsed) {
      const first = String(row["Nome"] ?? row["first_name"] ?? "").trim();
      const last = String(row["Sobrenome"] ?? row["last_name"] ?? "").trim();
      const cpf = String(row["CPF"] ?? row["cpf"] ?? "").replace(/\D/g, "");
      if (!first || !last) { errors++; continue; }
      if (cpf && seenCpfs.has(cpf)) { errors++; continue; }
      if (cpf) seenCpfs.add(cpf);

      let personId: string | null = null;
      if (cpf) {
        const found = await db.rpc("find_person_by_cpf", { p_cpf: cpf });
        if (found.data) personId = String(found.data);
      }
      if (!personId) {
        const fp = await db.rpc("generate_fp_id");
        const ins = await db
          .from("people")
          .insert({ fp_id: fp.data, first_name: first, last_name: last, cpf: cpf || null, birth_date: row["Data de nascimento"] || null, gender: row["Sexo"] || null })
          .select("id")
          .single();
        if (ins.error) { errors++; continue; }
        personId = ins.data.id;
        created++;
      } else {
        linked++;
      }
      await db.from("person_schools").insert({ person_id: personId, school_id: schoolId, martial_art: art, current_belt: row["Faixa Atual"] || "Branca" });
    }
    toast.success(`${created} criados · ${linked} vinculados · ${errors} erros`);
    qc.invalidateQueries({ queryKey: ["prac", schoolId] });
  };

  const topbarSubtitle = [
    `${filteredByTab.length} atletas`,
    schoolMeta?.martial_art,
    [schoolMeta?.city, schoolMeta?.state].filter(Boolean).join(" — "),
  ].filter(Boolean).join(" · ");

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    fontSize: 12.5,
    fontWeight: 500,
    fontFamily: "var(--font-body)",
    color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
    borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
    marginBottom: -1,
    background: "none",
    border: "none",
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderBottomColor: active ? "var(--color-accent)" : "transparent",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  });

  const tabBadge = (count: number, variant: "all" | "with" | "without") => {
    const styles: Record<string, React.CSSProperties> = {
      all: { background: "var(--color-accent-dim)", color: "var(--color-accent)" },
      with: { background: "#e8f5ec", color: "#22a05a" },
      without: { background: "#f4f4f4", color: "#888888" },
    };
    return (
      <span style={{
        ...styles[variant],
        fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 10,
      }}>
        {count}
      </span>
    );
  };

  return (
    <>
      <Topbar title={t("prac.title")} subtitle={topbarSubtitle}>
        <TopbarGhostBtn onClick={exportCsv}>
          <Download className="h-3 w-3" />
          {t("prac.export")}
        </TopbarGhostBtn>
        <TopbarGhostBtn onClick={() => fileRef.current?.click()}>
          <Upload className="h-3 w-3" />
          {t("prac.import")}
        </TopbarGhostBtn>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
        />
        <Link
          to="/painel/praticantes/novo"
          className="topbar-primary-link"
          style={{
            background: "var(--color-accent)",
            color: "#000",
            fontWeight: 600,
            padding: "7px 15px",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "var(--font-body)",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            textDecoration: "none",
          }}
        >
          <Plus className="h-3 w-3" />
          {t("prac.new")}
        </Link>
      </Topbar>

      {/* Tab bar */}
      <div style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        padding: "14px 24px 0",
        display: "flex",
        gap: 4,
      }}>
        <button style={tabStyle(tab === "all")} onClick={() => { setTab("all"); setPage(1); }}>
          Todos {tabBadge(filtered.length, "all")}
        </button>
        <button style={tabStyle(tab === "with")} onClick={() => { setTab("with"); setPage(1); }}>
          Com conquistas {tabBadge(countWith, "with")}
        </button>
        <button style={tabStyle(tab === "without")} onClick={() => { setTab("without"); setPage(1); }}>
          Sem conquistas {tabBadge(countWithout, "without")}
        </button>
      </div>

      {/* Page body */}
      <div style={{ padding: "20px 24px", background: "var(--color-page-bg)", flex: 1 }}>

        {/* Search + filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--color-text-faint)" }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("prac.search.ph")}
              style={{
                width: "100%",
                padding: "9px 10px 9px 34px",
                border: "1px solid var(--color-border)",
                borderRadius: 9,
                fontSize: 12.5,
                fontFamily: "var(--font-body)",
                background: "var(--color-surface)",
                outline: "none",
                color: "var(--color-text-primary)",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
            />
          </div>
          <Select value={beltFilter || "all"} onValueChange={(v) => { setBeltFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger style={{ height: 38, border: "1px solid var(--color-border)", borderRadius: 9, fontSize: 12.5, fontFamily: "var(--font-body)", width: 150 }}>
              <SelectValue placeholder={t("prac.filter.belt")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("prac.filter.belt")}</SelectItem>
              {Object.keys(BELT_COLORS).map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || beltFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setBeltFilter(""); setPage(1); }}>
              {t("prac.filter.clear")}
            </Button>
          )}
        </div>

        {/* Table card */}
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}>
          <table style={{ tableLayout: "fixed", width: "100%", borderCollapse: "collapse" }}>
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "21%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "31%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#fafaf8", borderBottom: "1px solid var(--color-border-subtle)" }}>
                <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left" }}>
                  {t("prac.col.name")}
                </th>
                <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left" }}>
                  {t("prac.col.belt")}
                </th>
                <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left" }}>
                  Conquistas
                </th>
                <th style={{ padding: "8px 18px 8px 14px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "right" }}>
                  {t("prac.col.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "32px 14px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                    {t("prac.empty")}
                  </td>
                </tr>
              )}
              {pageRows.map((r: any, idx: number) => (
                <PracRow
                  key={r.link_id}
                  row={r}
                  idx={idx}
                  achCount={achCountMap[r.person_id] ?? 0}
                  expanded={expanded === r.link_id}
                  onToggle={() => setExpanded(expanded === r.link_id ? null : r.link_id)}
                  onDelete={() => setDeleteTarget(r.link_id)}
                />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pageCount > 1 && (
            <div style={{
              padding: "11px 18px",
              borderTop: "1px solid var(--color-border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
                {filteredByTab.length} de {rows.length} praticantes
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: "5px 11px", border: "1px solid var(--color-border)", borderRadius: 7,
                    background: "var(--color-surface)", fontSize: 12, color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-body)", cursor: page <= 1 ? "default" : "pointer",
                    opacity: page <= 1 ? 0.4 : 1,
                  }}
                >
                  ←
                </button>
                {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        padding: "5px 11px", border: "1px solid var(--color-border)", borderRadius: 7,
                        background: page === p ? "var(--color-text-primary)" : "var(--color-surface)",
                        color: page === p ? "#ffffff" : "var(--color-text-secondary)",
                        borderColor: page === p ? "var(--color-text-primary)" : "var(--color-border)",
                        fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(pageCount, page + 1))}
                  disabled={page >= pageCount}
                  style={{
                    padding: "5px 11px", border: "1px solid var(--color-border)", borderRadius: 7,
                    background: "var(--color-surface)", fontSize: 12, color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-body)", cursor: page >= pageCount ? "default" : "pointer",
                    opacity: page >= pageCount ? 0.4 : 1,
                  }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("prac.delete.confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && del.mutate(deleteTarget)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PracRow({
  row,
  idx,
  achCount,
  expanded,
  onToggle,
  onDelete,
}: {
  row: any;
  idx: number;
  achCount: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const { data: achs } = useQuery({
    queryKey: ["ach", row.person_id],
    enabled: expanded,
    queryFn: async () => {
      const res = await db
        .from("achievements")
        .select("id, belt, achieved_at, graduated_by, verification_hash")
        .eq("person_id", row.person_id)
        .order("achieved_at", { ascending: false });
      return res.data ?? [];
    },
  });

  const rowBg = idx % 2 === 1 ? "#fffcf5" : "var(--color-surface)";
  const tdBase: React.CSSProperties = {
    padding: "10px 14px",
    borderBottom: "1px solid var(--color-border-subtle)",
    color: "var(--color-text-secondary)",
    verticalAlign: "middle",
    fontSize: 12.5,
  };

  const iconBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--color-text-faint)",
    fontSize: 15,
    padding: 2,
    display: "inline-flex",
    alignItems: "center",
  };

  return (
    <>
      <tr style={{ background: rowBg }}>
        <td style={tdBase}>
          <div>
            <div style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: 12.5 }}>
              {row.first_name} {row.last_name}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-faint)", marginTop: 1 }}>
              {row.fp_id}
            </div>
          </div>
        </td>
        <td style={tdBase}>
          <PracBeltBadge belt={row.current_belt} />
        </td>
        <td
          style={{ ...tdBase, cursor: "pointer" }}
          onClick={onToggle}
        >
          {achCount > 0
            ? <span style={{ fontSize: 11.5, color: "var(--color-accent)", fontWeight: 500 }}>{achCount} conquista{achCount !== 1 ? "s" : ""}</span>
            : <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>0 registros</span>
          }
        </td>
        <td style={{ ...tdBase, textAlign: "right", paddingRight: 14 }}>
          <div style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
            <Link to="/p/$id" params={{ id: row.fp_id }}>
              <button aria-label="Ver passaporte" style={iconBtn} className="prac-icon-btn">
                <Eye style={{ width: 15, height: 15 }} />
              </button>
            </Link>
            <Link to="/painel/conquistas/nova" search={{ person: row.person_id } as any}>
              <button aria-label="Registrar conquista" style={iconBtn} className="prac-icon-btn">
                <Award style={{ width: 15, height: 15 }} />
              </button>
            </Link>
            <Link to="/painel/praticantes/$id/editar" params={{ id: row.person_id }}>
              <button aria-label="Editar" style={iconBtn} className="prac-icon-btn">
                <Pencil style={{ width: 15, height: 15 }} />
              </button>
            </Link>
            <button
              aria-label="Excluir"
              onClick={onDelete}
              style={iconBtn}
              className="prac-icon-btn prac-icon-btn--delete"
            >
              <Trash2 style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: "#fafaf8" }}>
          <td colSpan={4} style={{ padding: "10px 14px 14px", borderBottom: "1px solid var(--color-border-subtle)" }}>
            {!achs ? (
              <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{t("common.loading")}</p>
            ) : achs.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{t("prac.exp.empty")}</p>
            ) : (
              <table style={{ width: "100%", fontSize: 11.5, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "var(--color-text-muted)" }}>
                    <th style={{ padding: "4px 0", fontWeight: 600, textAlign: "left" }}>{t("prac.exp.date")}</th>
                    <th style={{ padding: "4px 0", fontWeight: 600, textAlign: "left" }}>{t("prac.exp.belt")}</th>
                    <th style={{ padding: "4px 0", fontWeight: 600, textAlign: "left" }}>{t("prac.exp.gradBy")}</th>
                    <th style={{ padding: "4px 0", fontWeight: 600, textAlign: "left" }}>{t("prac.exp.hash")}</th>
                  </tr>
                </thead>
                <tbody>
                  {achs.map((a: any) => (
                    <tr key={a.id}>
                      <td style={{ padding: "4px 0", fontVariantNumeric: "tabular-nums" }}>{formatDateBR(a.achieved_at)}</td>
                      <td style={{ padding: "4px 0" }}><PracBeltBadge belt={a.belt} /></td>
                      <td style={{ padding: "4px 0" }}>{a.graduated_by}</td>
                      <td style={{ padding: "4px 0", fontFamily: "var(--font-mono)" }}>
                        <span style={{ display: "inline-block", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          {a.verification_hash}
                        </span>
                        <button
                          style={{ marginLeft: 4, verticalAlign: "middle", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)" }}
                          onClick={() => {
                            navigator.clipboard.writeText(a.verification_hash);
                            toast.success(t("ach.success.copied"));
                          }}
                        >
                          <Copy style={{ width: 12, height: 12 }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

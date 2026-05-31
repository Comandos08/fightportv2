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
import { getBeltTailwindClasses } from "@/components/BeltBadge";

export const Route = createFileRoute("/painel/praticantes")({ component: PracsPage });

const PAGE = 20;

function PracBeltBadge({ belt }: { belt: string | null | undefined }) {
  if (!belt) return <span className="text-[11px] text-[#bbbbbb]">—</span>;
  const { wrapper, dot, gradientStyle } = getBeltTailwindClasses(belt);
  return (
    <span
      className={`inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-[20px] text-[11px] font-medium whitespace-nowrap ${wrapper}`}
      style={gradientStyle ? { background: gradientStyle } : undefined}
    >
      <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${dot}`} />
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

  const tabCls = (active: boolean) =>
    `px-4 py-2 text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-0 border-b-2 -mb-px transition-colors ${
      active ? "text-[#0f0f0f] border-[#E07B20]" : "text-[#999999] border-transparent"
    }`;

  const tabBadge = (count: number, variant: "all" | "with" | "without") => {
    const cls = variant === "all"
      ? "bg-[#fef3e6] text-[#E07B20]"
      : variant === "with"
      ? "bg-[#e8f5ec] text-[#22a05a]"
      : "bg-[#f4f4f4] text-[#888888]";
    return (
      <span className={`text-[10.5px] font-semibold px-1.5 py-px rounded-[10px] ${cls}`}>
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
          className="bg-[#E07B20] hover:bg-[#F5A623] text-black font-semibold px-[15px] py-[7px] rounded-lg text-[12px] inline-flex items-center gap-[5px] no-underline transition-colors"
        >
          <Plus className="h-3 w-3" />
          {t("prac.new")}
        </Link>
      </Topbar>

      {/* Tab bar */}
      <div className="bg-white border-b border-[#E8E6E1] px-6 pt-[14px] flex gap-1">
        <button className={tabCls(tab === "all")} onClick={() => { setTab("all"); setPage(1); }}>
          Todos {tabBadge(filtered.length, "all")}
        </button>
        <button className={tabCls(tab === "with")} onClick={() => { setTab("with"); setPage(1); }}>
          Com conquistas {tabBadge(countWith, "with")}
        </button>
        <button className={tabCls(tab === "without")} onClick={() => { setTab("without"); setPage(1); }}>
          Sem conquistas {tabBadge(countWithout, "without")}
        </button>
      </div>

      {/* Page body */}
      <div className="p-5 px-6 flex-1">

        {/* Search + filter bar */}
        <div className="flex gap-2 mb-3.5">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#bbbbbb]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("prac.search.ph")}
              className="w-full pl-[34px] pr-2.5 py-2 border border-[#E8E6E1] rounded-[9px] text-[12.5px] bg-white outline-none text-[#0f0f0f] focus:border-[#E07B20] transition-colors"
            />
          </div>
          <Select value={beltFilter || "all"} onValueChange={(v) => { setBeltFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="h-[38px] border border-[#E8E6E1] rounded-[9px] text-[12.5px] w-[150px]">
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
        <div className="bg-white rounded-[10px] border border-[#E8E6E1] overflow-hidden">
          <table className="table-fixed w-full border-collapse">
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "21%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "31%" }} />
            </colgroup>
            <thead>
              <tr className="bg-[#fafaf8] border-b border-[#ededea]">
                <th className="px-3.5 py-2 text-[10px] font-semibold text-[#999999] uppercase tracking-[0.07em] text-left">
                  {t("prac.col.name")}
                </th>
                <th className="px-3.5 py-2 text-[10px] font-semibold text-[#999999] uppercase tracking-[0.07em] text-left">
                  {t("prac.col.belt")}
                </th>
                <th className="px-3.5 py-2 text-[10px] font-semibold text-[#999999] uppercase tracking-[0.07em] text-left">
                  Conquistas
                </th>
                <th className="px-3.5 py-2 pr-[18px] text-[10px] font-semibold text-[#999999] uppercase tracking-[0.07em] text-right">
                  {t("prac.col.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 px-3.5 text-center text-[#999999] text-[13px]">
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
            <div className="px-[18px] py-[11px] border-t border-[#ededea] flex items-center justify-between">
              <span className="text-[11.5px] text-[#999999]">
                {filteredByTab.length} de {rows.length} praticantes
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-[11px] py-[5px] border border-[#E8E6E1] rounded-[7px] bg-white text-[12px] text-[#555555] cursor-pointer disabled:opacity-40 disabled:cursor-default"
                >
                  ←
                </button>
                {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-[11px] py-[5px] border rounded-[7px] text-[12px] cursor-pointer transition-colors ${
                        page === p
                          ? "bg-[#0f0f0f] border-[#0f0f0f] text-white"
                          : "bg-white border-[#E8E6E1] text-[#555555]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(pageCount, page + 1))}
                  disabled={page >= pageCount}
                  className="px-[11px] py-[5px] border border-[#E8E6E1] rounded-[7px] bg-white text-[12px] text-[#555555] cursor-pointer disabled:opacity-40 disabled:cursor-default"
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

  const rowCls = idx % 2 === 1 ? "bg-[#fffcf5]" : "bg-white";
  const tdCls = "px-3.5 py-2.5 border-b border-[#ededea] text-[#555555] align-middle text-[12.5px]";
  const iconBtnCls = "bg-transparent border-0 cursor-pointer text-[#bbbbbb] hover:text-[#555555] p-0.5 inline-flex items-center transition-colors";

  return (
    <>
      <tr className={rowCls}>
        <td className={tdCls}>
          <div className="font-medium text-[#0f0f0f] text-[12.5px]">
            {row.first_name} {row.last_name}
          </div>
          <div className="font-mono text-[10px] text-[#bbbbbb] mt-px">
            {row.fp_id}
          </div>
        </td>
        <td className={tdCls}>
          <PracBeltBadge belt={row.current_belt} />
        </td>
        <td className={`${tdCls} cursor-pointer`} onClick={onToggle}>
          {achCount > 0
            ? <span className="text-[11.5px] text-[#E07B20] font-medium">{achCount} conquista{achCount !== 1 ? "s" : ""}</span>
            : <span className="text-[11.5px] text-[#999999]">0 registros</span>
          }
        </td>
        <td className={`${tdCls} text-right pr-3.5`}>
          <div className="inline-flex gap-2.5 items-center">
            <Link to="/p/$id" params={{ id: row.fp_id }}>
              <button aria-label="Ver passaporte" className={iconBtnCls}>
                <Eye className="w-[15px] h-[15px]" />
              </button>
            </Link>
            <Link to="/painel/conquistas/nova" search={{ person: row.person_id } as any}>
              <button aria-label="Registrar conquista" className={iconBtnCls}>
                <Award className="w-[15px] h-[15px]" />
              </button>
            </Link>
            <Link to="/painel/praticantes/$id/editar" params={{ id: row.person_id }}>
              <button aria-label="Editar" className={iconBtnCls}>
                <Pencil className="w-[15px] h-[15px]" />
              </button>
            </Link>
            <button
              aria-label="Excluir"
              onClick={onDelete}
              className={`${iconBtnCls} hover:text-red-500`}
            >
              <Trash2 className="w-[15px] h-[15px]" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#fafaf8]">
          <td colSpan={4} className="px-3.5 pt-2.5 pb-3.5 border-b border-[#ededea]">
            {!achs ? (
              <p className="text-[12px] text-[#999999]">{t("common.loading")}</p>
            ) : achs.length === 0 ? (
              <p className="text-[12px] text-[#999999]">{t("prac.exp.empty")}</p>
            ) : (
              <table className="w-full text-[11.5px] border-collapse">
                <thead>
                  <tr className="text-[#999999]">
                    <th className="py-1 font-semibold text-left">{t("prac.exp.date")}</th>
                    <th className="py-1 font-semibold text-left">{t("prac.exp.belt")}</th>
                    <th className="py-1 font-semibold text-left">{t("prac.exp.gradBy")}</th>
                    <th className="py-1 font-semibold text-left">{t("prac.exp.hash")}</th>
                  </tr>
                </thead>
                <tbody>
                  {achs.map((a: any) => (
                    <tr key={a.id}>
                      <td className="py-1 tabular-nums">{formatDateBR(a.achieved_at)}</td>
                      <td className="py-1"><PracBeltBadge belt={a.belt} /></td>
                      <td className="py-1">{a.graduated_by}</td>
                      <td className="py-1 font-mono">
                        <span className="inline-block max-w-[140px] overflow-hidden text-ellipsis align-middle whitespace-nowrap">
                          {a.verification_hash}
                        </span>
                        <button
                          className="ml-1 align-middle bg-transparent border-0 cursor-pointer text-[#bbbbbb] hover:text-[#555555] transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(a.verification_hash);
                            toast.success(t("ach.success.copied"));
                          }}
                        >
                          <Copy className="w-3 h-3" />
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

import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useRef } from "react";
import { ChevronDown, ChevronRight, Copy, Download, Upload, Plus } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { BELT_COLORS, MARTIAL_ARTS, beltRank, getInitials } from "@/lib/belts";
import { BeltBadge } from "@/components/BeltBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/painel/praticantes")({ component: PracsPage });

const PAGE = 20;

function PracsPage() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/painel/praticantes") return <Outlet />;

  const t = useT();
  const qc = useQueryClient();
  const { user } = useSession();
  const schoolId = user?.id;
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState("");
  const [artFilter, setArtFilter] = useState("");
  const [page, setPage] = useState(1);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = rows.filter((r: any) => {
      if (q && !`${r.first_name} ${r.last_name}`.toLowerCase().includes(q)) return false;
      if (beltFilter && r.current_belt !== beltFilter) return false;
      if (artFilter && r.martial_art !== artFilter) return false;
      return true;
    });
    // Sort highest belt first; no-belt rows pinned to the bottom.
    return result.sort((a: any, b: any) => {
      const ra = beltRank(a.current_belt);
      const rb = beltRank(b.current_belt);
      if (ra === -1 && rb === -1) return 0;
      if (ra === -1) return 1;
      if (rb === -1) return -1;
      return rb - ra;
    });
  }, [rows, search, beltFilter, artFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageRows = filtered.slice((page - 1) * PAGE, page * PAGE);

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
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
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
      if (!first || !last) {
        errors++;
        continue;
      }
      if (cpf && seenCpfs.has(cpf)) {
        errors++;
        continue;
      }
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
          .insert({
            fp_id: fp.data,
            first_name: first,
            last_name: last,
            cpf: cpf || null,
            birth_date: row["Data de nascimento"] || null,
            gender: row["Sexo"] || null,
          })
          .select("id")
          .single();
        if (ins.error) {
          errors++;
          continue;
        }
        personId = ins.data.id;
        created++;
      } else {
        linked++;
      }
      await db.from("person_schools").insert({
        person_id: personId,
        school_id: schoolId,
        martial_art: art,
        current_belt: row["Faixa Atual"] || "Branca",
      });
    }
    toast.success(`${created} criados · ${linked} vinculados · ${errors} erros`);
    qc.invalidateQueries({ queryKey: ["prac", schoolId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("prac.title")}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />
            {t("prac.export")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            {t("prac.import")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
          />
          <Link to="/painel/praticantes/novo">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
              <Plus className="h-4 w-4 mr-1" />
              {t("prac.new")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("prac.search.ph")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={beltFilter || "all"} onValueChange={(v) => setBeltFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("prac.filter.belt")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("prac.filter.belt")}</SelectItem>
            {Object.keys(BELT_COLORS).map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={artFilter || "all"} onValueChange={(v) => setArtFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("prac.filter.art")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("prac.filter.art")}</SelectItem>
            {MARTIAL_ARTS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || beltFilter || artFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setBeltFilter("");
              setArtFilter("");
            }}
          >
            {t("prac.filter.clear")}
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="w-8" />
              <th className="px-3 py-2">{t("prac.col.name")}</th>
              <th className="px-3 py-2 hidden sm:table-cell">{t("prac.col.belt")}</th>
              <th className="px-3 py-2 text-right">{t("prac.col.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  {t("prac.empty")}
                </td>
              </tr>
            )}
            {pageRows.map((r: any) => (
              <PracRow
                key={r.link_id}
                row={r}
                expanded={expanded === r.link_id}
                onToggle={() => setExpanded(expanded === r.link_id ? null : r.link_id)}
                onDelete={() => setDeleteTarget(r.link_id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: pageCount }).map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

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
    </div>
  );
}

function PracRow({
  row,
  expanded,
  onToggle,
  onDelete,
}: {
  row: any;
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

  return (
    <>
      <tr className="hover:bg-muted/30">
        <td className="px-2">
          <button onClick={onToggle} className="p-1">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {getInitials(`${row.first_name} ${row.last_name}`)}
            </div>
            <div>
              <div className="font-medium">
                {row.first_name} {row.last_name}
              </div>
              <div className="text-xs text-muted-foreground font-mono">{row.fp_id}</div>
              <div className="sm:hidden mt-1">
                <BeltBadge belt={row.current_belt} />
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 hidden sm:table-cell">
          <BeltBadge belt={row.current_belt} />
        </td>
        <td className="px-3 text-right">
          <div className="inline-flex gap-1">
            <Link to="/p/$id" params={{ id: row.fp_id }}>
              <Button variant="ghost" size="sm">
                {t("prac.action.viewPassport")}
              </Button>
            </Link>
            <Link to="/painel/conquistas/nova" search={{ person: row.person_id } as any}>
              <Button variant="ghost" size="sm">
                {t("prac.action.registerAchievement")}
              </Button>
            </Link>
            <Link to="/painel/praticantes/$id/editar" params={{ id: row.person_id }}>
              <Button variant="ghost" size="sm">
                {t("common.edit")}
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              {t("common.delete")}
            </Button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/20">
          <td />
          <td colSpan={3} className="px-3 py-3">
            {!achs ? (
              <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
            ) : achs.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("prac.exp.empty")}</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1">{t("prac.exp.date")}</th>
                    <th>{t("prac.exp.belt")}</th>
                    <th>{t("prac.exp.gradBy")}</th>
                    <th>{t("prac.exp.hash")}</th>
                  </tr>
                </thead>
                <tbody>
                  {achs.map((a: any) => (
                    <tr key={a.id}>
                      <td className="py-1 tabular-nums">{formatDateBR(a.achieved_at)}</td>
                      <td>
                        <BeltBadge belt={a.belt} />
                      </td>
                      <td>{a.graduated_by}</td>
                      <td className="font-mono">
                        <span className="truncate inline-block max-w-[140px] align-middle">
                          {a.verification_hash}
                        </span>
                        <button
                          className="ml-1 align-middle"
                          onClick={() => {
                            navigator.clipboard.writeText(a.verification_hash);
                            toast.success(t("ach.success.copied"));
                          }}
                        >
                          <Copy className="h-3 w-3 inline" />
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

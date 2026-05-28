import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export function DashPageHeader({
  title, description, actions,
}: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function DashSection({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="border border-border rounded-lg bg-card">
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function DashTable<T>({
  columns, rows, onRowClick, empty,
}: {
  columns: { key: string; label: string; render?: (r: T) => ReactNode; className?: string }[];
  rows: T[];
  onRowClick?: (r: T) => void;
  empty?: ReactNode;
}) {
  const t = useT();
  if (!rows.length) {
    return <div className="py-10 text-center text-sm text-muted-foreground">{empty ?? t("dash.empty")}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground">
          <tr>
            {columns.map((c) => <th key={c.key} className={`px-4 py-2 ${c.className ?? ""}`}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={`border-t border-border ${onRowClick ? "cursor-pointer hover:bg-muted/40" : ""}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                  {c.render ? c.render(r) : ((r as any)[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashFiltersBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-2 mb-4">{children}</div>;
}

export function DashSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const t = useT();
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? t("dash.search.ph")} className="pl-9" />
    </div>
  );
}

export function DashPagination({
  page, pageSize, total, onPageChange,
}: { page: number; pageSize: number; total: number; onPageChange: (p: number) => void }) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
      <span>{total} resultados · página {page} de {last}</span>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" disabled={page >= last} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DashEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

export function DashTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );
}

export function DashKpiCard({ label, value, delta }: { label: string; value: ReactNode; delta?: string }) {
  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {delta && <div className="text-xs text-muted-foreground mt-1">{delta}</div>}
    </div>
  );
}

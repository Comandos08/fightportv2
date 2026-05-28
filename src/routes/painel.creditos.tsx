import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { CreditBalance } from "@/components/panel/CreditBalance";
import { Button } from "@/components/ui/button";

type PaymentMethod = "mercadopago" | "paypal";

const PACKAGES = [
  { name: "Starter", credits: 10, price_brl: 97 },
  { name: "Equipe", credits: 50, price_brl: 397, popular: true },
  { name: "Organização", credits: 150, price_brl: 990 },
];

export const Route = createFileRoute("/painel/creditos")({
  validateSearch: (s: Record<string, unknown>) => ({
    collection_status: (s.collection_status as string) ?? "",
    paypal_status: (s.paypal_status as string) ?? "",
  }),
  component: CreditsPage,
});

function CreditsPage() {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useSession();
  const schoolId = user?.id;
  const [method, setMethod] = useState<PaymentMethod>("mercadopago");
  const search = Route.useSearch();

  useEffect(() => {
    const s = search.collection_status || search.paypal_status;
    if (!s) return;
    if (s === "approved" || s === "COMPLETED") {
      toast.success(t("cred.success"));
    } else if (s === "pending" || s === "PENDING") {
      toast.info(t("cred.pending"));
    } else {
      toast.error(t("cred.failure"));
    }
    qc.invalidateQueries({ queryKey: ["bal", schoolId] });
    qc.invalidateQueries({ queryKey: ["credit-tx", schoolId] });
  }, [search.collection_status, search.paypal_status, t, qc, schoolId]);

  const { data: balance = 0 } = useQuery({
    queryKey: ["bal", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db.from("credits").select("balance").eq("school_id", schoolId).maybeSingle();
      return Number(res.data?.balance ?? 0);
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["credit-tx", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const res = await db
        .from("credit_transactions")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(50);
      return res.data ?? [];
    },
  });

  const buy = async (pkg: (typeof PACKAGES)[number]) => {
    const fn = method === "mercadopago" ? "mercadopago-checkout" : "paypal-checkout";
    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { package: pkg.name, credits: pkg.credits, price_brl: pkg.price_brl },
      });
      if (error) throw error;
      const url = data?.init_point || data?.approval_url;
      if (url) window.location.href = url;
      else toast.error(t("common.error"));
    } catch (e: any) {
      toast.error(e?.message ?? t("common.error"));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("cred.title")}</h1>
      <CreditBalance balance={balance} />

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("cred.method")}:</span>
        <button
          onClick={() => setMethod("mercadopago")}
          className={`px-3 py-1 rounded border text-xs ${method === "mercadopago" ? "bg-foreground text-background" : "border-border"}`}
        >
          MercadoPago
        </button>
        <button
          onClick={() => setMethod("paypal")}
          className={`px-3 py-1 rounded border text-xs ${method === "paypal" ? "bg-foreground text-background" : "border-border"}`}
        >
          PayPal
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-2">{t("cred.col.plan")}</th>
              <th className="px-4 py-2">{t("cred.col.credits")}</th>
              <th className="px-4 py-2">{t("cred.col.price")}</th>
              <th className="px-4 py-2">{t("cred.col.perGrad")}</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PACKAGES.map((p) => (
              <tr key={p.name} className={p.popular ? "bg-amber-500/10" : ""}>
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  {p.popular && (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-black">
                      Popular
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{p.credits}</td>
                <td className="px-4 py-3 tabular-nums">R$ {p.price_brl.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums">R$ {(p.price_brl / p.credits).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" onClick={() => buy(p)}>
                    {t("cred.buy")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {PACKAGES.map((p) => (
          <div
            key={p.name}
            className={`rounded-lg border border-border p-4 ${p.popular ? "bg-amber-500/10" : "bg-card"}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{p.name}</span>
              {p.popular && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-black">
                  MAIS POPULAR
                </span>
              )}
            </div>
            <div className="mt-2 text-2xl font-bold">R$ {p.price_brl.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{p.credits} créditos</div>
            <Button size="sm" className="mt-3 w-full" onClick={() => buy(p)}>
              {t("cred.buy")}
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">{t("cred.history.title")}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground text-xs">
                <th className="py-1">{t("cred.history.date")}</th>
                <th>{t("cred.history.type")}</th>
                <th className="text-right">{t("cred.history.amount")}</th>
                <th>{t("cred.history.status")}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((tx: any) => (
                <tr key={tx.id} className="border-t border-border">
                  <td className="py-2 tabular-nums">{format(new Date(tx.created_at), "dd/MM/yyyy")}</td>
                  <td>{tx.package_name ?? t("cred.history.use")}</td>
                  <td className={`text-right tabular-nums ${tx.amount > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </td>
                  <td className="capitalize">{tx.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import { Coins } from "lucide-react";
import { useT } from "@/lib/i18n";

export function CreditBalance({
  balance,
  compact = false,
}: {
  balance: number;
  compact?: boolean;
}) {
  const t = useT();
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm">
        <Coins className="h-4 w-4" />
        <span className="font-mono font-semibold">{balance}</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {t("cred.balance")}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Coins className="h-7 w-7 text-amber-500" />
        <div className="text-4xl font-bold tabular-nums">{balance}</div>
      </div>
    </div>
  );
}

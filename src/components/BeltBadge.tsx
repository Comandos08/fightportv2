import { BELT_COLORS, BELT_TEXT_DARK } from "@/lib/belts";
import { useBeltLabel } from "@/lib/beltLabels";
import { cn } from "@/lib/utils";

export function BeltBadge({
  belt,
  className,
  size = "md",
}: {
  belt: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const getLabel = useBeltLabel();
  const bg = BELT_COLORS[belt] ?? "var(--belt-white)";
  const darkText = BELT_TEXT_DARK[belt];
  const sz =
    size === "sm" ? "text-[10px] px-2 py-0.5" : size === "lg" ? "text-sm px-4 py-1.5" : "text-xs px-3 py-1";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide uppercase border",
        sz,
        className,
      )}
      style={{
        background: bg,
        color: darkText ? "#1a1a1a" : "#fff",
        borderColor: darkText ? "rgba(0,0,0,.1)" : "transparent",
      }}
    >
      {getLabel(belt)}
    </span>
  );
}

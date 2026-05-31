import { useBeltLabel } from "@/lib/beltLabels";
import { cn } from "@/lib/utils";

export function getBeltTailwindClasses(belt: string | null | undefined): { wrapper: string; dot: string; gradientStyle?: string } {
  const x = (belt ?? "").toLowerCase().trim();
  if (x.includes("vermelha e preta"))
    return { wrapper: "text-[#dddddd]", dot: "bg-[#b21e1e]", gradientStyle: "linear-gradient(90deg, #b21e1e 50%, #1c1c1f 50%)" };
  if (x.includes("vermelha e branca"))
    return { wrapper: "text-[#555555]", dot: "bg-[#b21e1e]", gradientStyle: "linear-gradient(90deg, #b21e1e 50%, #eceae4 50%)" };
  if (x.includes("vermelha") || x.includes("red"))
    return { wrapper: "bg-[#fee2e2] text-[#7f1d1d]", dot: "bg-[#ef4444]" };
  if (x.includes("coral"))
    return { wrapper: "bg-[#ffe4e6] text-[#881337]", dot: "bg-[#fb7185]" };
  if (x.includes("preta") || x.includes("black"))
    return { wrapper: "bg-[#1c1c1f] border border-[#333333] text-[#dddddd]", dot: "bg-[#555555]" };
  if (x.includes("marrom") || x.includes("brown"))
    return { wrapper: "bg-[#fdf2e3] text-[#7c3012]", dot: "bg-[#92400e]" };
  if (x.includes("roxa") || x.includes("purple"))
    return { wrapper: "bg-[#ede9fe] text-[#3b0764]", dot: "bg-[#7c3aed]" };
  if (x.includes("azul") || x.includes("blue"))
    return { wrapper: "bg-[#dbeafe] text-[#1e3a5f]", dot: "bg-[#3b82f6]" };
  if (x.includes("verde") || x.includes("green"))
    return { wrapper: "bg-[#dcfce7] text-[#14532d]", dot: "bg-[#22c55e]" };
  if (x.includes("laranja") || x.includes("orange"))
    return { wrapper: "bg-[#fff0e0] text-[#a64e00]", dot: "bg-[#E07B20]" };
  if (x.includes("amarela") || x.includes("yellow"))
    return { wrapper: "bg-[#fef3c7] text-[#92400e]", dot: "bg-[#f59e0b]" };
  if (x.includes("cinza") || x.includes("grey") || x.includes("gray"))
    return { wrapper: "bg-[#e8e8e8] text-[#333333]", dot: "bg-[#888888]" };
  return { wrapper: "bg-[#f5f5f3] border border-[#e0ddd5] text-[#555555]", dot: "bg-[#cccccc]" };
}

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
  const { wrapper, dot, gradientStyle } = getBeltTailwindClasses(belt);
  const sz =
    size === "sm" ? "text-[10px] px-2 py-0.5" : size === "lg" ? "text-sm px-4 py-1.5" : "text-[11px] px-2.5 py-0.5";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full font-medium", sz, wrapper, className)}
      style={gradientStyle ? { background: gradientStyle } : undefined}
    >
      <span className={cn("w-[7px] h-[7px] rounded-full flex-shrink-0", dot)} />
      {getLabel(belt)}
    </span>
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a DB DATE string (YYYY-MM-DD) as DD/MM/YYYY without timezone conversion. */
export function formatDateBR(s: string | null | undefined): string {
  if (!s) return "—";
  const [y, m, d] = s.slice(0, 10).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

/** Format a DB DATE string (YYYY-MM-DD) as DD/MM/YY without timezone conversion. */
export function formatDateBRShort(s: string | null | undefined): string {
  if (!s) return "—";
  const [y, m, d] = s.slice(0, 10).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y.slice(-2)}`;
}

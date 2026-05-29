// Belt color tokens (CSS variables defined in styles.css).
export const BELT_COLORS: Record<string, string> = {
  Branca: "var(--belt-white)",
  Cinza: "var(--belt-grey)",
  Amarela: "var(--belt-yellow)",
  Laranja: "var(--belt-orange)",
  Verde: "var(--belt-green)",
  Azul: "var(--belt-blue)",
  Roxa: "var(--belt-purple)",
  Marrom: "var(--belt-brown)",
  Preta: "var(--belt-black)",
  Coral: "var(--belt-coral)",
  Vermelha: "var(--belt-red)",
};

export const BELT_TEXT_DARK: Record<string, boolean> = {
  Branca: true,
  Amarela: true,
  Laranja: true,
  Cinza: true,
};

/**
 * Resolves a solid CSS color (var string) for any belt value using substring matching.
 * Graded variants like "Preta 1º Grau" and compound belts like "Vermelha e Preta 7º Grau"
 * are handled correctly. For compound reds the capsule/badge uses solid red.
 */
export function beltCssColor(belt: string | null | undefined): string {
  const x = (belt ?? "").toLowerCase().trim();
  // "vermelha" catches all red variants including compound "e Preta" / "e Branca"
  if (x.includes("vermelha") || x.includes("red")) return "var(--belt-red)";
  if (x.includes("preta") || x.includes("black")) return "var(--belt-black)";
  if (x.includes("marrom") || x.includes("brown")) return "var(--belt-brown)";
  if (x.includes("roxa") || x.includes("purple")) return "var(--belt-purple)";
  if (x.includes("azul") || x.includes("blue")) return "var(--belt-blue)";
  if (x.includes("verde") || x.includes("green")) return "var(--belt-green)";
  if (x.includes("coral")) return "var(--belt-coral)";
  if (x.includes("laranja") || x.includes("orange")) return "var(--belt-orange)";
  if (x.includes("amarela") || x.includes("yellow")) return "var(--belt-yellow)";
  if (x.includes("cinza") || x.includes("grey") || x.includes("gray")) return "var(--belt-grey)";
  if (x.includes("branca") || x.includes("white")) return "var(--belt-white)";
  return "var(--belt-white)";
}

/**
 * Returns true when the belt background is light enough to need dark text.
 * Red overrides the "branca" substring in compound belts like "Vermelha e Branca".
 */
export function beltDarkText(belt: string | null | undefined): boolean {
  const x = (belt ?? "").toLowerCase().trim();
  if (x.includes("vermelha") || x.includes("red")) return false;
  return (
    x.includes("branca") || x.includes("white") ||
    x.includes("cinza") || x.includes("grey") || x.includes("gray") ||
    x.includes("amarela") || x.includes("yellow") ||
    x.includes("laranja") || x.includes("orange")
  );
}

// Canonical PT belt names in ascending hierarchy order.
// Sorting always uses canonical values; getBeltLabel handles localized display.
const BELT_ORDER: readonly string[] = [
  "Branca",
  "Cinza",
  "Amarela",
  "Laranja",
  "Verde",
  "Azul",
  "Roxa",
  "Marrom",
  "Coral",
  "Preta",
  "Preta 1º Grau",
  "Preta 2º Grau",
  "Preta 3º Grau",
  "Preta 4º Grau",
  "Preta 5º Grau",
  "Preta 6º Grau",
  "Vermelha e Preta 7º Grau",
  "Vermelha e Branca 8º Grau",
  "Vermelha 9º Grau",
  "Vermelha 10º Grau",
  "Vermelha",
];

const _BELT_RANK = new Map<string, number>(BELT_ORDER.map((b, i) => [b, i]));

/** Returns the hierarchy rank for a canonical PT belt value. Unknown belts sort last. */
export function beltRank(belt: string | null | undefined): number {
  if (!belt) return -1;
  return _BELT_RANK.get(belt) ?? BELT_ORDER.length;
}

export const MARTIAL_ARTS = [
  "Jiu-Jitsu Brasileiro",
  "Karatê",
  "Taekwondo",
  "Judô",
  "Muay Thai",
  "Boxe",
  "MMA",
  "Kickboxing",
  "Capoeira",
  "Kung Fu",
  "Aikido",
  "Hapkido",
  "Krav Maga",
  "Sambo",
  "Wrestling",
  "Sanda",
  "Outros",
] as const;

export const COACH_GRADUATIONS = ["Branca", "Azul", "Roxa", "Marrom", "Preta"] as const;

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

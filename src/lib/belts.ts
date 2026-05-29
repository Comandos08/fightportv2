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

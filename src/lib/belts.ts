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

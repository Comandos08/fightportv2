import { useLocale } from "@/lib/i18n";

const COLOR_MAP: Record<string, { en: string; es: string }> = {
  Branca:   { en: "White",  es: "Blanco"  },
  Cinza:    { en: "Grey",   es: "Gris"    },
  Amarela:  { en: "Yellow", es: "Amarillo" },
  Laranja:  { en: "Orange", es: "Naranja"  },
  Verde:    { en: "Green",  es: "Verde"    },
  Azul:     { en: "Blue",   es: "Azul"     },
  Roxa:     { en: "Purple", es: "Morado"   },
  Marrom:   { en: "Brown",  es: "Marrón"   },
  Preta:    { en: "Black",  es: "Negro"    },
  Coral:    { en: "Coral",  es: "Coral"    },
  Vermelha: { en: "Red",    es: "Rojo"     },
};

function ordEN(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

/**
 * Returns a fully-localized belt display string.
 * The canonical PT value stored in the DB is never mutated — only the displayed text changes.
 *
 * pt-BR: "Faixa Preta", "Faixa Vermelha e Branca 8º Grau"
 * en-US: "Black Belt",  "Red and White Belt 8th Degree"
 * es-ES: "Cinturón Negro", "Cinturón Rojo y Blanco 8º Grado"
 */
export function getBeltLabel(belt: string | null | undefined, locale: string): string {
  if (!belt) return "";

  if (!locale || locale.startsWith("pt")) return `Faixa ${belt}`;

  const loc: "en" | "es" = locale.startsWith("en") ? "en" : "es";

  // "Color1 e Color2 Nº Grau" (e.g. "Vermelha e Branca 8º Grau")
  const compound = belt.match(/^(\w+)\s+e\s+(\w+)\s+(\d+)º\s+Grau$/i);
  if (compound) {
    const [, c1, c2, n] = compound;
    const t1 = COLOR_MAP[c1]?.[loc] ?? c1;
    const t2 = COLOR_MAP[c2]?.[loc] ?? c2;
    const deg = parseInt(n, 10);
    if (loc === "en") return `${t1} and ${t2} Belt ${ordEN(deg)} Degree`;
    return `Cinturón ${t1} y ${t2} ${deg}º Grado`;
  }

  // "Color Nº Grau" (e.g. "Preta 1º Grau")
  const simpleDeg = belt.match(/^(\w+)\s+(\d+)º\s+Grau$/i);
  if (simpleDeg) {
    const [, c, n] = simpleDeg;
    const t = COLOR_MAP[c]?.[loc] ?? c;
    const deg = parseInt(n, 10);
    if (loc === "en") return `${t} Belt ${ordEN(deg)} Degree`;
    return `Cinturón ${t} ${deg}º Grado`;
  }

  // Simple color (e.g. "Preta", "Azul")
  const color = COLOR_MAP[belt];
  if (color) {
    if (loc === "en") return `${color.en} Belt`;
    return `Cinturón ${color.es}`;
  }

  // Unknown belt: passthrough with PT prefix
  return `Faixa ${belt}`;
}

/** React hook — re-renders the component whenever the active locale changes. */
export function useBeltLabel() {
  const locale = useLocale();
  return (belt: string | null | undefined) => getBeltLabel(belt, locale);
}

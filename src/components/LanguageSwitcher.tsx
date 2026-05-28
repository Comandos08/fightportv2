import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvailableLocales, setLocale, useLocale } from "@/lib/i18n";

const LABELS: Record<string, string> = {
  "pt-BR": "Português (BR)",
  "en-US": "English",
  "es-ES": "Español",
};

export function LanguageSwitcher() {
  const current = useLocale();
  const locales = getAvailableLocales();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Selecionar idioma">
          <Globe className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            data-active={loc === current}
            className="data-[active=true]:font-semibold"
          >
            {LABELS[loc] ?? loc}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

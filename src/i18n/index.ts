import { es } from "./es";
import { en } from "./en";

export type Lang = "es" | "en";
export type Dict = typeof es;

// If en.ts ever drifts from the es.ts shape, this assignment fails to compile,
// so `pnpm check` catches an incomplete translation.
const en_: Dict = en;

export const dictionaries: Record<Lang, Dict> = { es, en: en_ };

export function useTranslations(lang: Lang): Dict {
  return dictionaries[lang];
}

export const languages: { code: Lang; label: string; path: string }[] = [
  { code: "es", label: "Español", path: "/" },
  { code: "en", label: "English", path: "/en/" },
];

/** Opposite-language route for a given page, for the reciprocal link/hreflang. */
export function alternatePath(lang: Lang): string {
  return lang === "es" ? "/en/" : "/";
}

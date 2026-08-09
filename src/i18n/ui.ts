// Carga de traducciones. Los textos viven en en.json y es.json; este archivo
// solo los tipa y resuelve. Nombres de componentes, snippets y descripciones
// de props vienen de orn-ui/src (JSDoc en inglés) y no se traducen:
// traducirlas a mano las desincronizaría del código fuente real.
import en from './en.json';
import es from './es.json';

export const LANGUAGES = ['en', 'es'] as const;
export type Lang = (typeof LANGUAGES)[number];
export const DEFAULT_LANG: Lang = 'en';

export const LANGUAGE_LABELS: Record<Lang, string> = {
  en: 'EN',
  es: 'ES',
};

export interface UsageEntry {
  term: string;
  desc: string;
}

interface Translations {
  ui: Record<string, string>;
  // Guía de uso por componente, indexada por slug. Los componentes sin entrada
  // simplemente no muestran la sección "Uso".
  componentUsage: Record<string, UsageEntry[]>;
  // Descripciones de props traducidas, indexadas por "Componente.prop". El
  // JSDoc de orn-ui está escrito en español, así que la versión en inglés vive
  // aquí; sin entrada se muestra el texto original de la fuente.
  propDescriptions: Record<string, string>;
  // Igual que propDescriptions, para los pocos @default escritos en prosa
  // ("un placeholder gris") en vez de con un valor literal.
  propDefaults: Record<string, string>;
}

const translations: Record<Lang, Translations> = { en, es };

export type UIKey = keyof typeof en.ui;

// Las cadenas con partes variables usan marcadores {nombre}; el orden de los
// argumentos es el orden en que aparecen los marcadores en la cadena en inglés.
function interpolate(template: string, args: unknown[]): string {
  let i = 0;
  return template.replace(/\{(\w+)\}/g, () => String(args[i++] ?? ''));
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey, ...args: unknown[]): string {
    const entry = translations[lang].ui[key] ?? translations[DEFAULT_LANG].ui[key] ?? key;
    return args.length > 0 ? interpolate(entry, args) : entry;
  };
}

export function getPropDescription(
  lang: Lang,
  componentName: string,
  propName: string,
  fallback?: string
): string {
  return translations[lang].propDescriptions[`${componentName}.${propName}`] ?? fallback ?? '';
}

export function getPropDefault(
  lang: Lang,
  componentName: string,
  propName: string,
  fallback?: string | null
): string | null {
  return translations[lang].propDefaults[`${componentName}.${propName}`] ?? fallback ?? null;
}

export function getComponentUsage(lang: Lang, slug: string): UsageEntry[] {
  return translations[lang].componentUsage[slug] ?? translations[DEFAULT_LANG].componentUsage[slug] ?? [];
}

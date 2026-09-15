// Carga de traducciones. Los textos de chrome (nav, botones, títulos de
// sección) viven en en.json y es.json; los de cada componente, en
// components/<slug>/{en,es}.json. Este archivo solo los tipa y resuelve.
import en from './en.json';
import es from './es.json';
import components from '../data/components.json';

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

interface PropTranslation {
  // Descripción traducida de la prop. El JSDoc de orn-ui está escrito a veces
  // en inglés y a veces en español, así que el idioma que no coincide con la
  // fuente la traduce acá; sin entrada se muestra el texto original.
  description?: string;
  // Solo para los @default escritos en prosa ("un placeholder gris") o como
  // nombre de constante (DEFAULT_STEPS), que no le dicen nada a quien lee.
  default?: string;
}

// Un archivo por componente y por idioma: src/i18n/components/<slug>/<lang>.json.
export interface ComponentTranslations {
  // Guía de uso. Un componente sin entradas simplemente no muestra "Uso".
  usage: UsageEntry[];
  // Indexadas por nombre de prop, tal cual sale del código.
  props: Record<string, PropTranslation>;
}

const uiStrings: Record<Lang, Record<string, string>> = { en: en.ui, es: es.ui };

const componentFiles = import.meta.glob<ComponentTranslations>('./components/*/*.json', {
  eager: true,
  import: 'default',
});

// './components/avatar/es.json' -> byLang.es.avatar
const byLang: Record<Lang, Record<string, ComponentTranslations>> = { en: {}, es: {} };
for (const [path, file] of Object.entries(componentFiles)) {
  const match = /\.\/components\/([^/]+)\/(en|es)\.json$/.exec(path);
  if (match) byLang[match[2] as Lang][match[1]] = file;
}

// Las props se piden por nombre de componente (es lo que sabe la tabla) y los
// archivos van por slug (es lo que se ve en la URL); este mapa une los dos.
const SLUG_BY_NAME: Record<string, string> = Object.fromEntries(
  ['atoms', 'molecules', 'organisms']
    .flatMap((group) => (components as any)[group] as { name: string; slug: string }[])
    .map((c) => [c.name, c.slug])
);

function translationsFor(lang: Lang, componentName: string): ComponentTranslations | undefined {
  const slug = SLUG_BY_NAME[componentName];
  return slug ? byLang[lang][slug] : undefined;
}

export type UIKey = keyof typeof en.ui;

// Las cadenas con partes variables usan marcadores {nombre}; el orden de los
// argumentos es el orden en que aparecen los marcadores en la cadena en inglés.
function interpolate(template: string, args: unknown[]): string {
  let i = 0;
  return template.replace(/\{(\w+)\}/g, () => String(args[i++] ?? ''));
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey, ...args: unknown[]): string {
    const entry = uiStrings[lang][key] ?? uiStrings[DEFAULT_LANG][key] ?? key;
    return args.length > 0 ? interpolate(entry, args) : entry;
  };
}

export function getPropDescription(
  lang: Lang,
  componentName: string,
  propName: string,
  fallback?: string
): string {
  return translationsFor(lang, componentName)?.props[propName]?.description ?? fallback ?? '';
}

export function getPropDefault(
  lang: Lang,
  componentName: string,
  propName: string,
  fallback?: string | null
): string | null {
  return translationsFor(lang, componentName)?.props[propName]?.default ?? fallback ?? null;
}

export function getComponentUsage(lang: Lang, slug: string): UsageEntry[] {
  return byLang[lang][slug]?.usage ?? byLang[DEFAULT_LANG][slug]?.usage ?? [];
}

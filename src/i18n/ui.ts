// Translation loading. The chrome texts (nav, buttons, section titles)
// live in en.json and es.json; each component's, in
// components/<slug>/{en,es}.json. This file only types and resolves them.
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
  // The prop's translated description. orn-ui's JSDoc is sometimes written
  // in English and sometimes in Spanish, so the language that doesn't match
  // the source translates it here; without an entry the original text is shown.
  description?: string;
  // Only for @defaults written in prose ("a gray placeholder") or as a
  // constant name (DEFAULT_STEPS), which tell the reader nothing.
  default?: string;
}

// Un archivo por componente y por idioma: src/i18n/components/<slug>/<lang>.json.
export interface ComponentTranslations {
  // Usage guide. A component with no entries simply doesn't show "Usage".
  usage: UsageEntry[];
  // Indexed by prop name, exactly as it comes out of the code.
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

// Props are requested by component name (that's what the table knows) and
// the files go by slug (that's what's seen in the URL); this map joins the two.
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

// Strings with variable parts use {name} placeholders; the order of the
// arguments is the order the placeholders appear in the English string.
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

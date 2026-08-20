import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { GROUP_PAGES } from '../lib/groupedPages';

// Literal, no clave i18n: el índice es un solo archivo para ambos idiomas.
const GROUP_DISPLAY_NAME: Record<string, string> = { Text: 'Typography' };

/**
 * Índice del buscador global. El cliente lo descarga una vez y filtra en
 * memoria. `haystack` incluye los tags JSX de cada variante además del
 * nombre, para que buscar "TextInput" encuentre Input.
 */
export const GET: APIRoute = () => {
  const all = [...(components as any).atoms, ...(components as any).molecules, ...(components as any).organisms];

  const seen = new Set<string>();
  const entries: { name: string; category: string; slug: string; haystack: string }[] = [];

  for (const c of all) {
    const groupKey = c.sourceFile && c.sourceFile in GROUP_PAGES ? c.sourceFile : null;
    const dedupeKey = groupKey ?? c.slug;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const displayName = groupKey ? (GROUP_DISPLAY_NAME[groupKey] ?? groupKey) : c.name;
    const slug = groupKey ? GROUP_PAGES[groupKey].replace(/^\//, '') : `components/${c.slug}`;

    const codeSources: string[] = groupKey ? c.groupVariants?.map((v: any) => v.code) ?? [] : c.variants?.map((v: any) => v.code) ?? [];
    const tags = new Set<string>();
    for (const code of codeSources) {
      for (const m of String(code).matchAll(/<\/?([A-Z][A-Za-z0-9.]*)/g)) tags.add(m[1]);
    }

    const propNames = (c.props ?? []).map((p: any) => p.name).join(' ');

    entries.push({
      name: displayName,
      category: c.category,
      slug,
      haystack: [displayName, c.name, ...tags, propNames].join(' ').toLowerCase(),
    });
  }

  entries.push(
    // El haystack va bilingüe a propósito (el índice es uno solo para los dos
    // idiomas). La tabla de compatibilidad vive en esta página, así que buscar
    // "expo", "sdk 54" o "compatibilidad" tiene que traer acá.
    { name: 'Getting Started', category: 'Guide', slug: 'getting-started', haystack: 'getting started install instalacion uiprovider setup safeareauiprovider compatibility compatibilidad expo expo go sdk 54 55 56 57 react-native 0.81 0.83 0.85 0.86 peer dependencies peerdependencies requisitos versiones versions' },
    { name: 'Atomic Design', category: 'Guide', slug: 'atomic-design', haystack: 'atomic design diseño atomico atoms molecules organisms atomos moleculas organismos methodology metodologia architecture arquitectura why orn-ui' },
    { name: 'Tokens', category: 'Guide', slug: 'tokens', haystack: 'tokens spacing radius font size duration' }
  );

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { GROUP_PAGES } from '../lib/groupedPages';

// Label mostrado en resultados de búsqueda para un grupo (no un i18n key:
// el índice es un solo archivo compartido por ambos idiomas — la UI de
// búsqueda es English-first, como el resto de nombres de componentes).
const GROUP_DISPLAY_NAME: Record<string, string> = { Text: 'Typography' };

/**
 * Índice para el buscador global (Cmd/Ctrl+K). Un solo archivo, servido
 * estático, el cliente lo fetchea una vez y filtra en memoria — nada de
 * pegarle a un endpoint por tecla. `haystack` es lo que se matchea:
 * nombre del componente + el/los tag(s) JSX que renderiza cada variante
 * (p.ej. buscar "TextInput" encuentra Input, aunque el componente se
 * llame distinto al primitivo de RN que usa por debajo) + nombres de
 * props — "desde el tag hasta el nombre", no un simple substring del
 * nombre.
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

    // Tags JSX usados: de las variantes propias + (si es un grupo) de
    // TODAS las variantes sin filtrar del archivo compartido.
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

  // Getting Started y Tokens también son "cosas que se buscan" aunque no
  // sean componentes — se listan a mano, son 2 páginas fijas.
  entries.push(
    { name: 'Getting Started', category: 'Guide', slug: 'getting-started', haystack: 'getting started install uiprovider setup safeareauiprovider' },
    { name: 'Tokens', category: 'Guide', slug: 'tokens', haystack: 'tokens spacing radius font size duration' }
  );

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};

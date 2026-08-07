import { GROUP_PAGES, GROUP_LABEL_KEYS } from './groupedPages';
import { getRelativeLocaleUrl } from 'astro:i18n';
import type { Lang } from '../i18n/ui';

export interface NavCard {
  label: string;
  href: string;
  filterNames: string;
  mediaSlug: string;
}

/**
 * Varios componentes pueden salir del mismo archivo fuente (Title/Subtitle/
 * Body/Caption son las 4 variantes de Text.tsx) — cada uno tiene su propia
 * entrada en components.json, pero en la nav (home grid, sidebar) son un
 * solo item, no cuatro casi idénticos. Se agrupan por `sourceFile`
 * consecutivo (ya vienen así ordenados desde extract-docs.mjs: primario
 * primero, siblings después). Compartido entre HomeContent.astro y
 * Sidebar.astro — antes vivía duplicado en cada uno.
 */
export function groupCards(list: any[], lang: Lang, t: (key: any) => string): NavCard[] {
  const groups: { primary: any; members: any[] }[] = [];
  for (const c of list) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.primary.sourceFile === c.sourceFile) {
      lastGroup.members.push(c);
    } else {
      groups.push({ primary: c, members: [c] });
    }
  }
  return groups.map((g) => {
    const isGroup = g.members.length > 1;
    const groupHref = isGroup ? GROUP_PAGES[g.primary.sourceFile] : undefined;
    const labelKey = isGroup ? GROUP_LABEL_KEYS[g.primary.sourceFile] : undefined;
    return {
      label: labelKey ? t(labelKey) : isGroup ? g.primary.sourceFile : g.primary.name,
      href: groupHref ? getRelativeLocaleUrl(lang, groupHref) : getRelativeLocaleUrl(lang, `/components/${g.primary.slug}`),
      filterNames: g.members.map((m: any) => m.name.toLowerCase()).join(' '),
      mediaSlug: g.primary.mediaSlug,
    };
  });
}

/**
 * Mismo orden que ve el sidebar (Atoms → Molecules → Organisms, cada
 * grupo colapsado a un item), aplanado en una sola lista — para el link
 * "Siguiente" al pie de cada página de item. Único punto de verdad: si
 * el orden del sidebar cambia, "Siguiente" lo sigue automáticamente.
 */
export function getFlatNavList(components: any, lang: Lang, t: (key: any) => string): NavCard[] {
  return (['atoms', 'molecules', 'organisms'] as const).flatMap((cat) => groupCards(components[cat], lang, t));
}

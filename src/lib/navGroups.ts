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
 * Colapsa a un solo item los componentes que comparten archivo fuente
 * (Text.tsx → Title/Subtitle/Body/Caption). Depende de que vengan
 * ordenados con el primario primero, como los emite extract-docs.mjs.
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

/** Mismo orden del sidebar, aplanado — lo usan los links Anterior/Siguiente. */
export function getFlatNavList(components: any, lang: Lang, t: (key: any) => string): NavCard[] {
  return (['atoms', 'molecules', 'organisms'] as const).flatMap((cat) => groupCards(components[cat], lang, t));
}

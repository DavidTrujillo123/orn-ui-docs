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
 * Collapses into a single item the components that share a source file
 * (Text.tsx → Title/Subtitle/Body/Caption). Depends on them coming sorted
 * with the primary first, as extract-docs.mjs emits them.
 *
 * Returns the result alphabetically within the category. The ordering is
 * applied here and not in extract-docs.mjs for two reasons: grouping has to
 * happen before sorting —otherwise the siblings of the same file scatter and
 * the collapse, which looks at consecutive items, no longer joins them— and
 * the label that gets sorted is the one that's shown, which depends on the
 * language (Text.tsx is shown as "Typography").
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
  return groups
    .map((g) => {
      const isGroup = g.members.length > 1;
      const groupHref = isGroup ? GROUP_PAGES[g.primary.sourceFile] : undefined;
      const labelKey = isGroup ? GROUP_LABEL_KEYS[g.primary.sourceFile] : undefined;
      return {
        label: labelKey ? t(labelKey) : isGroup ? g.primary.sourceFile : g.primary.name,
        href: groupHref ? getRelativeLocaleUrl(lang, groupHref) : getRelativeLocaleUrl(lang, `/components/${g.primary.slug}`),
        filterNames: g.members.map((m: any) => m.name.toLowerCase()).join(' '),
        mediaSlug: g.primary.mediaSlug,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, lang, { sensitivity: 'base' }));
}

/** Same order as the sidebar, flattened — used by the Previous/Next links. */
export function getFlatNavList(components: any, lang: Lang, t: (key: any) => string): NavCard[] {
  return (['atoms', 'molecules', 'organisms'] as const).flatMap((cat) => groupCards(components[cat], lang, t));
}

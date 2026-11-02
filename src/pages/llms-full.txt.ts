import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { buildAtomicDesignMarkdown, buildComponentMarkdown, buildGettingStartedMarkdown, buildTypographyMarkdown } from '../lib/markdown';
import { useTranslations } from '../i18n/ui';
import { isMergedIntoGroupPage } from '../lib/groupedPages';

// Full catalog in a single file. Getting Started goes first on purpose:
// it's the only thing that mentions the required <UIProvider>, and this way
// it's read before any component snippet.
export const GET: APIRoute = () => {
  const t = useTranslations('en');
  const all = [
    ...(components as any).atoms,
    ...(components as any).molecules,
    ...(components as any).organisms,
  ];
  const typographyMembers = all.filter((c: any) => c.sourceFile === 'Text');
  const body = all
    .filter((c: any) => !isMergedIntoGroupPage(c))
    .map((c: any) => buildComponentMarkdown(c, t, 'en'))
    .join('\n\n---\n\n');
  const counts = {
    atoms: (components as any).atoms.length,
    molecules: (components as any).molecules.length,
    organisms: (components as any).organisms.length,
  };
  const full = [
    buildGettingStartedMarkdown(),
    buildAtomicDesignMarkdown(t, counts),
    buildTypographyMarkdown(typographyMembers),
    body,
  ].join('\n\n---\n\n');
  return new Response(`# orn-ui — full reference\n\n${full}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

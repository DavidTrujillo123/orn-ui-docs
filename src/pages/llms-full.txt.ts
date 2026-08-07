import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { buildComponentMarkdown, buildGettingStartedMarkdown, buildTypographyMarkdown } from '../lib/markdown';
import { useTranslations } from '../i18n/ui';
import { isMergedIntoGroupPage } from '../lib/groupedPages';

// Catálogo completo en un solo archivo. Getting Started va primero a
// propósito: es lo único que menciona el <UIProvider> obligatorio, y así
// se lee antes que cualquier snippet de componente.
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
    .map((c: any) => buildComponentMarkdown(c, t))
    .join('\n\n---\n\n');
  const full = [buildGettingStartedMarkdown(), buildTypographyMarkdown(typographyMembers), body].join('\n\n---\n\n');
  return new Response(`# orn-ui — full reference\n\n${full}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

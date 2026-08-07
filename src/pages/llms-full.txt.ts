import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { buildComponentMarkdown, buildGettingStartedMarkdown, buildTypographyMarkdown } from '../lib/markdown';
import { useTranslations } from '../i18n/ui';
import { isMergedIntoGroupPage } from '../lib/groupedPages';

// Todas las páginas de componentes concatenadas en un solo Markdown — el
// "llms-full.txt" que acompaña a llms.txt en la convención llmstxt.org,
// para que un agente pueda bajar el catálogo completo en una sola
// request en vez de 35. Getting Started va PRIMERO a propósito: es la
// única fuente que menciona que todo lo de abajo necesita un
// <UIProvider> ancestor — un agente que lea esto de punta a punta la ve
// antes de llegar a cualquier snippet de componente.
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

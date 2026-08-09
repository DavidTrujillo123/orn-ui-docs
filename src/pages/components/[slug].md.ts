import type { APIRoute } from 'astro';
import components from '../../data/components.json';
import { buildComponentMarkdown } from '../../lib/markdown';
import { useTranslations } from '../../i18n/ui';
import { isMergedIntoGroupPage } from '../../lib/groupedPages';

export function getStaticPaths() {
  const all = [...(components as any).atoms, ...(components as any).molecules, ...(components as any).organisms];
  return all.filter((c) => !isMergedIntoGroupPage(c)).map((c) => ({ params: { slug: c.slug }, props: { component: c } }));
}

// Misma página en Markdown, para crawlers y LLMs que no quieran parsear HTML.
export const GET: APIRoute = ({ props }) => {
  const t = useTranslations('en');
  const markdown = buildComponentMarkdown(props.component, t, 'en');
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};

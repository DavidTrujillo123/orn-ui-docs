import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { getEntry } from 'astro:content';
import { isMergedIntoGroupPage } from '../lib/groupedPages';

// Convención llms.txt (llmstxt.org): un índice en Markdown, en la raíz,
// pensado para que un LLM entienda de un vistazo qué es el sitio y a
// dónde ir a buscar el detalle — la versión "robots.txt" para agentes de
// lenguaje en vez de crawlers tradicionales.
export const GET: APIRoute = async () => {
  const site = await getEntry('site', 'en');
  const all = [...(components as any).atoms, ...(components as any).molecules, ...(components as any).organisms];

  const lines = [
    '# orn-ui',
    '',
    `> ${site?.data.heroH1 ?? 'Fast, tree-shakeable React Native components.'}`,
    '',
    'Zero runtime dependencies — only react and react-native as peers. Every',
    'component page below has a Markdown version at the same URL plus ".md"',
    '(e.g. /components/button.md): props table, install snippet and every',
    'variant as runnable TSX, no HTML to parse.',
    '',
    '⚠️ Read Getting Started first: every component must render inside a',
    '<UIProvider> ancestor or it throws at runtime. This is not optional and',
    'not shown in the per-component snippets below.',
    '',
    '## Docs',
    '',
    '- [Getting Started](https://orn-ui.dev/getting-started.md): install + required <UIProvider> setup — read this before using any component below.',
    '- [Typography](https://orn-ui.dev/typography.md): Title, Subtitle, Body, Caption — one shared install, used together in one example.',
    '- [Tokens](https://orn-ui.dev/tokens): spacing, radius, font size and duration scales.',
    '- [Full reference](https://orn-ui.dev/llms-full.txt): every page below, concatenated into one file.',
    '- [Español](https://orn-ui.dev/es/): same site and same component pages, Spanish UI labels.',
    '',
    '## Components',
    '',
    ...all
      .filter((c: any) => !isMergedIntoGroupPage(c))
      .map((c: any) => `- [${c.name}](https://orn-ui.dev/components/${c.slug}.md): ${c.category} — orn-ui`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { getEntry } from 'astro:content';
import { isMergedIntoGroupPage } from '../lib/groupedPages';

// Índice del sitio en Markdown para agentes de lenguaje (llmstxt.org).
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
    'Runs on Expo SDK 54, 55, 56 and 57 (react-native 0.81.5 / 0.83.10 /',
    '0.85.3 / 0.86.2 respectively), and on bare React Native >=0.81 with',
    'react >=19.1. No native modules, so it also runs inside Expo Go on all',
    'of them.',
    '',
    '⚠️ Read Getting Started first: every component must render inside a',
    '<UIProvider> ancestor or it throws at runtime. This is not optional and',
    'not shown in the per-component snippets below.',
    '',
    '## Docs',
    '',
    '- [Getting Started](https://orn-ui-docs.vercel.app/getting-started.md): install + required <UIProvider> setup — read this before using any component below.',
    '- [Atomic Design](https://orn-ui-docs.vercel.app/atomic-design.md): why orn-ui exists, what the atoms/molecules/organisms split means, and how to apply it in any frontend project.',
    '- [Typography](https://orn-ui-docs.vercel.app/typography.md): Title, Subtitle, Body, Caption — one shared install, used together in one example.',
    '- [Tokens](https://orn-ui-docs.vercel.app/tokens): spacing, radius, font size and duration scales.',
    '- [Full reference](https://orn-ui-docs.vercel.app/llms-full.txt): every page below, concatenated into one file.',
    '- [Español](https://orn-ui-docs.vercel.app/es/): same site and same component pages, Spanish UI labels.',
    '',
    '## Components',
    '',
    ...all
      .filter((c: any) => !isMergedIntoGroupPage(c))
      .map((c: any) => `- [${c.name}](https://orn-ui-docs.vercel.app/components/${c.slug}.md): ${c.category} — orn-ui`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

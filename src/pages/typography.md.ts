import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { buildTypographyMarkdown } from '../lib/markdown';

export const GET: APIRoute = () => {
  const all = [...(components as any).atoms, ...(components as any).molecules, ...(components as any).organisms];
  const members = all.filter((c: any) => c.sourceFile === 'Text');
  return new Response(buildTypographyMarkdown(members), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};

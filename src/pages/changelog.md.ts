import type { APIRoute } from 'astro';
import { buildChangelogMarkdown } from '../lib/changelog';

export const GET: APIRoute = () => {
  return new Response(buildChangelogMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};

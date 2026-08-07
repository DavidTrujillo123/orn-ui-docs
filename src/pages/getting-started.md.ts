import type { APIRoute } from 'astro';
import { buildGettingStartedMarkdown } from '../lib/markdown';

export const GET: APIRoute = () => {
  return new Response(buildGettingStartedMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};

import type { APIRoute } from 'astro';
import components from '../data/components.json';
import { buildAtomicDesignMarkdown } from '../lib/markdown';
import { useTranslations } from '../i18n/ui';

export const GET: APIRoute = () => {
  const t = useTranslations('en');
  const counts = {
    atoms: (components as any).atoms.length,
    molecules: (components as any).molecules.length,
    organisms: (components as any).organisms.length,
  };
  return new Response(buildAtomicDesignMarkdown(t, counts), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};

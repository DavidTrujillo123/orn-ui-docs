import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Copy editorial del sitio, un archivo por idioma. El schema lo valida en
 * build: un campo faltante rompe el deploy en vez de publicarse roto.
 * Ver CONTENT.md.
 */
const site = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/site' }),
  schema: z.object({
    tabTitle: z.string(),
    heroH1: z.string(),
    ledePrefix: z.string(),
    ledeSuffix: z.string(),
    installOr: z.string(),
    installCliLabel: z.string(),
    installPackageLabel: z.string(),
    installHint: z.string(),
    badges: z.array(z.string()).length(3),
    footer: z.string(),
  }),
});

export const collections = { site };

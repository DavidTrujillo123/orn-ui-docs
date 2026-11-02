import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The site's editorial copy, one file per language. The schema validates it
 * at build time: a missing field breaks the deploy instead of being published broken.
 * See CONTENT.md.
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

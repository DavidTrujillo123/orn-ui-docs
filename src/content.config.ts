import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * "CMS" del sitio: cero servicios externos, cero base de datos. El copy
 * editorial (hero, badges, footer) vive en src/content/site/<lang>.json,
 * un archivo por idioma. Se edita desde el editor web de GitHub —commit
 * directo o PR— y Vercel redeploya solo con el build hook de siempre.
 * `schema` hace de validación de contenido: un campo faltante o mal
 * tipeado rompe el build (local o en Vercel) en vez de publicarse roto.
 */
const site = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/site' }),
  schema: z.object({
    tabTitle: z.string(),
    heroH1: z.string(),
    ledePrefix: z.string(),
    ledeSuffix: z.string(),
    installOr: z.string(),
    installHint: z.string(),
    badges: z.array(z.string()).length(3),
    footer: z.string(),
  }),
});

export const collections = { site };

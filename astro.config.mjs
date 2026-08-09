import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Sitio ~100% estático: sin react-native-web, sin islas de framework, sin
// runtime de React en el navegador. Cada componente se documenta con
// snippet de código + GIF grabado del simulador — no con el componente
// renderizado en vivo. Ver README para el porqué de esta decisión.
// Las únicas excepciones son dos scripts vanilla, inline y sin build step
// (public/copy.js, el theme toggle en BaseLayout): progressive enhancement
// puro, la página funciona igual con JS desactivado.
export default defineConfig({
  output: 'static',
  site: 'https://orn-ui-docs.vercel.app',
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    // Inglés vive en la raíz (/, /tokens, /components/x), español bajo
    // /es/*. Nada de negociar por header de navegador: el switcher del
    // header es el único selector de idioma, para que las páginas
    // estáticas no cambien de contenido según el visitante.
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es' },
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});

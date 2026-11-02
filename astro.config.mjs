import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// A ~100% static site: no react-native-web, no framework islands, no React
// runtime in the browser. Each component is documented with a code snippet
// + a GIF recorded from the simulator — not with the component rendered
// live. See README for the reasoning behind this decision.
// The only exceptions are two vanilla scripts, inline and without a build
// step (public/copy.js, the theme toggle in BaseLayout): pure progressive
// enhancement, the page works the same with JS disabled.
export default defineConfig({
  output: 'static',
  site: 'https://orn-ui-docs.vercel.app',
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    // English lives at the root (/, /tokens, /components/x), Spanish under
    // /es/*. No negotiating via the browser header: the header's switcher is
    // the only language selector, so static pages don't change content
    // depending on the visitor.
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

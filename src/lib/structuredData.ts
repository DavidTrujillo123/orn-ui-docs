import { GITHUB_URL, NPM_URL } from './links';

/**
 * The home page's JSON-LD, in the language passed in. It describes the
 * package, not the site: `sameAs` links npm and GitHub so search engines
 * treat the three URLs as the same entity, which is what lets a search for
 * "orn-ui" resolve to any of them instead of to `orion-ui` or `ore-ui`.
 */
export function homeJsonLd(opts: {
  description: string;
  url: string;
  lang: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'orn-ui',
    alternateName: 'orn-ui — React Native component library',
    description: opts.description,
    programmingLanguage: 'TypeScript',
    runtimePlatform: 'React Native',
    targetProduct: {
      '@type': 'SoftwareApplication',
      name: 'orn-ui',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'iOS, Android',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    codeRepository: GITHUB_URL,
    downloadUrl: NPM_URL,
    installUrl: NPM_URL,
    url: opts.url,
    inLanguage: opts.lang,
    license: 'https://opensource.org/licenses/MIT',
    author: { '@type': 'Person', name: 'David Trujillo' },
    keywords: [
      'react native ui library',
      'expo component library',
      'expo sdk 54',
      'expo sdk 55',
      'expo sdk 56',
      'expo sdk 57',
      'atomic design',
      'design system',
      'typescript',
      'zero dependencies',
    ].join(', '),
    sameAs: [NPM_URL, GITHUB_URL],
  };
}

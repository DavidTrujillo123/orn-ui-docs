// Componente -> Markdown. Fuente única del botón "Copy page" y de los
// endpoints .md. Recibe `t` para que los encabezados salgan traducidos.
import { getPropDescription, getPropDefault, DEFAULT_LANG, type Lang } from '../i18n/ui';

type T = (key: string, ...args: any[]) => string;

function escCell(s: unknown): string {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function buildComponentMarkdown(component: any, t: T, lang: Lang = DEFAULT_LANG): string {
  const lines: string[] = [];
  lines.push(`# ${component.name}`, '', `> ${component.category} — orn-ui`, '');
  lines.push(
    `> ⚠️ ${t('gs.requiresProvider')}: ${t('gs.requiresProviderNote')} See https://orn-ui-docs.vercel.app/getting-started.md`,
    ''
  );
  // Una línea, no un segundo bloque de aviso: un agente que aterriza acá
  // (y no en getting-started.md) pregunta "¿corre en mi SDK?" antes que nada,
  // y sin esto tendría que ir a buscarlo a otra página.
  lines.push(`> ${t('gs.compat.oneLine')}`, '');

  if (component.registry) {
    lines.push(`## ${t('install.title')}`, '');
    lines.push(t('install.cli'), '```bash', `npx orn-ui add ${component.slug}`, '```', '');
    lines.push(
      t('install.package'),
      '```tsx',
      'pnpm add orn-ui',
      `import { ${component.name} } from 'orn-ui/${component.slug}';`,
      '```',
      ''
    );
    if (component.registry.registryDependencies?.length > 0) {
      const deps = component.registry.registryDependencies
        .map((d: string) => (d === 'core' ? t('install.core') : d))
        .join(', ');
      lines.push(`${t('install.dependsOn')} ${deps}`, '');
    }
  }

  if (component.variants?.length > 0) {
    lines.push(`## ${t('component.variants')}`, '');
    for (const v of component.variants) {
      lines.push(`### ${v.label}`, '', '```tsx', v.code, '```', '');
    }
  }

  if (component.snippet) {
    lines.push(`## ${t('component.fullSource')}`, '', '```tsx', component.snippet, '```', '');
  }

  lines.push(`## ${t('component.props')}`, '');
  if (component.props.length > 0) {
    lines.push(
      `| ${t('props.name')} | ${t('props.type')} | ${t('props.default')} | ${t('props.description')} |`,
      '|---|---|---|---|'
    );
    for (const p of component.props) {
      const name = p.name + (p.required ? '' : '?');
      const desc = getPropDescription(lang, component.name, p.name, p.description);
      const def = getPropDefault(lang, component.name, p.name, p.defaultValue);
      lines.push(
        `| \`${escCell(name)}\` | \`${escCell(p.type)}\` | ${escCell(def ?? '—')} | ${escCell(desc || '—')} |`
      );
    }
  } else {
    lines.push(t('component.noProps'));
  }
  lines.push('');

  return lines.join('\n');
}

const TYPOGRAPHY_USAGE_EN: Record<string, string> = {
  Title: 'Page and section headings — the largest, boldest style. One or two per screen, not more.',
  Subtitle: 'Secondary heading, right below a Title, or standalone for a lighter section header.',
  Body: 'The default paragraph style — most of the text on a screen should be Body.',
  Caption: 'Small print: secondary hints, metadata, timestamps, helper text under a field.',
};

/**
 * Title/Subtitle/Body/Caption no tienen `.md` propio (ver groupedPages.ts):
 * comparten archivo, props e instalación, así que se documentan juntos.
 */
export function buildTypographyMarkdown(members: any[]): string {
  const primary = members.find((m) => m.registry) ?? members[0];
  const lines: string[] = [
    '# Typography',
    '',
    '> Atom — orn-ui',
    '',
    'Title, Subtitle, Body and Caption — 4 text styles, 1 source file',
    '(Text.tsx), 1 install. You do not have to use all four: import only',
    'the ones you need.',
    '',
    '> ⚠️ Requires <UIProvider>: like every orn-ui component, these must',
    '> render inside a <UIProvider> ancestor. See https://orn-ui-docs.vercel.app/getting-started.md',
    '',
    '> Runs on Expo SDK 54, 55, 56 and 57, and on bare React Native >=0.81',
    '> with react >=19.1. No native modules — works in Expo Go, no prebuild.',
    '',
    '## Installation',
    '',
    'One command installs the whole file — Title, Subtitle, Body and',
    'Caption all come with it, but you only import/render what you use:',
    '',
    '```bash',
    `npx orn-ui add ${primary.slug}`,
    '```',
    '',
    '```tsx',
    'pnpm add orn-ui',
    `import { ${members.map((m) => m.name).join(', ')} } from 'orn-ui/${primary.slug}';`,
    '// or just the ones you actually use, e.g.:',
    `import { Body } from 'orn-ui/${primary.slug}';`,
    '```',
    '',
    '## Usage',
    '',
    ...members.flatMap((m) => [`- **${m.name}**: ${TYPOGRAPHY_USAGE_EN[m.name] ?? ''}`]),
    '',
    '## Example — used together',
    '',
    '```tsx',
    ...members.map((m) => {
      const sample: Record<string, string> = {
        Title: '<Title>Invoice #1042</Title>',
        Subtitle: '<Subtitle>Due in 5 days</Subtitle>',
        Body: '<Body>Body text, the default paragraph style.</Body>',
        Caption: '<Caption>Last updated 2 minutes ago</Caption>',
      };
      return sample[m.name] ?? '';
    }),
    '```',
    '',
  ];

  const allVariants: Array<{ label: string; code: string }> = primary.groupVariants ?? [];
  if (allVariants.length > 0) {
    lines.push('## All variants', '');
    for (const v of allVariants) {
      lines.push(`### ${v.label}`, '', '```tsx', v.code, '```', '');
    }
  }

  const props = primary.props ?? [];
  lines.push('## Props', '', '(same for Title, Subtitle, Body and Caption)', '');
  if (props.length > 0) {
    lines.push('| Name | Type | Default | Description |', '|---|---|---|---|');
    for (const p of props) {
      const name = p.name + (p.required ? '' : '?');
      lines.push(
        `| \`${escCell(name)}\` | \`${escCell(p.type)}\` | ${escCell(p.defaultValue ?? '—')} | ${escCell(p.description || '—')} |`
      );
    }
  }
  lines.push('');

  return lines.join('\n');
}

const UI_PROVIDER_PROPS_EN: Array<[string, string, string, string]> = [
  ['children', 'React.ReactNode', '—', 'Your app — mounted once, above the navigator.'],
  ['theme?', 'ThemePair', 'defaultTheme', 'Light/dark pair. Build one with createTheme().'],
  ['defaultMode?', "'system' | 'light' | 'dark'", "'system'", 'Initial mode, uncontrolled.'],
  ['mode?', "'system' | 'light' | 'dark'", '—', 'Controlled mode — pass with onModeChange to manage it yourself.'],
  ['onModeChange?', '(mode: ThemeMode) => void', '—', 'Called on toggle when mode is controlled.'],
  ['icons?', 'IconRenderer', 'renderDefaultIcon', 'Icon renderer. Defaults to the zero-dep glyphs bundled with orn-ui.'],
  ['insets?', 'EdgeInsets', 'zeroInsets', 'Safe-area insets, typically from useSafeAreaInsets().'],
  ['labels?', 'Partial<Labels>', 'defaultLabels', 'Override any built-in string (Close, Cancel, Search…).'],
  ['allowFontScaling?', 'boolean', 'false', 'Off by default, for parity across the library.'],
];

// Mismas versiones que la tabla de GettingStartedContent.astro, y las mismas
// que corre la matriz de compatibilidad del repo: si una se mueve, las tres.
const SUPPORTED_SDKS: Array<[string, string, string]> = [
  ['54', '0.81.5', '19.1.0'],
  ['55', '0.83.10', '19.2.0'],
  ['56', '0.85.3', '19.2.3'],
  ['57', '0.86.2', '19.2.3'],
];

// Versión Markdown de GettingStartedContent.astro.
export function buildGettingStartedMarkdown(): string {
  const lines: string[] = [
    '# Getting Started — orn-ui',
    '',
    '## Compatibility',
    '',
    'Verified on Expo SDK 54, 55, 56 and 57 — every one of them, not just the',
    "newest. Each SDK gets its own sandbox with that release's exact",
    'react-native and react, and both the type check and the full test suite',
    'run against it in CI. Bare React Native works the same way: nothing in',
    'the library imports Expo.',
    '',
    '| Expo SDK | react-native | react |',
    '|---|---|---|',
    ...SUPPORTED_SDKS.map(([sdk, rn, react]) => `| ${sdk} | \`${rn}\` | \`${react}\` |`),
    '',
    'Declared as peerDependencies: `react-native >=0.81.0` and',
    '`react >=19.1.0`. `react-native-safe-area-context >=5.4.0` is optional —',
    'only `orn-ui/safe-area` imports it.',
    '',
    'No native build required: orn-ui ships no native modules, so it runs',
    'inside Expo Go on every SDK listed here.',
    '',
    '## 1. Install',
    '',
    '```bash',
    'pnpm add orn-ui',
    '# or, per component, no npm dependency:',
    'npx orn-ui add button',
    '```',
    '',
    '## 2. Wrap your app in UIProvider',
    '',
    'UIProvider is the single entry point of the library. It resolves the',
    'active theme (system or manual override) and injects icons, safe-area',
    'insets and default labels to the whole tree. Mount it once, above your',
    'navigator.',
    '',
    '```tsx',
    "import { UIProvider } from 'orn-ui';",
    '',
    'export default function App() {',
    '  return (',
    '    <UIProvider>',
    '      {/* your navigator / screens go here */}',
    '    </UIProvider>',
    '  );',
    '}',
    '```',
    '',
    '> ⚠️ Every orn-ui component and hook (useColors, useTheme, Button, Input,',
    '> all of them) throws `this hook must be used within a <UIProvider>` if',
    '> rendered outside one. There is no fallback and no silent default — it',
    '> fails loudly at runtime, not at build time.',
    '',
    '### UIProvider props',
    '',
    '| Name | Type | Default | Description |',
    '|---|---|---|---|',
    ...UI_PROVIDER_PROPS_EN.map(([n, ty, d, desc]) => `| \`${n}\` | \`${ty}\` | ${d} | ${desc} |`),
    '',
    '### Recommended: SafeAreaUIProvider',
    '',
    'UIProvider defaults insets to {top:0,bottom:0,left:0,right:0} — harmless',
    'until you open a full-screen Modal (slides under the notch) or a',
    'BottomSheet (sits flush against the gesture bar). SafeAreaUIProvider is',
    'UIProvider with useSafeAreaInsets() already wired in.',
    '',
    'It lives in its own subpath (orn-ui/safe-area), on purpose: it is the',
    'only file in the library that imports a third-party package',
    '(react-native-safe-area-context). Nothing in the main orn-ui entry',
    'point references it, so a plain `import { Button } from \'orn-ui\'`',
    'never pulls it in — the rest of the library stays zero-dependency.',
    '',
    '```bash',
    'pnpm add react-native-safe-area-context',
    '```',
    '',
    '```tsx',
    "import { SafeAreaUIProvider } from 'orn-ui/safe-area';",
    '',
    'export default function App() {',
    '  return (',
    '    <SafeAreaUIProvider>',
    '      {/* your navigator / screens go here */}',
    '    </SafeAreaUIProvider>',
    '  );',
    '}',
    '```',
    '',
    'Already mounting a `<SafeAreaProvider>` higher up (some React',
    'Navigation templates do)? Pass `mountSafeAreaProvider={false}` — a',
    'nested provider measures its own View\'s frame, not the window\'s, so',
    'insets read zero from inside it.',
    '',
    '#### SafeAreaUIProviderProps',
    '',
    'Plus every UIProvider prop above except `insets` (still accepted, but',
    'optional — it overrides the measured value instead of being required).',
    '',
    '| Name | Type | Default | Description |',
    '|---|---|---|---|',
    "| `insets?` | `EdgeInsets` | measured via useSafeAreaInsets() | Explicit override — wins over the measured value. Useful for tests, Storybook, or a screen that does not fill the window. |",
    '| `mountSafeAreaProvider?` | `boolean` | `true` | Also mount `<SafeAreaProvider>`. Set false if your app already has one above. |',
    '',
    '## 3. Use components',
    '',
    'Every component page works as shown from here — copy a variant snippet,',
    'it renders. Full catalog: https://orn-ui-docs.vercel.app/llms.txt',
    '',
  ];
  return lines.join('\n');
}

// Mismas referencias que lista AtomicDesignContent.astro, en el mismo orden:
// los números son los que citan las notas ad.sources.N.note.
const ATOMIC_DESIGN_SOURCES: Array<[number, string, string]> = [
  [1, 'Brad Frost — "Atomic Design"', 'https://bradfrost.com/blog/post/atomic-web-design/'],
  [2, 'Brad Frost — Atomic Design, ch. 2: "Atomic Design Methodology"', 'https://atomicdesign.bradfrost.com/chapter-2/'],
  [3, 'eslint-plugin-import — import/no-restricted-paths', 'https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-restricted-paths.md'],
  [4, 'dependency-cruiser', 'https://github.com/sverweij/dependency-cruiser'],
  [5, 'orn-ui', 'https://github.com/DavidTrujillo123/orn-ui'],
];

/**
 * Versión Markdown de AtomicDesignContent.astro. A diferencia de las otras
 * páginas, la prosa no se repite acá: sale de las mismas claves i18n que
 * renderiza el .astro, así que editar la traducción actualiza las dos.
 */
export function buildAtomicDesignMarkdown(t: T, counts: { atoms: number; molecules: number; organisms: number }): string {
  const layers: Array<[string, string]> = [
    ['atoms', t('group.atoms')],
    ['molecules', t('group.molecules')],
    ['organisms', t('group.organisms')],
  ];

  const lines: string[] = [
    `# ${t('ad.h1')} — orn-ui`,
    '',
    `> ${t('ad.lede')}`,
    '',
    `## ${t('ad.why.title')}`,
    '',
    t('ad.why.body1'),
    '',
    t('ad.why.body2'),
    '',
    ...[1, 2, 3].map((i) => `- **${t(`ad.why.point${i}.title`)}**: ${t(`ad.why.point${i}.body`)}`),
    '',
    '```bash',
    'npx orn-ui add button   # single component, copied into your repo',
    'pnpm add orn-ui         # whole package, tree-shakeable per subpath',
    '```',
    '',
    t('ad.why.closing'),
    '',
    `## ${t('ad.what.title')}`,
    '',
    t('ad.what.body'),
    '',
    ...layers.flatMap(([key, label]) => [
      `### ${label}`,
      '',
      t(`ad.layers.${key}.def`),
      '',
      `- ${t('ad.layers.examplesLabel')}: ${t(`ad.layers.${key}.examples`)}`,
      `- ${t('ad.layers.ruleLabel')}: ${t(`ad.layers.${key}.rule`)}`,
      '',
    ]),
    `> ${t('ad.layers.direction')}`,
    '',
    `## ${t('ad.benefits.title')}`,
    '',
    ...[1, 2, 3, 4, 5].map((i) => `- **${t(`ad.benefits.${i}.title`)}**: ${t(`ad.benefits.${i}.body`)}`),
    '',
    `## ${t('ad.how.title')}`,
    '',
    t('ad.how.body'),
    '',
    ...[1, 2, 3, 4, 5].map((i) => `${i}. **${t(`ad.how.${i}.title`)}** — ${t(`ad.how.${i}.body`)}`),
    '',
    '```text',
    'src/',
    '  components/',
    '    atoms/        Button, Input, Badge, Avatar…',
    '    molecules/    SearchField, OptionCard, InfoRow…',
    '    organisms/    Modal, List, NavigationBar…',
    '  screens/        templates + pages (your routes)',
    '```',
    '',
    `### ${t('ad.mistakes.title')}`,
    '',
    ...[1, 2, 3].map((i) => `- ${t(`ad.mistakes.${i}`)}`),
    '',
    `## ${t('ad.map.title')}`,
    '',
    t('ad.map.body', counts.atoms, counts.molecules, counts.organisms),
    '',
    'Full catalog: https://orn-ui-docs.vercel.app/llms.txt',
    '',
    `## ${t('ad.sources.title')}`,
    '',
    t('ad.sources.body'),
    '',
    ...ATOMIC_DESIGN_SOURCES.map(
      ([n, title, href]) => `${n}. [${title}](${href}) — ${t(`ad.sources.${n}.note`)}`
    ),
    '',
  ];

  return lines.join('\n');
}

// Component -> Markdown. Single source for the "Copy page" button and the
// .md endpoints. Receives `t` so the headings come out translated.
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
  // One line, not a second notice block: an agent that lands here
  // (and not on getting-started.md) asks "does it run on my SDK?" before
  // anything else, and without this it would have to look it up on another page.
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
      const only = (p as { appliesTo?: string[] }).appliesTo;
      const base = getPropDescription(lang, component.name, p.name, p.description);
      const desc = only ? `${t('props.onlyFor')}: ${only.map((v) => `'${v}'`).join(' | ')}. ${base}`.trim() : base;
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
 * Title/Subtitle/Body/Caption don't have their own `.md` (see groupedPages.ts):
 * they share file, props and installation, so they're documented together.
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
    '> Runs on Expo SDK 54, 55, 56, 57 and 58, and on bare React Native >=0.81',
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
  ['insets?', 'EdgeInsets', 'measured', 'Overrides the measured safe-area insets. Leave it out in apps; useful for tests and screenshots.'],
  ['mountSafeAreaProvider?', 'boolean', '`true`', 'Mounts a `<SafeAreaProvider>` around the app. Pass false if your app already mounts one above (expo-router does).'],
  ['keyboardAvoidance?', 'boolean', '`true`', 'Keeps the focused Input (label and error included) above the keyboard by moving the app up just enough, with no Screen or ScrollView needed. Only the root provider does it.'],
  ['labels?', 'Partial<Labels>', 'defaultLabels', 'Override any built-in string (Close, Cancel, Search…).'],
  ['allowFontScaling?', 'boolean', 'false', 'Off by default, for parity across the library.'],
];

// Same versions as the table in GettingStartedContent.astro, and the same
// ones the repo's compatibility matrix runs: if one moves, all three do.
const SUPPORTED_SDKS: Array<[string, string, string]> = [
  ['54', '0.81.5', '19.1.0'],
  ['55', '0.83.10', '19.2.0'],
  ['56', '0.85.3', '19.2.3'],
  ['57', '0.86.2', '19.2.3'],
  ['58', '0.88.1', '19.3.0'],
];

// Markdown version of GettingStartedContent.astro.
export function buildGettingStartedMarkdown(): string {
  const lines: string[] = [
    '# Getting Started — orn-ui',
    '',
    '## Compatibility',
    '',
    'Verified on Expo SDK 54, 55, 56, 57 and 58 — every one of them, not just the',
    "newest. Each SDK gets its own sandbox with that release's exact",
    'react-native and react, and both the type check and the full test suite',
    'run against it in CI. Bare React Native works the same way: nothing in',
    'the library imports Expo.',
    '',
    '| Expo SDK | react-native | react |',
    '|---|---|---|',
    ...SUPPORTED_SDKS.map(([sdk, rn, react]) => `| ${sdk} | \`${rn}\` | \`${react}\` |`),
    '',
    'Declared as peerDependencies: `react-native >=0.81.0`, `react >=19.1.0`',
    'and `react-native-safe-area-context >=5.4.0` (required since 0.3.0; it',
    'has no dependencies of its own).',
    '',
    'orn-ui ships no native modules of its own, so it runs inside Expo Go on',
    'every SDK listed here. Its one native peer,',
    '`react-native-safe-area-context`, already ships with Expo; in bare React',
    'Native, run `pod install` after adding it.',
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
    "import { UIProvider } from 'orn-ui/theme';",
    '',
    'export default function App() {',
    '  return (',
    '    <UIProvider defaultMode="system">',
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
    '### Safe area: measured for you',
    '',
    'UIProvider measures the safe-area insets itself and hands them to',
    'Screen, NavigationBar, Toast, BottomSheet and Modal. Modal and',
    'BottomSheet remeasure inside their own native window, so a full-screen',
    'Modal never slides under the notch and a BottomSheet never sits flush',
    'against the gesture bar. There is nothing to wire.',
    '',
    'It measures with `react-native-safe-area-context` (>=5.4.0), a required',
    'peer with no dependencies of its own. Expo apps already have it',
    '(expo-router and React Navigation depend on it). In bare React Native,',
    'install it and rebuild the native app:',
    '',
    '```bash',
    'pnpm add react-native-safe-area-context',
    'cd ios && pod install',
    '```',
    '',
    'Already mounting a `<SafeAreaProvider>` higher up (expo-router and some',
    'React Navigation templates do)? Pass `mountSafeAreaProvider={false}` to',
    'UIProvider and it reads the insets from that one instead of mounting',
    'its own.',
    '',
    '> Upgrading from 0.2.x? Replace `SafeAreaUIProvider` (`orn-ui/safe-area`)',
    '> with `UIProvider` from `orn-ui/theme` — the old name still works, but it',
    '> is now a deprecated alias. Drop any manual',
    '> `insets={useSafeAreaInsets()}`: `insets` now only overrides the measured',
    '> values (tests, screenshots). See https://orn-ui-docs.vercel.app/changelog',
    '',
    '## 3. Use components',
    '',
    'Every component page works as shown from here — copy a variant snippet,',
    'it renders. Full catalog: https://orn-ui-docs.vercel.app/llms.txt',
    '',
  ];
  return lines.join('\n');
}

// Same references AtomicDesignContent.astro lists, in the same order:
// the numbers are the ones the ad.sources.N.note notes cite.
const ATOMIC_DESIGN_SOURCES: Array<[number, string, string]> = [
  [1, 'Brad Frost — "Atomic Design"', 'https://bradfrost.com/blog/post/atomic-web-design/'],
  [2, 'Brad Frost — Atomic Design, ch. 2: "Atomic Design Methodology"', 'https://atomicdesign.bradfrost.com/chapter-2/'],
  [3, 'eslint-plugin-import — import/no-restricted-paths', 'https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-restricted-paths.md'],
  [4, 'dependency-cruiser', 'https://github.com/sverweij/dependency-cruiser'],
  [5, 'orn-ui', 'https://github.com/DavidTrujillo123/orn-ui'],
];

/**
 * Markdown version of AtomicDesignContent.astro. Unlike the other pages,
 * the prose isn't repeated here: it comes from the same i18n keys the
 * .astro renders, so editing the translation updates both.
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

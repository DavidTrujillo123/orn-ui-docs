// Convierte un componente de src/data/components.json a Markdown plano:
// mismo contenido que ComponentContent.astro (install, variantes, props),
// una sola fuente para el botón "Copy page as Markdown" (cliente, vía
// data-md) y para el endpoint estático /components/<slug>.md que
// consumen crawlers/LLMs. `t` es el mismo useTranslations(lang) que ya
// usa la página — así los headers salen en el idioma correcto sin
// duplicar el diccionario acá.
type T = (key: string, ...args: any[]) => string;

function escCell(s: unknown): string {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function buildComponentMarkdown(component: any, t: T): string {
  const lines: string[] = [];
  lines.push(`# ${component.name}`, '', `> ${component.category} — orn-ui`, '');
  lines.push(
    `> ⚠️ ${t('gs.requiresProvider')}: ${t('gs.requiresProviderNote')} See https://orn-ui.dev/getting-started.md`,
    ''
  );

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
      lines.push(
        `| \`${escCell(name)}\` | \`${escCell(p.type)}\` | ${escCell(p.defaultValue ?? '—')} | ${escCell(p.description || '—')} |`
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
 * Title/Subtitle/Body/Caption salen del mismo archivo (Text.tsx), tienen
 * las mismas props (TypographyProps) y se instalan con un solo comando —
 * por eso NO tienen `.md` propio cada uno (ver lib/groupedPages.ts), esto
 * los documenta juntos: un ejemplo combinado (los 4 a la vez, que es como
 * se usan en la práctica) y una nota de que instalar el archivo no
 * obliga a renderizar los 4 — cada uno se importa y se usa por separado.
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
    '> render inside a <UIProvider> ancestor. See https://orn-ui.dev/getting-started.md',
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

// Guía de setup en Markdown — misma información que
// GettingStartedContent.astro, para el endpoint /getting-started.md que
// listan llms.txt y el link de advertencia en cada .md de componente.
export function buildGettingStartedMarkdown(): string {
  const lines: string[] = [
    '# Getting Started — orn-ui',
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
    'it renders. Full catalog: https://orn-ui.dev/llms.txt',
    '',
  ];
  return lines.join('\n');
}

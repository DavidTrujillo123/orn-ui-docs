// Changelog de orn-ui. Única fuente: la página /changelog (y su versión
// /changelog.md para agentes) se generan de este archivo.
//
// Para agregar una versión: copiar el primer objeto de `releases`, ponerlo
// arriba de todo y llenarlo. Texto en inglés, escrito para quien usa la
// librería (qué cambia en su app), no para quien la mantiene. `code` entre
// backticks se renderiza como <code>. Cada grupo es un componente (o
// "Setup", "Theme", "Icons"); `page` es opcional y sobrescribe el link que
// se deduce del nombre del componente.

export type ChangeKind = 'breaking' | 'added' | 'fixed' | 'changed';

export interface ChangeGroup {
  /** Componente o área: 'Button', 'UIProvider', 'Icons'… */
  component: string;
  /** Ruta sin prefijo de idioma. Si falta, se busca el componente en el catálogo. */
  page?: string;
  items: string[];
}

export interface MigrationStep {
  title: string;
  body: string;
  before?: string;
  after?: string;
}

export interface Release {
  version: string;
  /** Fecha ISO de publicación en npm. Sin fecha = todavía no publicada. */
  date?: string;
  /** Versión publicada contra la que se compara. */
  since?: string;
  summary: string;
  changes: Partial<Record<ChangeKind, ChangeGroup[]>>;
  migration?: MigrationStep[];
}

export const CHANGE_KIND_ORDER: ChangeKind[] = ['breaking', 'added', 'fixed', 'changed'];

export const releases: Release[] = [
  {
    version: '0.3.0',
    since: '0.2.10',
    summary:
      'The safe area now works with no setup: `UIProvider` measures it itself, so `react-native-safe-area-context` becomes a required peer. Alongside it, a full accessibility and touch-target pass over the atoms, a richer Avatar, a Spinner logo slot and ten new built-in icons.',
    changes: {
      breaking: [
        {
          component: 'Setup',
          page: '/getting-started',
          items: [
            '`react-native-safe-area-context` (>=5.4.0) is now a **required** peer dependency; it used to be optional. Expo apps already ship it (expo-router and React Navigation depend on it). In bare React Native, install it and run `pod install`. It has no dependencies of its own.',
          ],
        },
        {
          component: 'UIProvider',
          page: '/getting-started',
          items: [
            'The undocumented `ModalSafeAreaBoundary` prop is removed. Modal and BottomSheet now always remeasure the safe area inside their own native window, so there is nothing to plug in.',
          ],
        },
      ],
      added: [
        {
          component: 'UIProvider',
          page: '/getting-started',
          items: [
            'Measures the safe-area insets itself and mounts a `<SafeAreaProvider>` for you. Pass `mountSafeAreaProvider={false}` if your app already mounts one higher up (expo-router does).',
          ],
        },
        {
          component: 'Avatar',
          items: [
            '`source` shows a photo clipped to the circle; if it fails to load, the avatar falls back to the initials instead of an empty circle.',
            '`name` renders initials sized to the circle and becomes the accessible name. Without a name the avatar stays decorative.',
            '`iconName` (default `user`) and `color` for the icon fallback; `children` is now optional and still overrides everything.',
            'New `initialsOf(name)` helper, exported from `orn-ui/initials-of`.',
          ],
        },
        {
          component: 'Spinner',
          items: [
            '`logo` takes any node (an Image, an Avatar) and shows it above the indicator, for splash and first-load screens.',
            '`accessibilityLabel` overrides the announced name.',
          ],
        },
        {
          component: 'Divider',
          items: [
            '`orientation="vertical"` separates items in a row and stretches to its height.',
            '`spacing` takes a spacing token and adds the same space on both sides, so you no longer hand-tune margins around dividers.',
          ],
        },
        {
          component: 'Input',
          items: ['`rightIconAccessibilityLabel` names a custom right-icon button.'],
        },
        {
          component: 'Icons',
          page: '/components/icon-button',
          items: [
            'Ten new built-in glyphs, still with zero dependencies: `menu`, `more`, `home`, `settings`, `user`, `trash`, `edit`, `share`, `heart` and `star` (25 in total). The full list is exported as `BUILT_IN_ICON_NAMES`, with the `BuiltInIconName` type.',
            '`IconName` now accepts any string, so names from your own `<UIProvider icons>` renderer type-check, while the built-ins still autocomplete. An unknown name renders nothing and warns once in development.',
          ],
        },
        {
          component: 'Theme',
          page: '/tokens',
          items: [
            'New tokens: `letterSpacing` (`tight`, `normal`, `wide`) and `lineHeight.xl`.',
            'New labels: `showPassword`, `hidePassword` and `required`, overridable through `<UIProvider labels>`.',
          ],
        },
      ],
      fixed: [
        {
          component: 'Button',
          items: [
            'The `sm` and `link` sizes reach a 44pt touch target without changing their layout.',
            'While `loading`, the button keeps its width: the label stays in place, invisible, with the spinner on top.',
            'Custom `leftIcon`/`rightIcon` get the same spacing as named icons.',
            'The press animation is skipped when Reduce Motion is on.',
          ],
        },
        {
          component: 'IconButton',
          items: ['Actually reaches the 44pt touch target its docs promised (it was 40pt, or 32pt at size 16).'],
        },
        {
          component: 'PressableScale',
          items: ['The press spring is skipped when Reduce Motion is on.'],
        },
        {
          component: 'Input',
          items: [
            '`label=""` no longer crashes.',
            'Screen readers hear "required" on required fields, and the error message as the hint.',
            'The show/hide password and right-icon buttons are 44pt and take their names from labels; the clear button name is no longer hard-coded for every icon.',
            '`editable={false}` drops the fill, so a read-only field no longer looks tappable.',
          ],
        },
        {
          component: 'Checkbox',
          items: [
            'The row is at least 44pt tall.',
            '`label=""` no longer crashes, and label-less checkboxes accept an `accessibilityLabel`.',
            '`disabled` dims the label too, not only the box.',
            'With a custom `color`, the check mark picks black or white for contrast.',
            'The check animation is skipped when Reduce Motion is on.',
          ],
        },
        {
          component: 'Badge',
          items: ['The label stays on one line and truncates instead of deforming the pill.'],
        },
        {
          component: 'Card',
          items: [
            'No longer disappears in dark mode: it gets a hairline border where the shadow does not show.',
            '`style` accepts style arrays.',
          ],
        },
        {
          component: 'Gradient',
          items: [
            'Diagonal gradients paint the corners of wide or tall boxes (they used to leave a parallelogram).',
            'No more thin lines showing through between bands, and the default is now 48 bands per segment, so full-width gradients look smooth.',
          ],
        },
        {
          component: 'Image',
          items: [
            'A broken URL now shows the fallback instead of an empty gray box, and a custom `fallback` actually appears.',
            'The default fallback shows a warning icon; fallbacks are centered.',
            'Transparent images (logos) no longer keep the gray placeholder once loaded.',
            'With `accessibilityLabel` the image is announced as an image; without it, it stays decorative.',
          ],
        },
        {
          component: 'Spinner',
          items: [
            'The ring works with any color format (`rgb()`, named colors), not only 6-digit hex.',
            'Announced as a busy progress bar, named by `text` or the `loading` label, in a polite live region.',
            '`text=""` no longer crashes.',
          ],
        },
        {
          component: 'Icons',
          page: '/components/icon-button',
          items: [
            '`warning` is now a triangle, so it no longer looks identical to `alert`.',
            'The glyph inside `alert` and `warning` stays readable on the light fills of dark mode.',
          ],
        },
      ],
      changed: [
        {
          component: 'UIProvider',
          page: '/getting-started',
          items: [
            '`insets` now only overrides the measured values (useful in tests and screenshots); leave it out in apps.',
            'The development warning about a missing `insets` prop is gone.',
            '`SafeAreaUIProvider` and the `orn-ui/safe-area` subpath are deprecated aliases of `UIProvider`. They keep working and will be removed in a later minor version.',
          ],
        },
        {
          component: 'Title',
          items: [
            'Announced as a header (`accessibilityRole="header"`, overridable), so screen readers can jump between titles.',
            'Uses `lineHeight.xl` and tight letter spacing from tokens; multi-line titles are more compact.',
          ],
        },
        {
          component: 'Subtitle',
          items: ['Semibold weight and `lineHeight.lg`, to separate it from Body.'],
        },
        {
          component: 'Caption',
          items: ['Uses `lineHeight.sm`, so multi-line captions stay together.'],
        },
        {
          component: 'Button',
          items: [
            '`md` and `lg` padding now follow the spacing tokens (16 and 20 instead of 15 and 18), so those buttons are slightly larger.',
            '`disabled` is no longer faded on top of its muted colors.',
          ],
        },
        {
          component: 'Divider',
          items: ['The line is decorative and no longer reaches the accessibility tree.'],
        },
        {
          component: 'Badge',
          items: ['Padding and letter spacing come from tokens.'],
        },
        {
          component: 'Theme',
          page: '/tokens',
          items: [
            'The `Labels` type has three new keys. If you build a complete `Labels` object yourself, add them; partial overrides through `labels` need no change.',
          ],
        },
      ],
    },
    migration: [
      {
        title: 'Make sure the peer is installed',
        body: 'Expo: nothing to do, it ships with the SDK (`npx expo install react-native-safe-area-context` if your app somehow lacks it). Bare React Native: add it and rebuild the native app.',
        after: `pnpm add react-native-safe-area-context
cd ios && pod install`,
      },
      {
        title: 'Replace SafeAreaUIProvider with UIProvider',
        body: 'Same props, same behavior. The old import still works for now, as a deprecated alias.',
        before: `import { SafeAreaUIProvider } from 'orn-ui/safe-area';

<SafeAreaUIProvider defaultMode="system">{app}</SafeAreaUIProvider>`,
        after: `import { UIProvider } from 'orn-ui/theme';

<UIProvider defaultMode="system">{app}</UIProvider>`,
      },
      {
        title: 'Drop manual insets',
        body: 'UIProvider measures the insets itself. Remove `insets={useSafeAreaInsets()}` and the `<SafeAreaProvider>` you added only for it. If your app needs its own provider anyway (expo-router mounts one), pass `mountSafeAreaProvider={false}`.',
        before: `const insets = useSafeAreaInsets();

<SafeAreaProvider>
  <UIProvider mode="system" insets={insets}>{app}</UIProvider>
</SafeAreaProvider>`,
        after: `<UIProvider defaultMode="system">{app}</UIProvider>`,
      },
    ],
  },
];

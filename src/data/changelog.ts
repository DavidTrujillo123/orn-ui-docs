// Changelog de orn-ui. Única fuente: la página /changelog (en inglés), la
// página /es/changelog (en español) y /changelog.md (para agentes, en inglés)
// se generan de este archivo.
//
// Para agregar una versión: copiar el primer objeto de `releases`, ponerlo
// arriba de todo y llenarlo. Cada texto va en los dos idiomas (`{ en, es }`),
// escrito para quien usa la librería (qué cambia en su app), no para quien la
// mantiene. `code` entre backticks se renderiza como <code>; los nombres de
// props, componentes y código no se traducen. Cada grupo es un componente (o
// "Setup", "Theme", "Icons"); `page` es opcional y sobrescribe el link que se
// deduce del nombre del componente.

import type { Lang } from '../i18n/ui';

export type ChangeKind = 'breaking' | 'added' | 'fixed' | 'changed';

/** Texto en los dos idiomas del sitio. */
export interface Localized {
  en: string;
  es: string;
}

export function tr(text: Localized, lang: Lang): string {
  return text[lang] ?? text.en;
}

export interface ChangeGroup {
  /** Componente o área: 'Button', 'UIProvider', 'Icons'… (no se traduce). */
  component: string;
  /** Ruta sin prefijo de idioma. Si falta, se busca el componente en el catálogo. */
  page?: string;
  items: Localized[];
}

export interface MigrationStep {
  title: Localized;
  body: Localized;
  before?: string;
  after?: string;
}

export interface Release {
  version: string;
  /** Fecha ISO de publicación en npm. Sin fecha = todavía no publicada. */
  date?: string;
  /** Versión publicada contra la que se compara. */
  since?: string;
  summary: Localized;
  changes: Partial<Record<ChangeKind, ChangeGroup[]>>;
  migration?: MigrationStep[];
}

export const CHANGE_KIND_ORDER: ChangeKind[] = ['breaking', 'added', 'fixed', 'changed'];

export const releases: Release[] = [
  {
    version: '0.3.0',
    since: '0.2.10',
    summary: {
      en: 'The safe area now works with no setup: `UIProvider` measures it itself, so `react-native-safe-area-context` becomes a required peer. Alongside it, a full accessibility and touch-target pass over the atoms, a richer Avatar, a Spinner logo slot and ten new built-in icons.',
      es: 'El safe area ahora funciona sin configurar nada: `UIProvider` lo mide solo, así que `react-native-safe-area-context` pasa a ser una peer dependency obligatoria. Además: una revisión completa de accesibilidad y áreas táctiles en los átomos, un Avatar más completo, un espacio para logo en Spinner y diez íconos nuevos incluidos.',
    },
    changes: {
      breaking: [
        {
          component: 'Setup',
          page: '/getting-started',
          items: [
            {
              en: '`react-native-safe-area-context` (>=5.4.0) is now a **required** peer dependency; it used to be optional. Expo apps already ship it (expo-router and React Navigation depend on it). In bare React Native, install it and run `pod install`. It has no dependencies of its own.',
              es: '`react-native-safe-area-context` (>=5.4.0) ahora es una peer dependency **obligatoria**; antes era opcional. Las apps de Expo ya la traen (expo-router y React Navigation dependen de ella). En React Native puro, instálala y corre `pod install`. No tiene dependencias propias.',
            },
          ],
        },
        {
          component: 'UIProvider',
          page: '/getting-started',
          items: [
            {
              en: 'The undocumented `ModalSafeAreaBoundary` prop is removed. Modal and BottomSheet now always remeasure the safe area inside their own native window, so there is nothing to plug in.',
              es: 'Se eliminó la prop no documentada `ModalSafeAreaBoundary`. Modal y BottomSheet ahora siempre vuelven a medir el safe area dentro de su propia ventana nativa, así que no hay nada que conectar.',
            },
          ],
        },
      ],
      added: [
        {
          component: 'UIProvider',
          page: '/getting-started',
          items: [
            {
              en: 'Measures the safe-area insets itself and mounts a `<SafeAreaProvider>` for you. Pass `mountSafeAreaProvider={false}` if your app already mounts one higher up (expo-router does).',
              es: 'Mide los insets del safe area por sí mismo y monta un `<SafeAreaProvider>` por ti. Pasa `mountSafeAreaProvider={false}` si tu app ya monta uno más arriba (expo-router lo hace).',
            },
          ],
        },
        {
          component: 'Avatar',
          items: [
            {
              en: '`source` shows a photo clipped to the circle; if it fails to load, the avatar falls back to the initials instead of an empty circle.',
              es: '`source` muestra una foto recortada en el círculo; si no carga, el avatar muestra las iniciales en vez de un círculo vacío.',
            },
            {
              en: '`name` renders initials sized to the circle and becomes the accessible name. Without a name the avatar stays decorative.',
              es: '`name` dibuja las iniciales a la medida del círculo y se usa como nombre accesible. Sin nombre, el avatar queda como decorativo.',
            },
            {
              en: '`iconName` (default `user`) and `color` for the icon fallback; `children` is now optional and still overrides everything.',
              es: '`iconName` (por defecto `user`) y `color` para el ícono de respaldo; `children` ahora es opcional y sigue teniendo prioridad sobre todo.',
            },
            {
              en: 'New `initialsOf(name)` helper, exported from `orn-ui/initials-of`.',
              es: 'Nuevo helper `initialsOf(name)`, exportado desde `orn-ui/initials-of`.',
            },
          ],
        },
        {
          component: 'Spinner',
          items: [
            {
              en: '`logo` takes any node (an Image, an Avatar) and shows it above the indicator, for splash and first-load screens.',
              es: '`logo` recibe cualquier nodo (un Image, un Avatar) y lo muestra encima del indicador, para pantallas de splash y de primera carga.',
            },
            {
              en: '`accessibilityLabel` overrides the announced name.',
              es: '`accessibilityLabel` reemplaza el nombre que anuncia el lector de pantalla.',
            },
          ],
        },
        {
          component: 'Divider',
          items: [
            {
              en: '`orientation="vertical"` separates items in a row and stretches to its height.',
              es: '`orientation="vertical"` separa elementos en una fila y se estira a su altura.',
            },
            {
              en: '`spacing` takes a spacing token and adds the same space on both sides, so you no longer hand-tune margins around dividers.',
              es: '`spacing` recibe un token de espaciado y agrega el mismo espacio a ambos lados, así ya no hay que ajustar márgenes a mano alrededor de los divisores.',
            },
          ],
        },
        {
          component: 'Input',
          items: [
            {
              en: '`rightIconAccessibilityLabel` names a custom right-icon button.',
              es: '`rightIconAccessibilityLabel` da nombre a un botón de ícono derecho personalizado.',
            },
          ],
        },
        {
          component: 'Icons',
          page: '/components/icon-button',
          items: [
            {
              en: 'Ten new built-in glyphs, still with zero dependencies: `menu`, `more`, `home`, `settings`, `user`, `trash`, `edit`, `share`, `heart` and `star` (25 in total). The full list is exported as `BUILT_IN_ICON_NAMES`, with the `BuiltInIconName` type.',
              es: 'Diez íconos nuevos incluidos, sin dependencias: `menu`, `more`, `home`, `settings`, `user`, `trash`, `edit`, `share`, `heart` y `star` (25 en total). La lista completa se exporta como `BUILT_IN_ICON_NAMES`, con el tipo `BuiltInIconName`.',
            },
            {
              en: '`IconName` now accepts any string, so names from your own `<UIProvider icons>` renderer type-check, while the built-ins still autocomplete. An unknown name renders nothing and warns once in development.',
              es: '`IconName` ahora acepta cualquier string, así los nombres de tu propio renderer `<UIProvider icons>` pasan el typecheck y los incluidos siguen autocompletándose. Un nombre desconocido no dibuja nada y avisa una vez en desarrollo.',
            },
          ],
        },
        {
          component: 'Theme',
          page: '/tokens',
          items: [
            {
              en: 'New tokens: `letterSpacing` (`tight`, `normal`, `wide`) and `lineHeight.xl`.',
              es: 'Tokens nuevos: `letterSpacing` (`tight`, `normal`, `wide`) y `lineHeight.xl`.',
            },
            {
              en: 'New labels: `showPassword`, `hidePassword` and `required`, overridable through `<UIProvider labels>`.',
              es: 'Labels nuevos: `showPassword`, `hidePassword` y `required`, que se pueden reemplazar con `<UIProvider labels>`.',
            },
          ],
        },
        {
          component: 'EmptyState',
          items: [
            {
              en: '`action={{ label, onPress, variant? }}` shows the next step as a button under the text; it stays focusable on its own.',
              es: '`action={{ label, onPress, variant? }}` muestra el siguiente paso como botón debajo del texto; se puede enfocar por separado.',
            },
            {
              en: '`testID`, and `style` accepts style arrays.',
              es: '`testID`, y `style` acepta arrays de estilos.',
            },
          ],
        },
      ],
      fixed: [
        {
          component: 'Button',
          items: [
            {
              en: 'The `sm` and `link` sizes reach a 44pt touch target without changing their layout.',
              es: 'Los tamaños `sm` y `link` alcanzan un área táctil de 44pt sin cambiar su diseño.',
            },
            {
              en: 'While `loading`, the button keeps its width: the label stays in place, invisible, with the spinner on top.',
              es: 'Con `loading`, el botón mantiene su ancho: el texto queda en su lugar, invisible, con el spinner encima.',
            },
            {
              en: 'Custom `leftIcon`/`rightIcon` get the same spacing as named icons.',
              es: 'Los `leftIcon`/`rightIcon` personalizados tienen el mismo espaciado que los íconos por nombre.',
            },
            {
              en: 'The press animation is skipped when Reduce Motion is on.',
              es: 'La animación al presionar se omite cuando "Reducir movimiento" está activo.',
            },
          ],
        },
        {
          component: 'IconButton',
          items: [
            {
              en: 'Actually reaches the 44pt touch target its docs promised (it was 40pt, or 32pt at size 16).',
              es: 'Ahora sí alcanza el área táctil de 44pt que prometía su documentación (era de 40pt, o 32pt con tamaño 16).',
            },
          ],
        },
        {
          component: 'PressableScale',
          items: [
            {
              en: 'The press spring is skipped when Reduce Motion is on.',
              es: 'El rebote al presionar se omite cuando "Reducir movimiento" está activo.',
            },
          ],
        },
        {
          component: 'Input',
          items: [
            {
              en: '`label=""` no longer crashes.',
              es: '`label=""` ya no hace fallar la app.',
            },
            {
              en: 'Screen readers hear "required" on required fields, and the error message as the hint.',
              es: 'Los lectores de pantalla anuncian "obligatorio" en los campos requeridos, y el mensaje de error como pista.',
            },
            {
              en: 'The show/hide password and right-icon buttons are 44pt and take their names from labels; the clear button name is no longer hard-coded for every icon.',
              es: 'Los botones de mostrar/ocultar contraseña y de ícono derecho miden 44pt y toman su nombre de los labels; el nombre "borrar" ya no se aplica a cualquier ícono.',
            },
            {
              en: '`editable={false}` drops the fill, so a read-only field no longer looks tappable.',
              es: '`editable={false}` quita el fondo, así un campo de solo lectura ya no parece tocable.',
            },
          ],
        },
        {
          component: 'Checkbox',
          items: [
            {
              en: 'The row is at least 44pt tall.',
              es: 'La fila mide al menos 44pt de alto.',
            },
            {
              en: '`label=""` no longer crashes, and label-less checkboxes accept an `accessibilityLabel`.',
              es: '`label=""` ya no hace fallar la app, y los checkbox sin texto aceptan un `accessibilityLabel`.',
            },
            {
              en: '`disabled` dims the label too, not only the box.',
              es: '`disabled` atenúa también el texto, no solo la casilla.',
            },
            {
              en: 'With a custom `color`, the check mark picks black or white for contrast.',
              es: 'Con un `color` personalizado, la marca elige negro o blanco según el contraste.',
            },
            {
              en: 'The check animation is skipped when Reduce Motion is on.',
              es: 'La animación al marcar se omite cuando "Reducir movimiento" está activo.',
            },
          ],
        },
        {
          component: 'Badge',
          items: [
            {
              en: 'The label stays on one line and truncates instead of deforming the pill.',
              es: 'El texto queda en una sola línea y se recorta en vez de deformar la píldora.',
            },
          ],
        },
        {
          component: 'Card',
          items: [
            {
              en: 'No longer disappears in dark mode: it gets a hairline border where the shadow does not show.',
              es: 'Ya no desaparece en modo oscuro: lleva un borde fino donde la sombra no se ve.',
            },
            {
              en: '`style` accepts style arrays.',
              es: '`style` acepta arrays de estilos.',
            },
          ],
        },
        {
          component: 'Gradient',
          items: [
            {
              en: 'Diagonal gradients paint the corners of wide or tall boxes (they used to leave a parallelogram).',
              es: 'Los degradados diagonales pintan las esquinas de cajas anchas o altas (antes dejaban un paralelogramo).',
            },
            {
              en: 'No more thin lines showing through between bands, and the default is now 48 bands per segment, so full-width gradients look smooth.',
              es: 'Ya no se ven líneas finas entre las bandas, y el valor por defecto ahora es de 48 bandas por segmento, así los degradados a todo el ancho se ven suaves.',
            },
          ],
        },
        {
          component: 'Image',
          items: [
            {
              en: 'A broken URL now shows the fallback instead of an empty gray box, and a custom `fallback` actually appears.',
              es: 'Una URL rota ahora muestra el respaldo en vez de una caja gris vacía, y un `fallback` personalizado sí aparece.',
            },
            {
              en: 'The default fallback shows a warning icon; fallbacks are centered.',
              es: 'El respaldo por defecto muestra un ícono de advertencia; los respaldos quedan centrados.',
            },
            {
              en: 'Transparent images (logos) no longer keep the gray placeholder once loaded.',
              es: 'Las imágenes transparentes (logos) ya no conservan el fondo gris una vez cargadas.',
            },
            {
              en: 'With `accessibilityLabel` the image is announced as an image; without it, it stays decorative.',
              es: 'Con `accessibilityLabel` la imagen se anuncia como imagen; sin él, queda como decorativa.',
            },
          ],
        },
        {
          component: 'Spinner',
          items: [
            {
              en: 'The ring works with any color format (`rgb()`, named colors), not only 6-digit hex.',
              es: 'El anillo funciona con cualquier formato de color (`rgb()`, colores por nombre), no solo hex de 6 dígitos.',
            },
            {
              en: 'Announced as a busy progress bar, named by `text` or the `loading` label, in a polite live region.',
              es: 'Se anuncia como barra de progreso ocupada, con el nombre de `text` o del label `loading`, en una región en vivo discreta.',
            },
            {
              en: '`text=""` no longer crashes.',
              es: '`text=""` ya no hace fallar la app.',
            },
          ],
        },
        {
          component: 'Skeleton',
          items: [
            {
              en: 'Stops pulsing when Reduce Motion is on.',
              es: 'Deja de latir cuando "Reducir movimiento" está activo.',
            },
            {
              en: '`variant="text"` lines take exactly Body\'s line height (20pt), so the paragraph no longer shifts when the real text arrives.',
              es: 'Los renglones de `variant="text"` miden exactamente el interlineado de Body (20pt), así el párrafo ya no salta cuando llega el texto real.',
            },
          ],
        },
        {
          component: 'Transition',
          items: [
            {
              en: 'Content that is hidden or on its way out leaves the accessibility tree and stops taking touches, so screen readers no longer read what is not on screen (e.g. `keepMounted` while hidden).',
              es: 'El contenido oculto o que está saliendo sale del árbol de accesibilidad y deja de recibir toques, así los lectores de pantalla ya no leen lo que no está en pantalla (por ejemplo, con `keepMounted` mientras está oculto).',
            },
            {
              en: 'Switching between light and dark no longer replays the enter animation or fires `onEntered` again.',
              es: 'Cambiar entre claro y oscuro ya no repite la animación de entrada ni vuelve a disparar `onEntered`.',
            },
          ],
        },
        {
          component: 'KeyValueRow',
          items: [
            {
              en: 'A long value wraps inside the row instead of pushing it off screen; the label keeps its width up to half the row and lines up with the first line of the value.',
              es: 'Un valor largo se parte en líneas dentro de la fila en vez de sacarla de la pantalla; el label conserva su ancho hasta la mitad de la fila y se alinea con la primera línea del valor.',
            },
            {
              en: 'Values use tabular digits, so amounts line up across rows.',
              es: 'Los valores usan dígitos tabulares, así los montos quedan alineados entre filas.',
            },
            {
              en: 'With a text label and value, screen readers read the row as one element ("Subtotal, $300.00"). Adds `testID`.',
              es: 'Con label y valor de texto, el lector de pantalla lee la fila como un solo elemento ("Subtotal, $300.00"). Se agrega `testID`.',
            },
          ],
        },
        {
          component: 'Icons',
          page: '/components/icon-button',
          items: [
            {
              en: '`warning` is now a triangle, so it no longer looks identical to `alert`.',
              es: '`warning` ahora es un triángulo, así ya no se ve igual que `alert`.',
            },
            {
              en: 'The glyph inside `alert` and `warning` stays readable on the light fills of dark mode.',
              es: 'El símbolo dentro de `alert` y `warning` sigue legible sobre los rellenos claros del modo oscuro.',
            },
          ],
        },
      ],
      changed: [
        {
          component: 'UIProvider',
          page: '/getting-started',
          items: [
            {
              en: '`insets` now only overrides the measured values (useful in tests and screenshots); leave it out in apps.',
              es: '`insets` ahora solo reemplaza los valores medidos (útil en tests y capturas); en las apps, no lo pases.',
            },
            {
              en: 'The development warning about a missing `insets` prop is gone.',
              es: 'Se eliminó el aviso de desarrollo por no pasar `insets`.',
            },
            {
              en: '`SafeAreaUIProvider` and the `orn-ui/safe-area` subpath are deprecated aliases of `UIProvider`. They keep working and will be removed in a later minor version.',
              es: '`SafeAreaUIProvider` y el subpath `orn-ui/safe-area` son alias obsoletos de `UIProvider`. Siguen funcionando y se eliminarán en una versión minor posterior.',
            },
          ],
        },
        {
          component: 'Title',
          items: [
            {
              en: 'Announced as a header (`accessibilityRole="header"`, overridable), so screen readers can jump between titles.',
              es: 'Se anuncia como encabezado (`accessibilityRole="header"`, se puede cambiar), así los lectores de pantalla pueden saltar entre títulos.',
            },
            {
              en: 'Uses `lineHeight.xl` and tight letter spacing from tokens; multi-line titles are more compact.',
              es: 'Usa `lineHeight.xl` y el espaciado de letras `tight` de los tokens; los títulos de varias líneas quedan más compactos.',
            },
          ],
        },
        {
          component: 'Subtitle',
          items: [
            {
              en: 'Semibold weight and `lineHeight.lg`, to separate it from Body.',
              es: 'Peso semibold y `lineHeight.lg`, para distinguirlo de Body.',
            },
          ],
        },
        {
          component: 'Caption',
          items: [
            {
              en: 'Uses `lineHeight.sm`, so multi-line captions stay together.',
              es: 'Usa `lineHeight.sm`, así las leyendas de varias líneas se mantienen juntas.',
            },
          ],
        },
        {
          component: 'Button',
          items: [
            {
              en: '`md` and `lg` padding now follow the spacing tokens (16 and 20 instead of 15 and 18), so those buttons are slightly larger.',
              es: 'El padding de `md` y `lg` ahora sigue los tokens de espaciado (16 y 20 en vez de 15 y 18), así esos botones quedan un poco más grandes.',
            },
            {
              en: '`disabled` is no longer faded on top of its muted colors.',
              es: '`disabled` ya no se atenúa encima de sus colores apagados.',
            },
          ],
        },
        {
          component: 'Divider',
          items: [
            {
              en: 'The line is decorative and no longer reaches the accessibility tree.',
              es: 'La línea es decorativa y ya no aparece en el árbol de accesibilidad.',
            },
          ],
        },
        {
          component: 'Badge',
          items: [
            {
              en: 'Padding and letter spacing come from tokens.',
              es: 'El padding y el espaciado de letras salen de los tokens.',
            },
          ],
        },
        {
          component: 'Skeleton',
          items: [
            {
              en: 'Stronger placeholder color so it stands out from cards: `#e3e5e8` in light (was `#eceef1`), `#2c2c30` in dark (was `#26262a`).',
              es: 'Color más marcado para que se distinga de las tarjetas: `#e3e5e8` en claro (antes `#eceef1`) y `#2c2c30` en oscuro (antes `#26262a`).',
            },
          ],
        },
        {
          component: 'EmptyState',
          items: [
            {
              en: 'The title uses the main text color, so it stands apart from the description.',
              es: 'El título usa el color de texto principal, así se distingue de la descripción.',
            },
            {
              en: 'Spacing and line heights come from tokens: 12pt between icon and title, 4pt between title and description.',
              es: 'Espaciado e interlineado salen de los tokens: 12pt entre ícono y título, 4pt entre título y descripción.',
            },
          ],
        },
        {
          component: 'Theme',
          page: '/tokens',
          items: [
            {
              en: 'The `Labels` type has three new keys. If you build a complete `Labels` object yourself, add them; partial overrides through `labels` need no change.',
              es: 'El tipo `Labels` tiene tres claves nuevas. Si armas un objeto `Labels` completo a mano, agrégalas; los reemplazos parciales con `labels` no necesitan cambios.',
            },
          ],
        },
      ],
    },
    migration: [
      {
        title: {
          en: 'Make sure the peer is installed',
          es: 'Asegúrate de tener la peer dependency instalada',
        },
        body: {
          en: 'Expo: nothing to do, it ships with the SDK (`npx expo install react-native-safe-area-context` if your app somehow lacks it). Bare React Native: add it and rebuild the native app.',
          es: 'Expo: no hay que hacer nada, viene con el SDK (`npx expo install react-native-safe-area-context` si por algún motivo tu app no la tiene). React Native puro: agrégala y vuelve a compilar la app nativa.',
        },
        after: `pnpm add react-native-safe-area-context
cd ios && pod install`,
      },
      {
        title: {
          en: 'Replace SafeAreaUIProvider with UIProvider',
          es: 'Cambia SafeAreaUIProvider por UIProvider',
        },
        body: {
          en: 'Same props, same behavior. The old import still works for now, as a deprecated alias.',
          es: 'Mismas props, mismo comportamiento. El import viejo sigue funcionando por ahora, como alias obsoleto.',
        },
        before: `import { SafeAreaUIProvider } from 'orn-ui/safe-area';

<SafeAreaUIProvider defaultMode="system">{app}</SafeAreaUIProvider>`,
        after: `import { UIProvider } from 'orn-ui/theme';

<UIProvider defaultMode="system">{app}</UIProvider>`,
      },
      {
        title: {
          en: 'Drop manual insets',
          es: 'Quita los insets manuales',
        },
        body: {
          en: 'UIProvider measures the insets itself. Remove `insets={useSafeAreaInsets()}` and the `<SafeAreaProvider>` you added only for it. If your app needs its own provider anyway (expo-router mounts one), pass `mountSafeAreaProvider={false}`.',
          es: 'UIProvider mide los insets solo. Quita `insets={useSafeAreaInsets()}` y el `<SafeAreaProvider>` que agregaste solo para eso. Si tu app necesita su propio provider de todas formas (expo-router monta uno), pasa `mountSafeAreaProvider={false}`.',
        },
        before: `const insets = useSafeAreaInsets();

<SafeAreaProvider>
  <UIProvider mode="system" insets={insets}>{app}</UIProvider>
</SafeAreaProvider>`,
        after: `<UIProvider defaultMode="system">{app}</UIProvider>`,
      },
    ],
  },
];

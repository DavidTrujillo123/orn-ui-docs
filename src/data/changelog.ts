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
          component: 'AvatarHeader',
          items: [
            {
              en: 'No more built-in bottom margin (it was `spacing.xl`, 20pt): the space below belongs to the parent. If you relied on it, add `style={{ marginBottom: 20 }}` or a `gap` in the container.',
              es: 'Ya no trae margen inferior propio (era `spacing.xl`, 20pt): el espacio de abajo lo pone el padre. Si dependías de él, agrega `style={{ marginBottom: 20 }}` o un `gap` en el contenedor.',
            },
          ],
        },
        {
          component: 'Input',
          items: [
            {
              en: '`required` now validates: leaving an empty required field shows `labels.requiredError`. If you validate yourself, keep passing `error` (it wins) or use `validateOn="submit"`.',
              es: '`required` ahora valida: salir de un campo obligatorio vacío muestra `labels.requiredError`. Si validas por tu cuenta, sigue pasando `error` (manda) o usa `validateOn="submit"`.',
            },
          ],
        },
        {
          component: 'Fab',
          items: [
            {
              en: 'By default the button now sits above the safe area (`bottom` + `insets.bottom`). If you added the inset yourself, drop it; above a tab bar, pass `safeArea={false}`.',
              es: 'Por defecto el botón ahora queda por encima del safe area (`bottom` + `insets.bottom`). Si sumabas el inset a mano, quítalo; encima de una tab bar, pasa `safeArea={false}`.',
            },
          ],
        },
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
          component: 'Icon',
          items: [
            {
              en: 'New built-in `scan` glyph (a viewfinder). SearchList uses it on its `onScanPress` button, which used to show a magnifying glass next to the search box.',
              es: 'Nuevo glifo incluido `scan` (un visor). SearchList lo usa en su botón `onScanPress`, que antes mostraba una lupa al lado del buscador.',
            },
          ],
        },
        {
          component: 'Chart',
          items: [
            {
              en: '`surfaceColor`: the color behind the chart, used for the donut hole and the ring around points. Defaults to `surfaceRaised`, since a Chart usually sits in a Card (in dark the hole used to be a darker disc).',
              es: '`surfaceColor`: el color detrás del gráfico, usado para el agujero del donut y el anillo de los puntos. Por defecto `surfaceRaised`, porque un Chart suele ir dentro de una Card (en oscuro el agujero era un disco más oscuro).',
            },
          ],
        },
        {
          component: 'BottomSheet',
          items: [
            {
              en: '`inline`: draws the sheet inside its parent instead of over the screen, for docs and previews (like Alert).',
              es: '`inline`: dibuja la hoja dentro de su padre en vez de sobre la pantalla, para docs y previews (como Alert).',
            },
          ],
        },
        {
          component: 'Alert',
          items: [
            {
              en: '`destructive`: the confirm button of the `confirmText`/`onConfirm` shorthand uses the error color (delete, discard).',
              es: '`destructive`: el botón de confirmar del atajo `confirmText`/`onConfirm` usa el color de error (borrar, descartar).',
            },
          ],
        },
        {
          component: 'Theme',
          page: '/tokens',
          items: [
            {
              en: '`surfaceRaised`: fill for a surface that sits on another surface (Card). Equal to `surface` in light, lighter in dark. If you build a complete palette yourself, add it.',
              es: '`surfaceRaised`: relleno de una superficie que va sobre otra (Card). Igual a `surface` en claro, más claro en oscuro. Si armas una paleta completa a mano, agrégalo.',
            },
          ],
        },
        {
          component: 'AvatarHeader',
          items: [
            {
              en: '`caption`: a third, smallest line under the subtitle. Three lines is the limit, so the header stays scannable.',
              es: '`caption`: una tercera línea, la más pequeña, bajo el subtítulo. Tres líneas es el límite, así la cabecera se lee de un vistazo.',
            },
          ],
        },
        {
          component: 'SegmentedControl',
          items: [
            {
              en: 'The selection is one indicator that slides to the new option (native driver, 200 ms); with Reduce Motion it jumps.',
              es: 'La selección es un indicador que se desliza hasta la opción nueva (driver nativo, 200 ms); con Reducir movimiento salta.',
            },
          ],
        },
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
        {
          component: 'Fab',
          items: [
            {
              en: '`safeArea` (default `true`) adds the safe-area insets to `bottom`/`right`, so the button clears the home indicator. Pass `false` above a NavigationBar or tab bar.',
              es: '`safeArea` (por defecto `true`) suma los insets del safe area a `bottom`/`right`, así el botón no queda sobre la barra de inicio. Pasa `false` encima de un NavigationBar o tab bar.',
            },
            {
              en: 'Adds `testID`.',
              es: 'Se agrega `testID`.',
            },
          ],
        },
        {
          component: 'UIProvider',
          page: '/getting-started',
          items: [
            {
              en: '`keyboardAvoidance` (default `true`): the focused Input — label and error included — always stays above the keyboard. Inside a Screen only its content moves; outside one, the root provider moves the app just enough as a fallback.',
              es: '`keyboardAvoidance` (por defecto `true`): el Input enfocado — label y error incluidos — siempre queda por encima del teclado. Dentro de un Screen se mueve solo su contenido; fuera de uno, el provider raíz sube la app lo justo como respaldo.',
            },
          ],
        },
        {
          component: 'Input',
          items: [
            {
              en: 'Built-in validation: `rules` (`minLength`, `maxLength`, `pattern`, `validate`), `validateOn` (`blur` by default, `change` or `submit`) and `onValidate`. The ref is the TextInput plus `validate()`, for checking on submit.',
              es: 'Validación integrada: `rules` (`minLength`, `maxLength`, `pattern`, `validate`), `validateOn` (`blur` por defecto, `change` o `submit`) y `onValidate`. El ref es el TextInput más `validate()`, para validar al enviar.',
            },
            {
              en: 'A shown error re-checks on every change and clears as soon as the value is fixed; new errors are announced to screen readers. Messages come from `labels`, so they translate with the app.',
              es: 'Un error visible se revalida en cada cambio y desaparece apenas se corrige; los errores nuevos se anuncian al lector de pantalla. Los mensajes salen de `labels`, así se traducen con la app.',
            },
          ],
        },
        {
          component: 'Screen',
          items: [
            {
              en: '`header` renders a fixed bar on top (back button, title): it stays put while the content scrolls or moves up for the keyboard.',
              es: '`header` dibuja una barra fija arriba (volver, título): queda en su lugar mientras el contenido scrollea o sube por el teclado.',
            },
          ],
        },
        {
          component: 'NavigationBar',
          items: [
            {
              en: '`hideOnKeyboard` (default `true`) hides a bottom bar while the keyboard is open on Android, like native tab bars.',
              es: '`hideOnKeyboard` (por defecto `true`) oculta la barra inferior mientras el teclado está abierto en Android, como las barras de pestañas nativas.',
            },
          ],
        },
      ],
      fixed: [
        {
          component: 'List',
          page: '/components/list',
          items: [
            {
              en: 'The first load is announced to screen readers ("Loading..." as a busy progress bar); the placeholders were hidden and the list was silent.',
              es: 'La primera carga se anuncia a los lectores de pantalla ("Loading..." como barra de progreso ocupada); los placeholders estaban ocultos y la lista quedaba en silencio.',
            },
            {
              en: '`ListHeaderComponent` stays on screen during the first load, with the same padding as the loaded list, so a header or search field no longer disappears and jumps back in.',
              es: '`ListHeaderComponent` sigue en pantalla durante la primera carga, con el mismo padding que la lista cargada, así un encabezado o buscador ya no desaparece y vuelve de golpe.',
            },
            {
              en: 'Default placeholder rows match a real row: a 44pt avatar (Avatar\'s default) and two Body-height lines. `containerStyle` also applies while `isReady` is false, and the empty state\'s top margin comes from the spacing scale.',
              es: 'Las filas de placeholder por defecto coinciden con una fila real: avatar de 44pt (el de Avatar) y dos líneas del alto de Body. `containerStyle` también se aplica mientras `isReady` es false, y el margen superior del estado vacío sale de la escala de espaciado.',
            },
          ],
        },
        {
          component: 'Overlays',
          page: '/components/alert',
          items: [
            {
              en: 'iOS: an overlay opened while another is open now shows. `showAlert()`/`showConfirm()` over an open BottomSheet or Modal, an Alert opened right after closing a sheet, or a sheet right after a Modal were silently dropped, because iOS presents one native modal at a time. Alert, BottomSheet, Modal and Select now share a coordinator: the new one is drawn inside the one on top, or waits until a closing one is gone. Android was not affected.',
              es: 'iOS: un overlay abierto mientras otro está abierto ahora se muestra. `showAlert()`/`showConfirm()` sobre un BottomSheet o Modal abierto, un Alert abierto justo después de cerrar un sheet, o un sheet justo después de un Modal se perdían en silencio, porque iOS presenta un solo modal nativo a la vez. Alert, BottomSheet, Modal y Select ahora comparten un coordinador: el nuevo se dibuja dentro del que está arriba, o espera a que termine de cerrarse el anterior. Android no estaba afectado.',
            },
            {
              en: 'iOS: an Alert always ends up on top. An Alert opened before, together with or after a BottomSheet or Modal is no longer covered by it.',
              es: 'iOS: un Alert siempre queda arriba. Un Alert abierto antes, junto con o después de un BottomSheet o Modal ya no queda tapado por él.',
            },
          ],
        },
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
          component: 'Fab',
          items: [
            {
              en: 'With a custom `color`, the icon picks black or white for contrast (a light fill used to get a white, unreadable icon).',
              es: 'Con un `color` propio, el ícono elige negro o blanco según el contraste (un relleno claro tenía un ícono blanco ilegible).',
            },
          ],
        },
        {
          component: 'PressableScale',
          items: [
            {
              en: 'Announced as a button by default (`accessibilityRole` can be changed), and `disabled` reaches screen readers.',
              es: 'Se anuncia como botón por defecto (`accessibilityRole` se puede cambiar) y `disabled` llega al lector de pantalla.',
            },
          ],
        },
        {
          component: 'Stepper',
          items: [
            {
              en: 'Stays visible above the keyboard while typing, like Input.',
              es: 'Queda visible por encima del teclado mientras se escribe, como Input.',
            },
            {
              en: 'The field is an adjustable element: screen-reader users swipe up/down to step the value, within the range. Its name and the buttons\' names come from `labels` (`quantity`, `increment`, `decrement`), plus a new `accessibilityLabel` prop.',
              es: 'El campo es un elemento ajustable: quien usa lector de pantalla desliza arriba/abajo para cambiar el valor, dentro del rango. Su nombre y el de los botones salen de `labels` (`quantity`, `increment`, `decrement`), y hay una prop nueva `accessibilityLabel`.',
            },
            {
              en: '`size="sm"` buttons reach a 44pt touch target.',
              es: 'Los botones de `size="sm"` alcanzan un área táctil de 44pt.',
            },
          ],
        },
        {
          component: 'OptionCard',
          items: [
            {
              en: 'Screen readers read `description` as part of the name ("Express, Tomorrow, $8 more") instead of a hint, which users can turn off.',
              es: 'El lector de pantalla lee `description` como parte del nombre ("Express, Mañana, $8 más") en lugar de como pista, que se puede desactivar.',
            },
            {
              en: 'Unselected labels use the `text` color and the vertical layout no longer shrinks the label to 11pt: every option stays legible and only the selected one stands out.',
              es: 'Las etiquetas no seleccionadas usan el color `text` y el layout vertical ya no achica la etiqueta a 11pt: todas las opciones se leen bien y solo la seleccionada resalta.',
            },
            {
              en: 'Selecting a card no longer shifts its content by half a point (the thicker border is compensated in the padding).',
              es: 'Seleccionar una tarjeta ya no mueve su contenido medio punto (el borde más grueso se compensa en el padding).',
            },
          ],
        },
        {
          component: 'InfoRow',
          items: [
            {
              en: 'Screen readers read the row as one element ("Email, jane@example.com", or the placeholder); the icon is decorative.',
              es: 'El lector de pantalla lee la fila como un solo elemento ("Email, jane@example.com", o el placeholder); el ícono es decorativo.',
            },
            {
              en: 'The value uses the type scale (14pt with its line height) and the placeholder drops the bold, so it is never mistaken for data. New `testID` prop.',
              es: 'El valor usa la escala tipográfica (14pt con su interlineado) y el placeholder deja la negrita, así nunca se confunde con un dato. Prop nueva `testID`.',
            },
          ],
        },
        {
          component: 'FormActions',
          items: [
            {
              en: 'New `testID` prop; the buttons get `<testID>-primary` and `<testID>-secondary`.',
              es: 'Prop nueva `testID`; los botones reciben `<testID>-primary` y `<testID>-secondary`.',
            },
            {
              en: 'The gap between buttons comes from the theme (`spacing.md`), and an empty `primaryLabel` no longer risks rendering a stray string.',
              es: 'El espacio entre botones sale del tema (`spacing.md`), y un `primaryLabel` vacío ya no arriesga renderizar un texto suelto.',
            },
          ],
        },
        {
          component: 'AvatarHeader',
          items: [
            {
              en: 'The title is announced as a header and the circle is hidden from screen readers (the initials only repeated the title).',
              es: 'El título se anuncia como encabezado y el círculo se oculta del lector de pantalla (las iniciales solo repetían el título).',
            },
            {
              en: 'Without `iconName` or `initials` the circle shows a `user` icon instead of staying empty, and a long subtitle wraps centered. New `testID` prop.',
              es: 'Sin `iconName` ni `initials` el círculo muestra un ícono `user` en lugar de quedar vacío, y un subtítulo largo se parte centrado. Prop nueva `testID`.',
            },
          ],
        },
        {
          component: 'SegmentedControl',
          items: [
            {
              en: 'In dark mode the selected segment takes the soft accent fill: before, it was darker than the track and looked sunken instead of selected.',
              es: 'En modo oscuro el segmento seleccionado toma el relleno suave del acento: antes era más oscuro que el track y parecía hundido en vez de seleccionado.',
            },
            {
              en: 'Every segment reaches a 44pt touch target, labels are 14pt on one line (long ones ellipsize, so segments stay equal), and pressing the selected segment no longer calls `onChange`.',
              es: 'Cada segmento alcanza un área táctil de 44pt, las etiquetas son de 14pt en una línea (las largas se cortan con puntos suspensivos, así los segmentos quedan iguales), y tocar el segmento seleccionado ya no llama a `onChange`.',
            },
          ],
        },
        {
          component: 'Steps',
          items: [
            {
              en: 'Each step announces its position and state ("Step 2 of 3: Payment, current"), with the words from `labels` (`stepOf`, `stepCompleted`, `stepCurrent`, `stepPending`); it used to be a hard-coded English "Step 2: Payment".',
              es: 'Cada paso anuncia su posición y estado ("Paso 2 de 3: Pago, actual"), con las palabras de `labels` (`stepOf`, `stepCompleted`, `stepCurrent`, `stepPending`); antes era un "Step 2: Payment" fijo en inglés.',
            },
            {
              en: 'Only the current step label takes the accent color, pending ones are lighter, and the last vertical step no longer leaves empty space below.',
              es: 'Solo la etiqueta del paso actual toma el color de acento, las pendientes son más livianas, y el último paso vertical ya no deja espacio vacío abajo.',
            },
            {
              en: 'New `testID` prop (steps get `<testID>-<index>`); the hard-coded `testID="steps-row"` on the horizontal row is gone.',
              es: 'Prop nueva `testID` (los pasos reciben `<testID>-<índice>`); se quitó el `testID="steps-row"` fijo de la fila horizontal.',
            },
          ],
        },
        {
          component: 'Alert',
          items: [
            {
              en: 'The title is announced as a header and the VoiceOver escape gesture calls `onClose`.',
              es: 'El título se anuncia como encabezado y el gesto de escape de VoiceOver llama a `onClose`.',
            },
          ],
        },
        {
          component: 'Chart',
          items: [
            {
              en: 'With Reduce Motion the marks appear in their final shape instead of growing in.',
              es: 'Con Reducir movimiento las marcas aparecen en su forma final en vez de crecer.',
            },
            {
              en: 'Docs: the props table lists every prop (it was empty), with the ones that only apply to some chart types marked.',
              es: 'Docs: la tabla de props lista todas las props (estaba vacía), marcando las que solo aplican a algunos tipos de gráfico.',
            },
          ],
        },
        {
          component: 'DatePicker',
          page: '/components/date-picker',
          items: [
            {
              en: 'The month arrows are named from `labels` (`previousMonth`, `nextMonth`); they were fixed English. Every day reaches a 44pt touch target, and in dark the calendar is a raised panel (`surfaceRaised`).',
              es: 'Las flechas de mes toman su nombre de `labels` (`previousMonth`, `nextMonth`); estaban fijas en inglés. Cada día alcanza un área táctil de 44pt, y en oscuro el calendario es un panel elevado (`surfaceRaised`).',
            },
          ],
        },
        {
          component: 'DateField',
          page: '/components/date-picker',
          items: [
            {
              en: 'The placeholder defaults to `labels.selectDate` (it was a fixed "Select a date"), the field says "required" and announces its error like Input, and it uses the same chevron icon as Select instead of a "▾" character.',
              es: 'El placeholder por defecto es `labels.selectDate` (era un "Select a date" fijo), el campo dice "obligatorio" y anuncia su error como Input, y usa el mismo ícono de chevron que Select en vez de un carácter "▾".',
            },
          ],
        },
        {
          component: 'BottomSheet',
          items: [
            {
              en: 'The close button\'s accessible name comes from `labels.close` (it was a fixed English "Close").',
              es: 'El nombre accesible del botón de cerrar sale de `labels.close` (era un "Close" fijo en inglés).',
            },
            {
              en: 'A short downward flick closes it, not only a 100pt drag; with Reduce Motion it appears and leaves without sliding; the height follows rotation.',
              es: 'Un deslizamiento corto y rápido hacia abajo la cierra, no solo un arrastre de 100pt; con Reducir movimiento aparece y se va sin deslizarse; la altura sigue la rotación.',
            },
            {
              en: 'The drag handle is visible on a light sheet (it used the near-white `border` color).',
              es: 'El handle de arrastre se ve sobre una hoja clara (usaba el color `border`, casi blanco).',
            },
          ],
        },
        {
          component: 'SymmetricGrid',
          items: [
            {
              en: 'Rows no longer overflow the container: each cell was `100 / columns %` wide plus the gap, so the right column stuck out (cut off with 3 columns). The gap now lives inside the cells and the outer edges stay flush. New `testID` prop.',
              es: 'Las filas ya no se salen del contenedor: cada celda medía `100 / columns %` más el gap, así la columna derecha sobresalía (cortada con 3 columnas). Ahora el gap va dentro de las celdas y los bordes exteriores quedan alineados. Prop nueva `testID`.',
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
          component: 'Docs',
          items: [
            {
              en: 'Every public prop now has a description (158 were undocumented), in English and Spanish, and props a component takes from another one (`Pick<…>`) show in its table.',
              es: 'Toda prop pública ahora tiene descripción (158 no la tenían), en inglés y español, y las props que un componente toma de otro (`Pick<…>`) aparecen en su tabla.',
            },
          ],
        },
        {
          component: 'Theme',
          page: '/tokens',
          items: [
            {
              en: 'The dark `border` color is lighter (`#2a2a2e` → `#3a3a40`): at 1.17:1 against `surface` it was invisible, so cards, inputs, dividers and steppers lost their outline in dark mode.',
              es: 'El color `border` oscuro es más claro (`#2a2a2e` → `#3a3a40`): con 1,17:1 contra `surface` era invisible, así tarjetas, inputs, divisores y steppers perdían el contorno en modo oscuro.',
            },
          ],
        },
        {
          component: 'Card',
          items: [
            {
              en: 'In dark mode the card is a lighter tile (new `surfaceRaised` color, `#303036`) with a 1pt border: before, it had the same fill as the surface under it and only a hairline, so on a sheet or a grid only its text showed.',
              es: 'En modo oscuro la tarjeta es un tile más claro (nuevo color `surfaceRaised`, `#303036`) con borde de 1pt: antes tenía el mismo relleno que la superficie de abajo y solo un hairline, así sobre un sheet o una grilla solo se veía su texto.',
            },
            {
              en: 'OptionCard, the Timeline pills, the Chart tooltip, the Select dropdown and Toast use the same raised fill, so in dark they also read as tiles over the surface below.',
              es: 'OptionCard, las píldoras de Timeline, el tooltip de Chart, el desplegable de Select y Toast usan el mismo relleno elevado, así en oscuro también se leen como tiles sobre la superficie de abajo.',
            },
          ],
        },
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
          component: 'Screen',
          items: [
            {
              en: 'For the keyboard, Screen now moves only its content (clipped under `header`) instead of resizing with a KeyboardAvoidingView; the header and a tab bar outside the Screen stay put. With `keyboardAvoidance={false}` on the provider it keeps the old KeyboardAvoidingView.',
              es: 'Para el teclado, Screen ahora mueve solo su contenido (recortado bajo `header`) en vez de redimensionarse con un KeyboardAvoidingView; el header y una barra de pestañas fuera del Screen no se mueven. Con `keyboardAvoidance={false}` en el provider sigue con el KeyboardAvoidingView de antes.',
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
              en: 'Stronger placeholder color so it stands out from cards: `#e3e5e8` in light (was `#eceef1`), `#44444b` in dark (was `#26262a`), lighter than the dark card fill so it shows inside cards too.',
              es: 'Color más marcado para que se distinga de las tarjetas: `#e3e5e8` en claro (antes `#eceef1`) y `#44444b` en oscuro (antes `#26262a`), más claro que el relleno de las tarjetas oscuras para que también se vea dentro de ellas.',
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
              en: 'The `Labels` type has sixteen new keys (`showPassword`, `hidePassword`, `required`, the validation messages `requiredError`, `minLengthError`, `maxLengthError`, `patternError`, and Stepper\'s `quantity`, `increment`, `decrement`, Steps\' `stepOf`, `stepCompleted`, `stepCurrent`, `stepPending`, and DatePicker\'s `previousMonth`, `nextMonth`). If you build a complete `Labels` object yourself, add them; partial overrides through `labels` need no change.',
              es: 'El tipo `Labels` tiene dieciséis claves nuevas (`showPassword`, `hidePassword`, `required`, los mensajes de validación `requiredError`, `minLengthError`, `maxLengthError`, `patternError`, las de Stepper `quantity`, `increment`, `decrement`, las de Steps `stepOf`, `stepCompleted`, `stepCurrent`, `stepPending`, y las de DatePicker `previousMonth`, `nextMonth`). Si armas un objeto `Labels` completo a mano, agrégalas; los reemplazos parciales con `labels` no necesitan cambios.',
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
      {
        title: {
          en: 'Stop adding the inset to Fab',
          es: 'Deja de sumar el inset al Fab',
        },
        body: {
          en: 'Fab now clears the safe area on its own. Remove `insets.bottom` from `bottom`; if the Fab sits above a tab bar, pass `safeArea={false}` so the inset is not counted twice.',
          es: 'Fab ahora respeta el safe area por sí solo. Quita `insets.bottom` de `bottom`; si el Fab está encima de una tab bar, pasa `safeArea={false}` para no contar el inset dos veces.',
        },
        before: `<Fab bottom={insets.bottom + 20} onPress={add} accessibilityLabel="Add" />`,
        after: `<Fab onPress={add} accessibilityLabel="Add" />`,
      },
    ],
  },
];

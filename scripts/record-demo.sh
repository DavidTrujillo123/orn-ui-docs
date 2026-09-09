#!/usr/bin/env bash
# Graba el clip de un componente corriendo su flow de Maestro contra el
# simulador, y lo deja listo para la web en public/media/<slug>.mp4 + un
# poster .jpg.
#
# Sólo h264: se probó agregar un .webm (VP9) y salía el doble de pesado que
# el mp4 a calidad equivalente en clips de UI —- planos, con mucha superficie
# lisa. h264 lo reproduce todo lo que soporta <video>, así que el segundo
# formato era peso y un paso de encode a cambio de nada.
#
# A diferencia de record.sh (GIF, captura a ciegas de ~4s mientras alguien
# maneja el simulador a mano), acá la coreografía es el flow: mismo clip cada
# vez, regenerable, y versionado junto al componente. Ver MEDIA.md.
#
# Uso:
#   scripts/record-demo.sh <slug>              # flow: .maestro/demos/*<slug>.yaml
#   scripts/record-demo.sh <slug> <flow.yaml>  # flow explícito
#   scripts/record-demo.sh <slug> --from <clip.mp4>   # sin grabar, sólo encodear
#
# Requiere: maestro, ffmpeg, un simulador booteado con la app instalada.
set -euo pipefail

SLUG="${1:?uso: scripts/record-demo.sh <slug> [flow.yaml | --from clip.mp4]}"
shift || true

DOCS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${DOCS_DIR}/public/media"

# El repo de la librería es hermano de este (ver README). El nombre del
# directorio cambió una vez ya, así que se resuelve por lo que exista y se
# puede forzar con EXAMPLE_APP_DIR.
APP_DIR="${EXAMPLE_APP_DIR:-}"
if [ -z "$APP_DIR" ]; then
  for candidate in "${DOCS_DIR}/../orn-ui/apps/example" "${DOCS_DIR}/../only-react-native-components/apps/example"; do
    [ -d "$candidate" ] && { APP_DIR="$(cd "$candidate" && pwd)"; break; }
  done
fi

SOURCE_MP4=""
FLOW=""
case "${1:-}" in
  --from) SOURCE_MP4="${2:?--from necesita un archivo}" ;;
  "")     FLOW="${APP_DIR}/.maestro/demos/${SLUG}.yaml" ;;
  *)      FLOW="$1" ;;
esac

# El ancho es el de la columna de media (280px CSS) por 2 para pantallas
# retina. Subir de ahí engorda el archivo sin que se vea nada más: el clip
# nunca se muestra más grande.
WIDTH=560
FPS=30

mkdir -p "$OUT_DIR"

if [ -z "$SOURCE_MP4" ]; then
  [ -n "$APP_DIR" ] || { echo "no encontré apps/example — exportá EXAMPLE_APP_DIR" >&2; exit 1; }
  if [ ! -f "$FLOW" ]; then
    # El nombre del flow lleva la categoría del manifest (organisms-select),
    # el slug solo no alcanza para encontrarlo.
    FLOW="$(find "${APP_DIR}/.maestro/demos" -name "*${SLUG}.yaml" | head -1)"
    [ -n "$FLOW" ] || { echo "no encontré flow de demo para '${SLUG}' en ${APP_DIR}/.maestro/demos" >&2; exit 1; }
  fi

  # Barra de estado fija: sin esto cada regrabación cambia hora y batería, y
  # el diff de un clip regenerado es ruido puro.
  xcrun simctl status_bar booted override \
    --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 \
    --cellularMode active --cellularBars 4 \
    --batteryState charged --batteryLevel 100 >/dev/null 2>&1 || true

  echo "Corriendo ${FLOW##*/}..."
  # Un `maestro test` interrumpido deja la sesión de grabación del simulador
  # tomada, y el siguiente startRecording muere con "RECORDING_FAILED
  # exit_code=16" — para siempre, hasta que se mate al proceso o se reinicie
  # el simulador. Barrer antes de arrancar hace que una corrida cancelada no
  # envenene a la siguiente.
  pkill -f 'simctl io .* recordVideo' 2>/dev/null || true

  # Maestro escribe el .mp4 de startRecording en el CWD, con el nombre que le
  # pasa el flow — por convención, el slug.
  RUN_LOG="$(mktemp -t "maestro-${SLUG}.XXXXXX")"
  run_flow() { (cd "$APP_DIR" && maestro test "$FLOW") 2>&1 | tee "$RUN_LOG"; return "${PIPESTATUS[0]}"; }
  if ! run_flow; then
    # Un solo reintento, y sólo para el fallo de grabación: si lo que falló es
    # un selector, reintentar es perder un minuto para volver a fallar igual.
    if grep -q 'RECORDING_FAILED' "$RUN_LOG"; then
      echo "reintentando ${SLUG} tras limpiar la grabación colgada..."
      pkill -f 'simctl io .* recordVideo' 2>/dev/null || true
      run_flow || { rm -f "$RUN_LOG"; exit 1; }
    else
      rm -f "$RUN_LOG"
      exit 1
    fi
  fi
  rm -f "$RUN_LOG"
  SOURCE_MP4="${APP_DIR}/${SLUG}.mp4"
  KEEP_SOURCE=0
  [ -f "$SOURCE_MP4" ] || { echo "el flow no dejó ${SLUG}.mp4 — ¿el startRecording se llama distinto?" >&2; exit 1; }
else
  KEEP_SOURCE=1
  [ -f "$SOURCE_MP4" ] || { echo "no encontré $SOURCE_MP4" >&2; exit 1; }
fi

echo "Encodeando..."
# yuv420p + faststart: sin el primero Safari no reproduce nada, sin el
# segundo el video no arranca hasta bajar el archivo entero.
ffmpeg -y -i "$SOURCE_MP4" -an \
  -vf "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos" \
  -c:v libx264 -profile:v main -crf 28 -preset slow -pix_fmt yuv420p \
  -movflags +faststart "${OUT_DIR}/${SLUG}.mp4" >/dev/null 2>&1

# Poster = primer frame. Es lo que se ve antes de que el video cargue (y lo
# único que se ve si el visitante pidió menos movimiento), así que sale del
# mismo clip y no puede desincronizarse.
ffmpeg -y -i "$SOURCE_MP4" -frames:v 1 \
  -vf "scale=${WIDTH}:-2:flags=lanczos" -q:v 4 \
  "${OUT_DIR}/${SLUG}.jpg" >/dev/null 2>&1

[ "$KEEP_SOURCE" = "1" ] || rm -f "$SOURCE_MP4"

for f in "${OUT_DIR}/${SLUG}.mp4" "${OUT_DIR}/${SLUG}.jpg"; do
  echo "  $(du -h "$f" | cut -f1)	${f#${DOCS_DIR}/}"
done

# Un clip largo casi nunca es un demo largo: es Maestro esperando a que se
# aquiete una pantalla que anima sin parar (Spinner, Skeleton, Slides). Se
# avisa en vez de fallar —el archivo sirve igual— pero conviene mirar si esa
# demo necesita recortar variantes en CLIP_VARIANTS.
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "${OUT_DIR}/${SLUG}.mp4" 2>/dev/null | cut -d. -f1)
if [ -n "$DURATION" ] && [ "$DURATION" -gt 35 ]; then
  echo "  ⚠ ${DURATION}s — largo para un loop de doc; revisá CLIP_VARIANTS para ${SLUG}"
fi

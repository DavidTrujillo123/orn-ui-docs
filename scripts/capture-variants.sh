#!/usr/bin/env bash
# Captura cada variante de un demo del example app como imagen fija, en claro
# y oscuro, para la sección "Variantes" de la página del componente.
#
#   scripts/capture-variants.sh <layer> <slug> <count> [cropY cropH]
#   VIDEO=1 scripts/capture-variants.sh atoms spinner 7 1250 380   # con movimiento
#   scripts/capture-variants.sh atoms typography 9 1300 320
#
# Abre cada variante por deep link (`ornui:///<layer>/<slug>?v=N`, lo resuelve
# VariantList del example app), así que no depende de Maestro ni de swipes.
# Escribe:
#   public/media/variants/<slug>/<N>-light.jpg
#   public/media/variants/<slug>/<N>-dark.jpg
#   public/media/<slug>.jpg        (poster: variante 1, claro, pantalla entera)
#
# Con VIDEO=1 (componentes con movimiento: spinners, skeleton, transiciones)
# además graba ~3 s de cada variante y escribe:
#   public/media/variants/<slug>/<N>-light.mp4 / <N>-dark.mp4   (loop recortado)
#   public/media/<slug>.mp4        (portada: las variantes en claro, una tras otra)
# Las .jpg quedan como poster de cada clip. Requiere ffmpeg.
#
# El recorte por defecto es la tarjeta entera del demo (iPhone 17, 1206x2622).
# Para componentes pequeños (texto, badges) conviene una banda más baja
# centrada en el contenido: pasar cropY y cropH.
#
# Requiere: un simulador booteado con la app del example instalada y, si es
# Debug, Metro corriendo (`pnpm exec expo start` en apps/example, sin CI=1).
set -euo pipefail

LAYER=${1:?layer: atoms|molecules|organisms}
SLUG=${2:?slug}
COUNT=${3:?numero de variantes}
CROP_Y=${4:-578}
CROP_H=${5:-1732}
# Tarjeta del demo sin sus bordes laterales.
CROP_X=64
CROP_W=1078

APP=com.anonymous.orn-ui-example
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/public/media/variants/$SLUG"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"; xcrun simctl ui booted appearance light >/dev/null 2>&1 || true' EXIT
mkdir -p "$OUT"

xcrun simctl status_bar booted override --time 9:41 --batteryState charged \
  --batteryLevel 100 --cellularBars 4 --wifiBars 3 >/dev/null

open_variant() {
  # El parámetro ?v= solo se lee al montar la pantalla: relanzar en frío.
  xcrun simctl terminate booted "$APP" >/dev/null 2>&1 || true
  xcrun simctl launch booted "$APP" >/dev/null
  sleep 5
  xcrun simctl openurl booted "ornui:///$LAYER/$SLUG?v=$1"
  sleep 5
}

shot() { xcrun simctl io booted screenshot "$1" >/dev/null 2>&1; }

VIDEO=${VIDEO:-0}
CLIP_S=${CLIP_S:-3}
record() { # out.mov — graba CLIP_S segundos de la pantalla
  xcrun simctl io booted recordVideo --codec=h264 --force "$1" >/dev/null 2>&1 &
  local pid=$!
  sleep "$CLIP_S"
  kill -INT "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null || true
}
# Recorta la tarjeta del demo, 540 px de ancho (360 pt en la docs a 1.5x).
to_clip() { # in.mov out.mp4
  ffmpeg -y -loglevel error -i "$1" -an -t "$CLIP_S" \
    -vf "crop=${CROP_W}:${CROP_H}:${CROP_X}:${CROP_Y},fps=30,scale=540:-2:flags=lanczos" \
    -c:v libx264 -profile:v main -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart "$2"
}
HERO_PARTS=()

to_jpg() { # in out
  sips -c "$CROP_H" "$CROP_W" --cropOffset "$CROP_Y" "$CROP_X" "$1" --out "$TMP/crop.png" >/dev/null
  sips -s format jpeg -s formatOptions 80 "$TMP/crop.png" --out "$2" >/dev/null
}

for N in $(seq 1 "$COUNT"); do
  open_variant "$N"
  xcrun simctl ui booted appearance light; sleep 2
  shot "$TMP/l.png"
  xcrun simctl ui booted appearance dark; sleep 2
  shot "$TMP/d.png"
  xcrun simctl ui booted appearance light
  to_jpg "$TMP/l.png" "$OUT/$N-light.jpg"
  to_jpg "$TMP/d.png" "$OUT/$N-dark.jpg"
  if [ "$VIDEO" = 1 ]; then
    record "$TMP/d.mov"
    xcrun simctl ui booted appearance light; sleep 1
    record "$TMP/l.mov"
    to_clip "$TMP/l.mov" "$OUT/$N-light.mp4"
    to_clip "$TMP/d.mov" "$OUT/$N-dark.mp4"
    # Portada: la pantalla entera de esta variante, 560 px de ancho.
    ffmpeg -y -loglevel error -i "$TMP/l.mov" -an -t "$CLIP_S" \
      -vf "fps=30,scale=560:-2:flags=lanczos,setsar=1" -c:v libx264 -pix_fmt yuv420p "$TMP/hero-$N.mp4"
    HERO_PARTS+=("$TMP/hero-$N.mp4")
  fi
  if [ "$N" = 1 ]; then
    sips -Z 1218 -s format jpeg -s formatOptions 80 "$TMP/l.png" --out "$ROOT/public/media/$SLUG.jpg" >/dev/null
  fi
  echo "variante $N ok"
done

if [ "$VIDEO" = 1 ] && [ ${#HERO_PARTS[@]} -gt 0 ]; then
  LIST="$TMP/hero.txt"; : > "$LIST"
  for f in "${HERO_PARTS[@]}"; do echo "file '$f'" >> "$LIST"; done
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$LIST" -an \
    -c:v libx264 -profile:v main -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart \
    "$ROOT/public/media/$SLUG.mp4"
  echo "portada: public/media/$SLUG.mp4"
fi

xcrun simctl status_bar booted clear >/dev/null
echo "listo: $OUT"

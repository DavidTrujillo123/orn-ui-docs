#!/usr/bin/env bash
# Captura cada variante de un demo del example app como imagen fija, en claro
# y oscuro, para la sección "Variantes" de la página del componente.
#
#   scripts/capture-variants.sh <layer> <slug> <count> [cropY cropH]
#   scripts/capture-variants.sh atoms typography 9 1300 320
#
# Abre cada variante por deep link (`ornui:///<layer>/<slug>?v=N`, lo resuelve
# VariantList del example app), así que no depende de Maestro ni de swipes.
# Escribe:
#   public/media/variants/<slug>/<N>-light.jpg
#   public/media/variants/<slug>/<N>-dark.jpg
#   public/media/<slug>.jpg        (poster: variante 1, claro, pantalla entera)
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
  if [ "$N" = 1 ]; then
    sips -Z 1218 -s format jpeg -s formatOptions 80 "$TMP/l.png" --out "$ROOT/public/media/$SLUG.jpg" >/dev/null
  fi
  echo "variante $N ok"
done

xcrun simctl status_bar booted clear >/dev/null
echo "listo: $OUT"

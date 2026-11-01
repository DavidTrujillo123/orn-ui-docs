#!/usr/bin/env bash
# Captura cada variante de un demo del example app como imagen fija, en claro
# y oscuro, para la sección "Variantes" de la página del componente.
#
#   scripts/capture-variants.sh <layer> <slug> <count> [cropY cropH]
#   VIDEO=1 BAND_H=560 scripts/capture-variants.sh atoms spinner 8   # con movimiento
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
# centrada en el contenido: pasar cropY y cropH, o mejor BAND_H=<alto>: busca
# el contenido de cada variante dentro de la tarjeta (cropY..cropY+cropH) en
# la captura clara y centra ahí una banda de BAND_H px, así cada variante
# queda con el mismo aire arriba y abajo y todas miden lo mismo.
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
  # recordVideo tarda en arrancar y en cerrar el archivo: si se cuenta desde
  # el lanzamiento, el clip "oscuro" se queda con 0.4 s de oscuro y el resto
  # es el fundido al claro que pide el paso siguiente (pasó con spinner: el
  # video oscuro se volvía blanco en loop). Se espera a "Recording started",
  # se graba medio segundo de más y se deja cerrar antes de seguir.
  local log="$TMP/rec.log"; : > "$log"
  xcrun simctl io booted recordVideo --codec=h264 --force "$1" >"$log" 2>&1 &
  local pid=$! i=0
  until grep -q "Recording started" "$log" || [ $i -ge 100 ]; do sleep 0.1; i=$((i + 1)); done
  sleep "$CLIP_S"; sleep 0.5
  kill -INT "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null || true
  sleep 1
}
# Luma media del fondo del clip vs la del .jpg: si no coinciden, el clip no
# es del tema que dice ser (o quedó a medias). Mejor fallar que publicarlo.
corner_luma() { ffmpeg -v error -i "$1" -vf "format=gray,crop=4:4:6:6" -frames:v 1 -f rawvideo - | od -An -tu1 | awk '{for(i=1;i<=NF;i++){s+=$i;n++}} END{print int(s/n)}'; }
last_luma() { ffmpeg -v error -sseof -0.2 -i "$1" -vf "format=gray,crop=4:4:6:6" -frames:v 1 -f rawvideo - | od -An -tu1 | awk '{for(i=1;i<=NF;i++){s+=$i;n++}} END{print int(s/n)}'; }
# Una captura sin contenido (banda mal centrada, app sin cargar) aborta: no
# se publica una tarjeta vacía. Cuenta filas con algo distinto del fondo.
check_shot() { # shot.jpg
  local rows
  rows=$(ffmpeg -v error -i "$1" -vf format=gray -f rawvideo - | node -e '
    const [W,H]=process.argv.slice(1).map(Number); const ch=[];
    process.stdin.on("data",d=>ch.push(d)).on("end",()=>{const b=Buffer.concat(ch);let r=0;
      // r: filas con contenido. edge: contenido en las 16 filas de arriba o de
      // abajo = la banda corta algo (p. ej. solo se ve la última línea).
      let edge=0;
      for(let y=0;y<H;y++){const bg=b[y*W+8];let n=0;for(let x=8;x<W-8;x++)if(Math.abs(b[y*W+x]-bg)>24)n++;if(n>3){r++;if(y<16||y>=H-16)edge++;}}
      console.log(r+" "+edge);});' $(sips -g pixelWidth -g pixelHeight "$1" | awk '/pixel/{printf "%s ", $2}'))
  set -- "$1" $rows
  if [ "$2" -lt 12 ]; then
    # soft: lo llama shot_content, que reintenta (un demo animado puede estar
    # justo en su fase oculta). Sin soft, una captura vacía aborta.
    [ "${SOFT:-0}" = 1 ] && return 1
    echo "captura $1: sin contenido visible ($2 filas) — regrabar" >&2; exit 1
  fi
  if [ "$3" -gt 0 ]; then echo "captura $1: contenido cortado en el borde de la banda — subir BAND_H o revisar el centrado" >&2; exit 1; fi
}
check_clip() { # clip.mp4 poster.jpg
  local p a b f; p=$(corner_luma "$2"); a=$(corner_luma "$1"); b=$(last_luma "$1")
  # recordVideo a veces entrega 2-12 frames en vez de ~90: tampoco sirve.
  # (Una variante quieta, p. ej. animated={false}, también graba 2 frames:
  # tpad en to_clip clona el último hasta CLIP_S, así no cae en este chequeo.)
  f=$(ffprobe -v error -select_streams v -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$1")
  if [ "$f" -lt $((CLIP_S * 30 * 8 / 10)) ]; then echo "clip $1: $f frames — regrabar" >&2; exit 1; fi
  for v in "$a" "$b"; do
    if [ $((v > p ? v - p : p - v)) -gt 12 ]; then
      echo "clip $1: fondo $v, poster $p — no coincide, regrabar" >&2; exit 1
    fi
  done
}
# BAND_H: centra una banda de ese alto sobre el contenido de la variante.
BAND_H=${BAND_H:-}
CARD_Y=$CROP_Y; CARD_H=$CROP_H
center_band() { # screenshot.png -> fija CROP_Y/CROP_H
  [ -n "$BAND_H" ] || return 0
  local c
  c=$(ffmpeg -v error -i "$1" -vf "crop=${CROP_W}:${CARD_H}:${CROP_X}:${CARD_Y},format=gray" -f rawvideo - \
    | node -e '
      const W=+process.argv[1], H=+process.argv[2], px=80; const ch=[];
      process.stdin.on("data", d => ch.push(d)).on("end", () => {
        const b = Buffer.concat(ch);
        // Por fila: cuántos píxeles difieren del fondo de esa misma fila.
        const diff = (y) => { const bg = b[y * W + px]; let n = 0;
          for (let x = px; x < W - px; x++) if (Math.abs(b[y * W + x] - bg) > 12) n++; return n; };
        const full = (W - 2 * px) * 0.6;
        // Filas con contenido, agrupadas en bloques separados por >= 60 px.
        const blocks = []; let cur = null;
        for (let y = 24; y < H - 24; y++) {
          const n = diff(y); if (!(n > 0 && n < full)) continue;
          if (cur && y - cur.bot < 60) cur.bot = y; else { cur = { top: y, bot: y }; blocks.push(cur); }
        }
        // Un label de dos líneas entra en CARD_Y: es un bloque pegado arriba
        // (termina antes de 160 px), afuera de la tarjeta. No es contenido;
        // contarlo corría el centro hacia arriba y la banda salía vacía
        // (ShinyText, 2026-11-01).
        const content = blocks.filter((k) => k.bot >= 160);
        const top = content.length ? content[0].top : -1, bot = content.length ? content[content.length - 1].bot : -1;
        console.log(top < 0 ? Math.floor(H / 2) : Math.round((top + bot) / 2));
      });' "$CROP_W" "$CARD_H")
  CROP_H=$BAND_H
  CROP_Y=$((CARD_Y + c - BAND_H / 2))
  echo "  banda: centro $((CARD_Y + c)), cropY $CROP_Y"
}
# Recorta la tarjeta del demo, 540 px de ancho (360 pt en la docs a 1.5x).
to_clip() { # in.mov out.mp4
  ffmpeg -y -loglevel error -i "$1" -an -t "$CLIP_S" \
    -vf "crop=${CROP_W}:${CROP_H}:${CROP_X}:${CROP_Y},tpad=stop_mode=clone:stop_duration=${CLIP_S},fps=30,scale=540:-2:flags=lanczos" \
    -c:v libx264 -profile:v main -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart "$2"
}
HERO_PARTS=()

to_jpg() { # in out
  sips -c "$CROP_H" "$CROP_W" --cropOffset "$CROP_Y" "$CROP_X" "$1" --out "$TMP/crop.png" >/dev/null
  sips -s format jpeg -s formatOptions 80 "$TMP/crop.png" --out "$2" >/dev/null
}

# FROM=N rehace solo desde la variante N (p. ej. tras un clip fallido); la
# portada <slug>.mp4 junta todas las variantes, así que solo se reescribe
# en una corrida completa.
FROM=${FROM:-1}
# Captura fija con contenido: un demo que se anima solo (Transition) puede
# estar en su fase vacía al sacar la foto; se reintenta hasta 8 veces.
shot_content() { # png jpg [center]
  local i
  for i in 1 2 3 4 5 6 7 8; do
    shot "$1"
    [ "${3:-}" = center ] && center_band "$1"
    to_jpg "$1" "$2"
    SOFT=1 check_shot "$2" && return 0
    sleep 0.4
  done
  check_shot "$2"
}

for N in $(seq "$FROM" "$COUNT"); do
  open_variant "$N"
  xcrun simctl ui booted appearance light; sleep 2
  shot_content "$TMP/l.png" "$OUT/$N-light.jpg" center
  xcrun simctl ui booted appearance dark; sleep 2
  shot_content "$TMP/d.png" "$OUT/$N-dark.jpg"
  # El clip oscuro se graba ahora, todavía en oscuro. Antes se volvía a claro
  # antes de grabarlo y el "-dark.mp4" era un fundido a claro y después el
  # demo en claro: en la docs, con tema oscuro, el clip parpadeaba a blanco.
  [ "$VIDEO" = 1 ] && record "$TMP/d.mov"
  xcrun simctl ui booted appearance light
  if [ "$VIDEO" = 1 ]; then
    sleep 1
    record "$TMP/l.mov"
    to_clip "$TMP/l.mov" "$OUT/$N-light.mp4"
    to_clip "$TMP/d.mov" "$OUT/$N-dark.mp4"
    check_clip "$OUT/$N-light.mp4" "$OUT/$N-light.jpg"
    check_clip "$OUT/$N-dark.mp4" "$OUT/$N-dark.jpg"
    # Portada: la pantalla entera de esta variante, 560 px de ancho.
    ffmpeg -y -loglevel error -i "$TMP/l.mov" -an -t "$CLIP_S" \
      -vf "tpad=stop_mode=clone:stop_duration=${CLIP_S},fps=30,scale=560:-2:flags=lanczos,setsar=1" -c:v libx264 -pix_fmt yuv420p "$TMP/hero-$N.mp4"
    HERO_PARTS+=("$TMP/hero-$N.mp4")
  fi
  if [ "$N" = 1 ]; then
    sips -Z 1218 -s format jpeg -s formatOptions 80 "$TMP/l.png" --out "$ROOT/public/media/$SLUG.jpg" >/dev/null
  fi
  echo "variante $N ok"
done

if [ "$VIDEO" = 1 ] && [ "$FROM" = 1 ] && [ ${#HERO_PARTS[@]} -gt 0 ]; then
  LIST="$TMP/hero.txt"; : > "$LIST"
  for f in "${HERO_PARTS[@]}"; do echo "file '$f'" >> "$LIST"; done
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$LIST" -an \
    -c:v libx264 -profile:v main -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart \
    "$ROOT/public/media/$SLUG.mp4"
  echo "portada: public/media/$SLUG.mp4"
fi

xcrun simctl status_bar booted clear >/dev/null
echo "listo: $OUT"

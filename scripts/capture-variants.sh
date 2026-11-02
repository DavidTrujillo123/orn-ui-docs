#!/usr/bin/env bash
# Captures each variant of an example app demo as a still image, in light
# and dark, for the "Variants" section of the component's page.
#
#   scripts/capture-variants.sh <layer> <slug> <count> [cropY cropH]
#   VIDEO=1 BAND_H=560 scripts/capture-variants.sh atoms spinner 8   # with motion
#   scripts/capture-variants.sh atoms typography 9 1300 320
#
# Opens each variant via deep link (`ornui:///<layer>/<slug>?v=N`, resolved by
# the example app's VariantList), so it doesn't depend on Maestro or swipes.
# Writes:
#   public/media/variants/<slug>/<N>-light.jpg
#   public/media/variants/<slug>/<N>-dark.jpg
#   public/media/<slug>.jpg        (poster: variant 1, light, full screen)
#
# With VIDEO=1 (components with motion: spinners, skeleton, transitions)
# it also records ~3 s of each variant and writes:
#   public/media/variants/<slug>/<N>-light.mp4 / <N>-dark.mp4   (trimmed loop)
#   public/media/<slug>.mp4        (cover: the light variants, one after another)
# The .jpg files stay as each clip's poster. Requires ffmpeg.
#
# The default crop is the demo's whole card (iPhone 17, 1206x2622).
# For small components (text, badges) a lower band centered on the content
# works better: pass cropY and cropH, or better BAND_H=<height>: it finds
# each variant's content inside the card (cropY..cropY+cropH) in the light
# capture and centers a BAND_H px band there, so every variant gets the same
# room above and below and they all measure the same.
#
# Requires: a booted simulator with the example app installed and, if it's
# Debug, Metro running (`pnpm exec expo start` in apps/example, without CI=1).
set -euo pipefail

LAYER=${1:?layer: atoms|molecules|organisms}
SLUG=${2:?slug}
COUNT=${3:?number of variants}
CROP_Y=${4:-578}
CROP_H=${5:-1732}
# The demo's card without its side borders.
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
  # The ?v= parameter is only read when the screen mounts: cold relaunch.
  xcrun simctl terminate booted "$APP" >/dev/null 2>&1 || true
  xcrun simctl launch booted "$APP" >/dev/null
  sleep 5
  xcrun simctl openurl booted "ornui:///$LAYER/$SLUG?v=$1"
  sleep 5
}

shot() { xcrun simctl io booted screenshot "$1" >/dev/null 2>&1; }

VIDEO=${VIDEO:-0}
CLIP_S=${CLIP_S:-3}
record() { # out.mov — records CLIP_S seconds of the screen
  # recordVideo takes a while to start and to close the file: counting from
  # the launch, the "dark" clip ends up with 0.4 s of dark and the rest is
  # the fade to light the next step asks for (happened with spinner: the
  # dark video turned white in a loop). We wait for "Recording started",
  # record half a second extra and let it close before moving on.
  local log="$TMP/rec.log"; : > "$log"
  xcrun simctl io booted recordVideo --codec=h264 --force "$1" >"$log" 2>&1 &
  local pid=$! i=0
  until grep -q "Recording started" "$log" || [ $i -ge 100 ]; do sleep 0.1; i=$((i + 1)); done
  sleep "$CLIP_S"; sleep 0.5
  kill -INT "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null || true
  sleep 1
}
# Mean luma of the clip's background vs the .jpg's: if they don't match, the
# clip isn't the theme it claims to be (or was left half done). Better to fail than publish it.
corner_luma() { ffmpeg -v error -i "$1" -vf "format=gray,crop=4:4:6:6" -frames:v 1 -f rawvideo - | od -An -tu1 | awk '{for(i=1;i<=NF;i++){s+=$i;n++}} END{print int(s/n)}'; }
last_luma() { ffmpeg -v error -sseof -0.2 -i "$1" -vf "format=gray,crop=4:4:6:6" -frames:v 1 -f rawvideo - | od -An -tu1 | awk '{for(i=1;i<=NF;i++){s+=$i;n++}} END{print int(s/n)}'; }
# A capture with no content (badly centered band, app not loaded) aborts: an
# empty card isn't published. Counts rows with something other than the background.
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
    # soft: called by shot_content, which retries (an animated demo may be
    # right in its hidden phase). Without soft, an empty capture aborts.
    [ "${SOFT:-0}" = 1 ] && return 1
    echo "capture $1: no visible content ($2 rows) — re-record" >&2; exit 1
  fi
  if [ "$3" -gt 0 ]; then echo "capture $1: content cut off at the band edge — raise BAND_H or check the centering" >&2; exit 1; fi
}
check_clip() { # clip.mp4 poster.jpg
  local p a b f; p=$(corner_luma "$2"); a=$(corner_luma "$1"); b=$(last_luma "$1")
  # recordVideo sometimes delivers 2-12 frames instead of ~90: that's no good either.
  # (A still variant, e.g. animated={false}, also records 2 frames:
  # tpad in to_clip clones the last one up to CLIP_S, so it doesn't fall into this check.)
  f=$(ffprobe -v error -select_streams v -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$1")
  if [ "$f" -lt $((CLIP_S * 30 * 8 / 10)) ]; then echo "clip $1: $f frames — re-record" >&2; exit 1; fi
  for v in "$a" "$b"; do
    if [ $((v > p ? v - p : p - v)) -gt 12 ]; then
      echo "clip $1: background $v, poster $p — mismatch, re-record" >&2; exit 1
    fi
  done
}
# BAND_H: centers a band of that height over the variant's content.
BAND_H=${BAND_H:-}
CARD_Y=$CROP_Y; CARD_H=$CROP_H
center_band() { # screenshot.png -> sets CROP_Y/CROP_H
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
  echo "  band: center $((CARD_Y + c)), cropY $CROP_Y"
}
# Crops the demo's card, 540 px wide (360 pt in the docs at 1.5x).
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

# FROM=N redoes only from variant N on (e.g. after a failed clip); the
# <slug>.mp4 cover joins all variants, so it's only rewritten on a full
# run.
FROM=${FROM:-1}
# Still capture with content: a demo that animates on its own (Transition) may
# be in its empty phase when the photo is taken; it retries up to 8 times.
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
  # The dark clip is recorded now, still in dark. Before, it switched back to
  # light before recording it and the "-dark.mp4" was a fade to light and then
  # the demo in light: in the docs, with the dark theme, the clip flashed white.
  [ "$VIDEO" = 1 ] && record "$TMP/d.mov"
  xcrun simctl ui booted appearance light
  if [ "$VIDEO" = 1 ]; then
    sleep 1
    record "$TMP/l.mov"
    to_clip "$TMP/l.mov" "$OUT/$N-light.mp4"
    to_clip "$TMP/d.mov" "$OUT/$N-dark.mp4"
    check_clip "$OUT/$N-light.mp4" "$OUT/$N-light.jpg"
    check_clip "$OUT/$N-dark.mp4" "$OUT/$N-dark.jpg"
    # Cover: this variant's full screen, 560 px wide.
    ffmpeg -y -loglevel error -i "$TMP/l.mov" -an -t "$CLIP_S" \
      -vf "tpad=stop_mode=clone:stop_duration=${CLIP_S},fps=30,scale=560:-2:flags=lanczos,setsar=1" -c:v libx264 -pix_fmt yuv420p "$TMP/hero-$N.mp4"
    HERO_PARTS+=("$TMP/hero-$N.mp4")
  fi
  if [ "$N" = 1 ]; then
    sips -Z 1218 -s format jpeg -s formatOptions 80 "$TMP/l.png" --out "$ROOT/public/media/$SLUG.jpg" >/dev/null
  fi
  echo "variant $N ok"
done

if [ "$VIDEO" = 1 ] && [ "$FROM" = 1 ] && [ ${#HERO_PARTS[@]} -gt 0 ]; then
  LIST="$TMP/hero.txt"; : > "$LIST"
  for f in "${HERO_PARTS[@]}"; do echo "file '$f'" >> "$LIST"; done
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$LIST" -an \
    -c:v libx264 -profile:v main -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart \
    "$ROOT/public/media/$SLUG.mp4"
  echo "cover: public/media/$SLUG.mp4"
fi

xcrun simctl status_bar booted clear >/dev/null
echo "done: $OUT"

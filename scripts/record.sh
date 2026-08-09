#!/usr/bin/env bash
# Writes an optimized GIF to public/media/<slug>.gif, either by recording the
# booted iOS Simulator or by converting a .mov you already recorded.
# Requires ffmpeg and gifsicle (brew install ffmpeg gifsicle).
#
# Usage:
#   scripts/record.sh <slug>              # records ~4s from the simulator
#   scripts/record.sh <slug> <file.mov>   # converts an existing recording
set -euo pipefail

SLUG="${1:?usage: scripts/record.sh <slug> [file.mov]}"
SOURCE_MOV="${2:-}"
OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/media"
OUT_GIF="${OUT_DIR}/${SLUG}.gif"

# Los .mov del simulador llegan a 60fps y ~800px de ancho; la página muestra
# el gif a 220px. 8fps y 320px es el punto donde el texto de la demo se sigue
# leyendo sin que el archivo se dispare — el peso lo manda la cantidad de
# frames, así que grabaciones largas pesan aunque se baje la resolución.
FPS=8
WIDTH=320
COLORS=96

mkdir -p "$OUT_DIR"

if [ -n "$SOURCE_MOV" ]; then
  [ -f "$SOURCE_MOV" ] || { echo "no encontré $SOURCE_MOV" >&2; exit 1; }
  TMP_MOV="$SOURCE_MOV"
  KEEP_MOV=1
else
  TMP_MOV="$(mktemp -t "${SLUG}.XXXXXX").mov"
  KEEP_MOV=0
  echo "Recording ${SLUG} — press Ctrl+C after ~4s of interaction..."
  xcrun simctl io booted recordVideo --codec=h264 "$TMP_MOV" &
  REC_PID=$!
  sleep 4
  kill -INT "$REC_PID" 2>/dev/null || true
  wait "$REC_PID" 2>/dev/null || true
fi

echo "Encoding GIF..."
# Paleta por gif en un solo paso (split/palettegen/paletteuse): una paleta
# global adaptada a este clip rinde mejor que las 256 por defecto.
ffmpeg -y -i "$TMP_MOV" -vf \
  "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${COLORS}[p];[s1][p]paletteuse=dither=bayer" \
  "$OUT_GIF" >/dev/null 2>&1

if command -v gifsicle >/dev/null 2>&1; then
  # Recorta otro ~5%: reordena los frames y descarta detalle imperceptible.
  gifsicle -O3 --lossy=60 "$OUT_GIF" -o "$OUT_GIF"
else
  echo "gifsicle no está instalado — el gif queda sin el último paso de compresión (brew install gifsicle)"
fi

[ "$KEEP_MOV" = "1" ] || rm -f "$TMP_MOV"

SIZE=$(du -h "$OUT_GIF" | cut -f1)
echo "Wrote ${OUT_GIF} (${SIZE})"

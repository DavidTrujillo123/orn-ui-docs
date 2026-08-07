#!/usr/bin/env bash
# Records ~4s from the booted iOS Simulator and writes an optimized GIF to
# public/media/<slug>.gif. Requires ffmpeg (brew install ffmpeg) and a
# booted simulator running apps/example from the sibling repo.
#
# Usage: scripts/record.sh <slug>
set -euo pipefail

SLUG="${1:?usage: scripts/record.sh <slug>}"
OUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/media"
TMP_MOV="$(mktemp -t "${SLUG}.XXXXXX").mov"
OUT_GIF="${OUT_DIR}/${SLUG}.gif"
PALETTE="$(mktemp -t "${SLUG}-palette.XXXXXX").png"

mkdir -p "$OUT_DIR"

echo "Recording ${SLUG} — press Ctrl+C after ~4s of interaction..."
xcrun simctl io booted recordVideo --codec=h264 "$TMP_MOV" &
REC_PID=$!
sleep 4
kill -INT "$REC_PID" 2>/dev/null || true
wait "$REC_PID" 2>/dev/null || true

echo "Encoding GIF..."
ffmpeg -y -i "$TMP_MOV" -vf "fps=12,scale=320:-1:flags=lanczos,palettegen" "$PALETTE"
ffmpeg -y -i "$TMP_MOV" -i "$PALETTE" \
  -filter_complex "fps=12,scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  "$OUT_GIF"

rm -f "$TMP_MOV" "$PALETTE"

SIZE=$(du -h "$OUT_GIF" | cut -f1)
echo "Wrote ${OUT_GIF} (${SIZE})"

#!/usr/bin/env bash
# Records a component's clip by running its Maestro flow against the
# simulator, and leaves it ready for the web in public/media/<slug>.mp4 + a
# .jpg poster.
#
# h264 only: adding a .webm (VP9) was tried and it came out twice as heavy as
# the mp4 at equivalent quality on UI clips —- flat, with lots of smooth
# surface. h264 plays everywhere <video> is supported, so the second format
# was weight and an extra encode step for nothing.
#
# Unlike record.sh (GIF, a blind ~4s capture while someone drives the
# simulator by hand), here the choreography is the flow: the same clip every
# time, regenerable, and versioned alongside the component. See MEDIA.md.
#
# Usage:
#   scripts/record-demo.sh <slug>              # flow: .maestro/demos/*<slug>.yaml
#   scripts/record-demo.sh <slug> <flow.yaml>  # explicit flow
#   scripts/record-demo.sh <slug> --from <clip.mp4>   # no recording, encode only
#
# Requires: maestro, ffmpeg, a booted simulator with the app installed.
set -euo pipefail

SLUG="${1:?usage: scripts/record-demo.sh <slug> [flow.yaml | --from clip.mp4]}"
shift || true

DOCS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${DOCS_DIR}/public/media"

# The library repo is a sibling of this one (see README). The directory's
# name has already changed once, so it's resolved by whatever exists and can
# be forced with EXAMPLE_APP_DIR.
APP_DIR="${EXAMPLE_APP_DIR:-}"
if [ -z "$APP_DIR" ]; then
  for candidate in "${DOCS_DIR}/../orn-ui/apps/example" "${DOCS_DIR}/../only-react-native-components/apps/example"; do
    [ -d "$candidate" ] && { APP_DIR="$(cd "$candidate" && pwd)"; break; }
  done
fi

SOURCE_MP4=""
FLOW=""
case "${1:-}" in
  --from) SOURCE_MP4="${2:?--from needs a file}" ;;
  "")     FLOW="${APP_DIR}/.maestro/demos/${SLUG}.yaml" ;;
  *)      FLOW="$1" ;;
esac

# The width is the media column's (280px CSS) times 2 for retina screens.
# Going higher fattens the file without showing anything more: the clip is
# never displayed larger.
WIDTH=560
FPS=30

mkdir -p "$OUT_DIR"

if [ -z "$SOURCE_MP4" ]; then
  [ -n "$APP_DIR" ] || { echo "apps/example not found — export EXAMPLE_APP_DIR" >&2; exit 1; }
  if [ ! -f "$FLOW" ]; then
    # The flow's name carries the manifest category (organisms-select),
    # the slug alone isn't enough to find it.
    FLOW="$(find "${APP_DIR}/.maestro/demos" -name "*${SLUG}.yaml" | head -1)"
    [ -n "$FLOW" ] || { echo "no demo flow found for '${SLUG}' in ${APP_DIR}/.maestro/demos" >&2; exit 1; }
  fi

  # Fixed status bar: without this every re-recording changes the time and
  # battery, and the diff of a regenerated clip is pure noise.
  xcrun simctl status_bar booted override \
    --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 \
    --cellularMode active --cellularBars 4 \
    --batteryState charged --batteryLevel 100 >/dev/null 2>&1 || true

  echo "Running ${FLOW##*/}..."
  # An interrupted `maestro test` leaves the simulator's recording session
  # taken, and the next startRecording dies with "RECORDING_FAILED
  # exit_code=16" — forever, until the process is killed or the simulator
  # restarts. Sweeping before starting keeps a cancelled run from poisoning
  # the next one.
  pkill -f 'simctl io .* recordVideo' 2>/dev/null || true

  # Maestro writes startRecording's .mp4 to the CWD, with the name the flow
  # passes it — by convention, the slug.
  RUN_LOG="$(mktemp -t "maestro-${SLUG}.XXXXXX")"
  run_flow() { (cd "$APP_DIR" && maestro test "$FLOW") 2>&1 | tee "$RUN_LOG"; return "${PIPESTATUS[0]}"; }
  if ! run_flow; then
    # A single retry, and only for the recording failure: if what failed is
    # a selector, retrying is losing a minute to fail the same way again.
    if grep -q 'RECORDING_FAILED' "$RUN_LOG"; then
      echo "retrying ${SLUG} after clearing the stuck recording..."
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
  [ -f "$SOURCE_MP4" ] || { echo "the flow didn't leave ${SLUG}.mp4 — is the startRecording named differently?" >&2; exit 1; }
else
  KEEP_SOURCE=1
  [ -f "$SOURCE_MP4" ] || { echo "$SOURCE_MP4 not found" >&2; exit 1; }
fi

echo "Encoding..."
# yuv420p + faststart: without the first Safari plays nothing, without the
# second the video doesn't start until the whole file is downloaded.
ffmpeg -y -i "$SOURCE_MP4" -an \
  -vf "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos" \
  -c:v libx264 -profile:v main -crf 28 -preset slow -pix_fmt yuv420p \
  -movflags +faststart "${OUT_DIR}/${SLUG}.mp4" >/dev/null 2>&1

# Poster = first frame. It's what's seen before the video loads (and the only
# thing seen if the visitor asked for reduced motion), so it comes from the
# same clip and can't get out of sync.
ffmpeg -y -i "$SOURCE_MP4" -frames:v 1 \
  -vf "scale=${WIDTH}:-2:flags=lanczos" -q:v 4 \
  "${OUT_DIR}/${SLUG}.jpg" >/dev/null 2>&1

[ "$KEEP_SOURCE" = "1" ] || rm -f "$SOURCE_MP4"

for f in "${OUT_DIR}/${SLUG}.mp4" "${OUT_DIR}/${SLUG}.jpg"; do
  echo "  $(du -h "$f" | cut -f1)	${f#${DOCS_DIR}/}"
done

# A long clip is almost never a long demo: it's Maestro waiting for a screen
# that animates nonstop (Spinner, Skeleton, Slides) to settle. It warns instead
# of failing —the file works anyway— but it's worth checking whether that
# demo needs to trim variants in CLIP_VARIANTS.
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "${OUT_DIR}/${SLUG}.mp4" 2>/dev/null | cut -d. -f1)
if [ -n "$DURATION" ] && [ "$DURATION" -gt 35 ]; then
  echo "  ⚠ ${DURATION}s — long for a docs loop; check CLIP_VARIANTS for ${SLUG}"
fi

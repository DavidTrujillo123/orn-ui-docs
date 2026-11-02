#!/usr/bin/env bash
# Records and encodes the clip for each flow in the sibling repo's .maestro/demos/.
# A component that fails doesn't stop the run: it's noted and the run goes on,
# and at the end the summary is printed. It's ~45 recordings against a real
# simulator, so aborting on the first error would mean losing half an hour of
# run time over one selector.
#
# Usage:
#   scripts/record-all-demos.sh              # all
#   scripts/record-all-demos.sh button card  # only those slugs
set -uo pipefail

DOCS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APP_DIR="${EXAMPLE_APP_DIR:-}"
if [ -z "$APP_DIR" ]; then
  for candidate in "${DOCS_DIR}/../orn-ui/apps/example" "${DOCS_DIR}/../only-react-native-components/apps/example"; do
    [ -d "$candidate" ] && { APP_DIR="$(cd "$candidate" && pwd)"; break; }
  done
fi
[ -n "$APP_DIR" ] || { echo "apps/example not found — export EXAMPLE_APP_DIR" >&2; exit 1; }

ONLY=("$@")

ok=(); failed=()
for flow in "${APP_DIR}"/.maestro/demos/*.yaml; do
  name="$(basename "$flow" .yaml)"
  # _beat.yaml and any other subflow: they are not clips.
  case "$name" in _*) continue ;; esac
  # The file is named <category>-<slug>; the slug can contain hyphens, so
  # only the known category prefix is trimmed.
  slug="${name#atoms-}"; slug="${slug#molecules-}"; slug="${slug#organisms-}"; slug="${slug#examples-}"

  if [ ${#ONLY[@]} -gt 0 ]; then
    match=0
    for want in "${ONLY[@]}"; do [ "$want" = "$slug" ] && match=1; done
    [ $match -eq 1 ] || continue
  fi

  echo "──────── ${slug}"
  if "${DOCS_DIR}/scripts/record-demo.sh" "$slug" "$flow" > "/tmp/record-${slug}.log" 2>&1; then
    ok+=("$slug")
    tail -2 "/tmp/record-${slug}.log"
  else
    failed+=("$slug")
    echo "  ✗ failed — $(grep -m1 'FAILED' "/tmp/record-${slug}.log" || echo 'see /tmp/record-'"${slug}"'.log')"
  fi
done

echo
echo "════════ ${#ok[@]} ok, ${#failed[@]} failed"
[ ${#failed[@]} -gt 0 ] && printf 'failed: %s\n' "${failed[*]}"
exit 0

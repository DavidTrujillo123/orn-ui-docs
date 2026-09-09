#!/usr/bin/env bash
# Graba y encodea el clip de cada flow de .maestro/demos/ del repo hermano.
# Un componente que falla no corta la corrida: se anota y sigue, y al final
# imprime el resumen. Son ~45 grabaciones contra un simulador real, así que
# abortar en el primer error significaría perder media hora de corrida por un
# selector.
#
# Uso:
#   scripts/record-all-demos.sh              # todos
#   scripts/record-all-demos.sh button card  # sólo esos slugs
set -uo pipefail

DOCS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APP_DIR="${EXAMPLE_APP_DIR:-}"
if [ -z "$APP_DIR" ]; then
  for candidate in "${DOCS_DIR}/../orn-ui/apps/example" "${DOCS_DIR}/../only-react-native-components/apps/example"; do
    [ -d "$candidate" ] && { APP_DIR="$(cd "$candidate" && pwd)"; break; }
  done
fi
[ -n "$APP_DIR" ] || { echo "no encontré apps/example — exportá EXAMPLE_APP_DIR" >&2; exit 1; }

ONLY=("$@")

ok=(); failed=()
for flow in "${APP_DIR}"/.maestro/demos/*.yaml; do
  name="$(basename "$flow" .yaml)"
  # _beat.yaml y cualquier otro subflow: no son clips.
  case "$name" in _*) continue ;; esac
  # El archivo se llama <categoría>-<slug>; el slug puede tener guiones, así
  # que se recorta sólo el prefijo de categoría conocido.
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
    echo "  ✗ falló — $(grep -m1 'FAILED' "/tmp/record-${slug}.log" || echo 'ver /tmp/record-'"${slug}"'.log')"
  fi
done

echo
echo "════════ ${#ok[@]} ok, ${#failed[@]} fallaron"
[ ${#failed[@]} -gt 0 ] && printf 'fallaron: %s\n' "${failed[*]}"
exit 0

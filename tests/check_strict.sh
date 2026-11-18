#!/usr/bin/env bash
# Compiles every godot-claude GDScript tool under all-warnings-as-errors settings.
set -uo pipefail
GODOT="${GODOT_BIN:-godot}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail=0
for f in $(find "$ROOT/godot" -name '*.gd' | sort); do
  out=$("$GODOT" --headless --path "$ROOT/tests/fixtures/strict" --check-only --script "$f" 2>&1)
  if [ $? -ne 0 ] || echo "$out" | grep -q "SCRIPT ERROR"; then
    echo "FAIL $f"; echo "$out" | grep -A1 "SCRIPT ERROR" | head -40; fail=1
  fi
done
[ $fail -eq 0 ] && echo "all godot scripts pass strict check"
exit $fail

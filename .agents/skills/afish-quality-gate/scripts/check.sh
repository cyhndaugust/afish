#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

cd "$PROJECT_ROOT"

if [ -x backend/.venv/bin/python ]; then
  PYTHON_BIN="backend/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python3)"
else
  echo "[check:error] Python 3 is required" >&2
  exit 1
fi

if [ ! -d frontend/node_modules ]; then
  echo "[check:error] frontend dependencies are missing; run npm install in frontend/" >&2
  exit 1
fi

echo "[check] cross-layer contracts"
"$PYTHON_BIN" "$SCRIPT_DIR/check_contracts.py"

echo "[check] backend syntax"
"$PYTHON_BIN" -m compileall -q backend

echo "[check] frontend production build"
(
  cd frontend
  npm run build
)

echo "[check:ok] deterministic Afish checks passed"

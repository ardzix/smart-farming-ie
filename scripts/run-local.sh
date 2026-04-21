#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
BE_DIR="$ROOT_DIR/be"
FE_DIR="$ROOT_DIR/fe"

cleanup() {
  if [ -n "${BE_PID:-}" ]; then kill "$BE_PID" 2>/dev/null || true; fi
  if [ -n "${FE_PID:-}" ]; then kill "$FE_PID" 2>/dev/null || true; fi
}

trap cleanup INT TERM EXIT

echo "Starting backend and frontend..."

(
  cd "$BE_DIR"
  if [ -f ".venv/Scripts/python.exe" ]; then
    ".venv/Scripts/python.exe" manage.py runserver
  elif [ -f "venv/Scripts/python.exe" ]; then
    "venv/Scripts/python.exe" manage.py runserver
  elif [ -f ".venv/bin/python" ]; then
    ".venv/bin/python" manage.py runserver
  elif [ -f "venv/bin/python" ]; then
    "venv/bin/python" manage.py runserver
  else
    python manage.py runserver
  fi
) &
BE_PID=$!

(
  cd "$FE_DIR"
  npm run dev
) &
FE_PID=$!

wait "$BE_PID" "$FE_PID"

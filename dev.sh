#!/usr/bin/env bash
# 同时启动后端 (:8000) 与前端 (:5173)，Ctrl-C 一起退出
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d backend/.venv ]; then
  echo "首次运行：创建 Python 虚拟环境…"
  (cd backend && uv venv .venv --python 3.11 && uv pip install -r requirements.txt -p .venv/bin/python)
fi
if [ ! -d frontend/node_modules ]; then
  echo "首次运行：安装前端依赖…"
  (cd frontend && npm install)
fi

trap 'kill 0' EXIT INT TERM
(cd backend && .venv/bin/python -m uvicorn main:app --reload --port 8000) &
(cd frontend && npm run dev) &
wait

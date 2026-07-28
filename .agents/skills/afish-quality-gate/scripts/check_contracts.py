#!/usr/bin/env python3
"""Check small Afish contracts that must stay synchronized across layers."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]


def read(relative: str) -> str:
    path = ROOT / relative
    if not path.is_file():
        raise RuntimeError(f"missing required file: {relative}")
    return path.read_text(encoding="utf-8")


def capture(pattern: str, text: str, label: str) -> int:
    match = re.search(pattern, text, re.MULTILINE)
    if not match:
        raise RuntimeError(f"could not find {label}")
    return int(match.group(1))


def main() -> int:
    errors: list[str] = []
    try:
        backend_models = read("backend/models.py")
        backend_main = read("backend/main.py")
        frontend_types = read("frontend/src/types.ts")
        frontend_create = read("frontend/src/views/CreateView.tsx")
        frontend_api = read("frontend/src/api.ts")
        nginx = read("frontend/nginx.conf")

        for name in ("W", "H"):
            backend_value = capture(
                rf"^CANVAS_{name}\s*=\s*(\d+)", backend_models, f"backend CANVAS_{name}"
            )
            frontend_value = capture(
                rf"^export const CANVAS_{name}\s*=\s*(\d+)",
                frontend_types,
                f"frontend CANVAS_{name}",
            )
            if backend_value != frontend_value:
                errors.append(
                    f"CANVAS_{name} differs: backend={backend_value}, frontend={frontend_value}"
                )

        backend_name_limit = capture(
            r"name:\s*str\s*=\s*Field\(min_length=1,\s*max_length=(\d+)\)",
            backend_models,
            "backend name limit",
        )
        frontend_name_limit = capture(
            r"maxLength=\{(\d+)\}", frontend_create, "frontend name limit"
        )
        if backend_name_limit != frontend_name_limit:
            errors.append(
                "name limit differs: "
                f"backend={backend_name_limit}, frontend={frontend_name_limit}"
            )

        backend_body_kib = capture(
            r"^MAX_BODY_BYTES\s*=\s*(\d+)\s*\*\s*1024",
            backend_main,
            "backend request limit",
        )
        nginx_body_kib = capture(
            r"client_max_body_size\s+(\d+)k", nginx, "Nginx request limit"
        )
        if backend_body_kib != nginx_body_kib:
            errors.append(
                "request limit differs: "
                f"backend={backend_body_kib} KiB, nginx={nginx_body_kib} KiB"
            )

        backend_events = set(re.findall(r'"type":\s*"([a-z_]+)"', backend_main))
        frontend_events = set(re.findall(r"msg\.type\s*===\s*'([a-z_]+)'", frontend_api))
        if backend_events != frontend_events:
            errors.append(
                "WebSocket events differ: "
                f"backend={sorted(backend_events)}, frontend={sorted(frontend_events)}"
            )
    except RuntimeError as exc:
        errors.append(str(exc))

    if errors:
        for error in errors:
            print(f"[contract:error] {error}", file=sys.stderr)
        return 1

    print("[contract:ok] canvas dimensions, name limit, request limit, and events agree")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

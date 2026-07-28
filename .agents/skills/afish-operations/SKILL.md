---
name: afish-operations
description: Start, configure, deploy, inspect, and troubleshoot the Afish frontend, FastAPI backend, WebSocket proxy, SQLite storage, and Docker Compose services without losing data or exposing insecure defaults. Use for local setup, service health checks, LAN testing, production deployment, administrator access, backups, logs, ports, proxy failures, or operational recovery in this repository.
---

# Afish Operations

## Choose the mode

- For local development, use `./dev.sh`; it creates `backend/.venv` and installs frontend dependencies only when absent, then starts ports 8000 and 5173.
- For isolated debugging, run the backend and frontend commands documented in `README.md` separately.
- For production-like operation, use Docker Compose and open the configured `AFISH_PORT` (8080 by default).
- Read [references/runbook.md](references/runbook.md) for exact checks and symptom-based troubleshooting.

Before starting a long-running service, inspect current processes or Compose state to avoid port conflicts. Start or stop services only when requested; do not leave an unmentioned background process running.

## Protect configuration and data

1. Copy `.env.example` to the ignored `.env` only when deployment configuration is requested.
2. Require a strong `AFISH_ADMIN_PASSWORD` before public deployment. Never print or commit the actual value.
3. Treat the `afish-data` Docker volume and local SQLite database as persistent user data.
4. Prefer soft deletion in administration. State clearly that hard deletion and `docker compose down -v` are irreversible.
5. Resolve the exact database or volume before backup, restore, migration, or deletion. Use a copy or disposable database for experiments.

## Check service health

Verify the layer relevant to the request:

- backend: `GET http://127.0.0.1:8000/api/health` returns `ok`, fish count, and client count;
- local frontend: port 5173 loads and Vite proxies `/api` and `/ws` to port 8000;
- Docker frontend: the configured host port loads and Nginx proxies `/api/` and `/ws` to `backend:8000`;
- realtime: a client connects to `/ws`, then a new fish reaches another connected client;
- persistence: fish data survives a normal service or container restart.

Do not treat an HTTP-only health check as proof that WebSocket upgrade, persistence, touch input, or administrator actions work.

## Respect current operational limits

- Public fish submission is intentionally unauthenticated and must remain untrusted.
- Submission and login rate limits are in memory and reset on backend restart.
- Administrator sessions are in memory and expire; restarting the backend signs users out.
- The development CORS allowlist covers only local Vite origins. Update it deliberately when the API is exposed on a separate production origin.
- SQLite is suitable for one small shared deployment, not concurrent multi-instance writes.
- Nginx and FastAPI both enforce the 256 KiB request boundary; keep them aligned.

## Report changes and recovery impact

Report active URLs, health results, relevant logs, persistent-data location, configuration files changed, and whether rollback or recovery is available. Never claim a public deployment is secure solely because containers are healthy.

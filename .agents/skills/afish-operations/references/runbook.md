# Afish operations runbook

## Local development

From the repository root:

```bash
./dev.sh
```

Expected endpoints:

- frontend: `http://localhost:5173`
- backend health: `http://localhost:8000/api/health`
- phone on the same LAN: use the network URL printed by Vite

Run services separately when isolating a failure:

```bash
cd backend
.venv/bin/python -m uvicorn main:app --reload --port 8000
```

```bash
cd frontend
npm run dev
```

Stop both `dev.sh` children with Ctrl-C. Check ports 5173 and 8000 before starting another copy.

## Docker Compose

Prepare an ignored `.env` with a strong password, then:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
```

Open `http://localhost:${AFISH_PORT}`; the default is port 8080. A normal stop preserves the named volume:

```bash
docker compose down
```

Never use `docker compose down -v` as routine cleanup; `-v` deletes `afish-data` and all stored fish.

## Health interpretation

`GET /api/health` returns:

- `ok`: application reached the database-backed FastAPI process;
- `fishes`: count of non-deleted fish;
- `clients`: WebSocket connections held by this backend process.

A zero client count can be valid before the ocean page opens. A healthy backend does not prove that Nginx WebSocket upgrade works; exercise `/ws` through the user-facing port.

## Troubleshooting

| Symptom | Inspect | Likely boundary |
| --- | --- | --- |
| Frontend loads but fish requests fail | browser network, Vite/Nginx proxy, backend health | `/api` routing or backend startup |
| Initial fish load works but new fish do not appear | browser WebSocket state, `/ws` upgrade headers, backend client count | WebSocket proxy or reconnect path |
| Local works but Docker fails | `docker compose ps`, backend and frontend logs, health checks | image build, dependency health, service DNS |
| Port already in use | current listeners and Compose state | duplicate local or container service |
| Admin login always fails | configured environment, backend restart, login throttling | password initialization or in-memory rate limit |
| Admin is signed out after restart | expected in-memory session behavior | no persistent session store |
| Fish disappear after restart | resolved `AFISH_DB_PATH`, mounted volume, Compose project | wrong database path or missing volume |
| Browser rejects API on separate origin | FastAPI CORS allowlist | production API origin not allowed |
| Large drawing rejected | browser payload, Nginx 256k, FastAPI 256 KiB | request-size boundary |

## Data-safe recovery

1. Stop writers before copying a SQLite database.
2. Resolve `AFISH_DB_PATH` or the Compose volume rather than assuming a path.
3. Preserve an untouched backup before migration or restore work.
4. Test recovery against a copy and verify fish count plus sample strokes.
5. Prefer restart, log inspection, and soft deletion over volume recreation or hard deletion.

## Public deployment checklist

- set a strong `AFISH_ADMIN_PASSWORD` without committing `.env`;
- use HTTPS so bearer tokens and WebSockets use encrypted transport;
- verify the public `/api` and `/ws` routes through the reverse proxy;
- confirm backup and restore for `afish-data`;
- understand that rate limits and sessions reset on restart;
- keep one backend instance while using SQLite and in-memory coordination;
- review CORS if frontend and API use different origins;
- retain the noncommercial license and third-party notices.

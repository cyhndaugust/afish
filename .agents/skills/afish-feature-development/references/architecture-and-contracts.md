# Afish architecture and contracts

## Source map

| Concern | Primary files |
| --- | --- |
| View switching | `frontend/src/App.tsx` |
| Drawing flow | `views/CreateView.tsx`, `components/DrawCanvas.tsx`, `components/Toolbar.tsx` |
| Ocean lifecycle | `views/OceanView.tsx`, `ocean/engine.ts` |
| Fish deformation | `ocean/FishSprite.ts` |
| Shared frontend contracts | `types.ts`, `api.ts`, `storage.ts`, `i18n.ts` |
| HTTP and WebSocket entrypoints | `backend/main.py` |
| Validation | `backend/models.py` |
| SQLite schema and queries | `backend/db.py` |
| Admin password and sessions | `backend/auth.py` |
| WebSocket connections | `backend/ws.py` |
| Development and production routing | `frontend/vite.config.ts`, `frontend/nginx.conf`, `compose.yaml` |

## Fish data lifecycle

1. `DrawCanvas` produces `Stroke[]` in a fixed 480 × 320 logical coordinate system.
2. `CreateView` submits `{name, strokes, author_id}` through `api.ts`.
3. `FishCreate` validates the request; `db.py` stores compact JSON and UTC creation time.
4. `POST /api/fishes` returns a public `FishOut` and broadcasts `fish_added`.
5. `OceanView` can receive the same fish from the POST result, initial GET, and WebSocket. `OceanEngine.known` deduplicates by numeric ID.
6. `FishSprite` transforms original points each frame; server-side positions are intentionally absent.
7. A soft or hard admin deletion broadcasts `fish_deleted`; restoration broadcasts `fish_added` with the existing ID.

Public fish fields are `id`, `name`, `strokes`, and `created_at`. `author_id` is accepted on creation and shown only in the admin model. Do not expose it through the public list without an explicit product decision.

## API and realtime surface

| Method | Path | Contract |
| --- | --- | --- |
| GET | `/api/health` | `{ok, fishes, clients}` |
| GET | `/api/fishes?limit=...` | active fish, oldest-to-newest within the recent window |
| POST | `/api/fishes` | validate, persist, broadcast, return 201 |
| POST | `/api/admin/login` | return an in-memory bearer session |
| GET | `/api/admin/fishes` | return active and soft-deleted fish with attribution |
| DELETE | `/api/admin/fishes/{id}?mode=soft|hard` | delete and broadcast removal |
| POST | `/api/admin/fishes/{id}/restore` | restore and broadcast addition |
| WebSocket | `/ws` | server-to-client fish events; incoming text is only used to detect disconnects |

Keep event spellings and payload keys synchronized between `main.py` and `api.ts`. Preserve auto-reconnect and the unsubscribe cleanup path.

## Invariants

- Canvas dimensions: frontend and backend are both 480 × 320.
- Drawing limits: at most 200 strokes, 2,000 points per stroke, 8,000 total points, size `(0, 64]`, and `#RRGGBB` colors.
- Name limit: trimmed, non-empty, at most 16 characters in both UI and backend.
- Request limit: 256 KiB in FastAPI and Nginx.
- Active fish limits: desktop 40, mobile 20, performance floor 8.
- Device ID is local attribution, not an identity or authorization mechanism.
- Public list and count exclude soft-deleted fish; admin list includes them.
- Database migrations run from `init_db()` and must work against an existing database.
- Initial list ordering and deduplication affect which fish enter the visible pool; change deliberately.

## UI and storage behavior

- The app intentionally switches among `create`, `ocean`, and `admin` without a router.
- A saved failed-submission draft takes precedence on startup; otherwise a device that has drawn before opens the ocean.
- Draft, language, name, device ID, and the last 20 owned fish records use stable local-storage keys in `storage.ts`.
- Storage can fail in privacy mode, so reads and writes remain guarded.
- Every user-visible label, error, status, confirmation, and dialogue belongs in both branches of `COPY`.

## Security and deployment boundaries

- Fish submission is public by design, but all content remains untrusted.
- Submission and login throttles are per-process memory state, not distributed controls.
- Admin sessions are per-process memory state and expire after eight hours.
- The default admin password is unsafe; public deployments must set `AFISH_ADMIN_PASSWORD`.
- SQLite and in-memory state assume a small single-backend deployment.
- `docker compose down -v` removes persistent fish data and is never a routine restart command.

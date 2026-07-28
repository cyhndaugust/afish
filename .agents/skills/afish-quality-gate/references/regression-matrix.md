# Afish regression matrix

Select rows by changed behavior, not only changed filename. Add the original reproduction for every bug fix.

| Change area | Required focused checks |
| --- | --- |
| `CreateView`, `DrawCanvas`, `Toolbar`, theme or drawing CSS | Enter valid/invalid names; draw with mouse and coarse pointer; switch color/size; erase; undo; confirm clear; toggle guide; verify logical strokes survive resize; submit once without duplicate fish. |
| `storage.ts` or startup view logic | First visit opens create; returning artist opens ocean; failed submission restores draft; successful retry clears draft; unavailable/corrupt local storage does not crash; existing keys remain readable. |
| `i18n.ts` or user-visible layout | Traverse the changed flow in English and Chinese; verify labels, errors, confirmations, document title, and narrow-layout wrapping. |
| `types.ts`, `api.ts`, `models.py`, or create/list database code | Run contract checker; submit valid fish; reject empty/long names, empty strokes, invalid colors, excessive points, and oversized requests as applicable; list returns public fields only. |
| `main.py`, `ws.py`, `api.ts`, `OceanView` realtime path | Open two clients; add a fish and observe exactly one appearance in each; disconnect/reconnect one client; verify initial GET plus WebSocket race does not duplicate. |
| `engine.ts` or `FishSprite.ts` | Observe motion after resize; check left/right turns, bounds, tap name, same-fish double-tap dialogue/dash, empty-space dismissal, active-fish cap, and mobile hit padding; watch console and frame rate. |
| Admin UI, auth, or admin API/database code | Reject invalid login; accept configured credentials; expire/clear invalid bearer token; list active/deleted fish; soft-delete and restore with two ocean clients; hard-delete only disposable data; verify operation errors. |
| `db.py` schema or query changes | Start against a copy of an older database; verify additive migration, existing fish readability, ordering, soft-delete filtering, count, restart persistence, and rollback/recovery notes. |
| `vite.config.ts`, `nginx.conf`, Dockerfiles, or `compose.yaml` | Build images; check Compose health; load configured port; exercise `/api/health` and `/ws` through Nginx; restart without volume loss; confirm request-size and proxy settings stay aligned. |
| README, version, or release metadata | Confirm commands match the repository, English and Chinese docs do not contradict each other, version sources agree, and license/security warnings remain accurate. |

## Baseline smoke flow

When the change affects a shared contract or more than one layer, also run:

1. Load a clean browser profile and switch both languages.
2. Name and draw a fish, then release it.
3. Confirm the fish appears in the ocean and persists after refresh.
4. Tap for its name and double-tap for dialogue and dash.
5. Open a second client and confirm a new release arrives in realtime.
6. If admin code changed, soft-delete and restore disposable test data while both clients are open.

Record whether each step ran on desktop, emulated mobile, or a real touch device.

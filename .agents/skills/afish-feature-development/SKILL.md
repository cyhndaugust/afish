---
name: afish-feature-development
description: Safely implement or modify features and bug fixes in the Afish repository while preserving its React/TypeScript, Canvas 2D, FastAPI, SQLite, WebSocket, admin, local-storage, and bilingual contracts. Use for requests that add or change user flows, API fields or endpoints, fish rendering and interaction, persistence, realtime events, administration, or UI copy in this project.
---

# Afish Feature Development

## Prepare

1. Work from the repository root containing `frontend/`, `backend/`, and `compose.yaml`.
2. Read the files on the requested path before editing. Read [references/architecture-and-contracts.md](references/architecture-and-contracts.md) when the change crosses layers or touches an invariant listed there.
3. State the requested behavior and a verifiable success criterion. Identify the smallest affected path; do not refactor neighboring code.
4. Inspect `git status --short` and preserve unrelated user changes. Never commit unless explicitly requested.

## Map the change

- For a UI-only change, trace `App.tsx` to the relevant view, component, `i18n.ts`, storage helper, and CSS.
- For a data or API change, trace `frontend/src/types.ts` and `api.ts` through `backend/models.py`, `main.py`, and `db.py`.
- For realtime behavior, trace the backend broadcast in `main.py` through `frontend/src/api.ts`, `OceanView.tsx`, and `ocean/engine.ts`.
- For fish motion or interaction, preserve the logical drawing coordinates in `types.ts` and `models.py`, then inspect `DrawCanvas.tsx`, `FishSprite.ts`, and `engine.ts`.
- For administration, trace `AdminLoginModal.tsx`, `AdminView.tsx`, the admin API helpers, authorization in `main.py`, sessions in `auth.py`, and persistence in `db.py`.

## Implement with project constraints

- Keep the existing lightweight design. Do not add a router, state library, ORM, Canvas framework, or new service unless the request requires it.
- Keep frontend and backend data shapes synchronized. Update validation, serialization, storage, API helpers, and realtime payload handling together when a shared field changes.
- Keep `CANVAS_W` and `CANVAS_H` identical across frontend and backend. Store points in logical coordinates; handle CSS scaling and device pixel ratio only at rendering boundaries.
- Add or update both English and Chinese copy for every user-visible state. Access copy through `COPY[language]`; do not embed one-language UI strings in components.
- Keep local-storage reads defensive and backward compatible. Treat the device ID as attribution only, never authentication.
- Implement SQLite schema evolution additively in `init_db()` so existing databases continue to start. Do not delete or rewrite stored fish data without explicit authorization.
- Treat submitted names, strokes, WebSocket messages, and authorization headers as untrusted input. Preserve request limits, rate limits, and server-side validation.
- Preserve realtime idempotency: the initial HTTP list, POST response, and WebSocket event can describe the same fish. Deletion and restoration must update both active sprites and the waiting pool.
- Keep Canvas work inside the single animation loop and maintain mobile/DPR/performance behavior.

## Verify and hand off

1. Invoke `$afish-quality-gate` after implementation, or run its script directly if skill invocation is unavailable.
2. Select manual regression cases from that skill based on the files and behavior changed.
3. Report exactly what was checked and any unverified behavior. Do not claim browser, mobile, WebSocket, or Docker validation unless it actually ran.
4. Summarize only request-related files and call out migrations, deployment changes, or destructive behavior explicitly.

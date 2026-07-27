<h1 align="center">I Am a Fish</h1>

<p align="center">
  Draw a fish, give it a name, and let it swim in a shared living ocean.
</p>

<p align="center">
  <a href="README.md"><img alt="English" src="https://img.shields.io/badge/EN-English-blue?style=flat-square"></a>
  <a href="docs-readme/zh-CN/README.md"><img alt="简体中文" src="https://img.shields.io/badge/ZH-简体中文-red?style=flat-square"></a>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-334155?style=flat-square">
  <img alt="Status" src="https://img.shields.io/badge/status-preview-d97706?style=flat-square">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-7c3aed?style=flat-square"></a>
  <img alt="React" src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=0b1f2a">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white">
</p>

## About

I Am a Fish turns simple freehand drawings into animated fish. Each drawing is stored by the backend, rendered on an HTML Canvas, and shared with every connected visitor in real time.

The interface supports English and Chinese. The selected language is saved locally and restored on the next visit.

## Features

- Draw a fish with multiple colors and three brush sizes
- Erase, undo, clear, and toggle the fish-shaped drawing guide
- Release drawings into a shared animated ocean
- Receive newly released fish in real time through WebSocket
- Tap a fish to see its creator's name
- Double-tap a fish to trigger a random line of dialogue and a quick dash
- Responsive mouse, touch, and high-DPI canvas support
- Automatic fish-count reduction when frame rate drops
- English and Chinese interface with locally persisted language preference

## Tech stack

| Area              | Technology                                |
| ----------------- | ----------------------------------------- |
| Frontend          | React 18, TypeScript, Vite                |
| Rendering         | Native Canvas 2D, `requestAnimationFrame` |
| Backend           | FastAPI, Pydantic, Uvicorn                |
| Storage           | SQLite via aiosqlite                      |
| Real-time updates | WebSocket                                 |

## Version

The current project version is **v0.1.0**. It is an early preview focused on the complete drawing and shared-ocean experience.

The version number is defined in `frontend/package.json`. See [CHANGELOG.md](CHANGELOG.md) for the included features and future release notes.

## Quick start

### Requirements

- Node.js 18 or newer
- npm
- Python 3.11
- [uv](https://docs.astral.sh/uv/)

Clone the repository and start both services:

```bash
git clone https://github.com/cyhndaugust/afish.git
cd afish
./dev.sh
```

Open:

- Frontend: <http://localhost:5173>
- Backend health check: <http://localhost:8000/api/health>

For testing on a phone, connect it to the same local network and open the `Network` address printed by Vite.

### Run services separately

Backend:

```bash
cd backend
uv venv .venv --python 3.11
uv pip install -r requirements.txt -p .venv/bin/python
.venv/bin/python -m uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Create a production frontend build:

```bash
cd frontend
npm run build
```

### Docker deployment

Build and start the production services:

```bash
docker compose up --build -d
```

Open <http://localhost:8080>. To use another host port, set `AFISH_PORT`, for example:

```bash
AFISH_PORT=80 docker compose up --build -d
```

Useful operations:

```bash
docker compose ps
docker compose logs -f
docker compose down
```

Fish data is stored in the `afish-data` Docker volume and survives container recreation. Running `docker compose down -v` also deletes that data.

## How it works

1. The visitor enters a name and draws on a logical `480 × 320` canvas.
2. The frontend sends the name and strokes to the FastAPI backend.
3. The backend stores the fish in SQLite and broadcasts it over WebSocket.
4. Each client turns the original strokes into an animated `FishSprite`.
5. The ocean engine handles movement, turning, hit testing, labels, dialogue, and performance scaling.

## Project structure

```text
backend/
  main.py                 HTTP API, WebSocket endpoint, rate limiting
  db.py                   SQLite setup and queries
  models.py               Request and response models
  ws.py                   WebSocket connection manager

frontend/src/
  components/
    DrawCanvas.tsx        Pointer-based drawing canvas
    LanguageSwitch.tsx    English and Chinese language control
    Toolbar.tsx           Drawing tools
  ocean/
    background.ts         Water, light, bubbles, seabed, and seagrass
    FishSprite.ts         Fish deformation, movement, and hit testing
    engine.ts             Render loop, fish groups, labels, and dialogue
  views/
    CreateView.tsx        Fish creation screen
    OceanView.tsx         Shared ocean screen
  i18n.ts                 English and Chinese interface copy
```

## API overview

| Method    | Path                    | Purpose                              |
| --------- | ----------------------- | ------------------------------------ |
| `GET`     | `/api/health`           | Service, fish, and connection status |
| `GET`     | `/api/fishes?limit=100` | Fetch recent fish                    |
| `POST`    | `/api/fishes`           | Store and broadcast a fish           |
| WebSocket | `/ws`                   | Receive newly released fish          |

## Public deployment notes

- Fish submission is intentionally unauthenticated. Do not treat submitted names or drawings as trusted content.
- The backend limits each IP address to five submissions per minute. This is an in-memory limit and resets when the process restarts.
- Request bodies are limited to 256 KiB.
- The current CORS allowlist only includes the local Vite development addresses. Add the production frontend origin before deploying the API separately.
- SQLite is suitable for a small shared installation. Use managed storage if the service will run across multiple instances.
- Local databases, virtual environments, build output, environment files, and editor files are excluded by `.gitignore`.

## Contributing and support

Bug reports and improvement proposals are welcome through [GitHub Issues](https://github.com/cyhndaugust/afish/issues). Please describe the expected behavior, actual behavior, and reproduction steps.

## License

This project is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE).

- Personal study, research, experimentation, hobby projects, and other noncommercial uses are permitted.
- Commercial use is not permitted without separate written permission. This includes paid products or services, advertising or subscription-supported deployments, resale, and internal business use.
- Copies and modified versions may be shared only for permitted noncommercial purposes and must include the license and required notices.
- Third-party software and assets remain governed by their original licenses. See [Third-Party Notices](THIRD_PARTY_NOTICES.md), including the attribution and noncommercial terms for `animal-island-ui`.

Contact the copyright holders before any commercial use to obtain a separate license. This summary is provided for convenience; the `LICENSE` file controls if there is any conflict.

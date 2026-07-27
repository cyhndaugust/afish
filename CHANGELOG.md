# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Documentation

- Reorganized the project documentation into separate English and Simplified Chinese README files.
- Added language, version, status, and technology badges.

## 0.1.0

### Added

- Freehand fish drawing with colors, brush sizes, eraser, undo, clear, and guide controls.
- Shared Canvas 2D ocean with animated user-created fish.
- FastAPI and SQLite backend for storing drawings.
- WebSocket updates for newly released fish.
- Creator labels on tap and randomized dialogue with a dash animation on double-tap.
- Responsive desktop and touch interactions.
- English and Simplified Chinese interfaces with persistent language preference.
- Dynamic ocean background with light shafts, bubbles, seabed, and animated seagrass.

### Security

- Per-IP in-memory submission rate limiting.
- Request body size limit for fish submissions.

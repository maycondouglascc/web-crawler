# Visual Intelligence Studio (`web-crawler`)

A local-first visual intelligence platform to crawl, screen-capture, and reverse-engineer web applications (including authenticated sessions). Automatically slices semantic sections, deduplicates UI components, extracts W3C design tokens, and generates AI context packs.

## Core Capabilities

- **Authenticated Session Vault**: Interactive headed Chromium login (OAuth, 2FA, SSO) persisted locally with Safe-Crawl guardrails blocking destructive routes (`/logout`, `/delete-account`, `DELETE`/`PUT`/`PATCH`).
- **Smart Route Discovery**: Crawls SPAs and sitemaps, clustering dynamic URL patterns (`/projects/:id`) into representative samples.
- **Multi-Viewport & Multi-Theme Capture**: Lossless Playwright captures across Desktop (`1440px`), Mobile (`375px`), Tablet (`768px`), and Ultrawide (`1920px`) in Light and Dark modes, plus sandboxed modal/tab interaction triggers.
- **Section Slicer & Component Harvester**: Crops semantic landmarks (`navbar`, `hero`, `features`, `pricing`, `footer`) and deduplicates repeated UI components by structural/CSS fingerprint.
- **Design System & AI Exports**: Generates `DESIGN_SYSTEM.md`, `tokens.json`, `CONTEXT.md` (`llms.txt`), and a standalone offline `gallery.html`.

## Quickstart

Launch both the FastAPI backend and React Studio UI with one command:

```bash
./start.sh
```

Open **`http://localhost:8000`** in your browser.

## Project Structure

- `backend/` — FastAPI server, SQLite database (`studio.db`), Playwright engine (`app/engine/`), and exporters (`app/exporters/`).
- `frontend/` — React 18 + TypeScript + Vite + Tailwind CSS Studio UI.
- `profiles/` — Local authenticated Playwright `storage_state` sessions (gitignored).
- `projects/` — Captured screenshots, component crops, and exported bundles per run (gitignored).
- `legacy/` — Standalone CLI prototypes.

## Testing

```bash
# Unit & integration tests
PYTHONPATH=backend ./venv/bin/pytest backend/tests/test_milestone1.py backend/tests/test_milestone2.py backend/tests/test_milestone3.py backend/tests/test_post_milestone3.py

# End-to-end smoke test
PYTHONPATH=backend ./venv/bin/python backend/tests/e2e_smoke_test.py
```

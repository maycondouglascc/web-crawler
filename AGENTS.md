# AGENTS.md — Development Guidelines for AI Agents

This file provides essential architectural context, commands, and safety rules for AI coding agents working in `web-crawler` (Visual Intelligence Studio).

## 1. Tech Stack & Architecture

- **Backend (`backend/`)**: Python 3, FastAPI, SQLite (`studio.db` at repo root), Playwright (`sync_api` executed in background worker threads), BeautifulSoup4.
  - `backend/app/main.py`: REST API (`/api/*`), WebSocket progress broadcaster (`/ws/runs/{run_id}`), media mount (`/media/projects/*`), and static SPA host (`frontend/dist`).
  - `backend/app/database.py`: Raw `sqlite3` schema and connection helper (`projects`, `auth_profiles`, `runs`, `routes`, `captures`, `components`, `tokens`).
  - `backend/app/engine/`:
    - `auth_vault.py`: Headed Chromium login (`launch_interactive_login_sync`) and request interception guardrails (`apply_safe_crawl_guardrails`).
    - `discoverer.py`: Hybrid SPA/DOM route crawler and dynamic URL pattern grouper (`/blog/:slug`, `/items/:id`).
    - `sanitizer.py`: Pre-capture page sanitizer (lazy-load scrolling, cookie banner hiding, light/dark theme forcing).
    - `capturer.py`: Multi-viewport (`desktop`, `mobile`, `tablet`, `ultrawide`) and multi-theme capture orchestrator (`run_capture_pipeline`, `recapture_routes_pipeline`).
    - `slicer.py`: Semantic landmark detector/cropper (`slice_page_sections`) and structural fingerprint component harvester (`harvest_page_components`).
    - `interactions.py`: Safe auto-trigger explorer for no-URL UI states (modals, drawers, tabs).
    - `tokens.py`: Computed CSS token extractor (CSS Color 4 normalization, typography scale, border radii, shadows).
  - `backend/app/exporters/`: Generates `DESIGN_SYSTEM.md`, `tokens.json`, `CONTEXT.md`, `llms.txt`, and `gallery.html` inside `projects/<project_id>/runs/<run_id>/exports/`.
- **Frontend (`frontend/`)**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons.
  - Built into `frontend/dist` and served directly by FastAPI on port `8000` (or via Vite dev server on `5173` proxying `/api` and `/ws` to `127.0.0.1:8000`).

## 2. Build, Run & Verification Commands

Always use the local `./venv` Python environment and set `PYTHONPATH=backend` when running backend commands.

```bash
# Unified launcher (builds frontend & starts FastAPI on :8000)
./start.sh

# Run backend directly
PYTHONPATH=backend ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir backend

# Build & type-check frontend (MUST run after editing frontend/ so FastAPI serves updated assets)
cd frontend && npm run build

# Run unit & integration test suite
PYTHONPATH=backend ./venv/bin/pytest backend/tests/test_milestone1.py backend/tests/test_milestone2.py backend/tests/test_milestone3.py backend/tests/test_post_milestone3.py

# Run full E2E smoke test
PYTHONPATH=backend ./venv/bin/python backend/tests/e2e_smoke_test.py
```

## 3. Critical Guardrails & Conventions

1. **Preserve Safe-Crawl Guardrails**: Every automated Playwright page in discovery, capture, or interaction exploration **must** attach `apply_safe_crawl_guardrails(page)` from `app/engine/auth_vault.py` to block destructive URLs (`logout`, `delete-account`, etc.) and non-idempotent HTTP methods (`DELETE`, `PUT`, `PATCH`).
2. **Playwright Threading & Async Event Loop**: Playwright tasks use `sync_playwright()` inside FastAPI `BackgroundTasks` worker threads. Use `update_progress()` in `app/main.py` (which dispatches via `asyncio.run_coroutine_threadsafe` onto `main_event_loop`) to emit WebSocket updates safely across threads.
3. **Cache-Busted Media URLs**: Always format media paths through `make_media_url(abs_path)` in `app/main.py` so re-captured screenshots append `?v=<mtime>` and bypass browser caching.
4. **Frontend Build Sync**: FastAPI serves static files from `frontend/dist`. Whenever you modify any file in `frontend/src/`, run `cd frontend && npm run build` so changes take effect on `:8000`.
5. **Sensitive & Generated Artifacts**: Never commit `profiles/` (contains session cookies/tokens), `projects/` (generated captures), or `*.db` (`studio.db`).
6. **Legacy Folder**: `legacy/` and root-level legacy guides (`QUICKSTART.md`, `CONFIG_REFERENCE.md`, `LOCAL_SITE_CAPTURE.md`) belong to standalone CLI prototypes. All active development happens in `backend/` and `frontend/`.

# Visual Intelligence Studio (`web-crawler`)

A local-first visual intelligence platform to crawl, screen-capture, reverse-engineer web apps (including authenticated sessions), auto-slice sections/components, extract design tokens, and generate AI context packs.

---

## 🌟 Capabilities

- 🔐 **Authenticated Session Vault**: Log into web apps once with Google OAuth, 2FA, SSO, or Magic Links via an interactive headed Chromium window. Sessions are saved locally and protected with automated Safe-Crawl guardrails blocking destructive actions (`/logout`, `/delete-account`, etc.).
- ⚡ **Smart Route Discovery & Pattern Deduplication**: Crawls SPAs and sitemaps, automatically clustering dynamic paths (e.g. `/projects/:id` or `/blog/:slug`) into 1 representative sample URL to avoid endless crawls.
- 📸 **Multi-Viewport & Multi-Theme Lossless Capturer**: Parallel Playwright workers capturing Desktop (`1440px`), Mobile (`375px`), Tablet, and Ultrawide in both Light and Dark modes.
- 🧩 **Semantic Section Auto-Slicer**: Discovers visual landmarks (`<header>`, `<nav>`, `<hero>`, `<section>`, `<footer>`, pricing tables, feature grids) and captures lossless PNG crops.
- 📦 **Structural Fingerprint Component Harvester**: Scans buttons, cards, inputs, and tabs. Computes a structural signature hash based on tag structure, computed CSS properties, and aspect ratio. Deduplicates repeated elements into 1 canonical preview with instance counts (`"Used 14x across 3 routes"`).
- 🎭 **Auto-Trigger Discovery for No-URL UI**: Safely clicks non-destructive triggers (`[aria-haspopup]`, `[role=tab]`, modals, drawers) and captures open UI states.
- 🎨 **Design Token Extractor (`DESIGN_SYSTEM.md` & `tokens.json`)**: Extracts color palettes, typography scales, border radii, and box shadows in W3C Design Tokens format.
- 🤖 **AI Coding Agent Context Pack (`CONTEXT.md` / `llms.txt`)**: Generates route maps, section screenshots, and component inventories formatted specifically for Antigravity, Cursor, and Claude Code.
- 🌐 **Portable Offline Gallery (`gallery.html`)**: Zero-dependency standalone HTML viewer you can zip and email to clients or team members.
- 🖥️ **Studio UI**: Fast, modern React + Tailwind web dashboard served directly by FastAPI.

---

## 🚀 Quickstart (1 Command)

To launch the backend API and the Studio UI:

```bash
./start.sh
```

Then open **`http://localhost:8000`** in your browser.

---

## 🏗️ Architecture

```text
web-crawler/
├── backend/                     # FastAPI + Playwright + SQLite Engine
│   ├── app/
│   │   ├── main.py              # REST API & WebSocket live streaming
│   │   ├── database.py          # SQLite schema & persistence
│   │   ├── engine/
│   │   │   ├── auth_vault.py    # Headed login handoff & Safe-Crawl guardrails
│   │   │   ├── discoverer.py    # Hybrid SPA crawler & dynamic pattern grouper
│   │   │   ├── sanitizer.py     # Pre-capture sanitizer (lazy scroll, banners, theme)
│   │   │   ├── capturer.py      # Lossless multi-viewport / multi-theme orchestrator
│   │   │   ├── slicer.py        # Semantic section slicer & component harvester
│   │   │   ├── interactions.py  # Sandboxed auto-trigger explorer for Modals & Tabs
│   │   │   └── tokens.py        # Computed CSS Design Token extractor
│   │   ├── exporters/
│   │   │   ├── design_system.py # Generates DESIGN_SYSTEM.md & tokens.json
│   │   │   ├── context_pack.py  # Generates CONTEXT.md / llms.txt for AI agents
│   │   │   └── html_viewer.py   # Generates standalone offline gallery.html
│   │   └── tests/               # Pytest suite & E2E smoke tests
│   └── requirements.txt
├── frontend/                    # React + Vite + Tailwind CSS Studio UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthVaultModal.tsx     # Session manager & login launcher
│   │   │   ├── DiscoveryReview.tsx    # Pattern deduplication review & matrix selector
│   │   │   ├── LiveCrawlProgress.tsx  # Real-time WebSocket progress tracker
│   │   │   ├── StudioGallery.tsx      # Mobbin-style visual dashboard
│   │   │   ├── TokenInspector.tsx     # Visual color palette & typography viewer
│   │   │   └── ExportDrawer.tsx       # 1-click download drawer for tokens & context
│   │   └── App.tsx
│   └── dist/                    # Pre-compiled static assets
├── legacy/                      # Standalone CLI prototypes preserved for reference
├── profiles/                    # Local encrypted session vault (gitignored)
├── projects/                    # Generated captures and exports per run (gitignored)
└── start.sh                     # Unified local launcher
```

---

## 🧪 Testing

Run all unit and integration test suites:

```bash
PYTHONPATH=backend ./venv/bin/pytest backend/tests/test_milestone1.py backend/tests/test_milestone2.py backend/tests/test_milestone3.py
```

Run full end-to-end smoke test (spins up mock server, crawls, captures, extracts tokens, and tests downloads):

```bash
PYTHONPATH=backend ./venv/bin/python backend/tests/e2e_smoke_test.py
```

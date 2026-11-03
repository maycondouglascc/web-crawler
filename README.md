# Visual Intelligence Studio (`web-crawler`)

A local-first visual intelligence platform to crawl, screen-capture, reverse-engineer web apps (including authenticated sessions), auto-slice sections/components, and extract design tokens and AI context packs.

---

## 🌟 What's New in v1.0

- 🔐 **Authenticated Session Vault**: Log into web apps once with Google OAuth, 2FA, SSO, or Magic Links via an interactive Chromium window. Sessions are saved locally and guarded with automated Safe-Crawl rules that prevent accidental logouts or mutations.
- ⚡ **Smart Route Discovery & Pattern Deduplication**: Crawls SPAs and sitemaps, automatically clustering dynamic paths (e.g. `/projects/:id`) into 1 representative sample URL to avoid endless crawls.
- 🎨 **Local Studio UI**: Fast, modern React + Tailwind web dashboard to manage sessions, review routes, and configure capture matrices.
- 🗂️ **Legacy Scripts Preserved**: Original standalone scripts are safely stored in [`legacy/`](file:///home/maycon/Documents/code/web-crawler/legacy/).

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
│   │   │   └── discoverer.py    # Hybrid SPA crawler & dynamic pattern grouper
│   │   └── tests/               # Pytest suite
│   └── requirements.txt
├── frontend/                    # React + Vite + Tailwind CSS Studio UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthVaultModal.tsx     # Session manager & login launcher
│   │   │   ├── DiscoveryReview.tsx    # Pattern deduplication review & matrix selector
│   │   │   └── LiveCrawlProgress.tsx  # Real-time WebSocket progress tracker
│   │   └── App.tsx
│   └── dist/                    # Pre-compiled static assets
├── legacy/                      # Standalone CLI prototypes (crawler, visual_crawler, etc.)
├── profiles/                    # Local encrypted session vault (gitignored)
└── start.sh                     # Unified local launcher
```

---

## 🧪 Testing

Run backend unit and integration tests:

```bash
PYTHONPATH=backend ./venv/bin/pytest backend/tests/test_milestone1.py
```

---

## 📋 Legacy Scripts

The original standalone scripts remain available in [`legacy/`](file:///home/maycon/Documents/code/web-crawler/legacy/):
- `legacy/crawler.py` — Domain crawler and grouped sitemap generator
- `legacy/local_site_capture.py` — Local Vite server screenshot utility
- `legacy/multi_width_crawler.py` — Multi-viewport CLI capturer
- `legacy/visual_crawler.py` — Batch URL screenshotter
- `legacy/ai_crawler.py` — Local Ollama content auditor

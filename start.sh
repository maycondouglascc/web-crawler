#!/usr/bin/env bash
set -e

# Visual Intelligence Studio Launcher
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "============================================================"
echo "📸 Launching Visual Intelligence Studio"
echo "============================================================"

# Ensure virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtualenv..."
    python3 -m venv venv
    ./venv/bin/pip install -r backend/requirements.txt
fi

# Always build frontend studio UI to keep latest changes
echo "Building frontend studio UI..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd ..

echo ""
echo "🚀 Studio running locally at: http://localhost:8000"
echo "👉 Press Ctrl+C to stop"
echo ""

PYTHONPATH=backend ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir backend

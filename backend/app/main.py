"""
FastAPI Backend API for Visual Intelligence Studio
Provides REST endpoints and WebSockets for project management,
authenticated session vault, smart route discovery, and capture orchestration.
"""

import os
import uuid
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import get_connection, init_db
from app.engine.auth_vault import (
    launch_interactive_login_sync,
    get_all_profiles,
    delete_profile
)
from app.engine.discoverer import discover_site_routes

# Ensure database tables exist
init_db()

app = FastAPI(
    title="Visual Intelligence Studio API",
    description="Backend API for authenticated web app crawling, screenshotting, section slicing and design token extraction.",
    version="1.0.0"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections per run_id
active_websockets: Dict[str, List[WebSocket]] = {}

async def broadcast_progress(run_id: str, text: str, percent: int, status: str = None):
    """Broadcasts real-time progress to connected WebSockets and updates SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    if status:
        cursor.execute("UPDATE runs SET progress_text = ?, progress_percent = ?, status = ? WHERE id = ?",
                       (text, percent, status, run_id))
    else:
        cursor.execute("UPDATE runs SET progress_text = ?, progress_percent = ? WHERE id = ?",
                       (text, percent, run_id))
    conn.commit()
    conn.close()

    if run_id in active_websockets:
        payload = {"run_id": run_id, "text": text, "percent": percent, "status": status}
        dead_sockets = []
        for ws in active_websockets[run_id]:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_sockets.append(ws)
        for dead in dead_sockets:
            active_websockets[run_id].remove(dead)

# --- REQUEST SCHEMAS ---

class ProjectCreate(BaseModel):
    name: str
    base_url: str
    auth_profile_id: Optional[str] = None

class LoginLaunchRequest(BaseModel):
    login_url: str
    profile_name: str

class RouteToggleRequest(BaseModel):
    route_id: str
    is_selected: bool

class PatternToggleRequest(BaseModel):
    run_id: str
    pattern: str
    is_selected: bool

# --- API ROUTES ---

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "visual-studio-backend"}

# 1. Projects
@app.get("/api/projects")
def list_projects():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/projects")
def create_project(data: ProjectCreate):
    project_id = str(uuid.uuid4())[:8]
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO projects (id, name, base_url, auth_profile_id, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (project_id, data.name, data.base_url, data.auth_profile_id, now))
    conn.commit()
    conn.close()
    return {"id": project_id, "name": data.name, "base_url": data.base_url, "auth_profile_id": data.auth_profile_id}

# 2. Authenticated Session Vault
@app.get("/api/auth/profiles")
def list_auth_profiles():
    return get_all_profiles()

@app.post("/api/auth/login")
def launch_login_session(data: LoginLaunchRequest, background_tasks: BackgroundTasks):
    """
    Spawns interactive headed Chromium window for user to log in.
    Runs synchronously in executor thread so it doesn't block FastAPI event loop.
    """
    loop = asyncio.get_event_loop()
    profile = launch_interactive_login_sync(data.login_url, data.profile_name)
    return profile

@app.delete("/api/auth/profiles/{profile_id}")
def remove_auth_profile(profile_id: str):
    delete_profile(profile_id)
    return {"status": "deleted", "id": profile_id}

# 3. Discovery & Runs
@app.post("/api/projects/{project_id}/discover")
async def start_route_discovery(project_id: str, background_tasks: BackgroundTasks):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    project = cursor.fetchone()
    if not project:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    auth_storage_path = None
    if project["auth_profile_id"]:
        cursor.execute("SELECT storage_state_path FROM auth_profiles WHERE id = ?", (project["auth_profile_id"],))
        profile = cursor.fetchone()
        if profile:
            auth_storage_path = profile["storage_state_path"]

    run_id = str(uuid.uuid4())[:8]
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO runs (id, project_id, status, progress_text, progress_percent, created_at)
        VALUES (?, ?, 'discovering', 'Starting route discovery...', 5, ?)
    """, (run_id, project_id, now))
    conn.commit()
    conn.close()

    def run_discovery_worker():
        def progress_cb(text, pct):
            asyncio.run(broadcast_progress(run_id, text, pct))

        try:
            routes = discover_site_routes(
                run_id=run_id,
                base_url=project["base_url"],
                storage_state_path=auth_storage_path,
                max_pages=35,
                progress_callback=progress_cb
            )
            asyncio.run(broadcast_progress(run_id, "Route discovery finished! Review routes below.", 100, status="review_pending"))
        except Exception as e:
            print(f"Discovery error: {e}")
            asyncio.run(broadcast_progress(run_id, f"Discovery failed: {str(e)}", 100, status="failed"))

    background_tasks.add_task(run_discovery_worker)
    return {"run_id": run_id, "status": "discovering"}

@app.get("/api/runs/{run_id}")
def get_run_status(run_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runs WHERE id = ?", (run_id,))
    run = cursor.fetchone()
    conn.close()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return dict(run)

@app.get("/api/runs/{run_id}/routes")
def get_run_routes(run_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM routes WHERE run_id = ? ORDER BY pattern, is_sample DESC, path", (run_id,))
    rows = cursor.fetchall()
    conn.close()

    routes = [dict(r) for r in rows]

    # Group by pattern for the frontend
    patterns: Dict[str, Dict[str, Any]] = {}
    for r in routes:
        pat = r["pattern"]
        if pat not in patterns:
            patterns[pat] = {
                "pattern": pat,
                "total_routes": 0,
                "selected_count": 0,
                "sample_path": r["path"],
                "routes": []
            }
        patterns[pat]["total_routes"] += 1
        if r["is_selected"]:
            patterns[pat]["selected_count"] += 1
        patterns[pat]["routes"].append(r)

    return {
        "run_id": run_id,
        "total_routes": len(routes),
        "patterns": list(patterns.values())
    }

@app.post("/api/routes/toggle")
def toggle_route(data: RouteToggleRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE routes SET is_selected = ? WHERE id = ?", (1 if data.is_selected else 0, data.route_id))
    conn.commit()
    conn.close()
    return {"status": "ok", "route_id": data.route_id, "is_selected": data.is_selected}

@app.post("/api/routes/toggle-pattern")
def toggle_pattern(data: PatternToggleRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE routes SET is_selected = ? WHERE run_id = ? AND pattern = ?",
                   (1 if data.is_selected else 0, data.run_id, data.pattern))
    conn.commit()
    conn.close()
    return {"status": "ok", "pattern": data.pattern, "is_selected": data.is_selected}

# 4. WebSockets for Live Progress
@app.websocket("/ws/runs/{run_id}")
async def websocket_run_progress(websocket: WebSocket, run_id: str):
    await websocket.accept()
    if run_id not in active_websockets:
        active_websockets[run_id] = []
    active_websockets[run_id].append(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        if run_id in active_websockets and websocket in active_websockets[run_id]:
            active_websockets[run_id].remove(websocket)

# 5. Serve Frontend Dist if available
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


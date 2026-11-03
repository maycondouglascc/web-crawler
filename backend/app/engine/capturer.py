"""
Multi-Viewport & Multi-Theme Lossless Capture Pipeline
Orchestrates parallel Playwright workers to capture full-page and above-the-fold screens,
invoke semantic section slicing, and harvest deduplicated UI components.
"""

import os
import uuid
import time
import json
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

from app.database import get_connection
from app.engine.auth_vault import apply_safe_crawl_guardrails
from app.engine.sanitizer import sanitize_page_for_capture
from app.engine.slicer import slice_page_sections, harvest_page_components

VIEWPORT_SPECS = {
    "desktop": {"width": 1440, "height": 900},
    "mobile": {"width": 375, "height": 812},
    "tablet": {"width": 768, "height": 1024},
    "ultrawide": {"width": 1920, "height": 1080},
}

PROJECTS_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "projects")

def run_capture_pipeline(
    run_id: str,
    viewports: Dict[str, bool],
    themes: Dict[str, bool],
    progress_callback = None
):
    """
    Executes the complete capture pipeline for all selected routes in run_id.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Get run & project details
    cursor.execute("""
        SELECT r.id as run_id, p.id as project_id, p.base_url, p.auth_profile_id
        FROM runs r
        JOIN projects p ON r.project_id = p.id
        WHERE r.id = ?
    """, (run_id,))
    run_info = cursor.fetchone()

    if not run_info:
        conn.close()
        raise ValueError(f"Run {run_id} not found")

    project_id = run_info["project_id"]
    auth_profile_id = run_info["auth_profile_id"]

    # Get auth storage state path if any
    storage_state_path = None
    if auth_profile_id:
        cursor.execute("SELECT storage_state_path FROM auth_profiles WHERE id = ?", (auth_profile_id,))
        ap = cursor.fetchone()
        if ap and os.path.exists(ap["storage_state_path"]):
            storage_state_path = ap["storage_state_path"]

    # Get selected routes
    cursor.execute("SELECT * FROM routes WHERE run_id = ? AND is_selected = 1 ORDER BY path", (run_id,))
    selected_routes = cursor.fetchall()
    conn.close()

    if not selected_routes:
        if progress_callback:
            progress_callback("No routes selected for capture.", 100, status="completed")
        return

    # Setup directories
    run_dir = os.path.join(PROJECTS_BASE_DIR, project_id, "runs", run_id)
    screens_dir = os.path.join(run_dir, "screens")
    os.makedirs(screens_dir, exist_ok=True)

    active_viewports = [k for k, v in viewports.items() if v and k in VIEWPORT_SPECS]
    if not active_viewports:
        active_viewports = ["desktop", "mobile"]

    active_themes = [k for k, v in themes.items() if v and k in ["light", "dark"]]
    if not active_themes:
        active_themes = ["light"]

    total_tasks = len(selected_routes) * len(active_viewports) * len(active_themes)
    current_task = 0

    if progress_callback:
        progress_callback(f"Starting capture pipeline ({total_tasks} render variants)...", 5)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for route_row in selected_routes:
            route_path = route_row["path"]
            full_url = route_row["full_url"]
            clean_route_name = route_path.strip("/").replace("/", "_") or "home"

            for vp_name in active_viewports:
                vp_spec = VIEWPORT_SPECS[vp_name]

                for theme_name in active_themes:
                    current_task += 1
                    pct = int(5 + (current_task / total_tasks) * 90)

                    if progress_callback:
                        progress_callback(
                            f"Capturing [{current_task}/{total_tasks}]: {route_path} ({vp_name} - {theme_name})",
                            pct
                        )

                    context_args = {
                        "viewport": {"width": vp_spec["width"], "height": vp_spec["height"]},
                        "device_scale_factor": 2, # High DPI for crisp designer screenshots
                    }
                    if storage_state_path:
                        context_args["storage_state"] = storage_state_path

                    context = browser.new_context(**context_args)
                    page = context.new_page()
                    apply_safe_crawl_guardrails(page)

                    try:
                        page.goto(full_url, timeout=30000, wait_until="domcontentloaded")

                        # 1. Sanitize & Apply Theme
                        sanitize_page_for_capture(page, theme=theme_name, is_full_page=True)

                        # 2. Capture Full Page (Lossless PNG)
                        full_filename = f"{clean_route_name}_{vp_name}_{theme_name}_full.png"
                        full_filepath = os.path.join(screens_dir, full_filename)
                        page.screenshot(path=full_filepath, full_page=True)

                        # 3. Capture Above-The-Fold
                        fold_filename = f"{clean_route_name}_{vp_name}_{theme_name}_fold.png"
                        fold_filepath = os.path.join(screens_dir, fold_filename)
                        page.screenshot(path=fold_filepath, full_page=False)

                        # Save records to DB
                        conn = get_connection()
                        cursor = conn.cursor()
                        cursor.execute("""
                            INSERT INTO captures (id, run_id, route_path, viewport_label, width, height, theme, capture_type, file_path, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'full_page', ?, datetime('now'))
                        """, (str(uuid.uuid4())[:8], run_id, route_path, vp_name, vp_spec["width"], vp_spec["height"], theme_name, full_filepath))

                        cursor.execute("""
                            INSERT INTO captures (id, run_id, route_path, viewport_label, width, height, theme, capture_type, file_path, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'fold', ?, datetime('now'))
                        """, (str(uuid.uuid4())[:8], run_id, route_path, vp_name, vp_spec["width"], vp_spec["height"], theme_name, fold_filepath))
                        conn.commit()
                        conn.close()

                        # 4. On Desktop Light, slice semantic sections and harvest components
                        if vp_name == "desktop" and theme_name == active_themes[0]:
                            slice_page_sections(page, run_id, route_path, vp_name, theme_name, run_dir)
                            harvest_page_components(page, run_id, route_path, vp_name, theme_name, run_dir)

                    except Exception as e:
                        print(f"Error capturing {full_url} ({vp_name}/{theme_name}): {e}")
                    finally:
                        context.close()

        browser.close()

    # Update run status to completed
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE runs
        SET status = 'completed', progress_text = 'Capture pipeline complete! Browse your visual gallery.', progress_percent = 100, completed_at = datetime('now')
        WHERE id = ?
    """, (run_id,))
    conn.commit()
    conn.close()

    if progress_callback:
        progress_callback("All screenshots, sections, and UI components captured!", 100, status="completed")

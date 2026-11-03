"""
Multi-Viewport & Multi-Theme Lossless Capture Pipeline
Orchestrates parallel Playwright workers to capture full-page and above-the-fold screens,
invoke semantic section slicing, harvest deduplicated UI components,
explore interactive modals/drawers, and generate Design System & AI Context packs.
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
from app.engine.interactions import explore_interactive_triggers
from app.engine.tokens import extract_page_tokens, aggregate_and_store_tokens
from app.exporters.design_system import generate_design_system_files
from app.exporters.context_pack import generate_context_pack
from app.exporters.html_viewer import generate_portable_html_viewer

VIEWPORT_SPECS = {
    "desktop": {"width": 1440, "height": 900},
    "mobile": {"width": 375, "height": 812},
    "tablet": {"width": 768, "height": 1024},
    "ultrawide": {"width": 1920, "height": 1080},
}

PROJECTS_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "projects")

def _regenerate_exports(run_id: str, base_url: str, run_dir: str, tokens: Dict[str, Any]):
    """Helper to regenerate design system, AI context pack, and portable HTML viewer."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM routes WHERE run_id = ?", (run_id,))
    all_routes = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM captures WHERE run_id = ? AND capture_type = 'section'", (run_id,))
    all_sections = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM captures WHERE run_id = ? AND capture_type IN ('full_page', 'fold')", (run_id,))
    all_screens = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM components WHERE run_id = ?", (run_id,))
    all_components = [dict(r) for r in cursor.fetchall()]
    conn.close()

    generate_design_system_files(run_id, tokens, run_dir)
    generate_context_pack(run_id, base_url, all_routes, all_sections, all_components, tokens, run_dir)
    generate_portable_html_viewer(run_id, all_screens, all_sections, all_components, run_dir)

def run_capture_pipeline(
    run_id: str,
    viewports: Dict[str, bool],
    themes: Dict[str, bool],
    include_fold: bool = False,
    progress_callback = None
):
    """
    Executes the complete capture and visual intelligence pipeline.
    Defaulting to Full Page Only (include_fold=False).
    Progressively emits asset updates and saves tokens incrementally.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Save run configuration
    config_dict = {
        "viewports": viewports,
        "themes": themes,
        "include_fold": include_fold
    }
    cursor.execute("UPDATE runs SET config_json = ? WHERE id = ?", (json.dumps(config_dict), run_id))
    conn.commit()

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
    base_url = run_info["base_url"]
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
            progress_callback("No routes selected for capture.", 100, status="completed", asset_updated=True)
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

    # Choose primary viewport for structural landmark & component extraction
    primary_vp = "desktop" if "desktop" in active_viewports else active_viewports[0]

    total_tasks = len(selected_routes) * len(active_viewports) * len(active_themes)
    current_task = 0
    collected_tokens = []

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
                    pct = int(5 + (current_task / (total_tasks + 2)) * 80)

                    context_args = {
                        "viewport": {"width": vp_spec["width"], "height": vp_spec["height"]},
                        "device_scale_factor": 2, # High DPI for crisp screenshots
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

                        conn = get_connection()
                        cursor = conn.cursor()
                        cursor.execute("""
                            INSERT INTO captures (id, run_id, route_path, viewport_label, width, height, theme, capture_type, file_path, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'full_page', ?, datetime('now'))
                        """, (str(uuid.uuid4())[:8], run_id, route_path, vp_name, vp_spec["width"], vp_spec["height"], theme_name, full_filepath))

                        # 3. Capture Above-The-Fold (only if opt-in)
                        if include_fold:
                            fold_filename = f"{clean_route_name}_{vp_name}_{theme_name}_fold.png"
                            fold_filepath = os.path.join(screens_dir, fold_filename)
                            page.screenshot(path=fold_filepath, full_page=False)

                            cursor.execute("""
                                INSERT INTO captures (id, run_id, route_path, viewport_label, width, height, theme, capture_type, file_path, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, 'fold', ?, datetime('now'))
                            """, (str(uuid.uuid4())[:8], run_id, route_path, vp_name, vp_spec["width"], vp_spec["height"], theme_name, fold_filepath))

                        conn.commit()
                        conn.close()

                        # 4. On Primary Viewport & First Theme: Slice sections, harvest components, tokens, and modals
                        if vp_name == primary_vp and theme_name == active_themes[0]:
                            slice_page_sections(page, run_id, route_path, vp_name, theme_name, run_dir)
                            harvest_page_components(page, run_id, route_path, vp_name, theme_name, run_dir)
                            page_toks = extract_page_tokens(page)
                            if page_toks:
                                collected_tokens.append(page_toks)
                                aggregate_and_store_tokens(run_id, collected_tokens)
                            explore_interactive_triggers(page, run_id, route_path, run_dir)

                        # Notify progress after DB records are saved for this variant
                        if progress_callback:
                            progress_callback(
                                f"Captured [{current_task}/{total_tasks}]: {route_path} ({vp_name} - {theme_name})",
                                pct,
                                asset_updated=True
                            )

                    except Exception as e:
                        print(f"Error capturing {full_url} ({vp_name}/{theme_name}): {e}")
                    finally:
                        context.close()

        browser.close()

    # Post-Processing: Tokens & Exporters
    if progress_callback:
        progress_callback("Extracting design tokens and generating AI Context Pack...", 90, asset_updated=True)

    tokens = aggregate_and_store_tokens(run_id, collected_tokens)
    _regenerate_exports(run_id, base_url, run_dir, tokens)

    # Update run status to completed
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE runs
        SET status = 'completed', progress_text = 'Visual intelligence suite complete! Gallery & Context ready.', progress_percent = 100, completed_at = datetime('now')
        WHERE id = ?
    """, (run_id,))
    conn.commit()
    conn.close()

    if progress_callback:
        progress_callback("Capture complete! Design System, AI Context & Gallery ready.", 100, status="completed", asset_updated=True)

def recapture_routes_pipeline(
    run_id: str,
    route_paths: List[str],
    viewports: Optional[Dict[str, bool]] = None,
    themes: Optional[Dict[str, bool]] = None,
    include_fold: Optional[bool] = None,
    progress_callback = None
):
    """
    Re-runs capture, slicing, component harvesting and token extraction for a specific subset of routes.
    Streams real-time updates and regenerates exports upon completion.
    """
    if not route_paths:
        if progress_callback:
            progress_callback("No routes specified for recapture.", 100, status="completed", asset_updated=True)
        return

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT r.id as run_id, r.config_json, p.id as project_id, p.base_url, p.auth_profile_id
        FROM runs r
        JOIN projects p ON r.project_id = p.id
        WHERE r.id = ?
    """, (run_id,))
    run_info = cursor.fetchone()

    if not run_info:
        conn.close()
        raise ValueError(f"Run {run_id} not found")

    project_id = run_info["project_id"]
    base_url = run_info["base_url"]
    auth_profile_id = run_info["auth_profile_id"]

    saved_config = json.loads(run_info["config_json"] or "{}")
    if viewports is None:
        viewports = saved_config.get("viewports", {"desktop": True, "mobile": True})
    if themes is None:
        themes = saved_config.get("themes", {"light": True})
    if include_fold is None:
        include_fold = saved_config.get("include_fold", False)

    # Get auth storage state path if any
    storage_state_path = None
    if auth_profile_id:
        cursor.execute("SELECT storage_state_path FROM auth_profiles WHERE id = ?", (auth_profile_id,))
        ap = cursor.fetchone()
        if ap and os.path.exists(ap["storage_state_path"]):
            storage_state_path = ap["storage_state_path"]

    # Delete existing captures for these specific routes
    placeholders = ",".join(["?"] * len(route_paths))
    cursor.execute(f"""
        DELETE FROM captures
        WHERE run_id = ? AND route_path IN ({placeholders})
    """, (run_id, *route_paths))
    conn.commit()

    # Get route details for requested paths
    cursor.execute(f"""
        SELECT * FROM routes
        WHERE run_id = ? AND path IN ({placeholders})
        ORDER BY path
    """, (run_id, *route_paths))
    routes_to_capture = cursor.fetchall()
    conn.close()

    if not routes_to_capture:
        if progress_callback:
            progress_callback("Specified routes not found in run.", 100, status="completed", asset_updated=True)
        return

    run_dir = os.path.join(PROJECTS_BASE_DIR, project_id, "runs", run_id)
    screens_dir = os.path.join(run_dir, "screens")
    os.makedirs(screens_dir, exist_ok=True)

    active_viewports = [k for k, v in viewports.items() if v and k in VIEWPORT_SPECS]
    if not active_viewports:
        active_viewports = ["desktop"]

    active_themes = [k for k, v in themes.items() if v and k in ["light", "dark"]]
    if not active_themes:
        active_themes = ["light"]

    primary_vp = "desktop" if "desktop" in active_viewports else active_viewports[0]

    total_tasks = len(routes_to_capture) * len(active_viewports) * len(active_themes)
    current_task = 0
    collected_tokens = []

    if progress_callback:
        progress_callback(f"Recapturing {len(routes_to_capture)} route(s) ({total_tasks} variants)...", 10, asset_updated=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for route_row in routes_to_capture:
            route_path = route_row["path"]
            full_url = route_row["full_url"]
            clean_route_name = route_path.strip("/").replace("/", "_") or "home"

            for vp_name in active_viewports:
                vp_spec = VIEWPORT_SPECS[vp_name]

                for theme_name in active_themes:
                    current_task += 1
                    pct = int(10 + (current_task / (total_tasks + 1)) * 75)

                    context_args = {
                        "viewport": {"width": vp_spec["width"], "height": vp_spec["height"]},
                        "device_scale_factor": 2,
                    }
                    if storage_state_path:
                        context_args["storage_state"] = storage_state_path

                    context = browser.new_context(**context_args)
                    page = context.new_page()
                    apply_safe_crawl_guardrails(page)

                    try:
                        page.goto(full_url, timeout=30000, wait_until="domcontentloaded")
                        sanitize_page_for_capture(page, theme=theme_name, is_full_page=True)

                        full_filename = f"{clean_route_name}_{vp_name}_{theme_name}_full.png"
                        full_filepath = os.path.join(screens_dir, full_filename)
                        page.screenshot(path=full_filepath, full_page=True)

                        conn = get_connection()
                        cursor = conn.cursor()
                        cursor.execute("""
                            INSERT INTO captures (id, run_id, route_path, viewport_label, width, height, theme, capture_type, file_path, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'full_page', ?, datetime('now'))
                        """, (str(uuid.uuid4())[:8], run_id, route_path, vp_name, vp_spec["width"], vp_spec["height"], theme_name, full_filepath))

                        if include_fold:
                            fold_filename = f"{clean_route_name}_{vp_name}_{theme_name}_fold.png"
                            fold_filepath = os.path.join(screens_dir, fold_filename)
                            page.screenshot(path=fold_filepath, full_page=False)

                            cursor.execute("""
                                INSERT INTO captures (id, run_id, route_path, viewport_label, width, height, theme, capture_type, file_path, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, 'fold', ?, datetime('now'))
                            """, (str(uuid.uuid4())[:8], run_id, route_path, vp_name, vp_spec["width"], vp_spec["height"], theme_name, fold_filepath))

                        conn.commit()
                        conn.close()

                        if vp_name == primary_vp and theme_name == active_themes[0]:
                            slice_page_sections(page, run_id, route_path, vp_name, theme_name, run_dir)
                            harvest_page_components(page, run_id, route_path, vp_name, theme_name, run_dir)
                            page_toks = extract_page_tokens(page)
                            if page_toks:
                                collected_tokens.append(page_toks)
                                aggregate_and_store_tokens(run_id, collected_tokens)
                            explore_interactive_triggers(page, run_id, route_path, run_dir)

                        if progress_callback:
                            progress_callback(
                                f"Recaptured [{current_task}/{total_tasks}]: {route_path} ({vp_name} - {theme_name})",
                                pct,
                                asset_updated=True
                            )

                    except Exception as e:
                        print(f"Error recapturing {full_url} ({vp_name}/{theme_name}): {e}")
                    finally:
                        context.close()

        browser.close()

    # Re-aggregate tokens & exports
    tokens = aggregate_and_store_tokens(run_id, collected_tokens)
    _regenerate_exports(run_id, base_url, run_dir, tokens)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE runs
        SET status = 'completed', progress_text = 'Recapture complete! Gallery and Context Pack updated.', progress_percent = 100, completed_at = datetime('now')
        WHERE id = ?
    """, (run_id,))
    conn.commit()
    conn.close()

    if progress_callback:
        progress_callback("Recapture finished! Gallery updated.", 100, status="completed", asset_updated=True)

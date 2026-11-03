"""
Tests for Post-Milestone 3 Improvements:
- Progressive live updates & cache busting
- Full page only default
- Interactive Lightbox & Component inspector capabilities
- Recapture endpoint & pipeline
- Multi-strategy landmark & component detection
- Modern CSS Color 4 & Typography scale token extraction
"""

import os
import json
import uuid
import pytest
from fastapi import BackgroundTasks

from app.main import make_media_url, CaptureStartRequest, RecaptureRequest, recapture_routes
from app.database import get_connection, init_db
from app.engine.slicer import infer_section_category, infer_component_category
from app.engine.tokens import aggregate_and_store_tokens, rgba_to_hex

def test_cache_busting_media_url(tmp_path):
    test_file = tmp_path / "test_screenshot.png"
    test_file.write_bytes(b"\x89PNG\r\n\x1a\n")

    url = make_media_url(str(test_file))
    assert "?v=" in url
    # Verify timestamp is an integer
    v_param = url.split("?v=")[1]
    assert v_param.isdigit()

def test_capture_start_defaults():
    req = CaptureStartRequest(
        viewports={"desktop": True},
        themes={"light": True}
    )
    assert req.include_fold is False # Full Page Only by default!

def test_recapture_request_schema():
    req = RecaptureRequest(
        route_paths=["/dashboard", "/settings"],
        viewports={"desktop": True},
        themes={"dark": True},
        include_fold=True
    )
    assert req.route_paths == ["/dashboard", "/settings"]
    assert req.include_fold is True

def test_advanced_section_categorization():
    # Navbar position heuristic
    assert infer_section_category("div", "top-bar", "", 0, top=10, height=80) == "navbar"

    # Hero with Framer / heading heuristic
    assert infer_section_category("div", "", "", 0, framer_name="HeroSection", top=90, height=600, has_heading=True) == "hero"

    # Pricing with keywords
    assert infer_section_category("div", "pricing-tier-card", "", 2, top=1200, height=500) == "pricing"

    # Testimonials
    assert infer_section_category("div", "quote-carousel", "", 3, top=1800, height=400) == "testimonials"

    # Footer at bottom
    assert infer_section_category("div", "footer-links", "", 4, top=2500, height=300, total_sections=5) == "footer"

def test_advanced_component_categorization():
    assert infer_component_category("button", "framer-button") == "button"
    assert infer_component_category("div", "", role="button") == "button"
    assert infer_component_category("input", "email-field") == "input"
    assert infer_component_category("div", "chip pill rounded-full") == "badge"
    assert infer_component_category("div", "feature-card shadow-lg") == "card"
    assert infer_component_category("div", "tab-item", role="tab") == "tab"

def test_rich_token_aggregation():
    init_db()
    test_run_id = f"test-run-{uuid.uuid4().hex[:6]}"

    mock_raw_tokens = [
        {
            "colors": ["#10B981", "#3B82F6", "rgb(239, 68, 68)"],
            "bgColors": ["#FFFFFF", "#0F172A"],
            "typography": [
                {"role": "Display / H1", "tag": "h1", "fontFamily": "Inter", "fontSize": "48px", "fontWeight": "800", "fontSizeNum": 48},
                {"role": "H2", "tag": "h2", "fontFamily": "Inter", "fontSize": "30px", "fontWeight": "700", "fontSizeNum": 30},
                {"role": "Body", "tag": "p", "fontFamily": "Inter", "fontSize": "16px", "fontWeight": "400", "fontSizeNum": 16},
                {"role": "Button / UI", "tag": "button", "fontFamily": "Inter", "fontSize": "14px", "fontWeight": "600", "fontSizeNum": 14},
            ],
            "radii": ["8px", "12px", "8px"],
            "shadows": ["0 4px 6px rgba(0,0,0,0.1)"]
        }
    ]

    tokens = aggregate_and_store_tokens(test_run_id, mock_raw_tokens)

    # Verify colors
    color_hexes = [c["hex"] for c in tokens["colors"]]
    assert "#10B981" in color_hexes
    assert "#3B82F6" in color_hexes
    assert "#EF4444" in color_hexes

    # Verify semantic typography
    assert "Display / H1" in tokens["typography"]
    assert "H2" in tokens["typography"]
    assert "Body" in tokens["typography"]
    assert "Button / UI" in tokens["typography"]

    # Verify database persistence
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tokens WHERE run_id = ?", (test_run_id,))
    rows = cursor.fetchall()
    conn.close()

    assert len(rows) > 0
    categories = set(r["category"] for r in rows)
    assert "color" in categories
    assert "typography" in categories
    assert "radius" in categories
    assert "shadow" in categories

def test_recapture_api_endpoint():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Create dummy project and run
    proj_id = f"p-{uuid.uuid4().hex[:6]}"
    run_id = f"r-{uuid.uuid4().hex[:6]}"

    cursor.execute("INSERT INTO projects (id, name, base_url, created_at) VALUES (?, 'Test', 'http://localhost:5173', datetime('now'))", (proj_id,))
    cursor.execute("""
        INSERT INTO runs (id, project_id, status, progress_text, progress_percent, config_json, created_at)
        VALUES (?, ?, 'completed', 'Completed', 100, ?, datetime('now'))
    """, (run_id, proj_id, json.dumps({"viewports": {"desktop": True}, "themes": {"light": True}, "include_fold": False})))

    # Create dummy route
    route_id = f"rt-{uuid.uuid4().hex[:6]}"
    cursor.execute("""
        INSERT INTO routes (id, run_id, path, full_url, pattern, is_selected)
        VALUES (?, ?, '/pricing', 'http://localhost:5173/pricing', '/pricing', 1)
    """, (route_id, run_id))

    conn.commit()
    conn.close()

    # Call recapture endpoint directly with BackgroundTasks
    bg = BackgroundTasks()
    req = RecaptureRequest(
        route_paths=["/pricing"],
        include_fold=False
    )
    res = recapture_routes(run_id, req, bg)
    assert res["run_id"] == run_id
    assert res["status"] == "capturing"
    assert "/pricing" in res["route_paths"]
    assert len(bg.tasks) == 1

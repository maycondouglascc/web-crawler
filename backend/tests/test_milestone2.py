"""
Tests for Milestone 2: Pre-Capture Sanitizer, Section Slicing & Component Harvester
"""

import pytest
from app.engine.slicer import infer_section_category, infer_component_category
from app.engine.sanitizer import KNOWN_NOISE_SELECTORS
from app.database import get_connection, init_db

def test_section_categorization():
    # Navbar / Header
    assert infer_section_category("header", "site-header", "main-nav", 0) == "navbar"
    assert infer_section_category("nav", "", "", 1) == "navbar"

    # Hero
    assert infer_section_category("section", "hero-banner", "", 0) == "hero"

    # Pricing
    assert infer_section_category("section", "pricing-plans-grid", "", 3) == "pricing"

    # Features
    assert infer_section_category("div", "feature-list", "", 2) == "features"

    # Footer
    assert infer_section_category("footer", "site-footer", "", 5) == "footer"

def test_component_categorization():
    assert infer_component_category("button", "primary-btn") == "button"
    assert infer_component_category("a", "btn btn-outline") == "button"
    assert infer_component_category("div", "feature-card rounded-xl") == "card"
    assert infer_component_category("input", "text-input") == "input"
    assert infer_component_category("div", "role-tab") == "tab"
    assert infer_component_category("span", "status-badge") == "badge"

def test_sanitizer_rules():
    # Verifies known noise banner selectors are defined
    assert "#onetrust-consent-sdk" in KNOWN_NOISE_SELECTORS
    assert "#CybotCookiebotDialog" in KNOWN_NOISE_SELECTORS
    assert ".crisp-client" in KNOWN_NOISE_SELECTORS
    assert "#intercom-container" in KNOWN_NOISE_SELECTORS

def test_database_captures_schema():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(captures)")
    cols = [r["name"] for r in cursor.fetchall()]
    assert "section_category" in cols
    assert "capture_type" in cols
    assert "theme" in cols
    assert "viewport_label" in cols

    cursor.execute("PRAGMA table_info(components)")
    comp_cols = [r["name"] for r in cursor.fetchall()]
    assert "fingerprint" in comp_cols
    assert "instances_count" in comp_cols
    assert "computed_styles_json" in comp_cols
    conn.close()

"""
Tests for Milestone 3: Token Extractor, Interactive Triggers & Exporters
"""

import os
import tempfile
import json
import pytest

from app.engine.tokens import rgba_to_hex
from app.engine.interactions import is_safe_trigger
from app.exporters.design_system import generate_design_system_files
from app.exporters.context_pack import generate_context_pack
from app.exporters.html_viewer import generate_portable_html_viewer

def test_color_normalization():
    assert rgba_to_hex("rgb(59, 130, 246)") == "#3B82F6"
    assert rgba_to_hex("rgba(16, 185, 129, 1)") == "#10B981"
    assert rgba_to_hex("rgba(0, 0, 0, 0)") == "transparent"
    assert rgba_to_hex("#ff0000") == "#ff0000"

def test_safe_triggers():
    assert is_safe_trigger("Filter Options", "<button>Filter</button>") is True
    assert is_safe_trigger("View Details", "<button>View Details</button>") is True
    assert is_safe_trigger("Delete Account", "<button>Delete</button>") is False
    assert is_safe_trigger("Log Out", "<button>Logout</button>") is False

def test_design_system_exporter():
    with tempfile.TemporaryDirectory() as tmpdir:
        mock_tokens = {
            "colors": [
                {"hex": "#3B82F6", "count": 12, "category": "primary"},
                {"hex": "#10B981", "count": 6, "category": "accent"}
            ],
            "typography": {
                "h1": {"fontFamily": "Inter", "fontSize": "36px", "fontWeight": "700", "lineHeight": "44px"},
                "p": {"fontFamily": "Inter", "fontSize": "16px", "fontWeight": "400", "lineHeight": "24px"}
            },
            "radii": ["8px", "12px"],
            "shadows": ["0 4px 6px rgba(0,0,0,0.1)"]
        }

        res = generate_design_system_files("test-run-1", mock_tokens, tmpdir)
        assert os.path.exists(res["md_path"])
        assert os.path.exists(res["json_path"])

        with open(res["md_path"], "r") as f:
            md_text = f.read()
            assert "#3B82F6" in md_text
            assert "Typography Scale" in md_text

        with open(res["json_path"], "r") as f:
            token_json = json.load(f)
            assert "color" in token_json
            assert "typography" in token_json

def test_context_pack_exporter():
    with tempfile.TemporaryDirectory() as tmpdir:
        mock_routes = [{"path": "/pricing", "pattern": "/pricing", "full_url": "https://example.com/pricing"}]
        mock_sections = [{"section_category": "pricing_table", "route_path": "/pricing", "viewport_label": "desktop", "file_path": "/tmp/01_pricing.png"}]
        mock_components = [{"category": "button", "fingerprint": "a1b2c3", "instances_count": 5, "preview_path": "/tmp/btn.png", "computed_styles": {}}]
        mock_tokens = {"colors": [{"hex": "#10B981", "count": 4, "category": "accent"}]}

        ctx_file = generate_context_pack("test-run-1", "https://example.com", mock_routes, mock_sections, mock_components, mock_tokens, tmpdir)
        assert os.path.exists(ctx_file)

        with open(ctx_file, "r") as f:
            text = f.read()
            assert "AI Coding Agent Context Pack" in text
            assert "/pricing" in text
            assert "AI Coding Agent Prompt Recipes" in text

def test_html_viewer_exporter():
    with tempfile.TemporaryDirectory() as tmpdir:
        viewer_file = generate_portable_html_viewer("test-run-1", [], [], [], tmpdir)
        assert os.path.exists(viewer_file)
        with open(viewer_file, "r") as f:
            html = f.read()
            assert "Visual Intelligence Gallery" in html
            assert "Portable Client Edition" in html

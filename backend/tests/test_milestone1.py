"""
Tests for Milestone 1: Studio Foundation, Auth Vault & Pattern Discovery
"""

import pytest
from app.engine.auth_vault import is_safe_url
from app.engine.discoverer import infer_route_pattern
from app.database import get_connection, init_db

def test_safe_crawl_guardrails():
    # Safe URLs
    assert is_safe_url("https://app.example.com/dashboard") is True
    assert is_safe_url("https://app.example.com/settings/profile") is True
    assert is_safe_url("https://app.example.com/projects/123/edit") is True

    # Destructive / Logout URLs
    assert is_safe_url("https://app.example.com/logout") is False
    assert is_safe_url("https://app.example.com/auth/sign-out") is False
    assert is_safe_url("https://app.example.com/api/delete-account") is False
    assert is_safe_url("https://app.example.com/billing/cancel-subscription") is False

def test_pattern_deduplication():
    # Root
    assert infer_route_pattern("/") == "/"

    # Numeric IDs
    assert infer_route_pattern("/projects/101") == "/projects/:id"
    assert infer_route_pattern("/items/98765/details") == "/items/:id/details"

    # UUIDs
    assert infer_route_pattern("/orgs/550e8400-e29b-41d4-a716-446655440000") == "/orgs/:uuid"

    # Slugs
    assert infer_route_pattern("/blog/introducing-visual-intelligence") == "/blog/:slug"

def test_database_initialization():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r["name"] for r in cursor.fetchall()]
    conn.close()

    assert "projects" in tables
    assert "auth_profiles" in tables
    assert "runs" in tables
    assert "routes" in tables
    assert "captures" in tables
    assert "components" in tables
    assert "tokens" in tables

"""
SQLite Database Layer for Visual Intelligence Studio
Provides persistent tracking of Projects, Auth Profiles, Runs, Routes, Captures, Components, and Tokens.
"""

import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "studio.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        auth_profile_id TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Auth Profiles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS auth_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        storage_state_path TEXT NOT NULL,
        cookie_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Runs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        status TEXT NOT NULL, -- idle, discovering, review_pending, capturing, completed, failed
        progress_text TEXT,
        progress_percent INTEGER DEFAULT 0,
        config_json TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
    )
    """)

    # Discovered Routes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        path TEXT NOT NULL,
        full_url TEXT NOT NULL,
        pattern TEXT NOT NULL,
        is_selected INTEGER DEFAULT 1,
        is_sample INTEGER DEFAULT 1,
        sample_count_in_pattern INTEGER DEFAULT 1,
        FOREIGN KEY(run_id) REFERENCES runs(id)
    )
    """)

    # Captures (Screenshots & Slices)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS captures (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        route_path TEXT NOT NULL,
        viewport_label TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        theme TEXT NOT NULL,
        capture_type TEXT NOT NULL, -- full_page, fold, section, component, modal
        section_category TEXT,       -- navbar, hero, features, pricing, footer, modal, etc.
        file_path TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Harvested Components
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS components (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        category TEXT NOT NULL, -- button, card, input, nav, modal, table, badge, other
        instances_count INTEGER DEFAULT 1,
        preview_path TEXT NOT NULL,
        html_snippet TEXT,
        computed_styles_json TEXT,
        routes_json TEXT
    )
    """)

    # Extracted Design Tokens
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tokens (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        category TEXT NOT NULL, -- color, typography, radius, shadow, spacing
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        usage_count INTEGER DEFAULT 1
    )
    """)

    conn.commit()
    conn.close()

# Auto-initialize database on import
init_db()

"""
Authenticated Session Vault & Safe-Crawl Guardrails
Handles interactive login handoff (Google OAuth, 2FA, SSO, Magic Links),
storage_state persistence, and destructive-action protection.
"""

import os
import json
import uuid
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

from app.database import get_connection

PROFILES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "profiles")
os.makedirs(PROFILES_DIR, exist_ok=True)

# Destructive keyword blacklist to prevent accidental account deletion, logout, or mutation
DESTRUCTIVE_KEYWORDS = [
    "logout", "log-out", "signout", "sign-out", "destroy",
    "delete-account", "delete_account", "remove-account",
    "cancel-subscription", "unsubscribe", "revoke"
]

def is_safe_url(url: str) -> bool:
    """Returns False if URL matches known destructive or logout patterns."""
    url_lower = url.lower()
    for kw in DESTRUCTIVE_KEYWORDS:
        if kw in url_lower:
            return False
    return True

def apply_safe_crawl_guardrails(page):
    """
    Attaches route handlers to Playwright page to block destructive requests
    and prevent the crawler from logging itself out or mutating user data.
    """
    def route_handler(route):
        req = route.request
        url = req.url.lower()

        # Block destructive keywords in URL
        if not is_safe_url(url):
            print(f"[Guardrail] Blocked navigation/request to dangerous URL: {req.url}")
            route.abort()
            return

        # Block non-idempotent mutation methods during crawl
        if req.method in ["DELETE", "PUT", "PATCH"]:
            print(f"[Guardrail] Blocked non-idempotent HTTP mutation ({req.method}): {req.url}")
            route.abort()
            return

        route.continue_()

    page.route("**/*", route_handler)

def launch_interactive_login_sync(login_url: str, profile_name: str) -> Dict[str, Any]:
    """
    Launches a visible Chromium browser window pointing to login_url.
    User completes login (SSO, 2FA, OAuth). When user closes browser or finishes,
    Playwright storage_state is saved into profiles/<profile_id>.json.
    """
    domain = urlparse(login_url).netloc or "localhost"
    profile_id = str(uuid.uuid4())[:8]
    storage_path = os.path.join(PROFILES_DIR, f"{profile_id}_{domain}.json")

    print(f"\n🔐 [Auth Vault] Launching interactive login window for: {login_url}")
    print(f"👉 Please complete login in the opened browser window.")

    with sync_playwright() as p:
        # Launch headed browser so user can type passwords / complete 2FA
        browser = p.chromium.launch(
            headless=False,
            args=["--start-maximized", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(no_viewport=True)
        page = context.new_page()

        try:
            page.goto(login_url, timeout=45000)
        except Exception as e:
            print(f"Navigation warning: {e}")

        # Inject a floating visual guidance badge at top-right
        try:
            page.evaluate("""
                () => {
                    const badge = document.createElement('div');
                    badge.id = '__visual_studio_auth_badge';
                    badge.innerHTML = `
                        <div style="
                            position: fixed; top: 16px; right: 16px; z-index: 999999;
                            background: #111827; color: #F9FAFB; padding: 12px 18px;
                            border-radius: 10px; font-family: -apple-system, sans-serif;
                            font-size: 13px; font-weight: 500; box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                            border: 1px solid #374151; display: flex; align-items: center; gap: 10px;
                        ">
                            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#10B981;"></span>
                            <div>
                                <div style="font-weight:600;">Visual Studio Session Vault</div>
                                <div style="color:#9CA3AF; font-size:11px;">Complete your login, then simply close this window.</div>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(badge);
                }
            """)
        except Exception:
            pass

        # Wait until user closes the window or browser
        try:
            page.wait_for_event("close", timeout=300000) # 5 min timeout
        except Exception:
            pass

        # Save storage state before full shutdown
        try:
            context.storage_state(path=storage_path)
            print(f"✅ [Auth Vault] Storage state saved to: {storage_path}")
        except Exception as e:
            print(f"⚠️ [Auth Vault] Could not capture storage state: {e}")

        try:
            browser.close()
        except Exception:
            pass

    # Read cookie count
    cookie_count = 0
    if os.path.exists(storage_path):
        try:
            with open(storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                cookie_count = len(data.get("cookies", []))
        except Exception:
            pass

    # Store record in SQLite
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO auth_profiles (id, name, domain, storage_state_path, cookie_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (profile_id, profile_name or f"{domain} Session", domain, storage_path, cookie_count, now, now))
    conn.commit()
    conn.close()

    return {
        "id": profile_id,
        "name": profile_name or f"{domain} Session",
        "domain": domain,
        "storage_state_path": storage_path,
        "cookie_count": cookie_count,
        "created_at": now
    }

def get_all_profiles() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM auth_profiles ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_profile(profile_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT storage_state_path FROM auth_profiles WHERE id = ?", (profile_id,))
    row = cursor.fetchone()
    if row and os.path.exists(row["storage_state_path"]):
        try:
            os.remove(row["storage_state_path"])
        except Exception:
            pass
    cursor.execute("DELETE FROM auth_profiles WHERE id = ?", (profile_id,))
    conn.commit()
    conn.close()
    return True

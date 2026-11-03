"""
Auto-Trigger Discovery for No-URL UI (Modals, Drawers & Tabs)
Explores interactive state triggers (modals, drawers, dropdowns, tabs)
in a safe sandboxed environment and captures their open state.
"""

import os
import time
import uuid
from typing import Dict, Any, List
from playwright.sync_api import Page

from app.database import get_connection
from app.engine.auth_vault import is_safe_url

# Triggers likely to open non-destructive overlays or tab panels
SAFE_TRIGGER_SELECTORS = [
    "[aria-haspopup='dialog']",
    "[aria-haspopup='menu']",
    "[data-state='closed']",
    "[role='tab'][aria-selected='false']",
    "button[data-toggle='modal']",
    "button[data-bs-toggle='modal']",
    "button[aria-expanded='false']",
]

SAFE_LABEL_KEYWORDS = [
    "filter", "details", "options", "menu", "tab", "view",
    "preview", "modal", "info", "settings", "search", "more"
]

def is_safe_trigger(text: str, element_html: str) -> bool:
    """Verifies that button or trigger text doesn't contain destructive actions."""
    combined = (text + " " + element_html).lower()
    destructive = ["delete", "remove", "destroy", "logout", "sign out", "cancel", "purge", "revoke"]
    return not any(d in combined for d in destructive)

def explore_interactive_triggers(
    page: Page,
    run_id: str,
    route_path: str,
    output_dir: str,
    max_triggers: int = 8
) -> List[Dict[str, Any]]:
    """
    Finds and triggers safe interactive UI elements to capture modals, drawers, and tabs.
    """
    modals_dir = os.path.join(output_dir, "modals")
    os.makedirs(modals_dir, exist_ok=True)

    clean_route = route_path.strip("/").replace("/", "_") or "home"
    discovered_states = []

    # Find candidates
    try:
        triggers = page.evaluate("""
            (selectors, keywords) => {
                const results = [];
                const allButtons = Array.from(document.querySelectorAll('button, [role="button"], [role="tab"]'));

                allButtons.forEach((btn, idx) => {
                    const text = (btn.innerText || btn.getAttribute('aria-label') || '').trim().toLowerCase();
                    const hasSafeClass = selectors.some(s => {
                        try { return btn.matches(s); } catch(e) { return false; }
                    });
                    const hasSafeKeyword = keywords.some(kw => text.includes(kw));

                    if ((hasSafeClass || hasSafeKeyword) && text.length > 1 && text.length < 30) {
                        const rect = btn.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            results.push({
                                index: idx,
                                text: text,
                                selector: btn.id ? '#' + btn.id : null,
                                tagName: btn.tagName.toLowerCase(),
                                role: btn.getAttribute('role') || 'button'
                            });
                        }
                    }
                });

                return results.slice(0, 15);
            }
        """, SAFE_TRIGGER_SELECTORS, SAFE_LABEL_KEYWORDS)
    except Exception:
        triggers = []

    conn = get_connection()
    cursor = conn.cursor()

    count = 0
    for trig in triggers:
        if count >= max_triggers:
            break

        if not is_safe_trigger(trig["text"], ""):
            continue

        try:
            # Find and click element
            btn_loc = None
            if trig["selector"]:
                btn_loc = page.locator(trig["selector"]).first
            else:
                btn_loc = page.get_by_role(trig["role"], name=trig["text"], exact=False).first

            if not btn_loc or not btn_loc.is_visible():
                continue

            # Click safe trigger
            btn_loc.click(timeout=2000)
            page.wait_for_timeout(400) # Wait for animation

            # Check if modal, drawer, or dialog appeared
            dialog_loc = page.locator("[role='dialog'], [role='menu'], .modal.show, [data-state='open'], .drawer").first

            if dialog_loc and dialog_loc.is_visible():
                state_id = str(uuid.uuid4())[:8]
                filename = f"{clean_route}_state_{trig['text'].replace(' ', '_')}_{state_id}.png"
                filepath = os.path.join(modals_dir, filename)

                # Capture crop of the modal/dialog
                try:
                    dialog_loc.screenshot(path=filepath)
                except Exception:
                    page.screenshot(path=filepath, full_page=False)

                cursor.execute("""
                    INSERT INTO captures (id, run_id, route_path, viewport_label, width, height, theme, capture_type, section_category, file_path, created_at)
                    VALUES (?, ?, ?, 'desktop', 1440, 900, 'light', 'modal', ?, ?, datetime('now'))
                """, (state_id, run_id, route_path, f"modal_{trig['text']}", filepath))

                discovered_states.append({
                    "id": state_id,
                    "trigger": trig["text"],
                    "file_path": filepath,
                    "filename": filename
                })
                count += 1

                # Close overlay with Escape
                page.keyboard.press("Escape")
                page.wait_for_timeout(200)

        except Exception as e:
            # If click failed or timed out, press Escape and continue
            try:
                page.keyboard.press("Escape")
            except Exception:
                pass

    conn.commit()
    conn.close()
    return discovered_states

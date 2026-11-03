"""
Semantic Section Slicer & Component Harvester
Discovers and slices major visual landmarks (Hero, Nav, Sections, Pricing, Footer)
and harvests deduplicated UI components with structural fingerprints and CSS properties.
"""

import os
import json
import uuid
import hashlib
from typing import Dict, Any, List, Set, Tuple
from urllib.parse import urlparse
from playwright.sync_api import Page, Locator

from app.database import get_connection

def infer_section_category(tag: str, class_str: str, id_str: str, index: int) -> str:
    """Infers semantic section role from DOM attributes and position."""
    text = f"{tag} {class_str} {id_str}".lower()

    if tag == "footer" or "footer" in text or "bottom" in text:
        return "footer"
    if tag == "header" or tag == "nav" or "nav" in text or "header" in text:
        return "navbar"
    if index == 0 or "hero" in text or "banner" in text or "intro" in text:
        return "hero"
    if "pricing" in text or "tier" in text or "plan" in text:
        return "pricing"
    if "feature" in text or "benefit" in text or "grid" in text or "service" in text:
        return "features"
    if "testimonial" in text or "review" in text or "social-proof" in text:
        return "testimonials"
    if "faq" in text or "accordion" in text:
        return "faq"
    if "contact" in text or "form" in text:
        return "contact"

    return "section"

def slice_page_sections(
    page: Page,
    run_id: str,
    route_path: str,
    viewport_label: str,
    theme: str,
    output_dir: str
) -> List[Dict[str, Any]]:
    """
    Finds top-level visual landmarks, slices them into lossless PNG crops,
    and saves records to the database.
    """
    sections_dir = os.path.join(output_dir, "sections")
    os.makedirs(sections_dir, exist_ok=True)

    clean_route = route_path.strip("/").replace("/", "_") or "home"

    # Identify potential section elements
    raw_sections = page.evaluate("""
        () => {
            const candidates = document.querySelectorAll('header, nav, main > section, section, article, footer, [role="main"] > div');
            const results = [];
            const vpWidth = window.innerWidth;

            candidates.forEach((el, idx) => {
                const rect = el.getBoundingClientRect();
                // Filter elements that span at least 40% width and 80px height
                if (rect.width >= vpWidth * 0.4 && rect.height >= 80 && rect.height < 5000) {
                    results.push({
                        index: idx,
                        tag: el.tagName.toLowerCase(),
                        className: el.className || '',
                        id: el.id || '',
                        top: Math.round(rect.top + window.scrollY),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    });
                }
            });

            // Sort by vertical position
            results.sort((a, b) => a.top - b.top);
            return results;
        }
    """)

    sliced_records = []
    conn = get_connection()
    cursor = conn.cursor()

    for idx, sec in enumerate(raw_sections[:15]): # Cap to 15 sections per page
        cat = infer_section_category(sec["tag"], sec["className"], sec["id"], idx)
        filename = f"{clean_route}_{idx+1:02d}_{cat}_{viewport_label}_{theme}.png"
        filepath = os.path.join(sections_dir, filename)

        try:
            # Capture specific element crop
            selector = f"{sec['tag']}"
            if sec['id']:
                selector = f"#{sec['id']}"
            elif sec['className']:
                first_cls = sec['className'].split()[0] if sec['className'].split() else ""
                if first_cls and not any(c in first_cls for c in [':', '/', '[', ']']):
                    selector = f"{sec['tag']}.{first_cls}"

            loc = page.locator(selector).first
            if loc.is_visible():
                loc.screenshot(path=filepath)
            else:
                # Fallback to clip box if selector is ambiguous
                page.screenshot(
                    path=filepath,
                    clip={"x": 0, "y": sec["top"], "width": sec["width"], "height": sec["height"]}
                )

            cap_id = str(uuid.uuid4())[:8]
            cursor.execute("""
                INSERT INTO captures (id, run_id, route_path, viewport_label, width, height, theme, capture_type, section_category, file_path, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'section', ?, ?, datetime('now'))
            """, (cap_id, run_id, route_path, viewport_label, sec["width"], sec["height"], theme, cat, filepath))

            sliced_records.append({
                "id": cap_id,
                "category": cat,
                "file_path": filepath,
                "filename": filename,
                "width": sec["width"],
                "height": sec["height"]
            })
        except Exception as e:
            # Silently pass if element changed or scrolled out
            pass

    conn.commit()
    conn.close()
    return sliced_records

def infer_component_category(tag: str, class_str: str) -> str:
    """Infers UI component category."""
    text = f"{tag} {class_str}".lower()
    if tag == "button" or "btn" in text or "button" in text:
        return "button"
    if "card" in text:
        return "card"
    if tag in ["input", "textarea", "select"] or "input" in text or "field" in text:
        return "input"
    if "badge" in text or "tag" in text or "chip" in text:
        return "badge"
    if "tab" in text:
        return "tab"
    if "modal" in text or "dialog" in text:
        return "modal"
    if "nav" in text or "menu" in text:
        return "nav"
    return "component"

def harvest_page_components(
    page: Page,
    run_id: str,
    route_path: str,
    viewport_label: str,
    theme: str,
    output_dir: str
) -> int:
    """
    Extracts atomic UI components, computes structural fingerprints to deduplicate
    identical buttons/cards across pages, and stores 1 canonical lossless PNG with instance counts.
    """
    components_dir = os.path.join(output_dir, "components")
    os.makedirs(components_dir, exist_ok=True)

    # Harvest elements from DOM
    candidates = page.evaluate("""
        () => {
            const targets = document.querySelectorAll(
                'button, a.btn, a[class*="button"], input[type="text"], input[type="email"], select, [role="tab"], [class*="card"]'
            );
            const results = [];

            targets.forEach((el, idx) => {
                const rect = el.getBoundingClientRect();
                if (rect.width >= 30 && rect.height >= 24 && rect.width < 1200 && rect.height < 800) {
                    const style = window.getComputedStyle(el);
                    // Extract signature style properties
                    const sig = [
                        el.tagName.toLowerCase(),
                        style.backgroundColor,
                        style.color,
                        style.borderRadius,
                        style.fontSize,
                        style.fontWeight,
                        Math.round(rect.width / 20) * 20, // width bucket
                        Math.round(rect.height / 10) * 10 // height bucket
                    ].join('|');

                    results.push({
                        index: idx,
                        tag: el.tagName.toLowerCase(),
                        className: el.className || '',
                        signature: sig,
                        html: el.outerHTML.slice(0, 500),
                        top: Math.round(rect.top + window.scrollY),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        computedStyles: {
                            backgroundColor: style.backgroundColor,
                            color: style.color,
                            borderRadius: style.borderRadius,
                            fontSize: style.fontSize,
                            fontWeight: style.fontWeight,
                            padding: style.padding,
                            border: style.border
                        }
                    });
                }
            });

            return results.slice(0, 30); // Max 30 candidates per page
        }
    """)

    conn = get_connection()
    cursor = conn.cursor()
    new_components_count = 0

    for item in candidates:
        # Create structural fingerprint hash
        fp = hashlib.sha256(item["signature"].encode()).hexdigest()[:12]
        cat = infer_component_category(item["tag"], item["className"])

        cursor.execute("SELECT id, instances_count, routes_json FROM components WHERE run_id = ? AND fingerprint = ?", (run_id, fp))
        existing = cursor.fetchone()

        if existing:
            # Increment instance count and append route if new
            routes = json.loads(existing["routes_json"] or "[]")
            if route_path not in routes:
                routes.append(route_path)

            cursor.execute("""
                UPDATE components
                SET instances_count = instances_count + 1, routes_json = ?
                WHERE id = ?
            """, (json.dumps(routes), existing["id"]))
        else:
            # First time seeing this component variant: capture canonical screenshot!
            filename = f"comp_{cat}_{fp}.png"
            filepath = os.path.join(components_dir, filename)

            try:
                page.screenshot(
                    path=filepath,
                    clip={
                        "x": max(0, item["left"]),
                        "y": max(0, item["top"]),
                        "width": item["width"],
                        "height": item["height"]
                    }
                )

                comp_id = str(uuid.uuid4())[:8]
                cursor.execute("""
                    INSERT INTO components (id, run_id, fingerprint, category, instances_count, preview_path, html_snippet, computed_styles_json, routes_json)
                    VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
                """, (
                    comp_id,
                    run_id,
                    fp,
                    cat,
                    filepath,
                    item["html"],
                    json.dumps(item["computedStyles"]),
                    json.dumps([route_path])
                ))
                new_components_count += 1
            except Exception:
                pass

    conn.commit()
    conn.close()
    return new_components_count

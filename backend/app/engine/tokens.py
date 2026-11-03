"""
Design Token Extractor
Analyzes computed CSS properties across crawled pages to discover
Color Palettes, Typography Scales, Border Radii, and Box Shadows.
"""

import re
import uuid
from typing import Dict, Any, List, Set, Tuple
from collections import Counter
from playwright.sync_api import Page

from app.database import get_connection

RE_RGBA = re.compile(r'rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)')

def rgba_to_hex(color_str: str) -> str:
    """Converts rgb(r, g, b) or rgba(r, g, b, a) to hex #RRGGBB."""
    match = RE_RGBA.match(color_str.strip())
    if not match:
        return color_str
    r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
    a = match.group(4)
    if a and float(a) == 0:
        return "transparent"
    return f"#{r:02x}{g:02x}{b:02x}".upper()

def extract_page_tokens(page: Page) -> Dict[str, Any]:
    """
    Extracts raw computed style values from DOM elements.
    """
    try:
        raw = page.evaluate("""
            () => {
                const elements = document.querySelectorAll('h1, h2, h3, h4, p, a, button, input, div, section, header, footer');
                const colors = [];
                const bgColors = [];
                const typography = [];
                const radii = [];
                const shadows = [];

                elements.forEach(el => {
                    const style = window.getComputedStyle(el);

                    // Colors
                    if (style.color) colors.push(style.color);
                    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        bgColors.push(style.backgroundColor);
                    }

                    // Typography
                    const tag = el.tagName.toLowerCase();
                    if (['h1', 'h2', 'h3', 'h4', 'p', 'body'].includes(tag)) {
                        typography.push({
                            tag: tag,
                            fontFamily: style.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
                            fontSize: style.fontSize,
                            fontWeight: style.fontWeight,
                            lineHeight: style.lineHeight
                        });
                    }

                    // Border Radii
                    if (style.borderRadius && style.borderRadius !== '0px') {
                        radii.push(style.borderRadius);
                    }

                    // Shadows
                    if (style.boxShadow && style.boxShadow !== 'none') {
                        shadows.push(style.boxShadow);
                    }
                });

                return { colors, bgColors, typography, radii, shadows };
            }
        """)
        return raw
    except Exception as e:
        print(f"Token extraction error: {e}")
        return {"colors": [], "bgColors": [], "typography": [], "radii": [], "shadows": []}

def aggregate_and_store_tokens(run_id: str, raw_token_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregates tokens across all pages, sorts by frequency, categorizes,
    and stores them in the SQLite tokens table.
    """
    all_colors = []
    all_bg_colors = []
    all_radii = []
    all_shadows = []
    type_by_tag: Dict[str, Dict[str, Any]] = {}

    for item in raw_token_list:
        all_colors.extend(item.get("colors", []))
        all_bg_colors.extend(item.get("bgColors", []))
        all_radii.extend(item.get("radii", []))
        all_shadows.extend(item.get("shadows", []))

        for t in item.get("typography", []):
            tag = t["tag"]
            if tag not in type_by_tag:
                type_by_tag[tag] = t

    # Aggregate Colors
    color_counter = Counter()
    for c in all_colors + all_bg_colors:
        hex_c = rgba_to_hex(c)
        if hex_c and hex_c != "transparent":
            color_counter[hex_c] += 1

    top_colors = [
        {"hex": hex_val, "count": count, "category": "primary" if i == 0 else "accent" if i < 3 else "neutral"}
        for i, (hex_val, count) in enumerate(color_counter.most_common(12))
    ]

    # Aggregate Radii
    radii_counter = Counter(all_radii)
    top_radii = [r for r, _ in radii_counter.most_common(6)]

    # Aggregate Shadows
    shadow_counter = Counter(all_shadows)
    top_shadows = [s for s, _ in shadow_counter.most_common(4)]

    # Save to SQLite
    conn = get_connection()
    cursor = conn.cursor()

    # Clear old tokens for this run
    cursor.execute("DELETE FROM tokens WHERE run_id = ?", (run_id,))

    # Insert Colors
    for c in top_colors:
        cursor.execute("""
            INSERT INTO tokens (id, run_id, category, name, value, usage_count)
            VALUES (?, ?, 'color', ?, ?, ?)
        """, (str(uuid.uuid4())[:8], run_id, c["category"], c["hex"], c["count"]))

    # Insert Typography
    for tag, t in type_by_tag.items():
        val_str = f"{t['fontSize']} / {t['fontWeight']} ({t['fontFamily']})"
        cursor.execute("""
            INSERT INTO tokens (id, run_id, category, name, value, usage_count)
            VALUES (?, ?, 'typography', ?, ?, 1)
        """, (str(uuid.uuid4())[:8], run_id, tag, val_str))

    # Insert Radii
    for r in top_radii:
        cursor.execute("""
            INSERT INTO tokens (id, run_id, category, name, value, usage_count)
            VALUES (?, ?, 'radius', 'border-radius', ?, 1)
        """, (str(uuid.uuid4())[:8], run_id, r))

    # Insert Shadows
    for s in top_shadows:
        cursor.execute("""
            INSERT INTO tokens (id, run_id, category, name, value, usage_count)
            VALUES (?, ?, 'shadow', 'box-shadow', ?, 1)
        """, (str(uuid.uuid4())[:8], run_id, s))

    conn.commit()
    conn.close()

    return {
        "colors": top_colors,
        "typography": type_by_tag,
        "radii": top_radii,
        "shadows": top_shadows
    }

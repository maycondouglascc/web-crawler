"""
Design Token Extractor
Analyzes computed CSS properties across crawled pages to discover
Color Palettes (with modern Color 4 oklch/lab normalization via canvas),
Typography Scales (grouped by semantic hierarchy), Border Radii, and Box Shadows.
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
    if not color_str:
        return ""
    stripped = color_str.strip()
    match = RE_RGBA.match(stripped)
    if not match:
        return color_str
    r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
    a = match.group(4)
    if a and float(a) == 0:
        return "transparent"
    return f"#{r:02x}{g:02x}{b:02x}".upper()

def extract_page_tokens(page: Page) -> Dict[str, Any]:
    """
    Extracts raw computed style values, CSS variables, and typography from DOM elements.
    Uses browser canvas to normalize modern Color Level 4 formats (oklch, lab, color(srgb ...)).
    """
    try:
        raw = page.evaluate("""
            () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');

                function normalizeColor(rawColor) {
                    if (!rawColor || rawColor === 'transparent' || rawColor === 'rgba(0, 0, 0, 0)') {
                        return null;
                    }
                    try {
                        ctx.fillStyle = rawColor;
                        const computed = ctx.fillStyle;
                        if (!computed) return null;
                        if (computed.startsWith('#')) return computed.toUpperCase();

                        const match = computed.match(/^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)$/);
                        if (match) {
                            const r = parseInt(match[1]);
                            const g = parseInt(match[2]);
                            const b = parseInt(match[3]);
                            const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
                            if (a === 0) return null;
                            const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                            return hex;
                        }
                    } catch (e) {}
                    return null;
                }

                const colors = new Set();
                const bgColors = new Set();
                const radii = [];
                const shadows = [];
                const typeItems = [];

                // 1. Inspect CSS Custom Properties on :root and body
                const rootStyles = window.getComputedStyle(document.documentElement);
                const bodyStyles = window.getComputedStyle(document.body);
                [rootStyles, bodyStyles].forEach(styleObj => {
                    for (let i = 0; i < styleObj.length; i++) {
                        const prop = styleObj[i];
                        if (prop.startsWith('--')) {
                            const val = styleObj.getPropertyValue(prop).trim();
                            const hex = normalizeColor(val);
                            if (hex) {
                                colors.add(hex);
                            }
                        }
                    }
                });

                // 2. Sample elements across the DOM
                const elements = document.querySelectorAll(
                    'h1, h2, h3, h4, h5, h6, p, a, button, input, select, textarea, div, section, header, footer, [data-framer-name]'
                );

                elements.forEach(el => {
                    const style = window.getComputedStyle(el);

                    // Foreground Color
                    if (style.color) {
                        const hex = normalizeColor(style.color);
                        if (hex) colors.add(hex);
                    }

                    // Background Color
                    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        const hex = normalizeColor(style.backgroundColor);
                        if (hex) bgColors.add(hex);
                    }

                    // Border Color
                    if (style.borderColor && style.borderWidth !== '0px') {
                        const hex = normalizeColor(style.borderColor);
                        if (hex) colors.add(hex);
                    }

                    // Border Radii
                    if (style.borderRadius && style.borderRadius !== '0px') {
                        radii.push(style.borderRadius);
                    }

                    // Shadows
                    if (style.boxShadow && style.boxShadow !== 'none') {
                        shadows.push(style.boxShadow);
                    }

                    // Typography Extraction
                    const tag = el.tagName.toLowerCase();
                    const hasDirectText = Array.from(el.childNodes).some(
                        node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
                    );

                    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'body'].includes(tag) || hasDirectText) {
                        const fontSizePx = parseFloat(style.fontSize) || 16;
                        const fontFamily = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();

                        // Infer semantic role from tag and size
                        let semanticRole = 'Body';
                        if (tag === 'h1' || fontSizePx >= 32) {
                            semanticRole = 'Display / H1';
                        } else if (tag === 'h2' || fontSizePx >= 24) {
                            semanticRole = 'H2';
                        } else if (tag === 'h3' || fontSizePx >= 20) {
                            semanticRole = 'H3';
                        } else if (tag === 'h4' || fontSizePx >= 18) {
                            semanticRole = 'H4';
                        } else if (tag === 'button' || el.getAttribute('role') === 'button') {
                            semanticRole = 'Button / UI';
                        } else if (fontSizePx <= 13) {
                            semanticRole = 'Small / Caption';
                        }

                        typeItems.push({
                            role: semanticRole,
                            tag: tag,
                            fontFamily: fontFamily,
                            fontSize: style.fontSize,
                            fontWeight: style.fontWeight,
                            lineHeight: style.lineHeight,
                            fontSizeNum: fontSizePx
                        });
                    }
                });

                return {
                    colors: Array.from(colors),
                    bgColors: Array.from(bgColors),
                    typography: typeItems,
                    radii: radii,
                    shadows: shadows
                };
            }
        """)
        return raw
    except Exception as e:
        print(f"Token extraction error: {e}")
        return {"colors": [], "bgColors": [], "typography": [], "radii": [], "shadows": []}

def aggregate_and_store_tokens(run_id: str, raw_token_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregates tokens across pages, sorts by frequency, categorizes,
    and stores them incrementally in the SQLite tokens table.
    """
    all_colors = []
    all_bg_colors = []
    all_radii = []
    all_shadows = []
    type_by_role: Dict[str, Dict[str, Any]] = {}

    for item in raw_token_list:
        all_colors.extend(item.get("colors", []))
        all_bg_colors.extend(item.get("bgColors", []))
        all_radii.extend(item.get("radii", []))
        all_shadows.extend(item.get("shadows", []))

        for t in item.get("typography", []):
            role = t.get("role") or t.get("tag")
            if role not in type_by_role:
                type_by_role[role] = t
            elif t.get("fontSizeNum", 0) > type_by_role[role].get("fontSizeNum", 0):
                # Keep the more prominent definition for display/headings
                type_by_role[role] = t

    # Aggregate Colors (Hex values already normalized via canvas)
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
    # Order roles logically: Display / H1, H2, H3, H4, Body, Small / Caption, Button / UI
    ROLE_ORDER = ["Display / H1", "H2", "H3", "H4", "Body", "Small / Caption", "Button / UI"]
    sorted_roles = sorted(
        type_by_role.keys(),
        key=lambda r: ROLE_ORDER.index(r) if r in ROLE_ORDER else 99
    )

    for role in sorted_roles:
        t = type_by_role[role]
        val_str = f"{t['fontSize']} / {t['fontWeight']} ({t['fontFamily']})"
        cursor.execute("""
            INSERT INTO tokens (id, run_id, category, name, value, usage_count)
            VALUES (?, ?, 'typography', ?, ?, 1)
        """, (str(uuid.uuid4())[:8], run_id, role, val_str))

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
        "typography": type_by_role,
        "radii": top_radii,
        "shadows": top_shadows
    }

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

def infer_section_category(
    tag: str,
    class_str: str = "",
    id_str: str = "",
    index: int = 0,
    framer_name: str = "",
    role: str = "",
    aria_label: str = "",
    top: int = 0,
    height: int = 0,
    has_heading: bool = False,
    total_sections: int = 1
) -> str:
    """Infers semantic section role from DOM attributes, position, and layout heuristics."""
    text = f"{tag} {class_str} {id_str} {framer_name} {role} {aria_label}".lower()

    if tag == "footer" or "footer" in text or "copyright" in text:
        return "footer"
    if total_sections > 1 and index == total_sections - 1 and top > 600 and ("bottom" in text or height < 400):
        return "footer"
    if tag == "header" or tag == "nav" or "nav" in text or "header" in text:
        return "navbar"
    if height > 0 and top < 150 and height < 140 and "hero" not in text:
        return "navbar"
    if "pricing" in text or "tier" in text or "plan" in text or "billing" in text:
        return "pricing"
    if "feature" in text or "benefit" in text or "service" in text or "highlight" in text:
        return "features"
    if "testimonial" in text or "review" in text or "social-proof" in text or "quote" in text:
        return "testimonials"
    if "faq" in text or "accordion" in text or "question" in text:
        return "faq"
    if "contact" in text or "form" in text or "touch" in text or "newsletter" in text:
        return "contact"
    if index == 0 or (index == 1 and top < 250) or "hero" in text or "banner" in text or "intro" in text or (top < 800 and has_heading and index <= 2):
        return "hero"

    return "section"

def infer_component_category(
    tag: str,
    class_str: str = "",
    role: str = "",
    has_bg_border: bool = False,
    text_len: int = 0
) -> str:
    """Infers UI component category."""
    text = f"{tag} {class_str} {role}".lower()
    if tag == "button" or role == "button" or "btn" in text or "button" in text:
        return "button"
    if "card" in text:
        return "card"
    if tag in ["input", "textarea", "select"] or role in ["combobox", "searchbox"] or "input" in text or "field" in text:
        return "input"
    if "badge" in text or "chip" in text or "pill" in text or "tag" in text:
        return "badge"
    if role == "tab" or "tab" in text:
        return "tab"
    if "modal" in text or "dialog" in text:
        return "modal"
    if "nav" in text or "menu" in text:
        return "nav"
    return "component"

def slice_page_sections(
    page: Page,
    run_id: str,
    route_path: str,
    viewport_label: str,
    theme: str,
    output_dir: str
) -> List[Dict[str, Any]]:
    """
    Finds top-level visual landmarks & layout blocks via DOM heuristics,
    deduplicates overlapping parent/child containers, stamps elements with unique
    identifiers, slices them into lossless PNG crops, and saves records to the database.
    """
    sections_dir = os.path.join(output_dir, "sections")
    os.makedirs(sections_dir, exist_ok=True)

    clean_route = route_path.strip("/").replace("/", "_") or "home"

    # Multi-strategy landmark & visual layout discovery in JS
    raw_sections = page.evaluate("""
        () => {
            const vpWidth = window.innerWidth;

            function getSafeClass(el) {
                if (!el || !el.className) return '';
                if (typeof el.className === 'string') return el.className;
                if (el.className.baseVal) return el.className.baseVal;
                return '';
            }

            // 1. Semantic landmark candidates
            const rawCandidates = new Set();
            const selectors = [
                'header', 'nav', 'main > section', 'section', 'article', 'footer',
                '[role="main"] > section', '[role="banner"]', '[role="contentinfo"]',
                '[data-framer-name]', '[id*="hero" i]', '[class*="section" i]', '[id*="section" i]'
            ];
            selectors.forEach(sel => {
                try {
                    document.querySelectorAll(sel).forEach(el => rawCandidates.add(el));
                } catch(e) {}
            });

            // 2. Discover visual layout blocks by finding root vertical container
            let mainRoot = document.querySelector('main, [role="main"], #__next, #root, #app') || document.body;
            while (mainRoot && mainRoot.children && mainRoot.children.length === 1 && ['DIV', 'MAIN', 'SECTION'].includes(mainRoot.children[0].tagName)) {
                mainRoot = mainRoot.children[0];
            }
            if (mainRoot && mainRoot.children && mainRoot.children.length > 1) {
                for (let i = 0; i < mainRoot.children.length; i++) {
                    const child = mainRoot.children[i];
                    if (['HEADER', 'NAV', 'SECTION', 'DIV', 'ARTICLE', 'FOOTER'].includes(child.tagName)) {
                        rawCandidates.add(child);
                    }
                }
            }

            // 3. Filter candidates by geometry & visibility
            const candidates = [];
            rawCandidates.forEach(el => {
                if (!el || el.nodeType !== 1) return;
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return;

                // Width >= 45% of viewport width, height >= 60px
                if (rect.width >= vpWidth * 0.45 && rect.height >= 60 && rect.height < 6000) {
                    candidates.push({
                        el: el,
                        top: Math.round(rect.top + window.scrollY),
                        bottom: Math.round(rect.bottom + window.scrollY),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    });
                }
            });

            // 4. Containment & Overlap Deduplication
            // Drop large wrappers if 2+ child sections already partition its vertical height
            const filtered = candidates.filter(cand => {
                const childrenInside = candidates.filter(other =>
                    other !== cand &&
                    other.top >= cand.top - 10 &&
                    other.bottom <= cand.bottom + 10 &&
                    other.height < cand.height * 0.85
                );
                if (childrenInside.length >= 2) {
                    const totalChildHeight = childrenInside.reduce((sum, c) => sum + c.height, 0);
                    if (totalChildHeight >= cand.height * 0.6) {
                        return false;
                    }
                }
                return true;
            });

            // Sort by top ascending
            filtered.sort((a, b) => a.top - b.top || b.height - a.height);

            // Deduplicate near-identical overlapping elements (>80% overlap)
            const finalSections = [];
            for (const item of filtered) {
                const isDuplicate = finalSections.some(existing => {
                    const overlapTop = Math.max(existing.top, item.top);
                    const overlapBottom = Math.min(existing.bottom, item.bottom);
                    const overlapHeight = Math.max(0, overlapBottom - overlapTop);
                    const minHeight = Math.min(existing.height, item.height);
                    return minHeight > 0 && (overlapHeight / minHeight) > 0.8;
                });
                if (!isDuplicate) {
                    finalSections.push(item);
                }
            }

            finalSections.sort((a, b) => a.top - b.top);
            const sliced = finalSections.slice(0, 15);

            // 5. Stamp unique DOM attribute data-vis-sec-id
            const results = [];
            sliced.forEach((item, idx) => {
                item.el.setAttribute('data-vis-sec-id', String(idx));
                const el = item.el;
                const tag = el.tagName.toLowerCase();
                const cls = getSafeClass(el);
                const id = el.id || '';
                const framer = el.getAttribute('data-framer-name') || '';
                const role = el.getAttribute('role') || '';
                const ariaLabel = el.getAttribute('aria-label') || '';
                const hasH1H2 = !!el.querySelector('h1, h2');

                results.push({
                    index: idx,
                    tag: tag,
                    className: cls,
                    id: id,
                    framerName: framer,
                    role: role,
                    ariaLabel: ariaLabel,
                    hasHeading: hasH1H2,
                    top: item.top,
                    width: item.width,
                    height: item.height
                });
            });

            window.scrollTo(0, 0);
            return results;
        }
    """)

    sliced_records = []
    conn = get_connection()
    cursor = conn.cursor()
    total_sec = len(raw_sections)

    for idx, sec in enumerate(raw_sections):
        cat = infer_section_category(
            tag=sec["tag"],
            class_str=sec["className"],
            id_str=sec["id"],
            index=idx,
            framer_name=sec.get("framerName", ""),
            role=sec.get("role", ""),
            aria_label=sec.get("ariaLabel", ""),
            top=sec["top"],
            height=sec["height"],
            has_heading=sec.get("hasHeading", False),
            total_sections=total_sec
        )
        filename = f"{clean_route}_{idx+1:02d}_{cat}_{viewport_label}_{theme}.png"
        filepath = os.path.join(sections_dir, filename)

        try:
            # Locate exact stamped element
            loc = page.locator(f'[data-vis-sec-id="{sec["index"]}"]').first
            loc.scroll_into_view_if_needed(timeout=2000)
            loc.screenshot(path=filepath, timeout=3000)

            # Safe verification of screenshot file
            if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
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

def harvest_page_components(
    page: Page,
    run_id: str,
    route_path: str,
    viewport_label: str,
    theme: str,
    output_dir: str
) -> int:
    """
    Extracts atomic UI components across buttons, inputs, badges, tabs, and cards.
    Stamps candidates with data-vis-comp-id and captures exact Playwright element screenshots
    (preventing blank/shifted 202-byte clips). Computes structural fingerprints to deduplicate
    identical components across pages, maintaining instance counts and route occurrences.
    """
    components_dir = os.path.join(output_dir, "components")
    os.makedirs(components_dir, exist_ok=True)

    # Harvest elements from DOM and stamp them
    candidates = page.evaluate("""
        () => {
            function getSafeClass(el) {
                if (!el || !el.className) return '';
                if (typeof el.className === 'string') return el.className;
                if (el.className.baseVal) return el.className.baseVal;
                return '';
            }

            const results = [];
            const vpWidth = window.innerWidth;
            const vpHeight = window.innerHeight;

            const selector = [
                'button',
                '[role="button"]',
                'input[type="submit"]',
                'input[type="button"]',
                'a[class*="btn" i]',
                'a[class*="button" i]',
                'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])',
                'textarea',
                'select',
                '[role="combobox"]',
                '[role="searchbox"]',
                '[role="switch"]',
                '[role="slider"]',
                '[role="tab"]',
                'nav a',
                '[class*="badge" i]',
                '[class*="chip" i]',
                '[class*="pill" i]',
                '[class*="tag" i]',
                '[class*="card" i]',
                '[data-framer-name*="Card" i]',
                'article'
            ].join(', ');

            const rawElements = document.querySelectorAll(selector);
            const seenElements = new Set();
            let compIdx = 0;

            rawElements.forEach((el) => {
                if (seenElements.has(el)) return;
                seenElements.add(el);

                const rect = el.getBoundingClientRect();
                if (rect.width < 16 || rect.height < 14 || rect.width > vpWidth * 0.95 || rect.height > vpHeight * 1.5) return;
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return;

                const tag = el.tagName.toLowerCase();
                const cls = getSafeClass(el);
                const text = (el.innerText || el.textContent || '').trim();
                const lowerCls = cls.toLowerCase();
                const role = (el.getAttribute('role') || '').toLowerCase();

                let cat = 'component';
                if (tag === 'button' || role === 'button' || (tag === 'input' && ['submit', 'button'].includes(el.type)) ||
                    (tag === 'a' && (lowerCls.includes('btn') || lowerCls.includes('button') || (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && rect.width < 320 && text.length < 35)))) {
                    cat = 'button';
                } else if (['input', 'textarea', 'select'].includes(tag) || role === 'combobox' || role === 'searchbox') {
                    cat = 'input';
                } else if (role === 'tab' || (tag === 'a' && el.closest('nav')) || lowerCls.includes('tab')) {
                    cat = 'tab';
                } else if (lowerCls.includes('badge') || lowerCls.includes('chip') || lowerCls.includes('pill') || lowerCls.includes('tag') ||
                           (rect.height <= 36 && rect.width <= 220 && parseInt(style.borderRadius) >= 4 && (style.backgroundColor !== 'rgba(0, 0, 0, 0)' || style.borderWidth !== '0px'))) {
                    cat = 'badge';
                } else if (lowerCls.includes('card') || (el.getAttribute('data-framer-name') || '').toLowerCase().includes('card') || tag === 'article' ||
                           (rect.width >= 160 && rect.height >= 100 && (style.backgroundColor !== 'rgba(0, 0, 0, 0)' || style.borderWidth !== '0px' || style.boxShadow !== 'none'))) {
                    cat = 'card';
                }

                const sig = [
                    cat,
                    tag,
                    style.backgroundColor,
                    style.color,
                    style.borderRadius,
                    style.fontSize,
                    style.fontWeight,
                    Math.round(rect.width / 20) * 20,
                    Math.round(rect.height / 10) * 10
                ].join('|');

                el.setAttribute('data-vis-comp-id', String(compIdx));

                results.push({
                    index: compIdx,
                    tag: tag,
                    className: cls,
                    category: cat,
                    signature: sig,
                    html: el.outerHTML.slice(0, 500),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    computedStyles: {
                        backgroundColor: style.backgroundColor,
                        color: style.color,
                        borderRadius: style.borderRadius,
                        fontSize: style.fontSize,
                        fontWeight: style.fontWeight,
                        padding: style.padding,
                        border: style.border,
                        boxShadow: style.boxShadow
                    }
                });
                compIdx++;
            });

            return results.slice(0, 40);
        }
    """)

    conn = get_connection()
    cursor = conn.cursor()
    new_components_count = 0

    for item in candidates:
        fp = hashlib.sha256(item["signature"].encode()).hexdigest()[:12]
        cat = item["category"]

        cursor.execute("SELECT id, instances_count, routes_json FROM components WHERE run_id = ? AND fingerprint = ?", (run_id, fp))
        existing = cursor.fetchone()

        if existing:
            routes = json.loads(existing["routes_json"] or "[]")
            if route_path not in routes:
                routes.append(route_path)

            cursor.execute("""
                UPDATE components
                SET instances_count = instances_count + 1, routes_json = ?
                WHERE id = ?
            """, (json.dumps(routes), existing["id"]))
        else:
            filename = f"comp_{cat}_{fp}.png"
            filepath = os.path.join(components_dir, filename)

            try:
                # Scroll into view and screenshot exact element
                loc = page.locator(f'[data-vis-comp-id="{item["index"]}"]').first
                loc.scroll_into_view_if_needed(timeout=2000)
                loc.screenshot(path=filepath, timeout=3000)

                if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
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

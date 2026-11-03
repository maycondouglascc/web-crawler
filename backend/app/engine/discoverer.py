"""
Smart Route Discovery & Pattern Deduplication Engine
Crawls public or authenticated sites, parses sitemaps, and groups dynamic URL patterns
(e.g., /projects/101 and /projects/102 -> /projects/:id) with 1 representative sample.
"""

import os
import re
import uuid
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, urljoin
from typing import Dict, Any, List, Set, Tuple
import requests
from playwright.sync_api import sync_playwright

from app.database import get_connection
from app.engine.auth_vault import is_safe_url, apply_safe_crawl_guardrails

# Regex for dynamic segments (numbers, UUIDs, hex strings, common ID patterns)
RE_NUMERIC_ID = re.compile(r'^\d+$')
RE_UUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
RE_HEX_ID = re.compile(r'^[0-9a-f]{16,32}$', re.IGNORECASE)

def normalize_path(path: str) -> str:
    """Normalizes path by stripping query params, fragments, and trailing slashes."""
    clean = path.split('?')[0].split('#')[0].rstrip('/')
    return clean if clean else "/"

def infer_route_pattern(path: str) -> str:
    """
    Transforms dynamic path segments into parameterized patterns.
    Examples:
      /users/1234 -> /users/:id
      /projects/550e8400-e29b-41d4-a716-446655440000/settings -> /projects/:uuid/settings
      /blog/how-to-code -> /blog/:slug
    """
    if path == "/" or not path:
        return "/"

    segments = path.strip("/").split("/")
    pattern_segments = []

    for i, seg in enumerate(segments):
        if RE_NUMERIC_ID.match(seg):
            pattern_segments.append(":id")
        elif RE_UUID.match(seg):
            pattern_segments.append(":uuid")
        elif RE_HEX_ID.match(seg):
            pattern_segments.append(":hash")
        elif i > 0 and len(seg) > 15 and '-' in seg:
            # Likely a slug / article title
            pattern_segments.append(":slug")
        else:
            pattern_segments.append(seg)

    return "/" + "/".join(pattern_segments)

def fetch_sitemap_urls(base_url: str) -> List[str]:
    """Attempts to fetch and parse sitemap.xml."""
    sitemap_url = urljoin(base_url, "/sitemap.xml")
    urls = []
    try:
        resp = requests.get(sitemap_url, timeout=5, headers={"User-Agent": "Visual-Studio-Crawler/1.0"})
        if resp.status_code == 200 and ("xml" in resp.headers.get("Content-Type", "") or "<urlset" in resp.text):
            root = ET.fromstring(resp.content)
            # Handle XML namespace
            ns = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            for loc in root.findall('.//ns:loc', ns) or root.findall('.//loc'):
                if loc.text and is_safe_url(loc.text):
                    urls.append(loc.text.strip())
            print(f"📄 [Discoverer] Found {len(urls)} URLs in sitemap.xml")
    except Exception:
        pass
    return urls

def discover_site_routes(
    run_id: str,
    base_url: str,
    storage_state_path: Optional[str] = None,
    max_pages: int = 40,
    progress_callback = None
) -> List[Dict[str, Any]]:
    """
    Crawls base_url (with optional authenticated storage_state).
    Discovers links, deduplicates by structural pattern, and persists to DB.
    """
    domain = urlparse(base_url).netloc
    base_path = urlparse(base_url).path or "/"

    urls_to_visit = [base_url]
    visited_urls = set()
    discovered_paths: Set[str] = set()

    # Pre-seed from sitemap if available
    sitemap_urls = fetch_sitemap_urls(base_url)
    for surl in sitemap_urls:
        if urlparse(surl).netloc == domain and surl not in urls_to_visit:
            urls_to_visit.append(surl)

    if progress_callback:
        progress_callback("Launching crawler browser...", 10)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context_kwargs = {"viewport": {"width": 1440, "height": 900}}
        if storage_state_path and os.path.exists(storage_state_path):
            context_kwargs["storage_state"] = storage_state_path
            print(f"🔑 [Discoverer] Crawling with authenticated session from: {storage_state_path}")

        context = browser.new_context(**context_kwargs)
        page = context.new_page()
        apply_safe_crawl_guardrails(page)

        crawled_count = 0

        while urls_to_visit and crawled_count < max_pages:
            current_url = urls_to_visit.pop(0)
            clean_url = current_url.split('#')[0].split('?')[0].rstrip('/')
            if not clean_url:
                clean_url = base_url

            if clean_url in visited_urls:
                continue

            visited_urls.add(clean_url)
            parsed_current = urlparse(clean_url)
            norm_path = normalize_path(parsed_current.path)

            if not is_safe_url(clean_url):
                continue

            discovered_paths.add(norm_path)
            crawled_count += 1

            pct = int(10 + (crawled_count / max_pages) * 80)
            if progress_callback:
                progress_callback(f"Discovering routes ({crawled_count}/{max_pages}): {norm_path}", pct)

            try:
                page.goto(clean_url, timeout=25000, wait_until="domcontentloaded")
                page.wait_for_timeout(800)

                # Extract internal links from rendered DOM
                links = page.evaluate("""
                    () => {
                        const links = new Set();
                        document.querySelectorAll('a[href]').forEach(a => {
                            const href = a.getAttribute('href');
                            if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
                                links.add(a.href);
                            }
                        });
                        return Array.from(links);
                    }
                """)

                for link in links:
                    parsed_link = urlparse(link)
                    if parsed_link.netloc == domain and is_safe_url(link):
                        clean_link = link.split('#')[0].split('?')[0].rstrip('/')
                        if clean_link not in visited_urls and clean_link not in urls_to_visit:
                            urls_to_visit.append(clean_link)

            except Exception as e:
                print(f"⚠️ Error crawling {clean_url}: {e}")

        browser.close()

    if progress_callback:
        progress_callback("Analyzing and grouping route patterns...", 95)

    # Group routes by pattern
    # pattern -> list of paths
    pattern_groups: Dict[str, List[str]] = {}
    for pth in sorted(discovered_paths):
        pat = infer_route_pattern(pth)
        if pat not in pattern_groups:
            pattern_groups[pat] = []
        pattern_groups[pat].append(pth)

    # Save to database
    conn = get_connection()
    cursor = conn.cursor()

    route_records = []
    for pat, paths in pattern_groups.items():
        total_in_pattern = len(paths)
        for idx, pth in enumerate(paths):
            route_id = str(uuid.uuid4())[:8]
            full_url = urljoin(base_url, pth)
            is_sample = 1 if idx == 0 else 0
            is_selected = 1 if is_sample else 0 # default select 1 sample per pattern

            cursor.execute("""
                INSERT INTO routes (id, run_id, path, full_url, pattern, is_selected, is_sample, sample_count_in_pattern)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (route_id, run_id, pth, full_url, pat, is_selected, is_sample, total_in_pattern))

            route_records.append({
                "id": route_id,
                "path": pth,
                "full_url": full_url,
                "pattern": pat,
                "is_selected": bool(is_selected),
                "is_sample": bool(is_sample),
                "sample_count_in_pattern": total_in_pattern
            })

    # Update run status to review_pending
    cursor.execute("""
        UPDATE runs
        SET status = 'review_pending', progress_text = 'Discovery complete. Ready for review.', progress_percent = 100
        WHERE id = ?
    """, (run_id,))

    conn.commit()
    conn.close()

    print(f"✨ [Discoverer] Discovered {len(route_records)} routes across {len(pattern_groups)} patterns.")
    return route_records

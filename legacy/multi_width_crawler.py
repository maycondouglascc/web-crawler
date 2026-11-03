"""
Multi-Width Web Crawler
Captures screenshots of the same URLs at multiple responsive breakpoints.
Runs locally using Playwright.
"""

import os
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

# --- CONFIGURATION ---
INPUT_FILE = "urls.txt"
OUTPUT_DIR = "screenshots_multi_width"
VIEWPORT_WIDTHS = {
    "mobile": 375,
    "tablet": 768,
    "desktop": 1024,
    "ultrawide": 1920,
}
VIEWPORT_HEIGHT = 1080
# Height stays consistent; width changes to test responsive design
# ---------------------

def get_safe_filename(url, width_label):
    """Creates a clean filename using the URL path and width."""
    parsed = urlparse(url)
    path = parsed.path.replace('/', '_').replace('\\', '_').replace(':', '')
    
    # Handle root URLs
    if not path or path == "_":
        path = "home"
    
    # Shorten extremely long paths to prevent OS errors
    clean_path = path[:80]
    return f"{clean_path}_{width_label}.png"

def process_url_list_multi_width():
    """Process URLs and capture at multiple widths."""
    
    # 1. Read the list of URLs
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Could not find '{INPUT_FILE}'.")
        print(f"Please create it with one URL per line.")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip()]

    if not urls:
        print(f"Error: {INPUT_FILE} is empty.")
        return

    print(f"Loaded {len(urls)} URLs to process.")
    print(f"Will capture at {len(VIEWPORT_WIDTHS)} widths: {', '.join(VIEWPORT_WIDTHS.keys())}")
    
    # Create main output folder
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Create width-specific subfolders
    width_dirs = {}
    for width_label in VIEWPORT_WIDTHS.keys():
        width_dir = os.path.join(OUTPUT_DIR, width_label)
        if not os.path.exists(width_dir):
            os.makedirs(width_dir)
        width_dirs[width_label] = width_dir

    # Track failures
    failed_urls = []
    total_screenshots = 0

    with sync_playwright() as p:
        print("\nLaunching Browser...")
        browser = p.chromium.launch(headless=True)

        for i, url in enumerate(urls, 1):
            print(f"\n[URL {i}/{len(urls)}] {url}")
            
            # Try each width for this URL
            for width_label, width_px in VIEWPORT_WIDTHS.items():
                try:
                    # Create a new context for each width to ensure clean state
                    context = browser.new_context(
                        viewport={"width": width_px, "height": VIEWPORT_HEIGHT}
                    )
                    page = context.new_page()

                    print(f"  → Capturing {width_label} ({width_px}px)...", end="", flush=True)
                    
                    # Navigate
                    page.goto(url, timeout=30000, wait_until="domcontentloaded")
                    
                    # Wait for visual stability
                    page.wait_for_timeout(1500)
                    
                    # Save Screenshot
                    filename = get_safe_filename(url, width_label)
                    save_path = os.path.join(width_dirs[width_label], filename)
                    
                    page.screenshot(path=save_path, full_page=True)
                    print(" ✓")
                    total_screenshots += 1

                    context.close()

                except Exception as e:
                    print(f" ✗ ({str(e)[:40]}...)")
                    if width_label == list(VIEWPORT_WIDTHS.keys())[0]:
                        # Only add to failed list on first width failure (URL unreachable)
                        failed_urls.append(url)

        browser.close()

    # --- FINAL REPORT ---
    print("\n" + "="*50)
    print("JOB COMPLETE")
    print("="*50)
    print(f"Total Screenshots: {total_screenshots}")
    print(f"URLs Processed: {len(urls) - len(failed_urls)} success, {len(failed_urls)} failed")
    print(f"Output Directory: {OUTPUT_DIR}/")
    
    print("\nFolder structure:")
    for width_label in VIEWPORT_WIDTHS.keys():
        count = len([f for f in os.listdir(width_dirs[width_label]) if f.endswith('.png')])
        print(f"  {OUTPUT_DIR}/{width_label}/ ({count} screenshots)")
    
    if failed_urls:
        print("\nThe following URLs failed:")
        with open(os.path.join(OUTPUT_DIR, "failed_urls.txt"), "w", encoding="utf-8") as f:
            for bad_url in failed_urls:
                print(f"  - {bad_url}")
                f.write(bad_url + "\n")
        print(f"\n(Saved to {OUTPUT_DIR}/failed_urls.txt)")

if __name__ == "__main__":
    process_url_list_multi_width()

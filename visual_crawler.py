import os
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

# --- CONFIGURATION ---
INPUT_FILE = "FP_Trivent_Funds.txt"
OUTPUT_DIR = "screenshots_from_list"
# ---------------------

def get_safe_filename(url, index):
    """Creates a clean filename using the URL path and an index number."""
    parsed = urlparse(url)
    path = parsed.path.replace('/', '_').replace('\\', '_')
    if not path or path == "_":
        path = "_home"
    
    # Shorten extremely long paths to prevent OS errors
    clean_path = path[:100]
    return f"{index:04d}{clean_path}.png"

def process_url_list():
    # 1. Read the list of URLs
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Could not find '{INPUT_FILE}'. Please create it first.")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        # Read lines and remove whitespace/empty lines
        urls = [line.strip() for line in f if line.strip()]

    print(f"Loaded {len(urls)} URLs to process.")
    
    # Create output folder
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Track failures for your control report
    failed_urls = []

    with sync_playwright() as p:
        print("Launching Browser...")
        browser = p.chromium.launch(headless=True)
        # Context allows us to set screen size once for all tabs
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        for i, url in enumerate(urls, 1):
            try:
                print(f"[{i}/{len(urls)}] Processing: {url}")
                
                # Navigate
                page.goto(url, timeout=30000, wait_until="domcontentloaded")
                
                # Small buffer for visual stability (fonts/animations)
                page.wait_for_timeout(1500) 
                
                # Save Screenshot
                filename = get_safe_filename(url, i)
                save_path = os.path.join(OUTPUT_DIR, filename)
                
                page.screenshot(path=save_path, full_page=True)

            except Exception as e:
                print(f"   X Failed: {e}")
                failed_urls.append(url)

        browser.close()

    # --- FINAL REPORT ---
    print("\n" + "="*30)
    print("JOB COMPLETE")
    print(f"Success: {len(urls) - len(failed_urls)}")
    print(f"Failed:  {len(failed_urls)}")
    
    if failed_urls:
        print("\nThe following URLs failed:")
        with open("failed_urls.txt", "w") as f:
            for bad_url in failed_urls:
                print(f" - {bad_url}")
                f.write(bad_url + "\n")
        print("(Saved list of failures to 'failed_urls.txt')")

if __name__ == "__main__":
    process_url_list()
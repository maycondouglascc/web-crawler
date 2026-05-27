"""
Multi-Width AI Crawler
Captures screenshots at multiple widths and analyzes content with local AI.
Uses Ollama for local LLM inference (no API keys needed).
"""

import os
import csv
import json
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import ollama 

# --- CONFIGURATION ---
INPUT_FILE = "urls.txt"
OUTPUT_DIR = "local_audit_results_multi_width"
MODEL_NAME = "llama3.2"  # Change to 'mistral', 'llama3', etc. as needed
VIEWPORT_WIDTHS = {
    "mobile": 375,
    "tablet": 768,
    "desktop": 1024,
    "ultrawide": 1920,
}
VIEWPORT_HEIGHT = 1080
CAPTURE_WIDTHS = ["desktop"]  # Only analyze desktop screenshots (change if needed)
# ---------------------

def get_safe_filename(url, width_label):
    """Creates a clean filename using the URL path and width."""
    parsed = urlparse(url)
    path = parsed.path.replace('/', '_').replace('\\', '_').replace(':', '')
    if not path or path == "_":
        path = "home"
    return f"{path[:80]}_{width_label}.png"

def analyze_with_local_ai(text_content, url):
    """Sends text to local Ollama AI for content analysis."""
    try:
        response = ollama.chat(
            model=MODEL_NAME,
            format='json',
            messages=[
                {
                    'role': 'system',
                    'content': (
                        "You are a Lead Content Strategist auditing webpage content. "
                        "Analyze the provided webpage text and return a JSON object with these exact keys: "
                        "core_message (string, main value proposition), "
                        "user_value (string, what user benefits from), "
                        "tone (string, professional/casual/friendly/etc), "
                        "audience (string, target demographic), "
                        "grade (string, A-F rating for messaging clarity). "
                        "Be concise. All values must be present."
                    )
                },
                {
                    'role': 'user',
                    'content': f"WEBPAGE URL: {url}\n\nCONTENT:\n{text_content[:6000]}"
                },
            ]
        )
        
        json_str = response['message']['content']
        return json.loads(json_str)

    except Exception as e:
        return {
            "core_message": f"Error: {str(e)[:50]}", 
            "user_value": "-", 
            "tone": "-", 
            "audience": "-", 
            "grade": "-"
        }

def process_local_audit_multi_width():
    """Process URLs, capture multiple widths, and analyze content."""
    
    if not os.path.exists(INPUT_FILE):
        print(f"Please create {INPUT_FILE} with one URL per line.")
        return
        
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Create width-specific screenshot folders
    width_dirs = {}
    for width_label in VIEWPORT_WIDTHS.keys():
        width_dir = os.path.join(OUTPUT_DIR, f"screenshots_{width_label}")
        if not os.path.exists(width_dir):
            os.makedirs(width_dir)
        width_dirs[width_label] = width_dir

    # CSV for analysis results (one row per URL, not per width)
    csv_path = os.path.join(OUTPUT_DIR, "strategy_audit.csv")
    csv_file = open(csv_path, "w", newline="", encoding="utf-8")
    writer = csv.writer(csv_file)
    
    writer.writerow([
        "Index", 
        "URL", 
        "Screenshots", 
        "Core Message", 
        "User Value", 
        "Tone", 
        "Audience", 
        "Grade"
    ])

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"Starting LOCAL Audit of {len(urls)} pages using {MODEL_NAME}...")
    print(f"Capturing at {len(VIEWPORT_WIDTHS)} widths: {', '.join(VIEWPORT_WIDTHS.keys())}")
    print(f"Analyzing from: {', '.join(CAPTURE_WIDTHS)}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for i, url in enumerate(urls, 1):
            print(f"[{i}/{len(urls)}] {url}")
            
            text_content = None
            
            # Capture at each width
            for width_label, width_px in VIEWPORT_WIDTHS.items():
                try:
                    context = browser.new_context(
                        viewport={"width": width_px, "height": VIEWPORT_HEIGHT}
                    )
                    page = context.new_page()

                    print(f"  → Capturing {width_label:12} ({width_px}px)...", end="", flush=True)
                    
                    page.goto(url, timeout=30000, wait_until="domcontentloaded")
                    page.wait_for_timeout(1500)
                    
                    # Extract text content (use for analysis on first successful capture)
                    if text_content is None:
                        try:
                            text_content = page.inner_text('main')
                        except:
                            text_content = page.inner_text('body')
                    
                    # Save screenshot
                    filename = get_safe_filename(url, width_label)
                    save_path = os.path.join(width_dirs[width_label], filename)
                    page.screenshot(path=save_path, full_page=True)
                    
                    print(" ✓")
                    context.close()

                except Exception as e:
                    print(f" ✗ ({str(e)[:30]})")
            
            # Analyze content if successfully captured
            if text_content:
                print("  → Analyzing with AI...", end="", flush=True)
                clean_text = " ".join(text_content.split())
                analysis = analyze_with_local_ai(clean_text, url)
                
                # List which widths were captured
                captured_widths = ", ".join(VIEWPORT_WIDTHS.keys())
                
                writer.writerow([
                    i,
                    url,
                    captured_widths,
                    analysis.get("core_message", "-"),
                    analysis.get("user_value", "-"),
                    analysis.get("tone", "-"),
                    analysis.get("audience", "-"),
                    analysis.get("grade", "-")
                ])
                csv_file.flush()
                print(" ✓")
            else:
                print("  → Skipped analysis (failed to load page)")
                writer.writerow([i, url, "FAILED", "-", "-", "-", "-", "-"])
                csv_file.flush()

        browser.close()

    csv_file.close()

    # --- FINAL REPORT ---
    print("\n" + "="*60)
    print("AUDIT COMPLETE")
    print("="*60)
    print(f"URLs Processed: {len(urls)}")
    print(f"Output Directory: {OUTPUT_DIR}/")
    print(f"Results CSV: strategy_audit.csv")
    
    print("\nScreenshot folders:")
    for width_label in VIEWPORT_WIDTHS.keys():
        count = len([f for f in os.listdir(width_dirs[width_label]) if f.endswith('.png')])
        print(f"  {OUTPUT_DIR}/screenshots_{width_label}/ ({count} screenshots)")

if __name__ == "__main__":
    process_local_audit_multi_width()

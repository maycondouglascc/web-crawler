import os
import csv
import json
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import ollama 

# --- CONFIGURATION ---
INPUT_FILE = "urls.txt"
OUTPUT_DIR = "local_audit_results"
MODEL_NAME = "llama3.2" # You can swap this for 'mistral' or 'llama3' later
# ---------------------

def get_safe_filename(url, index):
    parsed = urlparse(url)
    path = parsed.path.replace('/', '_').replace('\\', '_')
    if not path or path == "_": path = "_home"
    return f"{index:04d}{path[:50]}.png"

def analyze_with_local_ai(text_content):
    """Sends text to your local machine's AI."""
    try:
        response = ollama.chat(
            model=MODEL_NAME,
            format='json', # <--- The magic switch for structured data
            messages=[
                {
                    'role': 'system',
                    'content': (
                        "You are a Lead Content Strategist. "
                        "Analyze the webpage text provided by the user. "
                        "Return a JSON object with these exact keys: "
                        "core_message (string), user_value (string), "
                        "tone (string), audience (string), grade (string A-F). "
                        "Be concise."
                    )
                },
                {
                    'role': 'user',
                    'content': f"PAGE CONTENT: {text_content[:6000]}"
                },
            ]
        )
        
        # Ollama returns the JSON string inside the 'message' object
        json_str = response['message']['content']
        return json.loads(json_str)

    except Exception as e:
        return {
            "core_message": f"Local AI Error: {str(e)}", 
            "user_value": "-", "tone": "-", "audience": "-", "grade": "-"
        }

def process_local_audit():
    if not os.path.exists(INPUT_FILE):
        print(f"Please create {INPUT_FILE} first.")
        return
        
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    csv_path = os.path.join(OUTPUT_DIR, "local_strategy_audit.csv")
    csv_file = open(csv_path, "w", newline="", encoding="utf-8")
    writer = csv.writer(csv_file)
    
    writer.writerow(["Index", "URL", "Screenshot", "Core Message", "User Value", "Tone", "Audience", "Grade"])

    with open(INPUT_FILE, "r") as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"Starting LOCAL Audit of {len(urls)} pages using {MODEL_NAME}...")
    print("Note: Speed depends on your GPU/CPU.")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        for i, url in enumerate(urls, 1):
            print(f"[{i}/{len(urls)}] Processing: {url}")
            
            try:
                page.goto(url, timeout=20000, wait_until="domcontentloaded")
                
                try:
                    text_content = page.inner_text('main')
                except:
                    text_content = page.inner_text('body')
                
                clean_text = " ".join(text_content.split())

                print("   > Thinking (Local GPU)...")
                # No time.sleep needed here; local models don't have rate limits!
                data = analyze_with_local_ai(clean_text)
                
                filename = get_safe_filename(url, i)
                save_path = os.path.join(OUTPUT_DIR, filename)
                page.screenshot(path=save_path, full_page=True)

                writer.writerow([
                    i, url, filename,
                    data.get("core_message", "-"),
                    data.get("user_value", "-"),
                    data.get("tone", "-"),
                    data.get("audience", "-"),
                    data.get("grade", "-")
                ])
                print(f"   > Grade: {data.get('grade', '-')}")

            except Exception as e:
                print(f"   > Failed: {e}")
                writer.writerow([i, url, "ERROR", str(e), "-", "-", "-", "-"])

        browser.close()
    
    csv_file.close()
    print(f"\nAudit Complete. Check '{OUTPUT_DIR}'.")

if __name__ == "__main__":
    process_local_audit()
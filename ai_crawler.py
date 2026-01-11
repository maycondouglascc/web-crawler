import os
import csv
import time
import json
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import google.generativeai as genai

# --- CONFIGURATION ---
INPUT_FILE = "urls.txt"
OUTPUT_DIR = "audit_results"
GEMINI_API_KEY = "AIzaSyAO3a4vSFK68D2iovFWhu3S7rbArvY-tdY" # <--- PASTE YOUR API KEY HERE
# ---------------------

def configure_gemini():
    genai.configure(api_key=GEMINI_API_KEY)
    
    # We configure the model to force JSON output. 
    # This is the secret to getting clean columns.
    return genai.GenerativeModel(
        'gemini-3-flash-preview',
        generation_config={"response_mime_type": "application/json"}
    )

def get_safe_filename(url, index):
    parsed = urlparse(url)
    path = parsed.path.replace('/', '_').replace('\\', '_')
    if not path or path == "_": path = "_home"
    return f"{index:04d}{path[:50]}.png"

def analyze_with_gemini(model, text_content):
    """Sends page text to Gemini and expects a JSON response."""
    try:
        # The Persona Prompt
        prompt = (
            "You are a Lead Content Strategist auditing a website. "
            "Analyze the following webpage text. Ignore navigation and footers. "
            "Return a JSON object with these 5 keys: "
            "1. 'core_message': (String) What is the single main point? "
            "2. 'user_value': (String) What problem does this solve for the user? "
            "3. 'tone': (String) Two adjectives describing the voice (e.g., 'Professional, Urgent'). "
            "4. 'audience': (String) Who is the intended reader? "
            "5. 'grade': (String) Grade A-F on clarity and brevity. "
            "\n\n"
            f"PAGE CONTENT: {text_content[:8000]}" # 8k characters context
        )
        
        response = model.generate_content(prompt)
        
        # Parse the JSON string into a Python Dictionary
        return json.loads(response.text)
    except Exception as e:
        # Return a "blank" object on error so the CSV doesn't break
        return {
            "core_message": f"Error: {str(e)}", 
            "user_value": "-", "tone": "-", "audience": "-", "grade": "-"
        }

def process_audit():
    if not os.path.exists(INPUT_FILE):
        print(f"Please create {INPUT_FILE} first.")
        return
        
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    model = configure_gemini()

    # Create CSV with specific columns for our insights
    csv_path = os.path.join(OUTPUT_DIR, "content_strategy_audit.csv")
    csv_file = open(csv_path, "w", newline="", encoding="utf-8")
    writer = csv.writer(csv_file)
    
    # The Header Row
    writer.writerow([
        "Index", "URL", "Screenshot", 
        "Core Message", "User Value", "Tone", "Audience", "Grade"
    ])

    with open(INPUT_FILE, "r") as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"Starting Content Strategy Audit for {len(urls)} pages...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        for i, url in enumerate(urls, 1):
            print(f"[{i}/{len(urls)}] Auditing: {url}")
            
            try:
                page.goto(url, timeout=25000, wait_until="domcontentloaded")
                
                # Extract Text (Prioritize main content)
                try:
                    text_content = page.inner_text('main')
                    if len(text_content) < 200: raise Exception("Too short")
                except:
                    text_content = page.inner_text('body')
                
                clean_text = " ".join(text_content.split())

                # AI Analysis
                print("   > Analyzing tone and copy...")
                time.sleep(1.5) # Respect rate limits
                data = analyze_with_gemini(model, clean_text)
                
                # Screenshot
                filename = get_safe_filename(url, i)
                save_path = os.path.join(OUTPUT_DIR, filename)
                page.screenshot(path=save_path, full_page=True)

                # Write formatted row to CSV
                writer.writerow([
                    i, 
                    url, 
                    filename,
                    data.get("core_message", "-"),
                    data.get("user_value", "-"),
                    data.get("tone", "-"),
                    data.get("audience", "-"),
                    data.get("grade", "-")
                ])
                print(f"   > Graded: {data.get('grade', '-')}")

            except Exception as e:
                print(f"   > Failed: {e}")
                writer.writerow([i, url, "ERROR", str(e), "-", "-", "-", "-"])

        browser.close()
    
    csv_file.close()
    print(f"\nAudit Complete. Open '{csv_path}' to see the insights.")

if __name__ == "__main__":
    process_audit()
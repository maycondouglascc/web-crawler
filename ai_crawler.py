import os
import csv
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import google.generativeai as genai

# --- CONFIGURATION ---
INPUT_FILE = "urls.txt"
OUTPUT_DIR = "gemini_audit"
GEMINI_API_KEY = "AIzaSyAO3a4vSFK68D2iovFWhu3S7rbArvY-tdY" # <--- PASTE YOUR GOOGLE API KEY HERE
# ---------------------

def configure_gemini():
    """Sets up the Gemini model."""
    genai.configure(api_key=GEMINI_API_KEY)
    # 1.5 Flash is optimized for speed and cost-efficiency
    return genai.GenerativeModel('gemini-3-flash-preview')

def get_safe_filename(url, index):
    parsed = urlparse(url)
    path = parsed.path.replace('/', '_').replace('\\', '_')
    if not path or path == "_": path = "_home"
    return f"{index:04d}{path[:50]}.png"

def analyze_with_gemini(model, text_content):
    """Sends page text to Gemini for a 1-sentence summary."""
    try:
        # Prompt Engineering for concise results
        prompt = (
            "You are a UX researcher. "
            "Analyze the following text from a webpage and summarize the specific user goal "
            "or purpose of this page in 15 words or less. Be direct, no filler words.\n\n"
            f"TEXT CONTENT: {text_content[:5000]}" # Flash handles larger context easily
        )
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        # Handle cases where safety filters might block content or API errors
        return f"Gemini Error: {e}"

def process_smart_audit():
    if not os.path.exists(INPUT_FILE):
        print(f"Please create {INPUT_FILE} first.")
        return
        
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Initialize Gemini
    model = configure_gemini()

    # Prepare CSV Report
    csv_path = os.path.join(OUTPUT_DIR, "audit_report.csv")
    csv_file = open(csv_path, "w", newline="", encoding="utf-8")
    writer = csv.writer(csv_file)
    writer.writerow(["Index", "URL", "Screenshot File", "Gemini Analysis"])

    with open(INPUT_FILE, "r") as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"Starting audit of {len(urls)} pages using Gemini 1.5 Flash...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        for i, url in enumerate(urls, 1):
            print(f"[{i}/{len(urls)}] Processing: {url}")
            
            try:
                # 1. Load Page
                page.goto(url, timeout=20000, wait_until="domcontentloaded")
                
                # 2. Extract Text
                # Tries to find the most relevant content container
                try:
                    text_content = page.inner_text('main')
                except:
                    text_content = page.inner_text('body')
                
                clean_text = " ".join(text_content.split())

                # 3. Gemini Analysis
                # We put a tiny delay to respect rate limits if you are on the free tier
                time.sleep(1) 
                print("   > Asking Gemini...")
                summary = analyze_with_gemini(model, clean_text)
                print(f"   > Summary: {summary}")

                # 4. Screenshot
                filename = get_safe_filename(url, i)
                save_path = os.path.join(OUTPUT_DIR, filename)
                page.screenshot(path=save_path, full_page=True)

                # 5. Save to Report
                writer.writerow([i, url, filename, summary])

            except Exception as e:
                print(f"   > Failed: {e}")
                writer.writerow([i, url, "ERROR", str(e)])

        browser.close()
    
    csv_file.close()
    print(f"\nAudit Complete. Open '{OUTPUT_DIR}/audit_report.csv' to see results.")

if __name__ == "__main__":
    process_smart_audit()
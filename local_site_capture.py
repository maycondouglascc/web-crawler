"""
Local Site Multi-Width Capture
Captures your local portfolio/dev site at multiple responsive widths.
Perfect for testing responsive design while developing.

Workflow:
1. Start your dev server: npm run dev (or your start command)
2. Run this script: python local_site_capture.py
3. Script auto-discovers all pages
4. Review discovered pages in discovered_pages.txt
5. Confirm to proceed with capturing
6. Screenshots saved to: local_screenshots/ (organized by width)
"""

import os
import time
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

# --- CONFIGURATION ---
DEFAULT_PORT = 5173  # Vite default
DEFAULT_HOST = "localhost"
VIEWPORT_WIDTHS = {
    "mobile": 375,
    "tablet": 768,
    "desktop": 1024,
    "ultrawide": 1920,
}
VIEWPORT_HEIGHT = 1080  # Same height for all widths
WAIT_TIME_MS = 1500  # Wait for fonts/animations to settle
DISCOVERY_FILE = "discovered_pages.txt"
OUTPUT_DIR = "local_screenshots"
# ---------------------

def check_server_running(host, port):
    """Check if dev server is running at host:port"""
    url = f"http://{host}:{port}"
    try:
        response = urlopen(url, timeout=2)
        return True
    except Exception:
        return False

def discover_pages(host, port):
    """Auto-discover all pages on the local site using Playwright"""
    base_url = f"http://{host}:{port}"
    domain = f"{host}:{port}"
    
    urls_to_visit = ["/"]
    visited_urls = set()
    pages = []
    
    print(f"\n🔍 Discovering pages from {base_url}...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        while urls_to_visit:
            current_path = urls_to_visit.pop(0)
            
            if current_path in visited_urls:
                continue
            
            current_url = urljoin(base_url, current_path)
            visited_urls.add(current_path)
            
            try:
                context = browser.new_context(viewport={"width": 1920, "height": 1080})
                page = context.new_page()
                
                page.goto(current_url, timeout=20000, wait_until="networkidle")
                
                # Extract all internal links - improved selector
                links = page.evaluate("""
                    () => {
                        const links = new Set();
                        
                        // Get all links from <a> tags
                        document.querySelectorAll('a[href]').forEach(a => {
                            let href = a.getAttribute('href');
                            if (href) {
                                // Skip external links, anchors, mailto, tel
                                if (!href.startsWith('http') && 
                                    !href.startsWith('#') && 
                                    !href.startsWith('mailto:') && 
                                    !href.startsWith('tel:') &&
                                    !href.startsWith('javascript:')) {
                                    // Normalize path
                                    href = href.split('?')[0].split('#')[0];
                                    if (href && href !== '/') {
                                        links.add(href);
                                    }
                                }
                            }
                        });
                        
                        return Array.from(links);
                    }
                """)
                
                # Add current page to results
                if current_path not in pages:
                    pages.append(current_path)
                    print(f"  ✓ Found: {current_path}")
                
                # Process discovered links
                for link in links:
                    # Normalize path
                    clean_link = link.rstrip('/')
                    if clean_link and clean_link not in visited_urls:
                        urls_to_visit.append(clean_link)
                
                context.close()
                
            except Exception as e:
                print(f"  ⚠️  Error on {current_path}: {str(e)[:40]}")
                visited_urls.discard(current_path)  # Try again later
        
        browser.close()
    
    # Sort pages for consistent output
    pages.sort()
    return pages

def save_discovery_file(pages):
    """Save discovered pages to file for user review"""
    with open(DISCOVERY_FILE, 'w', encoding='utf-8') as f:
        f.write("# Discovered Pages\n")
        f.write("# Review and confirm before capturing\n")
        f.write("# (Remove lines if you don't want to capture them)\n\n")
        for page in pages:
            f.write(f"{page}\n")
    
    print(f"\n✅ Discovered {len(pages)} pages")
    print(f"📄 Saved to: {DISCOVERY_FILE}")
    print(f"\n📋 Pages found:")
    for page in pages:
        print(f"   {page}")

def read_confirmed_pages():
    """Read pages from discovery file (user may have edited)"""
    if not os.path.exists(DISCOVERY_FILE):
        print(f"❌ {DISCOVERY_FILE} not found!")
        return []
    
    pages = []
    with open(DISCOVERY_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if line and not line.startswith('#'):
                pages.append(line)
    
    return pages

def wait_for_confirmation():
    """Wait for user to confirm they've reviewed the pages"""
    print("\n" + "="*60)
    print("⏳ REVIEW REQUIRED")
    print("="*60)
    print(f"\n📄 File: {DISCOVERY_FILE}")
    print("   - Review the discovered pages")
    print("   - Remove any pages you don't want to capture")
    print("   - Save the file when done")
    print("\n⚠️  Once you confirm, the capturing process will start.")
    print("   This may take several minutes depending on the number of pages.\n")
    
    input("Press Enter when ready to proceed with capturing...")

def create_output_dir():
    """Create single output folder"""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    return OUTPUT_DIR

def clean_page_path(path):
    """Clean page path for filename"""
    clean = path.strip('/')
    if not clean:
        clean = "home"
    clean = clean.replace('/', '_').replace('\\', '_').replace('?', '_').replace('&', '_')
    return clean

def capture_pages_multi_width(host, port, pages):
    """Capture all pages at multiple widths to single folder"""
    
    base_url = f"http://{host}:{port}"
    output_dir = create_output_dir()
    
    print("\n" + "="*60)
    print("📸 CAPTURING SCREENSHOTS")
    print("="*60)
    print(f"Source: {base_url}")
    print(f"Pages: {len(pages)}")
    print(f"Widths: {', '.join(VIEWPORT_WIDTHS.keys())}")
    print(f"Output: {output_dir}/")
    print("="*60 + "\n")
    
    successful_captures = 0
    failed_captures = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        for page_idx, page_path in enumerate(pages, 1):
            full_url = urljoin(base_url, page_path)
            clean_page_name = clean_page_path(page_path)
            
            print(f"[{page_idx}/{len(pages)}] {page_path}")
            
            page_success = False
            
            for width_label, width_px in VIEWPORT_WIDTHS.items():
                try:
                    # Create fresh context for each width
                    context = browser.new_context(
                        viewport={"width": width_px, "height": VIEWPORT_HEIGHT}
                    )
                    page_obj = context.new_page()
                    
                    print(f"  ├─ {width_label:12} ({width_px:4}px)...", end="", flush=True)
                    
                    # Navigate to page
                    page_obj.goto(full_url, timeout=30000, wait_until="domcontentloaded")
                    
                    # Wait for visual stability
                    page_obj.wait_for_timeout(WAIT_TIME_MS)
                    
                    # Generate filename: page_width.png (e.g., home_mobile.png)
                    filename = f"{clean_page_name}_{width_label}.png"
                    save_path = os.path.join(output_dir, filename)
                    
                    # Capture full page
                    page_obj.screenshot(path=save_path, full_page=True)
                    
                    print(" ✓")
                    successful_captures += 1
                    page_success = True
                    context.close()
                    
                except Exception as e:
                    print(f" ✗")
                    if width_label == "mobile":  # Only track on first failure
                        failed_captures.append(page_path)
            
            if not page_success:
                print(f"  ⚠️  Failed to capture {page_path}")
        
        browser.close()
    
    # --- FINAL REPORT ---
    print("\n" + "="*60)
    print("✨ CAPTURE COMPLETE")
    print("="*60)
    print(f"✓ Successful screenshots: {successful_captures}")
    print(f"✗ Failed pages: {len(failed_captures)}")
    
    print(f"\n📁 Output folder: {output_dir}/")
    total_files = len([f for f in os.listdir(output_dir) if f.endswith('.png')])
    print(f"   Total files: {total_files}")
    
    print(f"\n📸 Screenshot naming: [page]_[width].png")
    print(f"   Examples:")
    print(f"   - home_mobile.png, home_tablet.png, home_desktop.png, home_ultrawide.png")
    print(f"   - projects_mobile.png, projects_tablet.png, etc")
    
    print("\n💡 Tips:")
    print(f"   • Open {output_dir}/ folder to browse all screenshots")
    print(f"   • Compare same page across widths: e.g., home_mobile.png vs home_desktop.png")
    print(f"   • Edit {DISCOVERY_FILE} and run again to capture different pages")
    
    if failed_captures:
        print(f"\n⚠️  Failed pages: {', '.join(failed_captures)}")
        print("   → Check if they exist and that dev server is running")

def main():
    """Main entry point"""
    print("\n" + "="*60)
    print("🏠 LOCAL SITE AUTO-CAPTURE")
    print("="*60)
    
    # Get host and port
    port_input = input(f"\nEnter port (default {DEFAULT_PORT}): ").strip()
    port = int(port_input) if port_input.isdigit() else DEFAULT_PORT
    
    host = DEFAULT_HOST
    
    # Check if server is running
    print(f"\n🔍 Checking if server is running at {host}:{port}...")
    
    if not check_server_running(host, port):
        print(f"\n❌ Could not connect to http://{host}:{port}")
        print("\n💡 Make sure your dev server is running:")
        print("   npm run dev")
        print("   (or your equivalent start command)")
        print(f"\nIf you're using a different port, run again and enter it.")
        return
    
    print(f"✓ Server found at http://{host}:{port}\n")
    
    # Discover pages
    pages = discover_pages(host, port)
    
    if not pages:
        print("\n❌ No pages discovered!")
        print("Check your dev server and try again.")
        return
    
    # Save discovery file
    save_discovery_file(pages)
    
    # Wait for user review
    wait_for_confirmation()
    
    # Read confirmed pages (user may have edited the file)
    confirmed_pages = read_confirmed_pages()
    
    if not confirmed_pages:
        print("\n⚠️  No pages to capture (file was cleared)")
        return
    
    print(f"\n✓ Confirmed {len(confirmed_pages)} pages for capture")
    
    # Capture
    capture_pages_multi_width(host, port, confirmed_pages)
    
    print("\n🎉 Done! Check the local_screenshots/ folder.\n")

if __name__ == "__main__":
    main()

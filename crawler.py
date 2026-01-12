import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import os

def get_file_type(url):
    """Extracts extension from URL path. Defaults to 'html' if none found."""
    path = urlparse(url).path
    filename, ext = os.path.splitext(path)
    
    # If no extension or just a trailing slash, assume it's a web page
    if not ext or ext == "/":
        return "html"
    
    # Return extension without the dot (e.g., 'pdf' instead of '.pdf')
    return ext.lower().strip('.')

def crawl_website(start_url):
    domain = urlparse(start_url).netloc
    urls_to_visit = {start_url}
    visited_urls = set()
    
    # Dictionary to hold groups: {'html': set(), 'pdf': set(), ...}
    grouped_links = {}

    # Headers to mimic a real browser (Fixes 0 links issue)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }

    print(f"Starting crawl for: {domain}...")

    while urls_to_visit:
        current_url = urls_to_visit.pop()
        
        if current_url in visited_urls:
            continue

        try:
            time.sleep(0.5) # Brief pause for politeness
            
            # Only request standard pages to find more links
            # We don't want to download PDFs, just list them.
            if get_file_type(current_url) != 'html':
                visited_urls.add(current_url)
                continue

            response = requests.get(current_url, headers=headers, timeout=50)
            visited_urls.add(current_url)
            
            # If not a text/html page, skip parsing
            if "text/html" not in response.headers.get('Content-Type', ''):
                continue

            soup = BeautifulSoup(response.text, 'html.parser')
            
            for anchor in soup.find_all('a'):
                href = anchor.get('href')
                if not href:
                    continue
                
                full_url = urljoin(current_url, href)
                parsed_url = urlparse(full_url)

                # Internal Links Logic
                if parsed_url.netloc == domain and parsed_url.scheme in ['http', 'https']:
                    clean_url = full_url.split('#')[0].split('?')[0].rstrip('/')
                    
                    # Determine type and add to group
                    file_type = get_file_type(clean_url)
                    
                    if file_type not in grouped_links:
                        grouped_links[file_type] = set()
                    
                    grouped_links[file_type].add(clean_url)

                    # Add to queue only if it's a page we haven't seen
                    if clean_url not in visited_urls and file_type == 'html':
                        urls_to_visit.add(clean_url)

            # Progress indicator
            total_found = sum(len(v) for v in grouped_links.values())
            print(f"Crawling {current_url} | Total found: {total_found}", end='\r')

        except Exception as e:
            # Silently ignore errors to keep output clean
            pass

    return grouped_links

# --- EXECUTION ---
target_site = "url.com/" # <--- PUT YOUR URL HERE
results = crawl_website(target_site)

print("\n\n--- CRAWL FINISHED ---")

# Save to file grouped by category
with open("grouped_sitemap.txt", "w", encoding="utf-8") as f:
    for file_type, links in results.items():
        header = f"--- {file_type.upper()} FILES ({len(links)}) ---"
        print(header)
        f.write(header + "\n")
        
        for link in sorted(links):
            f.write(link + "\n")
        
        f.write("\n") # Empty line between groups


print("Results saved to 'grouped_sitemap.txt'")

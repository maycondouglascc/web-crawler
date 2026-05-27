# Local Site Capture — Quick Start

Capture your **local portfolio/dev site** at multiple responsive widths **automatically**.

The script discovers all pages, lets you review, then captures everything at once.

## ⚡ 3-Step Setup

### 1. Start Your Dev Server

```bash
# In your portfolio directory
npm run dev
```

This starts the dev server at `http://localhost:5173` (Vite default).

### 2. Run the Capture Script

```bash
# In the web-crawler directory
python local_site_capture.py
```

### 3. Follow the Workflow

```
Enter port (default 5173): [Press Enter]
🔍 Discovering pages...
✓ Found: /
✓ Found: /about
✓ Found: /projects
✓ Found: /case-study/danone
✅ Discovered 4 pages

📄 Review: discovered_pages.txt
⏳ Press Enter when ready...
📸 CAPTURING SCREENSHOTS
```

## 📊 What You Get

Single folder with all screenshots organized by width:

```
local_screenshots/
  home_mobile.png
  home_tablet.png
  home_desktop.png
  home_ultrawide.png

  about_mobile.png
  about_tablet.png
  about_desktop.png
  about_ultrawide.png

  projects_mobile.png
  projects_tablet.png
  ...
```

**Easy comparison:** `home_mobile.png` vs `home_desktop.png` side by side!

## 🔄 Workflow Explained

### 1. Auto-Discovery

Script crawls your local site and finds all pages automatically.

### 2. Save & Review

Pages saved to `discovered_pages.txt`. You can:

- Review the list
- **Remove any pages** you don't want captured
- Save the file

### 3. Confirmation

Press Enter when ready. Script starts capturing.

### 4. Capture

Screenshots at 4 widths: mobile (375), tablet (768), desktop (1024), ultrawide (1920)

## 🎯 Common Workflows

### First time run

```bash
python local_site_capture.py
# Auto-discovers everything
# Press Enter twice
# Done!
```

### Only capture specific pages

```bash
# Edit discovered_pages.txt
# Keep only: /, /projects, /case-study/danone
# Delete other lines
# Run again: python local_site_capture.py
```

### Re-run without discovery

```
# discovered_pages.txt already exists
# Just press Enter -> review -> Press Enter -> capture
```

### Test different port

```bash
python local_site_capture.py
Enter port: 3000
```

## 🎨 Filename Format

```
[page-name]_[width].png

Examples:
  home_mobile.png         ← homepage at mobile width
  about_tablet.png        ← about page at tablet width
  projects_desktop.png    ← projects at desktop width
  case-study_danone_ultrawide.png ← case study at ultrawide
```

**Why this format?**

- Easy to find all widths of one page: `home_*`
- Easy to compare responsive: open all `home_*` files
- Single folder, no mess

## 🔧 Configuration

Edit the script if needed:

```python
DEFAULT_PORT = 5173           # Your dev server port
VIEWPORT_WIDTHS = {
    "mobile": 375,
    "tablet": 768,
    "desktop": 1024,
    "ultrawide": 1920,
}
WAIT_TIME_MS = 1500           # Increase if pages load slowly
```

## 💡 Tips

- **While developing:** Run this script repeatedly as you make changes
- **Find layout breaks:** Compare mobile vs desktop for each page
- **Quick test:** Just press Enter 3 times to capture everything
- **Before commit:** Ensure no pages are missing/broken
- **Edit and retry:** Modify `discovered_pages.txt` and run again

## 📸 Example Output

```
============================================================
🏠 LOCAL SITE AUTO-CAPTURE
============================================================

🔍 Checking if server is running at localhost:5173...
✓ Server found at http://localhost:5173

🔍 Discovering pages from http://localhost:5173...
  ✓ Found: /
  ✓ Found: /about
  ✓ Found: /projects
  ✓ Found: /case-study/danone

✅ Discovered 4 pages
📄 Saved to: discovered_pages.txt

📋 Pages found:
   /
   /about
   /projects
   /case-study/danone

============================================================
⏳ REVIEW REQUIRED
============================================================

📄 File: discovered_pages.txt
   - Review the discovered pages
   - Remove any pages you don't want to capture
   - Save the file when done

Press Enter when ready to proceed with capturing...

[Press Enter...]

✓ Confirmed 4 pages for capture

============================================================
📸 CAPTURING SCREENSHOTS
============================================================
Source: http://localhost:5173
Pages: 4
Widths: mobile, tablet, desktop, ultrawide
Output: local_screenshots/

[1/4] /
  ├─ mobile       ( 375px)... ✓
  ├─ tablet       ( 768px)... ✓
  ├─ desktop      (1024px)... ✓
  ├─ ultrawide    (1920px)... ✓

[2/4] /about
  ├─ mobile       ( 375px)... ✓
  ├─ tablet       ( 768px)... ✓
  ├─ desktop      (1024px)... ✓
  ├─ ultrawide    (1920px)... ✓

[3/4] /projects
  ├─ mobile       ( 375px)... ✓
  ├─ tablet       ( 768px)... ✓
  ├─ desktop      (1024px)... ✓
  ├─ ultrawide    (1920px)... ✓

[4/4] /case-study/danone
  ├─ mobile       ( 375px)... ✓
  ├─ tablet       ( 768px)... ✓
  ├─ desktop      (1024px)... ✓
  ├─ ultrawide    (1920px)... ✓

============================================================
✨ CAPTURE COMPLETE
============================================================
✓ Successful screenshots: 16
✗ Failed pages: 0

📁 Output folder: local_screenshots/
   Total files: 16

🎉 Done!
```

## 🚀 Full Workflow Example

```bash
# Terminal 1: Start dev server
cd portfolio
npm run dev

# Terminal 2: Capture screenshots
cd portfolio/web-crawler
python local_site_capture.py

# Follow prompts (mostly just press Enter!)
# Results in local_screenshots/ folder
# Compare pages at different widths
# Edit portfolio, run script again
# Repeat!
```

Done! All screenshots in one organized folder. 🎉

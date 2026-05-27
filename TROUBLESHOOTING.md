# Setup Checklist & Troubleshooting

Complete checklist to get the web crawler running locally.

## ✅ Setup Checklist

### Prerequisites

- [ ] Python 3.8+ installed
  - Check: `python --version`
- [ ] pip available
  - Check: `pip --version`
- [ ] Internet connection (for initial downloads)

### Installation Steps

- [ ] Navigate to web-crawler folder: `cd web-crawler`
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate environment:
  - Windows: `venv\Scripts\activate`
  - Mac/Linux: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Install Playwright browsers: `python -m playwright install`

### File Setup

- [ ] Create `urls.txt` with test URLs
- [ ] Verify one URL per line (no comments)

### First Run

- [ ] Test with: `python multi_width_crawler.py`
- [ ] Check output folder created: `screenshots_multi_width/`
- [ ] Verify images in `mobile/`, `tablet/`, `desktop/`, `ultrawide/`

### (Optional) AI Features

- [ ] Download and install Ollama from https://ollama.ai
- [ ] Run in background: `ollama serve`
- [ ] Test AI crawler: `python multi_width_ai_crawler.py`

---

## 🔧 Troubleshooting Guide

### Python / Environment Issues

**❌ "python: command not found"**

- Windows: Python not in PATH
  - Solution: Reinstall Python, check "Add Python to PATH"
  - Or: Use full path `C:\Python311\python.exe`
- Mac/Linux: Try `python3` instead of `python`

**❌ "venv: command not found"**

- Try: `python -m venv venv`
- Or: `pip install virtualenv && virtualenv venv`

**❌ "pip: command not found"**

- Try: `python -m pip install -r requirements.txt`

**❌ "activation script not found"**

- Windows: Check path is `venv\Scripts\activate`
- Mac/Linux: Check path is `source venv/bin/activate`
- Or: `python -m venv venv --prompt .venv`

### Dependencies Issues

**❌ "No module named 'playwright'"**

```bash
pip install playwright
python -m playwright install
```

**❌ "No module named 'requests'"**

```bash
pip install requests
```

**❌ "No module named 'beautifulsoup4'"**

```bash
pip install beautifulsoup4
```

**❌ "No module named 'ollama'" (for AI features)**

```bash
pip install ollama
```

**❌ "playwright: command not found"**

```bash
python -m playwright install
# May require chromium download, be patient
```

### File/Input Issues

**❌ "Error: Could not find 'urls.txt'"**

- Solution: Create file in same folder as script
- Check filename is exactly `urls.txt` (case-sensitive on Mac/Linux)
- Verify file is not empty

**❌ "urls.txt is empty"**

- Add at least one URL per line
- Example:
  ```
  https://google.com
  https://github.com
  ```

**❌ "URLs have invalid format"**

- Must start with `http://` or `https://`
- No spaces before/after URL
- One URL per line only

### Browser/Navigation Issues

**❌ "Failed to connect to Chromium"**

```bash
python -m playwright install chromium
# Or if that fails:
python -m playwright install --with-deps
```

**❌ "Timeout connecting to URL"**

- Website may be slow
- Edit script, change timeout:
  ```python
  page.goto(url, timeout=60000)  # 60 seconds
  ```
- Or skip that URL and try later

**❌ "Failed: 404 Not Found"**

- URL doesn't exist or is blocked
- Check URL is correct
- Try in browser first
- Check if site blocks scrapers (`robots.txt`)

**❌ "Connection refused"**

- Website may be down
- Try with different URL
- Check internet connection
- Check if corporate firewall blocks site

### Screenshot/Output Issues

**❌ "Permission denied: cannot write to output folder"**

- Windows: Close Explorer window with folder
- Mac/Linux: Check folder permissions
- Solution: `chmod 755 screenshots_multi_width/`

**❌ "Disk space error"**

- Screenshots take ~5-20MB each
- At 4 widths: 20-80MB per URL
- Free up disk space or reduce breakpoints

**❌ "Screenshot is blank/white"**

- Website may have slow JavaScript
- Increase wait time:
  ```python
  page.wait_for_timeout(3000)  # 3 seconds
  ```
- Or website may require JavaScript that doesn't work in Playwright
- Try with `wait_until="networkidle"`

### AI / Ollama Issues

**❌ "Connection refused" (Ollama)**

- Ollama not running
- Solution: Open new terminal, run `ollama serve`
- Keep that terminal open while running crawler

**❌ "Model not found: llama3.2"**

- Model not downloaded
- Solution: `ollama pull llama3.2`
- First download takes 5-10 minutes
- Be patient!

**❌ "Timeout waiting for AI response"**

- Model is slow (CPU inference)
- Solution:
  - Use faster model: `ollama pull mistral`
  - Or wait longer between requests
  - Or run on GPU if available

**❌ "JSON decode error from AI"**

- Model returned invalid JSON
- Try different model: `ollama pull mistral`
- Or increase system prompt clarity

### Performance Issues

**❌ "Script is very slow"**

- Multi-width crawler = slower (4x screenshots)
- AI crawler = slowest (AI inference)
- Normal speeds:
  - visual_crawler: 5-10 sec/URL
  - multi_width: 20-40 sec/URL
  - with AI: 30-60 sec/URL

**Solutions:**

- Use fewer breakpoints
- Reduce number of URLs for testing
- Use faster model for AI
- Run on machine with more RAM/GPU

### Output Issues

**❌ "failed_urls.txt shows all URLs failed"**

- Check internet connection
- Verify URLs are correct
- Check if site blocks automation
- Try one URL manually in browser first

**❌ "CSV file is corrupted/unreadable"**

- Try opening with different program:
  - Excel, Google Sheets, VS Code, Notepad
- May have encoding issues
- Check that Ollama was running during capture

---

## 🚀 Quick Fixes (Copy & Paste)

### Everything fresh (nuclear option)

```bash
# Windows
rmdir /s venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m playwright install

# Mac/Linux
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m playwright install
```

### Just reinstall packages

```bash
pip install --upgrade -r requirements.txt
python -m playwright install --force
```

### Test basic functionality

```bash
# Create temp test file
echo https://example.com > test_urls.txt

# Run with test file
python multi_width_crawler.py
```

### Verify Playwright installation

```bash
python -m playwright --version
python -m playwright install --with-deps
```

---

## 📊 System Requirements

| Component | Minimum    | Recommended         |
| --------- | ---------- | ------------------- |
| RAM       | 2GB        | 4GB+                |
| CPU       | Dual-core  | Quad-core           |
| Disk      | 100MB free | 1GB free            |
| Internet  | 1 Mbps     | 5+ Mbps             |
| GPU       | None       | NVIDIA (for Ollama) |

---

## 🎯 Health Check

Run this to verify everything works:

```bash
# 1. Check Python
python --version

# 2. Check venv activated (should show path)
which python  # Mac/Linux
where python  # Windows

# 3. Check packages
pip list | grep playwright
pip list | grep requests

# 4. Check Playwright browsers
python -m playwright --version

# 5. Test minimal script
python -c "from playwright.sync_api import sync_playwright; print('✓ Playwright OK')"

# 6. Test with URL
echo https://google.com > test.txt
python multi_width_crawler.py
```

All checks passing? You're ready to go! 🎉

---

## 📞 Still Stuck?

1. **Check the logs:** Look for detailed error messages in terminal output
2. **Verify prerequisites:** Run health check above
3. **Try test URL:** Use https://example.com to test
4. **Search issues:** Google the exact error message
5. **Check internet:** Verify WiFi/connection works
6. **Restart everything:** Fresh terminal + reactivate venv

Last resort: Delete `venv` folder and start from scratch.

---

## ✨ You're All Set!

Once checklist is complete:

```bash
# Create real urls.txt with your sites
python multi_width_crawler.py

# Enjoy responsive design testing! 🚀
```

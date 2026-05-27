"""
CONFIGURATION EXAMPLES
Reference file showing all configurable options for each script.
Copy relevant sections to customize each script.
"""

# ============================================================================

# multi_width_crawler.py

# ============================================================================

# Captures screenshots at multiple responsive breakpoints

# BASIC CONFIG

INPUT_FILE = "urls.txt"
OUTPUT_DIR = "screenshots_multi_width"

# BREAKPOINTS - Define custom responsive widths

# Common options:

# xs: 320, sm: 375, md: 768, lg: 1024, xl: 1280, xxl: 1536, ultrawide: 1920

VIEWPORT_WIDTHS = {
"mobile": 375,
"tablet": 768,
"desktop": 1024,
"ultrawide": 1920,
}

# Fixed height for all captures

VIEWPORT_HEIGHT = 1080

# TIMING

# Increase if pages have animations/fonts loading slowly

WAIT_TIME_MS = 1500 # milliseconds to wait after page load

# ============================================================================

# multi_width_ai_crawler.py

# ============================================================================

# Captures screenshots AND analyzes content with local AI (Ollama)

# FILE CONFIG

INPUT_FILE = "urls.txt"
OUTPUT_DIR = "local_audit_results_multi_width"

# AI MODEL

# Available options: "llama3.2", "mistral", "llama3", "neural-chat", "orca", "openchat"

# Download first: ollama pull model_name

# Then run: ollama run model_name

MODEL_NAME = "llama3.2"

# BREAKPOINTS (same as multi_width_crawler.py)

VIEWPORT_WIDTHS = {
"mobile": 375,
"tablet": 768,
"desktop": 1024,
"ultrawide": 1920,
}
VIEWPORT_HEIGHT = 1080

# WHICH WIDTHS TO ANALYZE

# Analyzing from multiple widths = slower but more thorough

# Usually desktop is sufficient for content analysis

CAPTURE_WIDTHS = ["desktop"] # or ["mobile", "desktop"] or ["ultrawide"], etc

# TIMING

WAIT_TIME_MS = 1500

# ============================================================================

# PRESET CONFIGURATIONS

# ============================================================================

# --- PRESET 1: Fast Mobile Testing ---

MOBILE_TESTING = {
"VIEWPORT_WIDTHS": {
"mobile": 375,
"tablet": 768,
},
"VIEWPORT_HEIGHT": 1080,
"WAIT_TIME_MS": 1000, # Mobile sites load faster
}

# --- PRESET 2: Full Desktop Audit ---

DESKTOP_AUDIT = {
"VIEWPORT_WIDTHS": {
"laptop": 1280,
"desktop": 1440,
"ultrawide": 1920,
},
"VIEWPORT_HEIGHT": 1080,
"WAIT_TIME_MS": 2000, # More wait for complex desktop sites
}

# --- PRESET 3: Comprehensive Responsive Testing ---

RESPONSIVE_COMPLETE = {
"VIEWPORT_WIDTHS": {
"mobile_sm": 320,
"mobile": 375,
"mobile_lg": 425,
"tablet": 768,
"tablet_landscape": 1024,
"laptop": 1280,
"desktop": 1440,
"ultrawide": 1920,
},
"VIEWPORT_HEIGHT": 1080,
"WAIT_TIME_MS": 2000,
}

# --- PRESET 4: Quick Preview (Desktop Only) ---

QUICK_PREVIEW = {
"VIEWPORT_WIDTHS": {
"desktop": 1920,
},
"VIEWPORT_HEIGHT": 1080,
"WAIT_TIME_MS": 1000,
}

# ============================================================================

# ADVANCED: AI SYSTEM PROMPTS

# ============================================================================

# Customize what the AI analyzes. Replace the default prompt in ai_crawler.py:

# Content Strategy Focus

SYSTEM_PROMPT_STRATEGY = """
You are a Content Strategist. Analyze the webpage and return JSON with:

- core_message: Main value proposition (max 15 words)
- user_value: What user benefits (max 15 words)
- tone: Writing style (professional/casual/friendly/authoritative)
- audience: Target demographic
- grade: A-F rating for clarity
  Be concise.
  """

# UX/Accessibility Focus

SYSTEM_PROMPT_UX = """
You are a UX Auditor. Analyze the webpage for user experience and return JSON:

- clarity: How clear is the value prop? (A-F)
- cta_presence: Are CTAs clear and visible? (yes/no)
- navigation: Navigation structure quality (excellent/good/fair/poor)
- accessibility: Likely accessibility issues (list or "none")
- improvements: Top 2 UX improvements needed
  """

# SEO Focus

SYSTEM_PROMPT_SEO = """
You are an SEO Expert. Analyze the page content for search optimization:

- primary_keyword: Likely main target keyword
- secondary_keywords: 3-5 secondary keywords
- meta_quality: Quality of meta descriptions (A-F)
- heading_structure: H1/H2 hierarchy assessment
- content_quality: Content depth for SEO (A-F)
  """

# ============================================================================

# DOCKER SETUP (Optional for CI/CD)

# ============================================================================

# If running in Docker, use these configs:

DOCKER_CONFIG = {
"PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "1",
"OLLAMA_HOST": "http://host.docker.internal:11434", # Access host Ollama from container
}

# docker-compose.yml example:

"""
version: '3.8'
services:
crawler:
image: python:3.11-slim
volumes: - .:/app
working_dir: /app
command: python multi_width_crawler.py
environment: - PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

ollama:
image: ollama/ollama:latest
ports: - "11434:11434"
volumes: - ollama:/root/.ollama
volumes:
ollama:
"""

# ============================================================================

# SCHEDULING (Optional for automated runs)

# ============================================================================

# Use APScheduler or cron to run crawlers on a schedule:

# Python example (install: pip install apscheduler)

"""
from apscheduler.schedulers.background import BackgroundScheduler
from multi_width_crawler import process_url_list_multi_width

scheduler = BackgroundScheduler()

# Run every Monday at 9 AM

scheduler.add_job(process_url_list_multi_width, 'cron', day_of_week=0, hour=9)

scheduler.start()

# Windows batch file (save as: run_crawler.bat)

@echo off
cd C:\\path\\to\\web-crawler
python -m venv venv
call venv\\Scripts\\activate.bat
pip install -r requirements.txt
python multi_width_crawler.py
pause

# Schedule via Windows Task Scheduler

# Action: Start program

# Program: C:\\path\\to\\web-crawler\\run_crawler.bat

"""

# ============================================================================

# TIPS FOR DIFFERENT USE CASES

# ============================================================================

# Use Case: Daily monitoring of competitor sites

"""
VIEWPORT_WIDTHS = {"desktop": 1920} # Just desktop
WAIT_TIME_MS = 1500

# Run daily, compare screenshots using image diff tools

"""

# Use Case: E-commerce product page testing

"""
VIEWPORT_WIDTHS = {
"mobile": 375,
"tablet": 768,
"desktop": 1024,
}
MODEL_NAME = "mistral" # Faster AI model
CAPTURE_WIDTHS = ["mobile", "desktop"]

# Analyze if product info is clear on mobile vs desktop

"""

# Use Case: Full website audit

"""
VIEWPORT_WIDTHS = {
"mobile": 375,
"tablet": 768,
"desktop": 1024,
"ultrawide": 1920,
}
MODEL_NAME = "llama3.2" # Slower, more detailed
CAPTURE_WIDTHS = ["mobile", "desktop", "ultrawide"]

# Get comprehensive data across all breakpoints

"""

# Use Case: Quick visual regression testing

"""
VIEWPORT_WIDTHS = {"desktop": 1920}
WAIT_TIME_MS = 1000

# Fast, low overhead, suitable for CI/CD pipelines

"""

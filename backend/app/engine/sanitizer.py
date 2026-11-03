"""
Page Sanitizer & Pre-Capture Processor
Handles lazy-load image scrolling, font stabilization, cookie/chat banner suppression,
sticky-header unpinning, and theme switching (Light vs. Dark mode).
"""

import time
from playwright.sync_api import Page

# Selectors for common cookie banners, GDPR consent overlays, and floating chat bubbles
KNOWN_NOISE_SELECTORS = [
    "#onetrust-consent-sdk",
    "#CybotCookiebotDialog",
    ".cookie-banner",
    ".cc-banner",
    "#cmpbox",
    "#cookie-law-info-again",
    ".crisp-client",
    "#intercom-container",
    "#hubspot-messages-iframe-container",
    "#drift-widget",
    ".drift-frame-controller",
    "#launcher",  # Zendesk
    "[id*='cookie-consent']",
    "[class*='cookie-consent']",
    "[class*='consent-modal']",
]

def apply_theme_to_page(page: Page, theme: str = "light"):
    """
    Enforces theme (light or dark) via Playwright emulation and DOM manipulation
    so modern Tailwind, Next-themes, and custom CSS variables react immediately.
    """
    is_dark = theme.lower() == "dark"
    try:
        page.emulate_media(color_scheme="dark" if is_dark else "light")
        page.evaluate("""
            (isDark) => {
                const root = document.documentElement;
                if (isDark) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                    root.setAttribute('data-theme', 'dark');
                    root.setAttribute('data-color-mode', 'dark');
                    root.style.colorScheme = 'dark';
                    try {
                        localStorage.setItem('theme', 'dark');
                        localStorage.setItem('color-theme', 'dark');
                    } catch(e) {}
                } else {
                    root.classList.remove('dark');
                    root.classList.add('light');
                    root.setAttribute('data-theme', 'light');
                    root.setAttribute('data-color-mode', 'light');
                    root.style.colorScheme = 'light';
                    try {
                        localStorage.setItem('theme', 'light');
                        localStorage.setItem('color-theme', 'light');
                    } catch(e) {}
                }
            }
        """, is_dark)
    except Exception as e:
        print(f"Theme switch warning: {e}")

def suppress_banners_and_widgets(page: Page):
    """Hides cookie banners, chat popups, and floating overlays."""
    try:
        page.evaluate("""
            (selectors) => {
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => {
                        el.style.setProperty('display', 'none', 'important');
                        el.style.setProperty('visibility', 'hidden', 'important');
                        el.style.setProperty('opacity', '0', 'important');
                        el.style.setProperty('pointer-events', 'none', 'important');
                    });
                });
            }
        """, KNOWN_NOISE_SELECTORS)
    except Exception:
        pass

def scroll_and_trigger_lazy_loads(page: Page, max_scrolls: int = 12):
    """
    Scrolls down in increments to trigger IntersectionObserver lazy-loaded images,
    then scrolls back to top and waits for layout to settle.
    """
    try:
        page.evaluate("""
            async (maxSteps) => {
                const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
                const step = window.innerHeight * 0.75;
                let current = 0;
                let count = 0;
                while (current < scrollHeight && count < maxSteps) {
                    current += step;
                    window.scrollTo(0, current);
                    count++;
                    await new Promise(r => setTimeout(r, 80));
                }
                window.scrollTo(0, 0);
                await new Promise(r => setTimeout(r, 150));
            }
        """, max_scrolls)
    except Exception:
        pass

def unpin_fixed_navbars_for_full_page(page: Page):
    """
    Converts fixed/sticky headers to absolute positioning so they appear only once
    at the top of full-page screenshots instead of repeating down the page.
    """
    try:
        page.evaluate("""
            () => {
                document.querySelectorAll('*').forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.position === 'fixed' || style.position === 'sticky') {
                        const rect = el.getBoundingClientRect();
                        if (rect.top <= 10 && rect.height < 250) {
                            el.style.setProperty('position', 'absolute', 'important');
                        }
                    }
                });
            }
        """)
    except Exception:
        pass

def sanitize_page_for_capture(page: Page, theme: str = "light", is_full_page: bool = True):
    """Runs the complete sanitization pipeline before capturing screenshots."""
    # 1. Apply theme
    apply_theme_to_page(page, theme)

    # 2. Trigger lazy images & components
    scroll_and_trigger_lazy_loads(page)

    # 3. Suppress banners and chat bubbles
    suppress_banners_and_widgets(page)

    # 4. Wait for fonts & network settle
    try:
        page.evaluate("() => document.fonts.ready")
    except Exception:
        pass

    # 5. Neutralize sticky headers if full-page
    if is_full_page:
        unpin_fixed_navbars_for_full_page(page)

    time.sleep(0.3)

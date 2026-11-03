"""
Standalone Portable HTML Viewer Exporter
Generates a portable, offline gallery.html file inside the run directory.
"""

import os
from typing import Dict, Any, List

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <title>Visual Intelligence Gallery - Offline Viewer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0B0F19; color: #E2E8F0; font-family: -apple-system, sans-serif; }
    </style>
</head>
<body class="p-6 max-w-7xl mx-auto space-y-6">
    <header class="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
            <h1 class="text-2xl font-bold text-white">Visual Intelligence Studio</h1>
            <p class="text-xs text-slate-400">Offline Run Export • __RUN_ID__</p>
        </div>
        <div class="text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Portable Client Edition
        </div>
    </header>

    <div class="flex gap-2 border-b border-slate-800 pb-3" id="tabBar">
        <button onclick="showTab('screens')" id="tab-screens" class="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950">
            Screens (__TOTAL_SCREENS__)
        </button>
        <button onclick="showTab('sections')" id="tab-sections" class="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white">
            Sections (__TOTAL_SECTIONS__)
        </button>
        <button onclick="showTab('components')" id="tab-components" class="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white">
            UI Components (__TOTAL_COMPONENTS__)
        </button>
    </div>

    <!-- SCREENS TAB -->
    <div id="view-screens" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        __SCREENS_HTML__
    </div>

    <!-- SECTIONS TAB -->
    <div id="view-sections" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden">
        __SECTIONS_HTML__
    </div>

    <!-- COMPONENTS TAB -->
    <div id="view-components" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 hidden">
        __COMPONENTS_HTML__
    </div>

    <script>
        function showTab(tabName) {
            ['screens', 'sections', 'components'].forEach(t => {
                document.getElementById('view-' + t).classList.add('hidden');
                const btn = document.getElementById('tab-' + t);
                btn.className = 'px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white';
            });
            document.getElementById('view-' + tabName).classList.remove('hidden');
            const activeBtn = document.getElementById('tab-' + tabName);
            activeBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950';
        }
    </script>
</body>
</html>
"""

def generate_portable_html_viewer(
    run_id: str,
    screens: List[Dict[str, Any]],
    sections: List[Dict[str, Any]],
    components: List[Dict[str, Any]],
    output_dir: str
) -> str:
    """
    Generates standalone offline gallery.html inside output_dir/exports/.
    """
    exports_dir = os.path.join(output_dir, "exports")
    os.makedirs(exports_dir, exist_ok=True)
    filepath = os.path.join(exports_dir, "gallery.html")

    # Generate screens HTML
    screens_cards = []
    for s in screens:
        rel_img = os.path.relpath(s.get("file_path", ""), exports_dir)
        screens_cards.append(f"""
        <div class="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div class="aspect-video bg-black flex items-start overflow-hidden">
                <img src="{rel_img}" class="w-full object-cover object-top" loading="lazy" />
            </div>
            <div class="p-3 text-xs flex justify-between">
                <span class="font-mono text-slate-200">{s.get('route_path')}</span>
                <span class="text-slate-400 capitalize">{s.get('viewport_label')} ({s.get('theme')})</span>
            </div>
        </div>
        """)

    # Generate sections HTML
    sections_cards = []
    for sec in sections:
        rel_img = os.path.relpath(sec.get("file_path", ""), exports_dir)
        sections_cards.append(f"""
        <div class="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div class="aspect-video bg-black flex items-center justify-center p-2">
                <img src="{rel_img}" class="max-h-full max-w-full object-contain" loading="lazy" />
            </div>
            <div class="p-3 text-xs flex justify-between">
                <span class="font-bold text-slate-200 capitalize">{sec.get('section_category')}</span>
                <span class="font-mono text-slate-400">{sec.get('route_path')}</span>
            </div>
        </div>
        """)

    # Generate components HTML
    components_cards = []
    for c in components:
        rel_img = os.path.relpath(c.get("preview_path", ""), exports_dir)
        components_cards.append(f"""
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-2">
            <div class="h-28 bg-slate-950 rounded flex items-center justify-center p-2">
                <img src="{rel_img}" class="max-h-full max-w-full object-contain" loading="lazy" />
            </div>
            <div class="flex justify-between items-center text-xs">
                <span class="uppercase text-[10px] text-emerald-400 font-bold">{c.get('category')}</span>
                <span class="text-slate-400 text-[11px]">Used {c.get('instances_count')}x</span>
            </div>
        </div>
        """)

    content = (
        HTML_TEMPLATE
        .replace("__RUN_ID__", run_id)
        .replace("__TOTAL_SCREENS__", str(len(screens)))
        .replace("__TOTAL_SECTIONS__", str(len(sections)))
        .replace("__TOTAL_COMPONENTS__", str(len(components)))
        .replace("__SCREENS_HTML__", "\n".join(screens_cards))
        .replace("__SECTIONS_HTML__", "\n".join(sections_cards))
        .replace("__COMPONENTS_HTML__", "\n".join(components_cards))
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return filepath

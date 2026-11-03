"""
End-to-end smoke test for Visual Intelligence Studio
Starts a local mock web server, runs discovery, captures screens,
slices sections, harvests components, and queries the gallery API.
"""

import threading
import time
import requests
from http.server import HTTPServer, SimpleHTTPRequestHandler
import tempfile
import os

HTML_CONTENT = """<!DOCTYPE html>
<html>
<head>
    <title>Mock SaaS App</title>
    <style>
        body { font-family: sans-serif; margin: 0; background: #fafafa; color: #111; }
        header { background: #1e293b; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .hero { padding: 80px 20px; text-align: center; background: #3b82f6; color: white; }
        .hero h1 { font-size: 40px; margin: 0 0 16px; }
        .btn-primary { background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; }
        .features { padding: 60px 20px; display: flex; gap: 20px; justify-content: center; }
        .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; width: 260px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        footer { background: #0f172a; color: #94a3b8; padding: 40px 20px; text-align: center; }
    </style>
</head>
<body>
    <header id="site-header">
        <div style="font-weight: bold; font-size: 20px;">SaaSify</div>
        <button class="btn-primary">Sign In</button>
    </header>
    <section class="hero">
        <h1>Transform Your Workflow</h1>
        <p>The modern platform for product teams and designers.</p>
        <button class="btn-primary">Get Started Free</button>
    </section>
    <section class="features">
        <div class="card">
            <h3>Automated Discovery</h3>
            <p>Discovers every route in your web application.</p>
            <button class="btn-primary" style="padding: 8px 16px; font-size: 12px;">Learn More</button>
        </div>
        <div class="card">
            <h3>Design Tokens</h3>
            <p>Extracts colors, fonts, and radii automatically.</p>
            <button class="btn-primary" style="padding: 8px 16px; font-size: 12px;">Learn More</button>
        </div>
    </section>
    <footer>
        <p>&copy; 2026 SaaSify Inc. All rights reserved.</p>
    </footer>
</body>
</html>
"""

class TestServerHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(HTML_CONTENT.encode("utf-8"))

def run_smoke_test():
    # 1. Start mock server on port 9876
    server = HTTPServer(("127.0.0.1", 9876), TestServerHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    print("✓ Mock HTTP server started on http://127.0.0.1:9876")

    # 2. Start FastAPI backend on port 8009
    from app.main import app
    import uvicorn
    config = uvicorn.Config(app, host="127.0.0.1", port=8009, log_level="warning")
    uvicorn_server = uvicorn.Server(config)
    uvicorn_thread = threading.Thread(target=uvicorn_server.run, daemon=True)
    uvicorn_thread.start()
    time.sleep(2)
    print("✓ FastAPI backend running on http://127.0.0.1:8009")

    # 3. Create Project
    res = requests.post("http://127.0.0.1:8009/api/projects", json={
        "name": "Smoke Test SaaS",
        "base_url": "http://127.0.0.1:9876"
    })
    assert res.status_code == 200, f"Project creation failed: {res.text}"
    project = res.json()
    project_id = project["id"]
    print(f"✓ Created test project: {project_id}")

    # 4. Trigger Discovery
    disc_res = requests.post(f"http://127.0.0.1:8009/api/projects/{project_id}/discover")
    assert disc_res.status_code == 200
    run_id = disc_res.json()["run_id"]
    print(f"✓ Triggered discovery run: {run_id}")

    # Wait for discovery to finish
    for _ in range(30):
        status_res = requests.get(f"http://127.0.0.1:8009/api/runs/{run_id}").json()
        if status_res["status"] == "review_pending":
            break
        time.sleep(0.5)

    assert status_res["status"] == "review_pending", f"Discovery did not finish: {status_res}"
    print("✓ Route discovery completed with status 'review_pending'")

    # 5. Trigger Capture Pipeline (Desktop + Mobile in Light mode)
    cap_res = requests.post(f"http://127.0.0.1:8009/api/runs/{run_id}/capture", json={
        "viewports": {"desktop": True, "mobile": True},
        "themes": {"light": True}
    })
    assert cap_res.status_code == 200
    print("✓ Triggered capture pipeline")

    # Wait for capture to finish
    for _ in range(40):
        status_res = requests.get(f"http://127.0.0.1:8009/api/runs/{run_id}").json()
        if status_res["status"] == "completed":
            break
        time.sleep(0.5)

    assert status_res["status"] == "completed", f"Capture did not complete: {status_res}"
    print("✓ Capture pipeline completed with status 'completed'")

    # 6. Query Gallery Data
    gallery_res = requests.get(f"http://127.0.0.1:8009/api/runs/{run_id}/gallery").json()
    screens = gallery_res["screens"]
    sections = gallery_res["sections"]
    components = gallery_res["components"]

    print(f"✓ Gallery retrieved: {len(screens)} screens, {len(sections)} sections, {len(components)} harvested components")
    assert len(screens) >= 2, f"Expected at least 2 screens (desktop & mobile), got {len(screens)}"
    assert len(sections) >= 1, f"Expected sliced sections, got {len(sections)}"
    assert len(components) >= 1, f"Expected harvested components, got {len(components)}"

    # Clean shutdown
    server.shutdown()
    uvicorn_server.should_exit = True
    print("\n🎉 ALL E2E SMOKE TESTS PASSED!")

if __name__ == "__main__":
    run_smoke_test()

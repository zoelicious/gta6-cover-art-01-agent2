"""Coral Dawn — headless smoke test.

Opens the editor in Chromium and exports a real PNG at all three sizes
through the app's own export path (window.__coral.exportPNG), then checks
each one is a valid PNG of the right dimensions. Also checks the live
preview canvas is non-blank and that all five sample photos loaded.
"""
import os
import sys

from playwright.sync_api import sync_playwright

BASE = f"http://localhost:{os.environ.get('CORAL_PORT', '8091')}"
SIZES = {"square": (1080, 1080), "portrait": (1080, 1350), "wide": (1920, 1080)}


def main():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 860})
        page.goto(f"{BASE}/")
        page.wait_for_function("window.__coralReady === true", timeout=30000)
        page.wait_for_timeout(500)

        loaded = page.evaluate("window.__coral.library.filter(Boolean).length")
        print(f"sample photos loaded: {loaded}")
        if loaded != 5:
            failures.append(f"expected 5 sample photos, got {loaded}")

        blank = page.evaluate("""() => {
          const c = document.getElementById('preview');
          const g = c.getContext('2d');
          const d = g.getImageData(0, 0, c.width, c.height).data;
          let sum = 0;
          for (let i = 0; i < d.length; i += 401) sum += d[i] + d[i+1] + d[i+2];
          return sum;
        }""")
        print(f"preview pixel sum: {blank}")
        if blank <= 0:
            failures.append("preview canvas is blank")

        for key, (w, h) in SIZES.items():
            res = page.evaluate(f"window.__coral.exportPNG('{key}')")
            ok = res["pngMagic"] and res["width"] == w and res["height"] == h and res["bytes"] > 50000
            print(f"export {key}: {res['width']}x{res['height']} {res['bytes']} bytes png={res['pngMagic']} {'OK' if ok else 'FAIL'}")
            if not ok:
                failures.append(f"export {key} failed: {res}")

        browser.close()
    if failures:
        print("SMOKE FAIL:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("SMOKE PASS: 3 sizes exported, preview live, 5 samples loaded")


if __name__ == "__main__":
    main()

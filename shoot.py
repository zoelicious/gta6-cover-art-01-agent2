"""Coral Dawn — headless screenshot driver.

Loads the studio in Chromium, waits for the sample photos and fonts, and
takes the four deliverable screenshots:
  1-cover.jpg  exported cover, hero-top, Coral Dawn, square
  2-editor.jpg the bright editor with photos loaded
  3-cover.jpg  exported cover, hero-left, Sunset, square
  4-cover.jpg  exported cover, hero-top, Coral Dawn, portrait
Screenshots are JPEGs within the gate limits (long side <= 1280,
short side >= 480, each <= 256 KiB).
"""
import io
import os
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

BASE = f"http://localhost:{os.environ.get('CORAL_PORT', '8091')}"
OUT = Path(__file__).resolve().parent / "screenshots"


def save_jpeg(page_or_element, path, max_long=1280, quality=88):
    png = page_or_element.screenshot()
    img = Image.open(io.BytesIO(png)).convert("RGB")
    w, h = img.size
    if max(w, h) > max_long:
        scale = max_long / max(w, h)
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    q = quality
    while True:
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=q, optimize=True)
        if len(buf.getvalue()) <= 256 * 1024 or q <= 45:
            path.write_bytes(buf.getvalue())
            return len(buf.getvalue()), img.size
        q -= 8


def wait_ready(page):
    page.wait_for_function("window.__coralReady === true", timeout=30000)
    page.wait_for_timeout(600)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1120, "height": 1120})

        page.goto(f"{BASE}/?shot=cover&layout=hero-top&grade=coral-dawn&size=square")
        wait_ready(page)
        page.wait_for_function("window.__shotDone === true", timeout=30000)
        n, size = save_jpeg(page.locator("#shotCanvas"), OUT / "1-cover.jpg")
        print(f"1-cover.jpg {size} {n} bytes")

        page.goto(f"{BASE}/?shot=cover&layout=hero-left&grade=sunset&size=square")
        wait_ready(page)
        page.wait_for_function("window.__shotDone === true", timeout=30000)
        n, size = save_jpeg(page.locator("#shotCanvas"), OUT / "3-cover.jpg")
        print(f"3-cover.jpg {size} {n} bytes")

        page.goto(f"{BASE}/?shot=cover&layout=hero-top&grade=coral-dawn&size=portrait")
        wait_ready(page)
        page.wait_for_function("window.__shotDone === true", timeout=30000)
        n, size = save_jpeg(page.locator("#shotCanvas"), OUT / "4-cover.jpg")
        print(f"4-cover.jpg {size} {n} bytes")

        page2 = browser.new_page(viewport={"width": 1280, "height": 1000})
        page2.goto(f"{BASE}/")
        wait_ready(page2)
        page2.wait_for_timeout(400)
        n, size = save_jpeg(page2, OUT / "2-editor.jpg")
        print(f"2-editor.jpg {size} {n} bytes")

        browser.close()
    print("shots done")


if __name__ == "__main__":
    main()

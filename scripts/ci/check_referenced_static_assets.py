"""Warn-only: referenced /logo/*.png assets must exist under archlucid-ui/public/logo (TB-252)."""

from __future__ import annotations

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
UI_ROOT = REPO_ROOT / "archlucid-ui"
LOGO_DIR = UI_ROOT / "public" / "logo"
PNG_REF_PATTERN = re.compile(r"/logo/([A-Za-z0-9._-]+\.png)")
SCAN_PATHS = (
    UI_ROOT / "src" / "app" / "layout.tsx",
    UI_ROOT / "public" / "manifest.webmanifest",
)


def collect_png_references() -> set[str]:
    refs: set[str] = set()

    for path in SCAN_PATHS:
        if not path.is_file():
            continue

        text = path.read_text(encoding="utf-8")

        for match in PNG_REF_PATTERN.finditer(text):
            refs.add(match.group(1))

    return refs


def main() -> int:
    missing: list[str] = []

    for filename in sorted(collect_png_references()):
        if not (LOGO_DIR / filename).is_file():
            missing.append(filename)

    if not missing:
        print("OK: all referenced /logo/*.png files exist.")
        return 0

    for name in missing:
        print(f"WARN: missing raster asset public/logo/{name}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Repair UTF-8 punctuation mojibake from Windows-1252 mis-decode (â€" → —, etc.)."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] if False else Path.cwd()

REPLACEMENTS = [
    ("\u00e2\u20ac\u201d", "\u2014"),  # â€" → —
    ("\u00e2\u20ac\u0094", "\u2014"),
    ("\u00e2\u20ac\u201c", "\u2013"),  # “ → –
    ("\u00e2\u20ac\u0093", "\u2013"),
    ("\u00e2\u20ac\u00a6", "\u2026"),  # … → …
    ("\u00e2\u20ac\u2122", "\u2019"),  # ’ → ’
    ("\u00e2\u20ac\u02dc", "\u2018"),  # ‘ → ‘
    ("\u00e2\u20ac\u0153", "\u201c"),  # “ → “
    ("\u00e2\u20ac\u009d", "\u201d"),  # ” → ”
    ("\u00e2\u2020\u2019", "\u2192"),  # → → →
    ("\u00e2\u2020\u201d", "\u2194"),  # ↔ → ↔
]

# Also accept already-mojibake literal forms commonly seen in editors
LITERALS = [
    ("—", "—"),
    ("–", "–"),
    ("…", "…"),
    ("’", "’"),
    ("‘", "‘"),
    ("“", "“"),
    ("”", "”"),
    ("→", "→"),
    ("↔", "↔"),
]

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "bin",
    "obj",
    ".next",
    "archive",
    "dist",
    ".cache",
}

EXTS = {".md", ".cs", ".ts", ".tsx", ".json", ".py", ".ps1", ".yml", ".yaml"}


def should_skip(path: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in path.parts)


def repair_text(text: str) -> str:
    out = text
    for old, new in REPLACEMENTS + LITERALS:
        if old in out:
            out = out.replace(old, new)
    return out


def main() -> int:
    repaired = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for name in filenames:
            path = Path(dirpath) / name
            if path.suffix.lower() not in EXTS:
                continue
            if should_skip(path):
                continue
            try:
                raw = path.read_bytes()
                text = raw.decode("utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            if "â" not in text and "\u00e2" not in text:
                continue
            fixed = repair_text(text)
            if fixed != text:
                path.write_text(fixed, encoding="utf-8", newline="")
                repaired += 1
                print(f"repaired {path.relative_to(ROOT)}")
    print(f"Repaired {repaired} files")
    matrix = ROOT / "docs" / "library" / "ROUTE_TIER_POLICY_NAV_MATRIX.md"
    if matrix.exists():
        m = matrix.read_text(encoding="utf-8")
        target = "## Appendix — per-controller registry (CI)"
        if target not in m:
            import re

            m2 = re.sub(
                r"(?m)^## Appendix .+ per-controller registry \(CI\)$",
                target,
                m,
            )
            if m2 != m:
                matrix.write_text(m2, encoding="utf-8", newline="")
                print("fixed matrix appendix heading")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

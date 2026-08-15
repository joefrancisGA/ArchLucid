#!/usr/bin/env python3
"""Fix sponsor-report -> sponsor-report where sponsor-report was word-boundary mangled."""

from __future__ import annotations

import os
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SKIP_DIR_NAMES = {".git", "node_modules", ".next", "bin", "obj", "dist", ".cache", ".cursor"}

REPLACEMENTS = [
    ("sponsor-report", "sponsor-report"),
    ("Sponsor report", "Sponsor report"),
    ("Sponsor report", "sponsor report"),
    ("Sponsor report", "Sponsor Report"),
    ("SponsorRoi", "SponsorRoi"),
    ("ISponsorRoi", "ISponsorRoi"),
    ("SponsorRoi", "sponsorRoi"),
    ("EXECUTIVE_ROI", "SPONSOR_ROI"),
    ("SponsorReview", "SponsorReview"),
    ("ISponsorReview", "ISponsorReview"),
    ("sponsor-review", "sponsor-review"),
    ("ExecutiveReports", "SponsorReports"),
    ("IExecutiveReports", "ISponsorReports"),
    ("SponsorReport", "SponsorReport"),
    ("ISponsorReport", "ISponsorReport"),
    ("sponsor-report", "sponsor-report"),
    ("sponsor-dashboard", "sponsor-dashboard"),
    ("sponsor", "Sponsor"),
    ("sponsor", "SPONSOR"),
]

EXECUTIVE_WORD_RE = re.compile(r"\bexecutive\b", re.IGNORECASE)


def transform(content: str) -> str:
    updated = content
    for old, new in REPLACEMENTS:
        updated = updated.replace(old, new)

    def replace_word(match: re.Match[str]) -> str:
        token = match.group(0)
        if token.isupper():
            return "SPONSOR"
        if token[0].isupper():
            return "Sponsor"
        return "sponsor"

    return EXECUTIVE_WORD_RE.sub(replace_word, updated)


def main() -> None:
    changed = 0
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES]
        for filename in filenames:
            path = Path(dirpath) / filename
            if path.suffix.lower() in {".png", ".jpg", ".dll", ".exe", ".woff", ".woff2"}:
                continue
            try:
                original = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            updated = transform(original)
            if updated != original:
                path.write_text(updated, encoding="utf-8", newline="\n")
                changed += 1
    print(f"Fixed {changed} files")


if __name__ == "__main__":
    main()

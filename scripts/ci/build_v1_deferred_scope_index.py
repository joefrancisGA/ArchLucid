#!/usr/bin/env python3
"""Emit machine-readable deferred-scope index from V1_DEFERRED.md headings."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE = REPO_ROOT / "docs" / "library" / "V1_DEFERRED.md"
OUT_PATH = REPO_ROOT / "docs" / "library" / "V1_DEFERRED_SCOPE_INDEX.json"


def parse_deferred_entries(text: str) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    current_title = ""
    current_lines: list[str] = []

    for line in text.splitlines():
        if line.startswith("## "):
            if current_title:
                entries.append(
                    {
                        "title": current_title,
                        "summary": " ".join(current_lines).strip()[:280],
                    },
                )

            current_title = line.removeprefix("## ").strip()
            current_lines = []
            continue

        if current_title and line.strip():
            current_lines.append(line.strip())

    if current_title:
        entries.append(
            {
                "title": current_title,
                "summary": " ".join(current_lines).strip()[:280],
            },
        )

    return entries


def main() -> int:
    if not SOURCE.is_file():
        print(f"deferred scope index: missing {SOURCE}")
        return 1

    text = SOURCE.read_text(encoding="utf-8")
    entries = parse_deferred_entries(text)

    payload = {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "source": "docs/library/V1_DEFERRED.md",
        "entryCount": len(entries),
        "entries": entries,
        "note": "Deferred items are (B)/V1.1+ — not V1 headline blockers per assessment scope.",
    }

    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"deferred scope index: {len(entries)} entries -> {OUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

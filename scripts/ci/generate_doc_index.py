#!/usr/bin/env python3
"""Regenerate archlucid-ui/public/doc-index.json with in-app /help routes."""

from __future__ import annotations

import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_TS = REPO_ROOT / "archlucid-ui/src/lib/product-documentation-registry.ts"
IN_APP_MAP_TS = REPO_ROOT / "archlucid-ui/src/lib/in-app-doc-href.ts"
DOC_INDEX = REPO_ROOT / "archlucid-ui/public/doc-index.json"

SLUG_BLOCK = re.compile(
    r'slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?summary:\s*"([^"]+)"[\s\S]*?audience:\s*"([^"]+)"',
    re.M,
)
PATH_ALIAS = re.compile(r'"([^"]+\.md)":\s*"([^"]+)"')


def _parse_registry() -> list[dict[str, str]]:
    text = REGISTRY_TS.read_text(encoding="utf-8")
    entries: list[dict[str, str]] = []

    for match in SLUG_BLOCK.finditer(text):
        slug, title, summary, audience = match.groups()
        category = {
            "operator": "Operations",
            "buyer": "Go-to-market",
            "marketing": "Go-to-market",
            "developer": "Operations",
        }.get(audience, "Operations")

        entries.append(
            {
                "title": title,
                "summary": summary,
                "category": category,
                "url": f"/help/{slug}",
            }
        )

    return entries


def _parse_aliases() -> dict[str, str]:
    text = IN_APP_MAP_TS.read_text(encoding="utf-8")
    block_match = re.search(r"DOC_PATH_TO_SLUG:[\s\S]*?=\s*\{([\s\S]*?)\};", text)

    if block_match is None:
        return {}

    return {k.lower(): v for k, v in PATH_ALIAS.findall(block_match.group(1))}


def _legacy_rows() -> list[dict[str, str]]:
    if not DOC_INDEX.is_file():
        return []

    return json.loads(DOC_INDEX.read_text(encoding="utf-8"))


def main() -> None:
    registry_rows = _parse_registry()
    aliases = _parse_aliases()
    seen_titles = {row["title"].lower() for row in registry_rows}
    merged = list(registry_rows)

    for row in _legacy_rows():
        title_key = row["title"].lower()

        if title_key in seen_titles:
            continue

        url = row.get("url", "")

        if "github.com" in url:
            if "/blob/" in url:
                path_part = url.split("/blob/", 1)[-1]
            elif "/tree/" in url:
                path_part = url.split("/tree/", 1)[-1]
            else:
                path_part = ""

            slug = aliases.get(path_part.lower()) if path_part else None

            if slug:
                row = {**row, "url": f"/help/{slug}"}
            else:
                row = {**row, "url": "/help"}

        merged.append(row)
        seen_titles.add(title_key)

    merged.sort(key=lambda r: (r.get("category", ""), r.get("title", "")))
    DOC_INDEX.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(merged)} entries -> {DOC_INDEX.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()

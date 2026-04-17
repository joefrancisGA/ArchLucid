#!/usr/bin/env python3
"""
Emit archlucid-ui/public/pricing.json from docs/go-to-market/PRICING_PHILOSOPHY.md.

Fails if the ```locked-prices fenced block is missing or contains invalid JSON.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def extract_locked_prices_json(doc: str) -> str:
    """Prefer a line-start fence so inline prose cannot accidentally embed the token."""
    marker = "\n```locked-prices\n"
    start = doc.find(marker)

    if start < 0:
        raise ValueError("Missing line-start ```locked-prices fenced block in PRICING_PHILOSOPHY.md")

    body_start = start + len(marker)
    end = doc.find("\n```", body_start)

    if end < 0:
        raise ValueError("Unclosed locked-prices fence.")

    return doc[body_start:end].strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="Repository root (parent of archlucid-ui/).",
    )
    args = parser.parse_args()
    repo: Path = args.repo_root
    md_path = repo / "docs" / "go-to-market" / "PRICING_PHILOSOPHY.md"
    out_path = repo / "archlucid-ui" / "public" / "pricing.json"

    if not md_path.is_file():
        print(f"ERROR: {md_path} not found", file=sys.stderr)
        return 2

    raw = md_path.read_text(encoding="utf-8")

    try:
        json_text = extract_locked_prices_json(raw)
    except ValueError as ex:
        print(f"ERROR: {ex}", file=sys.stderr)
        return 1

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as ex:
        print(f"ERROR: invalid JSON in locked-prices block: {ex}", file=sys.stderr)
        return 1

    if not isinstance(data, dict) or data.get("schemaVersion") != 1:
        print("ERROR: pricing JSON must be an object with schemaVersion: 1", file=sys.stderr)
        return 1

    if "packages" not in data or not isinstance(data["packages"], list) or len(data["packages"]) < 1:
        print("ERROR: pricing JSON must include a non-empty packages array", file=sys.stderr)
        return 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

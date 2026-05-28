#!/usr/bin/env python3
"""
Validate docs/go-to-market/QUOTE_TO_PROOF_PACKET.md structure and link hygiene.

Run from repo root: python scripts/ci/check_quote_to_proof_packet.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
PRICE_LIKE = re.compile(r"\$\s?\d{2,}(?:\.\d{2})?|\bUSD\s?\d")

REQUIRED_HEADINGS = (
    "# Quote-to-proof packet",
    "## Packet checklist (first proof → quote)",
    "## Annual order readiness vs deferred scope",
)

REQUIRED_LINK_TARGETS = (
    "COMMERCIAL_CONVERSION_CHECKLIST.md",
    "ORDER_FORM_TEMPLATE.md",
    "PRICING_PHILOSOPHY.md",
    "PILOT_SUCCESS_SCORECARD.md",
    "FIRST_PILOT_EVIDENCE_BUNDLE.md",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_link(root: Path, href: str) -> Path | None:
    if href.startswith("http://") or href.startswith("https://") or href.startswith("#"):
        return None

    base = root / "docs" / "go-to-market"
    target = (base / href).resolve()

    if target.is_file():
        return target

    return None


def main() -> int:
    root = repo_root()
    doc_path = root / "docs" / "go-to-market" / "QUOTE_TO_PROOF_PACKET.md"

    if not doc_path.is_file():
        print(f"error: missing {doc_path}", file=sys.stderr)
        return 1

    text = doc_path.read_text(encoding="utf-8")
    errors: list[str] = []

    for heading in REQUIRED_HEADINGS:
        if heading not in text:
            errors.append(f"missing heading: {heading}")

    for target in REQUIRED_LINK_TARGETS:
        if target not in text:
            errors.append(f"missing required link target mention: {target}")

    for match in LINK_RE.finditer(text):
        href = match.group(1)
        if href.startswith("http") or href.startswith("#"):
            continue

        resolved = resolve_link(root, href)
        if resolved is None:
            errors.append(f"broken link: {href}")

    for match in PRICE_LIKE.finditer(text):
        errors.append(f"price literal not allowed in packet index: {match.group(0)}")

    if errors:
        print("check_quote_to_proof_packet: FAILED", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print("check_quote_to_proof_packet: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

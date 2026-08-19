#!/usr/bin/env python3
"""Guard WhyArchLucid pack builder banner text is documented as demo-only (TB-273 / BDA-023)."""

from __future__ import annotations

import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PACK_BUILDER = REPO_ROOT / "ArchLucid.Application" / "Pilots" / "WhyArchLucidPackBuilder.cs"
BANNER_FRAGMENT = "demo tenant — replace before publishing"
REQUIRED_NEARBY_COMMENT = "DemoOnly"


def main() -> int:
    if not PACK_BUILDER.is_file():
        print(f"Missing {PACK_BUILDER}", file=sys.stderr)
        return 2

    text = PACK_BUILDER.read_text(encoding="utf-8")

    if BANNER_FRAGMENT not in text:
        print("OK: WhyArchLucid pack demo banner removed or rewritten.")
        return 0

    if REQUIRED_NEARBY_COMMENT not in text and "buyer-safe" not in text.lower():
        print(
            "WhyArchLucidPackBuilder still emits demo banner without DemoOnly/buyer-safe documentation.",
            file=sys.stderr,
        )
        return 1

    print("OK: WhyArchLucid pack demo banner is documented as demo-only (BDA-023).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

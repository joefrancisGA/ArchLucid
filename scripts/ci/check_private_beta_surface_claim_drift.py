#!/usr/bin/env python3
"""Check final landing/showcase route inventory for buyer-facing claim drift."""

from __future__ import annotations

import argparse
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ROUTE_INVENTORY = {
    "/showcase/customer-intake-modernization": (
        Path("docs/go-to-market/DEMO_QUICKSTART.md"),
        Path("docs/go-to-market/SCENARIO_FRAMING_VARIANTS.md"),
    ),
    "/showcase/claims-intake-modernization": (
        Path("docs/go-to-market/DEMO_QUICKSTART.md"),
        Path("docs/go-to-market/SHOWCASE_SCREENSHOT_CAPTURE_CHECKLIST.md"),
    ),
    "/see-it": (
        Path("docs/go-to-market/DEMO_QUICKSTART.md"),
        Path("docs/go-to-market/SEO_AND_PAID_ACQUISITION.md"),
    ),
}


def collect_violations(root: Path) -> list[str]:
    violations: list[str] = []

    for route, documents in ROUTE_INVENTORY.items():
        missing_documents = [
            str(document)
            for document in documents
            if not (root / document).is_file() or route not in (root / document).read_text(encoding="utf-8")
        ]

        if missing_documents:
            violations.append(f"{route}: missing from {', '.join(missing_documents)}")

    demo_quickstart_path = root / "docs/go-to-market/DEMO_QUICKSTART.md"
    demo_quickstart = demo_quickstart_path.read_text(encoding="utf-8") if demo_quickstart_path.is_file() else ""

    if "/demo/preview" in demo_quickstart and "secondary Product Tour surface" not in demo_quickstart:
        violations.append("/demo/preview appears without its documented secondary-surface boundary")

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=REPO_ROOT)
    args = parser.parse_args()
    violations = collect_violations(args.root.resolve())

    if violations:
        for violation in violations:
            print(f"ERROR: {violation}")

        return 1

    print("Private-beta landing/showcase claim inventory: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

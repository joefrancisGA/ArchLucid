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


def _safe_read_markdown(root: Path, relative: Path, issues: list[str]) -> str | None:
    path = root / relative
    if path.is_symlink():
        issues.append(f"{relative}: symlinked claim source is not trusted")
        return None
    if not path.is_file():
        issues.append(f"{relative}: claim source is missing")
        return None
    try:
        return path.read_text(encoding="utf-8", errors="strict")
    except (OSError, UnicodeError) as exc:
        issues.append(f"{relative}: claim source unreadable ({type(exc).__name__})")
        return None


def collect_violations(root: Path) -> list[str]:
    violations: list[str] = []

    sources: dict[Path, str | None] = {}
    for documents in ROUTE_INVENTORY.values():
        for document in documents:
            if document not in sources:
                sources[document] = _safe_read_markdown(root, document, violations)

    for route, documents in ROUTE_INVENTORY.items():
        missing_documents = [str(document) for document in documents if route not in (sources[document] or "")]
        if missing_documents:
            violations.append(f"{route}: missing from {', '.join(missing_documents)}")

    demo_quickstart_path = Path("docs/go-to-market/DEMO_QUICKSTART.md")
    demo_quickstart = sources.get(demo_quickstart_path) or ""

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

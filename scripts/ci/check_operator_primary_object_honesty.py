#!/usr/bin/env python3
"""TB-1027 / M-176: Anti-finding-as-primary / dual-product-create-review honesty CI.

Fails dishonest stubs that:
- Treat findings or decisions as the hireable unit of truth without package parent.
- Pitch create and review as two equal products without TB-1026 verb framing.
- Omit TB-1026 anchors near buyer primary-workflow / day-one manage language.

Contract: docs/library/OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md (TB-1026 / TB-1027).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "operator-primary-object-honesty: allow"

CONTRACT_REL = Path("docs/library/OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/PRODUCT_DATASHEET.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/COMPETITIVE_POSITIONING.md"),
    Path("docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/COMPETITIVE_LANDSCAPE.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
)

UI_SCAN_FILES: tuple[Path, ...] = (
    Path("archlucid-ui/src/lib/operator/operator-home-page-copy.ts"),
    Path("archlucid-ui/src/lib/why-archlucid-page-copy.ts"),
    Path("archlucid-ui/src/lib/vocabulary/signed-records-review-detail-vocabulary.ts"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1026**",
    "**TB-1027**",
    "check_operator_primary_object_honesty.py",
    "architecture package",
    "/reviews",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "operator-primary-object-nav-collapse-m-177",
    "TB-1027",
    "hireable unit is the **architecture package**",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    (
        "findings are the hireable unit of truth",
        "Findings must not be sold as the hireable unit of truth (M-176 / TB-1027).",
    ),
    (
        "findings are the hireable unit",
        "Findings must not be sold as the hireable unit (M-176 / TB-1027).",
    ),
    (
        "decisions are the hireable unit of truth",
        "Decisions must not be sold as the hireable unit of truth (M-176 / TB-1027).",
    ),
    (
        "decisions are the hireable unit",
        "Decisions must not be sold as the hireable unit (M-176 / TB-1027).",
    ),
    (
        "findings or decisions are the hireable unit",
        "Findings/decisions must not be sold as the hireable unit (M-176 / TB-1027).",
    ),
    (
        "create and review are two equal products",
        "Create and review must not be pitched as two equal products (M-176 / TB-1027).",
    ),
    (
        "create and review are two products",
        "Create and review must not be pitched as two products (M-176 / TB-1027).",
    ),
    (
        "findings are the product",
        "Findings must not be sold as the primary product noun (M-176 / TB-1027).",
    ),
    (
        "finding is the product",
        "A finding must not be sold as the primary product noun (M-176 / TB-1027).",
    ),
    (
        "decision is the signed package",
        "A decision/approval must not be sold as the signed architecture package (M-176 / TB-1027).",
    ),
    (
        "approval is the signed package",
        "An approval must not be sold as the signed architecture package (M-176 / TB-1027).",
    ),
)

PRIMARY_CLAIM_MARKERS: tuple[str, ...] = (
    "primary workflow",
    "what operators manage day one",
    "day-one workflow",
)

TB_1026_ANCHOR_MARKERS: tuple[str, ...] = (
    "tb-1026",
    "operator_primary_object_nav_collapse_contract",
    "operator-primary-object-nav-collapse",
    "architecture package",
    "ui_glossary_v1",
    "package spine",
    "/reviews",
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "not pitch",
    "not two equal",
    "forbidden",
    "review finding",
    "anti-pattern",
    "too strong",
    "collapse",
    "children",
    "m-176",
    "m-177",
    "tb-1026",
    "tb-1027",
    "operator-primary-object-honesty: allow",
    '"findings',
    "“findings",
    "| ",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing operator primary-object contract (TB-1026)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1027)."
        )
    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    if not path.is_file():
        return [f"{path.as_posix()}: missing buyer procurement packet (TB-1027)."]
    text = path.read_text(encoding="utf-8", errors="replace").lower()
    return [
        f"{path.relative_to(root).as_posix()}: missing procurement anchor {marker!r} (TB-1027)."
        for marker in REQUIRED_PROCUREMENT_ANCHORS
        if marker.lower() not in text
    ]


def _line_has_negation(line_lower: str, phrase: str) -> bool:
    idx = line_lower.find(phrase)
    if idx < 0:
        return False
    prefix = line_lower[:idx]
    return any(marker in prefix for marker in NEGATION_MARKERS)


def scan_text_file(root: Path, rel: Path) -> list[str]:
    path = root / rel if not rel.is_absolute() else rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing operator primary-object honesty scan target."]
    text = path.read_text(encoding="utf-8", errors="replace")
    display = path.relative_to(root).as_posix() if path.is_relative_to(root) else str(rel)
    violations: list[str] = []

    for line_no, line in enumerate(text.splitlines(), start=1):
        if ALLOWLIST_MARKER in line.lower():
            continue
        line_lower = line.lower()
        for phrase, message in FORBIDDEN_PHRASES:
            if phrase not in line_lower:
                continue
            if _line_has_negation(line_lower, phrase):
                continue
            violations.append(f"{display}:{line_no}: {message} Matched `{phrase}`.")

        if any(marker in line_lower for marker in PRIMARY_CLAIM_MARKERS):
            if not any(anchor in line_lower for anchor in TB_1026_ANCHOR_MARKERS):
                violations.append(
                    f"{display}:{line_no}: buyer primary-workflow language without TB-1026 package anchor (TB-1027)."
                )

    return violations


def operator_primary_object_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_text_file(root, rel))
    for rel in UI_SCAN_FILES:
        violations.extend(scan_text_file(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = operator_primary_object_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"operator primary object honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("operator primary object honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

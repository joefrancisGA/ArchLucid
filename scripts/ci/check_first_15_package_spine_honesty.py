#!/usr/bin/env python3
"""TB-1031 / M-180: Anti-15-min-product-led-without-spine honesty CI.

Fails dishonest stubs that:
- Claim 15-minute / product-led / no-SE paths without TB-1030 package-spine caveats.
- Treat absent M-44 cohort results as proof the expert path is product-led.
- Omit TB-1030 anchors near buyer first-15 / unaided-export language.

Contract: docs/library/PA_FIRST_15_PACKAGE_SPINE_IA_CONTRACT.md (TB-1030 / TB-1031).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "first-15-package-spine-honesty: allow"

CONTRACT_REL = Path("docs/library/PA_FIRST_15_PACKAGE_SPINE_IA_CONTRACT.md")

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
    Path("docs/library/CANONICAL_FIRST_RUN_PATH.md"),
    Path("docs/library/FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md"),
)

UI_SCAN_FILES: tuple[Path, ...] = (
    Path("archlucid-ui/src/components/marketing/welcome-marketing-copy.ts"),
    Path("archlucid-ui/src/lib/cloud-neutral-primary-copy.ts"),
)

SKIP_DOC_SUFFIXES: tuple[str, ...] = (
    "help-index.generated.ts",
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1030**",
    "**TB-1031**",
    "check_first_15_package_spine_honesty.py",
    "minute-12",
    "/reviews/{runId}",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "pa-first-15-package-spine-ia-m-181",
    "TB-1031",
    "minute-12 checkpoint",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    (
        "15 minutes without founder narration",
        "15-minute path must not be sold without package-spine caveats (M-180 / TB-1031).",
    ),
    (
        "15 minutes without narration",
        "15-minute path must not be sold without package-spine caveats (M-180 / TB-1031).",
    ),
    (
        "product-led first value",
        "Product-led first value must not be claimed without TB-1030 spine (M-180 / TB-1031).",
    ),
    (
        "no se required",
        "No-SE-required claims need M-44 cohort proof (M-180 / TB-1031).",
    ),
    (
        "no founder needed",
        "No-founder-needed claims need M-44 cohort proof (M-180 / TB-1031).",
    ),
    (
        "without founder narration guaranteed",
        "Founder-narration-free path is not guaranteed without cohort proof (M-180 / TB-1031).",
    ),
    (
        "won't dismiss without cohort",
        "Dismissal claims require M-44 cohort evidence (M-180 / TB-1031).",
    ),
    (
        "will not dismiss without cohort",
        "Dismissal claims require M-44 cohort evidence (M-180 / TB-1031).",
    ),
    (
        "m-44 cohort proves",
        "M-44 cohort absence must not be treated as product-led proof (M-180 / TB-1031).",
    ),
    (
        "cohort proves product-led",
        "Absent M-44 must not be treated as product-led proof (M-180 / TB-1031).",
    ),
)

PRIMARY_CLAIM_MARKERS: tuple[str, ...] = (
    "decision signal in one sitting",
    "unaided sponsor export",
    "product-led first",
)

TB_1030_ANCHOR_MARKERS: tuple[str, ...] = (
    "tb-1030",
    "pa_first_15_package_spine",
    "pa-first-15-package-spine",
    "minute-12",
    "package spine",
    "finalize + sponsor export",
    "finalize and sponsor export",
    "committed architecture package",
    "sponsor export",
    "/reviews/{runid}",
    "m-44",
    "canonical_first_run_path",
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "claim product-led",
    "as proven",
    "not treat",
    "not prove",
    "forbidden",
    "review finding",
    "anti-pattern",
    "too strong",
    "without package spine",
    "without minute-12",
    "m-180",
    "m-181",
    "tb-1030",
    "tb-1031",
    "first-15-package-spine-honesty: allow",
    '"15 minutes',
    "“15 minutes",
    "must complete",
    "| ",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing PA first-15 package-spine contract (TB-1030)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1031)."
        )
    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    if not path.is_file():
        return [f"{path.as_posix()}: missing buyer procurement packet (TB-1031)."]
    text = path.read_text(encoding="utf-8", errors="replace").lower()
    return [
        f"{path.relative_to(root).as_posix()}: missing procurement anchor {marker!r} (TB-1031)."
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
        return [f"{rel.as_posix()}: missing first-15 package-spine honesty scan target."]
    if any(path.name.endswith(suffix) for suffix in SKIP_DOC_SUFFIXES):
        return []

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
            if not any(anchor in line_lower for anchor in TB_1030_ANCHOR_MARKERS):
                violations.append(
                    f"{display}:{line_no}: buyer first-15 language without TB-1030 package-spine anchor (TB-1031)."
                )

    return violations


def first_15_package_spine_honesty_violations(root: Path) -> list[str]:
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
    violations = first_15_package_spine_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"first-15 package-spine honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("first-15 package-spine honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

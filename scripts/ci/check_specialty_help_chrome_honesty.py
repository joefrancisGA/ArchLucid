#!/usr/bin/env python3
"""TB-1415 / M-251: Anti-bare-HelpTopicMarkdownView / ungated-technical-doc honesty CI.

Fails dishonest stubs that:
- Claim all `/help/*` product surfaces have specialty chrome / Start CTAs while the ≤~50
  inventory still falls through bare `HelpTopicMarkdownView`.
- Claim **TB-735** gates all technical help while `contentKind: technical-documentation`
  remains ungated in product search.
- Drop open ≤~50 inventory rows without closing the owning TB cluster.

Contract: docs/library/SPECIALTY_HELP_CHROME_CONTRACT.md (TB-1414 / TB-1415).
Inventory SoT: archlucid-ui/src/lib/specialty-help-chrome-below-50-inventory.ts
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "specialty-help-chrome-honesty: allow"

CONTRACT_REL = Path("docs/library/SPECIALTY_HELP_CHROME_CONTRACT.md")

INVENTORY_REL = Path("archlucid-ui/src/lib/specialty-help-chrome-below-50-inventory.ts")

DRIFT_GUARD_REL = Path("archlucid-ui/src/lib/specialty-help-chrome-honesty-surfaces.ts")

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

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1414**",
    "**TB-1415**",
    "check_specialty_help_chrome_honesty.py",
    "HelpTopicMarkdownView",
    "technical-documentation",
    "M-251",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "owner-screenshot-below-50-specialty-help-chrome-m-252",
    "tb-1415",
    "m-251",
    "specialty-guided",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    (
        "all help is specialty-guided",
        "All help must not be sold as specialty-guided while ≤~50 inventory remains open (M-251 / TB-1415).",
    ),
    (
        "every help route has specialty chrome",
        "Every help route must not be sold as specialty-chrome complete (M-251 / TB-1415).",
    ),
    (
        "all /help routes are specialty-guided",
        "All /help routes must not be sold as specialty-guided (M-251 / TB-1415).",
    ),
    (
        "product help is specialty-guided",
        "Product help must not be sold as fully specialty-guided (M-251 / TB-1415).",
    ),
    (
        "start-cta ready across all help",
        "Start-CTA readiness must not be claimed across all help (M-251 / TB-1415).",
    ),
    (
        "tb-735 gates all technical help",
        "TB-735 must not be sold as gating all technical help (M-251 / TB-1415).",
    ),
    (
        "all technical help is admin-gated",
        "All technical help must not be sold as admin-gated while ungated slugs remain (M-251 / TB-1415).",
    ),
    (
        "every technical-documentation slug is admin-gated",
        "Every technical-documentation slug must not be sold as admin-gated (M-251 / TB-1415).",
    ),
    (
        "all technical-documentation is gated",
        "All technical-documentation must not be sold as gated (M-251 / TB-1415).",
    ),
)

PRIMARY_CLAIM_MARKERS: tuple[str, ...] = (
    "specialty-guided help",
    "specialty chrome is done",
    "all technical help",
)

TB_1414_ANCHOR_MARKERS: tuple[str, ...] = (
    "tb-1414",
    "tb-1415",
    "tb-735",
    "m-251",
    "m-252",
    "specialty_help_chrome",
    "specialty-help-chrome",
    "below-50",
    "≤~50",
    "help topic markdownview",
    "technical-documentation",
    "do not claim",
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not claim",
    "not promise",
    "not cover",
    "forbidden",
    "anti-pattern",
    "too strong",
    "confirm claims",
    "claims of",
    "m-251",
    "tb-1414",
    "tb-1415",
    "tb-735",
    ALLOWLIST_MARKER,
    "| ",
    '"all help',
    "“all help",
    '"specialty-guided',
    "“specialty-guided",
)

INVENTORY_SLUG_RE = re.compile(r'slug:\s*"([^"]+)"')
INVENTORY_CLUSTER_DONE_RE = re.compile(r"clusterDone:\s*(true|false)")
DRIFT_GUARD_SLUG_RE = re.compile(r'"([a-z0-9-]+)"')


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing specialty help chrome contract (TB-1414)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1415)."
        )
    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    if not path.is_file():
        return [f"{path.as_posix()}: missing buyer procurement packet (TB-1415)."]
    text = path.read_text(encoding="utf-8", errors="replace").lower()
    return [
        f"{path.relative_to(root).as_posix()}: missing procurement anchor {marker!r} (TB-1415)."
        for marker in REQUIRED_PROCUREMENT_ANCHORS
        if marker.lower() not in text
    ]


def inventory_drift_violations(root: Path) -> list[str]:
    inventory_path = root / INVENTORY_REL
    drift_path = root / DRIFT_GUARD_REL
    violations: list[str] = []

    if not inventory_path.is_file():
        return [f"{INVENTORY_REL.as_posix()}: missing ≤~50 inventory (TB-1415)."]

    if not drift_path.is_file():
        return [f"{DRIFT_GUARD_REL.as_posix()}: missing drift guard surfaces (TB-1415)."]

    inventory_text = inventory_path.read_text(encoding="utf-8", errors="replace")
    drift_text = drift_path.read_text(encoding="utf-8", errors="replace")

    inventory_slugs = INVENTORY_SLUG_RE.findall(inventory_text)
    cluster_done_flags = INVENTORY_CLUSTER_DONE_RE.findall(inventory_text)

    if len(inventory_slugs) != len(cluster_done_flags):
        violations.append(
            f"{INVENTORY_REL.as_posix()}: slug/clusterDone row count mismatch (TB-1415)."
        )
        return violations

    inventory_by_slug = {
        slug: flag == "true" for slug, flag in zip(inventory_slugs, cluster_done_flags, strict=True)
    }

    drift_guard_match = re.search(
        r"SPECIALTY_HELP_CHROME_INVENTORY_DRIFT_GUARD_SLUGS.*?=\s*\[(.*?)\]\s*as const",
        drift_text,
        re.DOTALL,
    )
    if drift_guard_match is None:
        violations.append(
            f"{DRIFT_GUARD_REL.as_posix()}: missing SPECIALTY_HELP_CHROME_INVENTORY_DRIFT_GUARD_SLUGS (TB-1415)."
        )
        return violations

    drift_guard_slugs = DRIFT_GUARD_SLUG_RE.findall(drift_guard_match.group(1))
    drift_guard_set = set(drift_guard_slugs)

    for slug in drift_guard_slugs:
        if slug not in inventory_by_slug:
            violations.append(
                f"{DRIFT_GUARD_REL.as_posix()}: drift guard slug {slug!r} missing from inventory (TB-1415)."
            )

    for slug, cluster_done in inventory_by_slug.items():
        if cluster_done and slug in drift_guard_set:
            violations.append(
                f"{INVENTORY_REL.as_posix()}: done slug {slug!r} must leave drift guard (TB-1415)."
            )
        if not cluster_done and slug not in drift_guard_set:
            violations.append(
                f"{INVENTORY_REL.as_posix()}: open slug {slug!r} must stay on drift guard (TB-1415)."
            )

    return violations


def _line_has_negation(line_lower: str, phrase: str) -> bool:
    idx = line_lower.find(phrase)
    if idx < 0:
        return False
    prefix = line_lower[:idx]
    return any(marker in prefix for marker in NEGATION_MARKERS)


def scan_text_file(root: Path, rel: Path) -> list[str]:
    path = root / rel if not rel.is_absolute() else rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing specialty help chrome honesty scan target."]
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

        for marker in PRIMARY_CLAIM_MARKERS:
            if marker not in line_lower:
                continue
            if _line_has_negation(line_lower, marker):
                continue
            if not any(anchor in line_lower for anchor in TB_1414_ANCHOR_MARKERS):
                violations.append(
                    f"{display}:{line_no}: specialty help chrome language without TB-1414 anchor (TB-1415)."
                )
                break

    return violations


def specialty_help_chrome_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))
    violations.extend(inventory_drift_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_text_file(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = specialty_help_chrome_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"specialty help chrome honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("specialty help chrome honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

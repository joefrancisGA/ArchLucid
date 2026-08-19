#!/usr/bin/env python3
"""TB-1033 / M-182: Anti-replicas-fix-AOAI / launch-load-proven honesty CI.

Fails dishonest stubs that:
- Claim API scale-out removes AOAI 429/TPM limits.
- Claim launch load is proven while G-SCALE-02 drill evidence is pending.
- Imply worker/outbox lag loses committed packages or is first sync admit failure.

Contract: docs/library/LAUNCH_LOAD_FAILURE_ORDER_DEGRADATION_CONTRACT.md (TB-1032 / TB-1033).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "launch-load-failure-order-honesty: allow"

CONTRACT_REL = Path("docs/library/LAUNCH_LOAD_FAILURE_ORDER_DEGRADATION_CONTRACT.md")

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
    Path("docs/library/CAPACITY_AND_COST_PLAYBOOK.md"),
    Path("docs/library/DEGRADED_MODE.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1032**",
    "**TB-1033**",
    "check_launch_load_failure_order_honesty.py",
    "AOAI",
    "HTTP",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "launch-load-failure-order-m-183",
    "TB-1033",
    "g-scale-02",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    (
        "scale-out removes aoai 429",
        "API scale-out must not be sold as removing AOAI 429 (M-182 / TB-1033).",
    ),
    (
        "scale-out removes 429",
        "API scale-out must not be sold as removing AOAI 429 (M-182 / TB-1033).",
    ),
    (
        "scale-out removes tpm",
        "API scale-out must not be sold as removing AOAI TPM (M-182 / TB-1033).",
    ),
    (
        "more replicas = more tpm",
        "More API replicas must not be sold as more AOAI TPM (M-182 / TB-1033).",
    ),
    (
        "more replicas means more tpm",
        "More API replicas must not be sold as more AOAI TPM (M-182 / TB-1033).",
    ),
    (
        "launch load is proven",
        "Launch load is not proven without G-SCALE-02 drill evidence (M-182 / TB-1033).",
    ),
    (
        "launch load proven",
        "Launch load is not proven without G-SCALE-02 drill evidence (M-182 / TB-1033).",
    ),
    (
        "launch load validated",
        "Launch load is not validated without G-SCALE-02 drill evidence (M-182 / TB-1033).",
    ),
    (
        "committed package lost when worker",
        "Worker lag must not be sold as losing committed packages (M-182 / TB-1033).",
    ),
    (
        "committed package lost when worker backs up",
        "Worker lag must not be sold as losing committed packages (M-182 / TB-1033).",
    ),
)

PRIMARY_CLAIM_MARKERS: tuple[str, ...] = (
    "launch load",
    "linkedin burst",
    "aoai ceiling",
    "marketing burst",
)

TB_1032_ANCHOR_MARKERS: tuple[str, ...] = (
    "tb-1032",
    "launch_load_failure_order",
    "launch-load-failure-order",
    "http-first",
    "http scale",
    "aoai tpm",
    "g-scale-02",
    "g-scale-01",
    "degraded_mode",
    "tb-947",
    "tb-1011",
    "finalize",
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "not sell",
    "not prove",
    "not substitute",
    "not mean",
    "forbidden",
    "review finding",
    "anti-pattern",
    "too strong",
    "treat ",
    "without g-scale-02",
    "drill pending",
    "m-182",
    "m-183",
    "tb-1032",
    "tb-1033",
    "launch-load-failure-order-honesty: allow",
    '"scale-out',
    "“scale-out",
    "| ",
    "≠",
    "â‰ ",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing launch-load failure-order contract (TB-1032)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1033)."
        )
    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    if not path.is_file():
        return [f"{path.as_posix()}: missing buyer procurement packet (TB-1033)."]
    text = path.read_text(encoding="utf-8", errors="replace").lower()
    return [
        f"{path.relative_to(root).as_posix()}: missing procurement anchor {marker!r} (TB-1033)."
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
        return [f"{rel.as_posix()}: missing launch-load failure-order honesty scan target."]
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
            if not any(anchor in line_lower for anchor in TB_1032_ANCHOR_MARKERS):
                violations.append(
                    f"{display}:{line_no}: buyer launch-load language without TB-1032 failure-order anchor (TB-1033)."
                )

    return violations


def launch_load_failure_order_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_text_file(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = launch_load_failure_order_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"launch-load failure-order honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("launch-load failure-order honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""TB-1035 / M-184: Anti-dual-default-run-lifecycle / result-as-finalize honesty CI.

Fails dishonest stubs that:
- Teach create→execute→commit as the default peer lifecycle to Authority.
- Claim dual coordinator storage still ships.
- Imply POST /result finalizes or commits Authority packages.

Contract: docs/library/STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md (TB-1034 / TB-1035).
Complements TB-1008 (always-execute) without duplicating that full suite.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "strangler-next-slice-honesty: allow"

CONTRACT_REL = Path("docs/library/STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md")

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
    Path("docs/library/ARCHITECTURE_FLOWS.md"),
    Path("docs/library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1034**",
    "**TB-1035**",
    "check_strangler_next_slice_honesty.py",
    "Authority",
    "/result",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "strangler-next-slice-result-sunset-m-185",
    "TB-1035",
    "authority product-default",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    (
        "create→execute→commit is the default peer lifecycle",
        "Create→execute→commit must not be sold as default peer lifecycle (M-184 / TB-1035).",
    ),
    (
        "create-execute-commit is the default peer lifecycle",
        "Create→execute→commit must not be sold as default peer lifecycle (M-184 / TB-1035).",
    ),
    (
        "dual coordinator storage still ships",
        "Dual coordinator storage is retired — do not claim it still ships (M-184 / TB-1035).",
    ),
    (
        "dual coordinator storage still live",
        "Dual coordinator storage is retired — do not claim it is still live (M-184 / TB-1035).",
    ),
    (
        "/result finalizes or commits",
        "POST /result must not be sold as finalizing/committing Authority packages (M-184 / TB-1035).",
    ),
    (
        "/result finalizes and commits",
        "POST /result must not be sold as finalizing/committing Authority packages (M-184 / TB-1035).",
    ),
    (
        "post …/result finalizes",
        "POST /result must not be sold as finalizing Authority packages (M-184 / TB-1035).",
    ),
    (
        "post /result finalizes",
        "POST /result must not be sold as finalizing Authority packages (M-184 / TB-1035).",
    ),
    (
        "`result` finalizes/commits",
        "POST /result must not be sold as finalizing/committing Authority packages (M-184 / TB-1035).",
    ),
    (
        "legacy coordinator storage still ships",
        "Legacy coordinator storage must not be sold as still shipping (M-184 / TB-1035).",
    ),
)

PRIMARY_CLAIM_MARKERS: tuple[str, ...] = (
    "default peer lifecycle",
    "strangler next slice",
    "coordinator storage still",
)

TB_1034_ANCHOR_MARKERS: tuple[str, ...] = (
    "tb-1034",
    "tb-1035",
    "tb-1007",
    "tb-1008",
    "tb-919",
    "m-184",
    "m-185",
    "authority product-default",
    "agenttask",
    "extension loop",
    "adr 0066",
    "adr 0030",
    "adr 0042",
    "strangler_next_slice",
    "strangler-next-slice",
    "do not promise",
    "/result does not",
    "does not finalize",
    "does not commit",
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "not teach",
    "not sell",
    "not reopen",
    "forbidden",
    "review finding",
    "anti-pattern",
    "too strong",
    "treat ",
    "retired",
    "removed",
    "gone",
    "m-184",
    "m-185",
    "tb-1034",
    "tb-1035",
    "tb-1008",
    "strangler-next-slice-honesty: allow",
    '"create',
    "“create",
    "| ",
    "**forbid**",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [
            f"{CONTRACT_REL.as_posix()}: missing strangler next-slice contract (TB-1034)."
        ]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1035)."
        )
    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    if not path.is_file():
        return [f"{path.as_posix()}: missing buyer procurement packet (TB-1035)."]
    text = path.read_text(encoding="utf-8", errors="replace").lower()
    return [
        f"{path.relative_to(root).as_posix()}: missing procurement anchor {marker!r} (TB-1035)."
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
        return [f"{rel.as_posix()}: missing strangler next-slice honesty scan target."]
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

            if not any(anchor in line_lower for anchor in TB_1034_ANCHOR_MARKERS):
                violations.append(
                    f"{display}:{line_no}: buyer strangler/lifecycle language without TB-1034 anchor (TB-1035)."
                )
                break

    return violations


def strangler_next_slice_honesty_violations(root: Path) -> list[str]:
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
    violations = strangler_next_slice_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"strangler next-slice honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("strangler next-slice honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

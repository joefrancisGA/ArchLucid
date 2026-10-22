#!/usr/bin/env python3
"""TB-1025 / M-174: Anti-artifact-mode-equals-stable / live-UI-verify honesty CI.

Fails dishonest stubs that:
- Equate artifact-mode replay with architecture unchanged / no-drift proof.
- Claim live mutable UI side-by-side equals verify without TB-1024 caveats.
- Omit TB-1024 anchors near buyer drift/stable claim language.

Contract: docs/library/COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md (TB-1024 / TB-1025).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "comparison-replay-drift-honesty: allow"

CONTRACT_REL = Path("docs/library/COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md")

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
    Path("archlucid-ui/src/lib/comparison-replay-help-guide-content.ts"),
    Path("archlucid-ui/src/lib/why-comparison.ts"),
    Path("archlucid-ui/src/lib/contextual-help/help-topic-rows.ts"),
)

SKIP_DOC_SUFFIXES: tuple[str, ...] = (
    "help-index.generated.ts",
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1024**",
    "**TB-1025**",
    "check_comparison_replay_drift_honesty.py",
    "artifact",
    "verify",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "comparison-replay-immutable-snapshot-m-175",
    "TB-1025",
    "verify mode (422",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    (
        "artifact replay proves architecture unchanged",
        "Artifact replay must not be sold as architecture-unchanged proof (M-174 / TB-1025).",
    ),
    (
        "artifact-mode replay proves architecture is unchanged",
        "Artifact-mode replay must not be sold as architecture-unchanged proof (M-174 / TB-1025).",
    ),
    (
        "artifact mode replay proves architecture is unchanged",
        "Artifact-mode replay must not be sold as architecture-unchanged proof (M-174 / TB-1025).",
    ),
    (
        "live ui side-by-side equals verify",
        "Live UI side-by-side is not verify without 422 contract (M-174 / TB-1025).",
    ),
    (
        "live mutable ui side-by-side equals verify",
        "Live mutable UI side-by-side is not verify without 422 contract (M-174 / TB-1025).",
    ),
    (
        "mutable ui side-by-side equals verify",
        "Mutable UI side-by-side is not verify without 422 contract (M-174 / TB-1025).",
    ),
    (
        "artifact-only proves no drift",
        "Artifact-only replay is stored-delta replay, not no-drift proof (TB-1025).",
    ),
    (
        "artifact mode proves no drift",
        "Artifact mode is not no-drift proof without verify (TB-1025).",
    ),
)

DRIFT_CLAIM_MARKERS: tuple[str, ...] = (
    "architecture drift",
    "deterministic drift detection",
    "unchanged since last review",
    "drifted / stable",
    "drift/stable",
)

TB_1024_ANCHOR_MARKERS: tuple[str, ...] = (
    "tb-1024",
    "comparison_replay_immutable_snapshot_contract",
    "comparison-replay-immutable-snapshot",
    "comparison replay immutable snapshot",
    "verify mode",
    "verify (422",
    "422 on mismatch",
    "comparison-verification-failed",
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "forbidden",
    "review finding",
    "anti-pattern",
    "illusion",
    "not verify",
    "not drift proof",
    "not proof",
    "not stable",
    "≠",
    "m-174",
    "tb-1024",
    "tb-1025",
    "comparison-replay-drift-honesty: allow",
    '"artifact replay',
    "“artifact",
    "| ",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing comparison/replay immutable snapshot contract (TB-1024)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1025)."
        )
    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    if not path.is_file():
        return [f"{path.as_posix()}: missing buyer procurement packet (TB-1025)."]
    text = path.read_text(encoding="utf-8", errors="replace").lower()
    return [
        f"{path.relative_to(root).as_posix()}: missing procurement anchor {marker!r} (TB-1025)."
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
        return [f"{rel.as_posix()}: missing comparison/replay drift honesty scan target."]
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

        if any(marker in line_lower for marker in DRIFT_CLAIM_MARKERS):
            if not any(anchor in line_lower for anchor in TB_1024_ANCHOR_MARKERS):
                violations.append(
                    f"{display}:{line_no}: buyer drift/stable language without TB-1024 verify/artifact anchor (TB-1025)."
                )

    return violations


def comparison_replay_drift_honesty_violations(root: Path) -> list[str]:
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
    violations = comparison_replay_drift_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"comparison replay drift honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("comparison replay drift honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

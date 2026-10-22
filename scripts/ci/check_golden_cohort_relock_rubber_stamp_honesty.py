#!/usr/bin/env python3
"""TB-1173 / M-201: Anti-rubber-stamp cohort re-lock honesty CI.

Fails dishonest stubs that:
- Treat unexplained mass cohort SHA rewrites as regression proof.
- Claim cohort re-lock heals production ManifestHash / export verify.
- Sell green 20/20 nightlies as stability proof after rubber-stamp re-lock.

Contract: docs/library/GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_CONTRACT.md (TB-1172 / TB-1173).
Complements assert_golden_cohort_baseline_locked.py without duplicating placeholder checks.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "golden-cohort-relock-honesty: allow"

CONTRACT_REL = Path("docs/library/GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_CONTRACT.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_PA_ONE_PAGER.md"),
    Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/library/AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    CONTRACT_REL,
)

PRIMARY_CLAIM_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1172**",
    "**TB-1173**",
    "check_golden_cohort_relock_rubber_stamp_honesty.py",
    "Never re-lockable",
    "rubber stamp",
    "M-201",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "golden-cohort-relock-vs-rubber-stamp-m-202",
    "TB-1173",
    "GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_CONTRACT",
)

FORBIDDEN_PHRASES: tuple[tuple[str, str], ...] = (
    (
        "cohort re-lock heals production",
        "Cohort re-lock does not heal production ManifestHash (M-201 / TB-1173).",
    ),
    (
        "cohort relock heals production",
        "Cohort re-lock does not heal production ManifestHash (M-201 / TB-1173).",
    ),
    (
        "re-lock healed manifesthash",
        "Cohort re-lock does not heal production ManifestHash (M-201 / TB-1173).",
    ),
    (
        "re-lock heals manifesthash",
        "Cohort re-lock does not heal production ManifestHash (M-201 / TB-1173).",
    ),
    (
        "mass sha rewrite = regression proof",
        "Unexplained mass SHA rewrite is not regression proof (M-201 / TB-1173).",
    ),
    (
        "mass sha rewrite proves regression",
        "Unexplained mass SHA rewrite is not regression proof (M-201 / TB-1173).",
    ),
    (
        "20/20 proves stability",
        "Green 20/20 after mass unexplained rewrite is not stability proof (M-201 / TB-1173).",
    ),
    (
        "green 20/20 proves stability",
        "Green 20/20 after mass unexplained rewrite is not stability proof (M-201 / TB-1173).",
    ),
    (
        "deterministic drift locked forever",
        "Do not claim deterministic drift locked without intentional-change ritual (M-201 / TB-1173).",
    ),
    (
        "make ci green",
        "Re-lock rationale must not be only make CI green (M-201 / TB-1173).",
    ),
)

PRIMARY_CLAIM_MARKERS: tuple[str, ...] = (
    "golden cohort",
    "cohort re-lock",
    "cohort relock",
    "rubber stamp",
    "rubber-stamp",
)

TB_1172_ANCHOR_MARKERS: tuple[str, ...] = (
    "tb-1172",
    "tb-1173",
    "tb-1156",
    "tb-266",
    "m-201",
    "m-202",
    "m-198",
    "golden_cohort_relock",
    "golden-cohort-relock",
    "never-re-lockable",
    "never re-lockable",
    "intentional re-lock",
    "intentional content re-lock",
    "do not promise",
    "forbidden",
    "rubber-stamp",
)

NEGATION_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "not heal",
    "does not heal",
    "not substitute",
    "forbidden",
    "review finding",
    "anti-pattern",
    "too strong",
    "treat ",
    "unsafe",
    "rubber-stamp",
    "rubber stamp",
    "m-201",
    "m-202",
    "tb-1172",
    "tb-1173",
    "tb-1156",
    "golden-cohort-relock-honesty: allow",
    '"mass',
    "“mass",
    '"cohort',
    "“cohort",
    "| ",
    "**forbid**",
    "≠",
    "not regression proof",
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [
            f"{CONTRACT_REL.as_posix()}: missing golden-cohort re-lock contract (TB-1172)."
        ]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1173)."
        )
    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    if not path.is_file():
        return [f"{path.as_posix()}: missing buyer procurement packet (TB-1173)."]
    text = path.read_text(encoding="utf-8", errors="replace").lower()
    return [
        f"{path.relative_to(root).as_posix()}: missing procurement anchor {marker!r} (TB-1173)."
        for marker in REQUIRED_PROCUREMENT_ANCHORS
        if marker.lower() not in text
    ]


def _line_has_negation(line_lower: str, phrase: str) -> bool:
    idx = line_lower.find(phrase)
    if idx < 0:
        return False
    prefix = line_lower[:idx]
    return any(marker in prefix for marker in NEGATION_MARKERS)


def scan_text_file(root: Path, rel: Path, *, check_primary_claims: bool) -> list[str]:
    path = root / rel if not rel.is_absolute() else rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing golden-cohort re-lock honesty scan target."]
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
            if not check_primary_claims:
                break

            if marker not in line_lower:
                continue

            if _line_has_negation(line_lower, marker):
                continue

            if not any(anchor in line_lower for anchor in TB_1172_ANCHOR_MARKERS):
                violations.append(
                    f"{display}:{line_no}: buyer golden-cohort language without TB-1172 anchor (TB-1173)."
                )
                break

    return violations


def golden_cohort_relock_rubber_stamp_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(
            scan_text_file(
                root,
                rel,
                check_primary_claims=rel in PRIMARY_CLAIM_SCAN,
            )
        )
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = golden_cohort_relock_rubber_stamp_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"golden-cohort re-lock honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("golden-cohort re-lock honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

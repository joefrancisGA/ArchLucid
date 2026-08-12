#!/usr/bin/env python3
"""TB-1006 / M-156: Anti-NetArchTest-equals-isolation / silent-allowlist honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "netarchtest-isolation-honesty: allow"

CONTRACT_REL = Path("docs/library/LAYER_BOUNDARY_IRREVERSIBLE_LEAK_MATRIX.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/LAYER_BOUNDARY_IRREVERSIBLE_LEAK_PA_ONE_PAGER.md")
STUB_CATALOG_REL = Path("ArchLucid.Architecture.Tests/ArchitectureConstraintCompatibilityStubCatalog.cs")
ARCH_CONSTRAINTS_REL = Path("docs/library/ARCHITECTURE_CONSTRAINTS.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1005**",
    "**TB-1006**",
    "M-156",
    "M-157",
    "Compile-time held",
    "Explicit non-claims",
    "ArchitectureConstraintCompatibilityStubCatalog",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "too strong",
    "forbidden",
    "does not",
    "doesn't",
    "layer a",
    "inv-001",
    "catalog",
    "residual",
    "tb-1005",
    "tb-1006",
    "m-156",
    "m-157",
    "honesty guard",
    "non-claim",
    "≠",
    "not alone",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:netarch(?:test)?|dependencyconstrainttests?)\b[^.\n]{0,80}\b"
            r"(?:prove[sd]?|guarantees?|ensures?)\b[^.\n]{0,60}\b(?:tenant\s+)?isolation\b",
            re.IGNORECASE,
        ),
        "NetArchTest does not prove tenant isolation (TB-1005 / M-156).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:architecture|layer)\s+tests?\b[^.\n]{0,80}\b(?:prove[sd]?|guarantee[sd]?|make)\b[^.\n]{0,60}\b"
            r"(?:cross[-\s]tenant\s+leaks?\s+impossible|tenant\s+isolation)\b",
            re.IGNORECASE,
        ),
        "Layer/architecture tests alone do not make cross-tenant leaks impossible (TB-1005).",
    ),
    ClaimPattern(
        re.compile(
            r"\bgreen\s+architecture[-\s]tests?\b[^.\n]{0,80}\b(?:close|prove|guarantee)\b[^.\n]{0,60}\bisolation\b",
            re.IGNORECASE,
        ),
        "Green architecture tests do not close isolation residuals (TB-1005 / TB-1006).",
    ),
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())
    return text[line_start:] if line_end == -1 else text[line_start:line_end]


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _line_is_forbidden_example(line: str, match: re.Match[str]) -> bool:
    if "|" in line and ("too strong" in line.lower() or "forbid" in line.lower()):
        return True

    prefix = line[: match.start()]
    return sum(prefix.count(ch) for ch in ('"', '"', "\u201c", "\u201d")) % 2 == 1


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL

    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing layer-boundary contract (TB-1005)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1006)."
        )

    return violations


def stub_allowlist_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []

    if not (root / STUB_CATALOG_REL).is_file():
        violations.append(f"{STUB_CATALOG_REL.as_posix()}: missing compatibility stub catalog (TB-1006).")
        return violations

    arch_constraints = root / ARCH_CONSTRAINTS_REL

    if not arch_constraints.is_file():
        violations.append(f"{ARCH_CONSTRAINTS_REL.as_posix()}: missing architecture constraints doc.")
        return violations

    text = arch_constraints.read_text(encoding="utf-8", errors="replace")

    if "ArchitectureConstraintCompatibilityStubCatalog" not in text:
        violations.append(
            f"{ARCH_CONSTRAINTS_REL.as_posix()}: must reference ArchitectureConstraintCompatibilityStubCatalog (TB-1006)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing NetArchTest isolation honesty scan target."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = line.lower()

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, match) or _line_has_caveat(line_lower):
                continue

            violations.append(f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`.")

    return violations


def netarchtest_isolation_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(stub_allowlist_anchor_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = netarchtest_isolation_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"NetArchTest isolation honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("NetArchTest isolation honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""TB-1000 / M-150: Anti-header/ambient re-derive honesty CI.

Fails dishonest stubs that claim production tenant identity from client headers alone,
or that Application/Persistence re-parse JWT/headers for tenant without TB-999 / INV-001 caveats.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "tenant-identity-header-rederive-honesty: allow"

CONTRACT_REL = Path("docs/library/TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/TENANT_IDENTITY_SINGLE_DERIVATION_PA_ONE_PAGER.md")
ARCH001_REL = Path("ArchLucid.Analyzers/TenantIdentityBoundaryAnalyzer.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/go-to-market/TENANT_ISOLATION.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-999**",
    "**TB-1000**",
    "M-150",
    "M-151",
    "Forbidden re-derive",
    "Explicit non-claims",
    "x-tenant-id",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "≠",
    "does not",
    "doesn't",
    "forbidden",
    "fail closed",
    "devbypass",
    "production-like",
    "tb-999",
    "tb-1000",
    "m-150",
    "m-151",
    "inv-001",
    "decide-once",
    "trusted source",
    "too strong",
    "not a second identity",
    "not trusted",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bx-tenant-id\b[^.\n]{0,80}\b(?:establishes?|selects?|binds?|determines?)\b[^.\n]{0,60}\b(?:production\s+)?tenant\b",
            re.IGNORECASE,
        ),
        "Do not claim x-tenant-id establishes production tenant identity (TB-999 / M-150).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:client|request)\s+headers?\b[^.\n]{0,80}\b(?:establish|select|bind)\b[^.\n]{0,60}\btenant\s+identity\b",
            re.IGNORECASE,
        ),
        "Tenant identity is not decided from client headers in production-like hosts (TB-999).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:persistence|application|repository)\b[^.\n]{0,80}\b(?:re[-\s]?parses?|reads?)\b[^.\n]{0,80}\b(?:jwt|httpcontext|headers?)\b[^.\n]{0,60}\btenant\b",
            re.IGNORECASE,
        ),
        "Deeper layers must consume ScopeContext — not re-derive tenant from HTTP (TB-999 / ARCH001).",
    ),
    ClaimPattern(
        re.compile(
            r"\bproduction\b[^.\n]{0,80}\bheader[-\s]?only\b[^.\n]{0,80}\btenant\b",
            re.IGNORECASE,
        ),
        "Production-like hosts fail closed on header-only tenant binding (TB-999 / TB-925).",
    ),
    ClaimPattern(
        re.compile(
            r"\bambient\s+http\b[^.\n]{0,80}\b(?:tenant|scope)\b[^.\n]{0,80}\b(?:authority|source)\b",
            re.IGNORECASE,
        ),
        "Do not treat ambient HTTP as tenant authority (TB-999).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing tenant identity contract (TB-999)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1000)."
        )

    return violations


def arch001_anchor_violations(root: Path) -> list[str]:
    path = root / ARCH001_REL

    if not path.is_file():
        return [f"{ARCH001_REL.as_posix()}: missing TenantIdentityBoundaryAnalyzer (ARCH001)."]

    text = path.read_text(encoding="utf-8", errors="replace")

    if "Arch001Descriptor" not in text:
        return [f"{ARCH001_REL.as_posix()}: expected ARCH001 analyzer anchor (TB-1000)."]

    return []


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing tenant-identity honesty scan target."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = line.lower()

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, match) or _line_has_caveat(line_lower):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`."
            )

    return violations


def tenant_identity_header_rederive_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(arch001_anchor_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = tenant_identity_header_rederive_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Tenant-identity header re-derive honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Tenant-identity header re-derive honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

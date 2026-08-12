#!/usr/bin/env python3
"""TB-1123 / M-194: Anti-RLS-as-live / workspace-boundary / crypto-Search honesty CI.

Fails dishonest stubs that:
- Cite SQL RLS / row-level security as a deployed production isolation control.
- Treat workspace/project as the paying-client security boundary.
- Promise crypto-proof retrieval or a per-tenant Azure AI Search index.
- Claim NetArchTest / architecture tests alone prove tenant isolation.
- Assert G3 PASS / fully proven isolation without TB-1122 / M-195 caveats.

Contract: docs/library/ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md (TB-1122).
Points Verification at TB-1000 / TB-1002 / TB-1006 / TB-1019 without replacing those scopes.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "isolation-claims-too-strong-honesty: allow"

CONTRACT_REL = Path("docs/library/ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/ISOLATION_CLAIMS_VS_INV001_ADR0037_PA_ONE_PAGER.md")
BUYER_PACKET_REL = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")
CLAIM_READINESS_REL = Path("docs/go-to-market/CLAIM_READINESS_STATUS.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    BUYER_PACKET_REL,
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/go-to-market/TENANT_ISOLATION.md"),
    CLAIM_READINESS_REL,
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md"),
    PA_ONE_PAGER_REL,
    CONTRACT_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1122**",
    "**TB-1123**",
    "M-194",
    "M-195",
    "Too strong vs shipped",
    "CI anchors for **TB-1123**",
    "ADR 0037",
    "INV-001",
)

REQUIRED_BUYER_PACKET_MARKERS: tuple[str, ...] = (
    "ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md",
    "TB-1122",
    "isolation-claims-vs-inv001-adr0037-m-195",
)

_G3_TOPIC_RE = re.compile(
    r"\b(?:g3\s+(?:pass|fully\s+proven)|tenant\s+isolation\s+provable|"
    r"fully\s+proven\s+isolation|crypto(?:graphically)?[- ]?prov(?:able|en)\s+isolation)\b",
    re.IGNORECASE,
)

_G3_CITATION_MARKERS: tuple[str, ...] = (
    "tb-1122",
    "tb-1123",
    "m-194",
    "m-195",
    "isolation_claims_too_strong_vs_inv001_adr0037_contract.md",
    "isolation-claims-vs-inv001-adr0037-m-195",
    "with residuals",
    "catalog + decide-once",
    "too-strong",
    "too strong",
)

# Negation / forbid vocabulary only — SoT IDs (TB-1122, ADR 0037, …) must NOT
# suppress claim matches; otherwise a dishonest stub passes by name-dropping.
_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "too strong",
    "forbidden",
    "anti-claim",
    "do-not-promise",
    "does not",
    "doesn't",
    "cannot",
    "can't",
    "unsafe",
    "≠",
    "!=",
    "not a deployed",
    "not deployed",
    "not the primary",
    "not the paying",
    "non-control",
    "historical",
    "superseded",
    "legacy",
    "rejected",
    "fail stub",
    "intended fail",
    "ci anchor",
    "honesty guard",
    "example dishonest",
    "safe rewrite",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:sql\s+)?(?:row[-\s]level\s+security|rls)\b[^.\n]{0,100}\b"
            r"(?:isolates?\s+tenants?|protects?\s+production|production\s+(?:isolation\s+)?control|"
            r"deployed\s+production\s+control|multi[-\s]tenant\s+isolation|"
            r"(?:for|provides?|enables?|ensures?)\s+tenant\s+isolation|"
            r"tenant\s+isolation)\b",
            re.IGNORECASE,
        ),
        "Do not cite SQL RLS as a deployed production isolation control (TB-1122 / ADR 0037 / M-194).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:azure\s+sql|production)\b[^.\n]{0,80}\b(?:with\s+)?row[-\s]level\s+security\b"
            r"[^.\n]{0,80}\b(?:isolation|isolates?|tenancy|tenant)\b",
            re.IGNORECASE,
        ),
        "Do not present Azure SQL row-level security as production tenant isolation (TB-1122 / M-194).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:workspace|project)\b[^.\n]{0,80}\b(?:is|are|as)\b[^.\n]{0,60}\b"
            r"(?:the\s+)?(?:paying[- ]client\s+)?(?:tenant\s+)?(?:security|isolation)\s+boundary\b",
            re.IGNORECASE,
        ),
        "Workspace/project are organizational scope — not the paying-client security boundary (TB-1122 / M-114).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:per[-\s]tenant\s+(?:azure\s+ai\s+)?search\s+index(?:es)?|"
            r"dedicated\s+(?:azure\s+ai\s+)?search\s+(?:index|service)\s+per\s+tenant|"
            r"crypto(?:graphically)?[- ]?proof\s+(?:retrieval|search|isolation))\b",
            re.IGNORECASE,
        ),
        "Do not promise per-tenant Search indexes or crypto-proof retrieval — shared index + $filter (TB-1122 / M-152).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:netarch(?:test)?|architecture\s+tests?|layer\s+tests?|arch001)\b[^.\n]{0,80}\b"
            r"(?:alone\s+)?(?:prove[sd]?|guarantees?|ensures?)\b[^.\n]{0,60}\b"
            r"(?:tenant\s+isolation|multi[-\s]tenant\s+isolation|cross[-\s]tenant\s+(?:impossibility|leaks?\s+impossible))\b",
            re.IGNORECASE,
        ),
        "NetArchTest / architecture tests alone do not prove tenant isolation (TB-1122 / M-156 / TB-1006).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bg3\s+(?:pass\s*=\s*|means?\s+)?fully\s+proven\s+isolation\b",
            re.IGNORECASE,
        ),
        "G3 PASS is catalog + decide-once shipped — not fully proven isolation (TB-1122 / CLAIM_READINESS).",
        CLAIM_READINESS_REL.as_posix(),
    ),
)


def _normalize_line(line: str) -> str:
    normalized = line

    for marker in ("*", "_", "`"):
        normalized = normalized.replace(marker, "")

    return normalized.lower()


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())

    if line_end == -1:
        line_end = len(text)

    return text[line_start:line_end]


def _match_is_quoted_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    for open_quote, close_quote in (('"', '"'), ("“", "”"), ("‘", "’")):
        cursor = 0

        while cursor < len(line):
            open_index = line.find(open_quote, cursor)

            if open_index < 0:
                break

            close_index = line.find(close_quote, open_index + len(open_quote))

            if close_index < 0:
                break

            quoted_end = close_index + len(close_quote)

            if open_index <= match_start and match_end <= quoted_end:
                return True

            cursor = quoted_end

    return False


def _is_markdown_table_data_row(line: str) -> bool:
    stripped = line.lstrip()

    if not stripped.startswith("|"):
        return False

    # Separator rows like | --- | --- |
    if re.match(r"^\|[\s|:-]+$", stripped):
        return False

    return stripped.count("|") >= 3


def _line_is_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    if _match_is_quoted_forbidden_example(line, match_start, match_end):
        return True

    stripped = line.lstrip().lower()

    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no “" in stripped):
        return True

    # Too-strong / Do-not-promise / CI-anchor matrices list forbidden stubs in cells.
    if _is_markdown_table_data_row(line):
        return True

    return False


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    missing: list[str] = []

    for marker in markers:
        if marker.lower() not in lowered:
            missing.append(marker)

    return missing


def contract_violations(root: Path) -> list[str]:
    violations: list[str] = []
    contract_path = root / CONTRACT_REL

    if not contract_path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing isolation claims too-strong contract (TB-1122)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1122 / TB-1123)."
        )

    return violations


def buyer_packet_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / BUYER_PACKET_REL

    if not path.is_file():
        return [f"{BUYER_PACKET_REL.as_posix()}: missing buyer security procurement packet (M-195)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_BUYER_PACKET_MARKERS):
        violations.append(
            f"{BUYER_PACKET_REL.as_posix()}: missing required M-195 anchor {marker!r} (TB-1122 / TB-1123)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted isolation claims honesty scan target"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_start = text.rfind("\n", 0, match.start()) + 1
            match_start = match.start() - line_start
            match_end = match.end() - line_start
            line_lower = _normalize_line(line)

            if (
                _line_is_allowlisted(line)
                or _line_is_forbidden_example(line, match_start, match_end)
                or _line_has_caveat(line_lower)
            ):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                f"Source of truth: {claim.source_of_truth}."
            )

    return violations


def scan_g3_citations(root: Path, rel: Path) -> list[str]:
    """Require TB-1122 / M-195 near G3 PASS / fully-proven isolation language."""
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return []

    # Contract + claim readiness are the SoT; do not demand self-citation windows.
    if rel in (CONTRACT_REL, CLAIM_READINESS_REL):
        return []

    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    for index, line in enumerate(lines):
        if not _G3_TOPIC_RE.search(line):
            continue

        if _line_is_allowlisted(line):
            continue

        line_lower = _normalize_line(line)

        if _line_has_caveat(line_lower):
            continue

        window_start = max(0, index - 2)
        window_end = min(len(lines), index + 3)
        window = "\n".join(lines[window_start:window_end]).lower()

        if any(marker in window for marker in _G3_CITATION_MARKERS):
            continue

        violations.append(
            f"{rel.as_posix()}: G3 / fully-proven isolation language must cite TB-1122 / M-195 / "
            f"ISOLATION_CLAIMS_TOO_STRONG_VS_INV001_ADR0037_CONTRACT.md near the claim. "
            f"Line {index + 1}: {line.strip()[:120]}"
        )

    return violations


def isolation_claims_too_strong_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(buyer_packet_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
        violations.extend(scan_g3_citations(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found (local exploration).",
    )
    args = parser.parse_args(argv)

    violations = isolation_claims_too_strong_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Isolation claims too-strong honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Isolation claims too-strong honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

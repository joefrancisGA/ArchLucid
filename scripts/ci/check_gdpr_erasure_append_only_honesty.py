#!/usr/bin/env python3
"""TB-1471 / M-265: Anti-append-only-forever / complete-erasure-including-Search honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "gdpr-erasure-append-only-honesty: allow"

CONTRACT_REL = Path("docs/library/GDPR_ERASURE_VS_APPEND_ONLY_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/GDPR_ERASURE_VS_APPEND_ONLY_PA_ONE_PAGER.md")
TENANT_DELETION_REL = Path("ArchLucid.Application/Tenancy/TenantDeletionService.cs")
HARD_PURGE_REL = Path("ArchLucid.Persistence/Tenancy/SqlTenantHardPurgeService.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1470**",
    "**TB-1471**",
    "M-265",
    "Too strong",
    "CI anchors for **TB-1471**",
    "TenantDeletionService",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "tb-1470",
    "tb-1471",
    "tb-1009",
    "m-265",
    "honesty guard",
    "non-claim",
    "≠",
    "sealed-in-life",
    "hard purge",
    "residual",
    "disclosed",
    "§6m",
    "v2",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:append[-\s]only|sealed\s+evidence|golden\s+manifests?|audit)\b[^.\n]{0,60}\b"
            r"(?:are\s+)?(?:immutable|undeletable)\b[^.\n]{0,40}\bforever\b",
            re.IGNORECASE,
        ),
        "Sealed evidence is append-only during tenant life — not immutable forever (TB-1470).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:complete|full)\s+erasure\b[^.\n]{0,60}\b(?:of\s+)?all\s+copies\b",
            re.IGNORECASE,
        ),
        "Do not claim complete erasure of all copies without residual caveats (TB-1470).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:ai\s+)?search\b[^.\n]{0,60}\b(?:is\s+)?(?:purged|deleted|erased)\b"
            r"[^.\n]{0,40}\b(?:on|upon|when)\s+(?:tenant\s+)?offboard\b",
            re.IGNORECASE,
        ),
        "Search purge is not wired into tenant hard purge today (TB-1470).",
    ),
    ClaimPattern(
        re.compile(
            r"\bv1\b[^.\n]{0,40}\bhas\s+no\s+(?:tenant\s+)?(?:deletion|erasure)\b",
            re.IGNORECASE,
        ),
        "V1 has operator/trial hard purge — do not claim no deletion capability (TB-1470).",
    ),
    ClaimPattern(
        re.compile(
            r"\bv1\b[^.\n]{0,60}\b(?:fully\s+)?automated\b[^.\n]{0,40}\bgdpr\b",
            re.IGNORECASE,
        ),
        "Fully automated GDPR pipeline is V2 (§6m) — not V1 (TB-1470).",
    ),
    ClaimPattern(
        re.compile(
            r"\berases?\s+all\s+your\s+data\s+everywhere\s+instantly\b",
            re.IGNORECASE,
        ),
        "Hard purge has disclosed Search/backup/telemetry residuals (TB-1470).",
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


def _is_markdown_table_data_row(line: str) -> bool:
    stripped = line.lstrip()
    if not stripped.startswith("|"):
        return False
    if re.match(r"^\|[\s|:-]+$", stripped):
        return False
    return stripped.count("|") >= 3


def _match_is_quoted_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    for open_quote, close_quote in (('"', '"'), ("\u201c", "\u201d"), ("\u2018", "\u2019")):
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


def _line_is_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    if _match_is_quoted_forbidden_example(line, match_start, match_end):
        return True
    stripped = line.lstrip().lower()
    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no \u201c" in stripped):
        return True
    if _is_markdown_table_data_row(line):
        return True
    if stripped.startswith("|") and (
        "unsafe" in stripped or "forbid" in stripped or "too strong" in stripped or "ci anchors" in stripped
    ):
        return True
    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing GDPR erasure vs append-only map (TB-1470)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1471)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (TENANT_DELETION_REL, ("TenantDeletionService", "TenantErasureApprovedUtc")),
        (HARD_PURGE_REL, ("SqlTenantHardPurgeService", "GoldenManifests")),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing GDPR erasure code anchor (TB-1471).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1471).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing GDPR erasure honesty scan target."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = line.lower()
            line_start = text.rfind("\n", 0, match.start()) + 1
            match_start_in_line = match.start() - line_start
            match_end_in_line = match.end() - line_start
            if (
                _line_is_allowlisted(line)
                or _line_is_forbidden_example(line, match_start_in_line, match_end_in_line)
                or _line_has_caveat(line_lower)
            ):
                continue
            violations.append(f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`.")
    return violations


def gdpr_erasure_append_only_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(code_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = gdpr_erasure_append_only_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"GDPR erasure append-only honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("GDPR erasure append-only honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

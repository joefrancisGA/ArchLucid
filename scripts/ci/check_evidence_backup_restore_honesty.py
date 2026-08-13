#!/usr/bin/env python3
"""TB-1491 / M-269: Anti-append-only-survives-PITR / restored-equals-untampered honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "evidence-backup-restore-honesty: allow"

CONTRACT_REL = Path("docs/library/EVIDENCE_BACKUP_RESTORE_INVARIANT_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/EVIDENCE_BACKUP_RESTORE_INVARIANT_PA_ONE_PAGER.md")
SEALED_RULES_REL = Path(
    "ArchLucid.Host.Core/Startup/Validation/Rules/SqlSealedEvidenceImmutabilityRules.cs"
)
LINEAGE_VERIFIER_REL = Path("ArchLucid.Application/Analysis/RunExportLineageVerifier.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1490**",
    "**TB-1491**",
    "M-269",
    "Too strong",
    "CI anchors for **TB-1491**",
    "controlled discontinuity",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "tb-1490",
    "tb-1491",
    "tb-1009",
    "tb-307",
    "m-269",
    "honesty guard",
    "non-claim",
    "≠",
    "external anchor",
    "sql alone",
    "not shipped",
    "controlled discontinuity",
    "separate clocks",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bappend[-\s]only\b[^.\n]{0,60}\b(?:means?|proves?|guarantees?)\b[^.\n]{0,40}\b"
            r"backups?\b[^.\n]{0,40}\b(?:can'?t|cannot)\b[^.\n]{0,40}\b(?:change|rewrite)\b",
            re.IGNORECASE,
        ),
        "Append-only binds app principal — DR restore is a separate discontinuity (TB-1490).",
    ),
    ClaimPattern(
        re.compile(
            r"\brestored\b[^.\n]{0,60}\b(?:tenants?|databases?)\b[^.\n]{0,60}\b"
            r"(?:are\s+)?cryptographically\b[^.\n]{0,40}\b(?:distinguish|labeled|prove)\b",
            re.IGNORECASE,
        ),
        "Restored state is not crypto-labeled — use external export anchors (TB-1490).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:sql|database)\b[^.\n]{0,40}\balone\b[^.\n]{0,60}\b(?:proves?|shows?)\b[^.\n]{0,40}\b"
            r"(?:no\s+)?tamper\b",
            re.IGNORECASE,
        ),
        "SQL alone cannot prove restore≠tamper — external anchors required (TB-1490).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:sql|database)\s+and\s+blob\b[^.\n]{0,60}\bperfect\b[^.\n]{0,40}\bpitr\b",
            re.IGNORECASE,
        ),
        "SQL and blob have separate continuity clocks — no perfect fused PITR (TB-1490).",
    ),
    ClaimPattern(
        re.compile(
            r"\bpitr\b[^.\n]{0,60}\bproves?\b[^.\n]{0,40}\bmanifest\s*hash\b[^.\n]{0,40}\b"
            r"(?:was\s+)?(?:not\s+)?tampered\b",
            re.IGNORECASE,
        ),
        "PITR proves recoverability to T — tamper detection needs pre-event external hashes (TB-1490).",
    ),
    ClaimPattern(
        re.compile(
            r"\bappend[-\s]only\b[^.\n]{0,60}\bsurvives?\b[^.\n]{0,40}\bpitr\b",
            re.IGNORECASE,
        ),
        "PITR is time-travel discontinuity — not continuous append-only across restore (TB-1490).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing evidence backup/restore map (TB-1490)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1491)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (SEALED_RULES_REL, ("SqlSealedEvidenceImmutabilityRules",)),
        (LINEAGE_VERIFIER_REL, ("RunExportLineageVerifier",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing backup/restore code anchor (TB-1491).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1491).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing backup/restore honesty scan target."]
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


def evidence_backup_restore_honesty_violations(root: Path) -> list[str]:
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
    violations = evidence_backup_restore_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Evidence backup/restore honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Evidence backup/restore honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

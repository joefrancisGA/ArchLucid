#!/usr/bin/env python3
"""TB-1558 / M-286: Anti-separate-migrator-job / anti-always-ZDT / anti-least-privilege-while-bootstrap honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "zero-downtime-sql-migration-honesty: allow"

CONTRACT_REL = Path("docs/library/ZERO_DOWNTIME_SQL_MIGRATION_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/ZERO_DOWNTIME_SQL_MIGRATION_PA_ONE_PAGER.md")
MIGRATOR_REL = Path("ArchLucid.Persistence/Data/Infrastructure/DatabaseMigrator.cs")
PERSISTENCE_STARTUP_REL = Path("ArchLucid.Host.Core/Startup/ArchLucidPersistenceStartup.cs")
ROLLING_LINT_REL = Path("scripts/ci/check_migration_rolling_deploy_patterns.py")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1557**",
    "**TB-1558**",
    "M-286",
    "CI anchors for **TB-1558**",
    "DatabaseMigrator",
    "DbUp",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1557",
    "tb-1558",
    "tb-068",
    "tb-1244",
    "m-286",
    "m-287",
    "honesty guard",
    "non-claim",
    "not automatic",
    "not by default",
    "unless",
    "bootstrap",
    "db_owner",
    "expand/contract",
    "forward-only",
    "reference + bootstrap",
    "in-process",
    "optional",
    "future",
    "not shipped",
    "not wired",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:single|one|only)\s+sql\s+file\b[^.\n]{0,60}\b(?:is\s+)?(?:the\s+)?only\b"
            r"[^.\n]{0,40}\b(?:production|prod)\b[^.\n]{0,40}\b(?:apply|schema|migration)\b",
            re.IGNORECASE,
        ),
        "Consolidated SQL is reference+bootstrap — DbUp deltas also apply in prod (TB-1557).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:separate|dedicated)\b[^.\n]{0,40}\b(?:cd|sql|schema)\b[^.\n]{0,40}\bmigrator\b"
            r"[^.\n]{0,60}\b(?:owns?|runs?|applies?)\b[^.\n]{0,40}\b(?:prod|production|schema)\b",
            re.IGNORECASE,
        ),
        "Production DDL is in-process DbUp on API/Worker startup — not a separate migrator job (TB-1557).",
    ),
    ClaimPattern(
        re.compile(
            r"\bterraform\b[^.\n]{0,60}\b(?:applies?|runs?|owns?)\b[^.\n]{0,40}\bschema\b",
            re.IGNORECASE,
        ),
        "Terraform deploys infra — it does not apply product schema (TB-1557).",
    ),
    ClaimPattern(
        re.compile(
            r"\brolling\s+deploy(?:ment)?s?\b[^.\n]{0,60}\b(?:are\s+)?always\b[^.\n]{0,40}\b"
            r"(?:zero[-\s]downtime|zdt)\b[^.\n]{0,40}\bschema\b",
            re.IGNORECASE,
        ),
        "Rolling deploy ZDT requires expand/contract discipline — not automatic (TB-1557).",
    ),
    ClaimPattern(
        re.compile(
            r"\bdbup\b[^.\n]{0,60}\b(?:automatic|built[-\s]in)\b[^.\n]{0,40}\bdown\s+migrations?\b",
            re.IGNORECASE,
        ),
        "DbUp is forward-only — no automatic down migrations (TB-1557).",
    ),
    ClaimPattern(
        re.compile(
            r"\bproduction\b[^.\n]{0,40}\bapi\b[^.\n]{0,60}\b(?:sql|database)\b[^.\n]{0,40}\b"
            r"(?:is\s+)?least[-\s]privilege\b",
            re.IGNORECASE,
        ),
        "Production API SQL defaults to bootstrap/db_owner MI unless runtime split is wired (TB-1557/TB-1244).",
    ),
    ClaimPattern(
        re.compile(
            r"\bnon[-\s]db_owner\b[^.\n]{0,40}\b(?:by\s+default|in\s+production)\b",
            re.IGNORECASE,
        ),
        "Default production SQL identity is bootstrap/db_owner-equivalent (TB-1557).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing zero-downtime SQL migration claim map (TB-1557)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1558)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (MIGRATOR_REL, ("DatabaseMigrator", "DbUp")),
        (PERSISTENCE_STARTUP_REL, ("ArchLucidPersistenceStartup",)),
        (ROLLING_LINT_REL, ("TB-068",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing SQL migration code anchor (TB-1558).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1558).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing SQL migration honesty scan target."]
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


def zero_downtime_sql_migration_honesty_violations(root: Path) -> list[str]:
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
    violations = zero_downtime_sql_migration_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"zero-downtime SQL migration honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("zero-downtime SQL migration honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

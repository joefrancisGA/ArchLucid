#!/usr/bin/env python3
"""TB-1498 / M-271: Anti-project-purge-erases-evidence / no-trace-after-bin honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "project-soft-delete-sealed-evidence-honesty: allow"

CONTRACT_REL = Path("docs/library/PROJECT_SOFT_DELETE_SEALED_EVIDENCE_MAP.md")
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/PROJECT_SOFT_DELETE_SEALED_EVIDENCE_PA_ONE_PAGER.md"
)
PURGE_SERVICE_REL = Path(
    "ArchLucid.Persistence/Tenancy/SqlArchitectureProjectRetentionPurgeService.cs"
)
PROJECT_REPO_REL = Path(
    "ArchLucid.Persistence/Tenancy/DapperArchitectureProjectRepository.cs"
)
AUDIT_EVENT_TYPES_REL = Path("ArchLucid.Core/Audit/AuditEventTypes.Tenant.cs")

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
    "**TB-1497**",
    "**TB-1498**",
    "M-271",
    "CI anchors for **TB-1498**",
    "SqlArchitectureProjectRetentionPurgeService",
    "DapperArchitectureProjectRepository",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1497",
    "tb-1498",
    "tb-1180",
    "m-271",
    "m-272",
    "honesty guard",
    "non-claim",
    "residue",
    "remain",
    "orphan",
    "project record",
    "project row",
    "not erase",
    "not erasure",
    "≠",
    "separate",
    "tenant offboard",
    "append-only",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:delete|purge|remove)\s+project\b[^.\n]{0,60}\b(?:deletes?|erases?|removes?)\b"
            r"[^.\n]{0,40}\b(?:all\s+)?(?:evidence|runs?|packages?|manifests?|audit)\b",
            re.IGNORECASE,
        ),
        "Project purge removes the project row — sealed evidence remains (TB-1497).",
    ),
    ClaimPattern(
        re.compile(
            r"\bproject\s+(?:purge|delete|removal)\b[^.\n]{0,60}\b(?:gdpr|art\.?\s*17|erasure|right\s+to\s+be\s+forgotten)\b",
            re.IGNORECASE,
        ),
        "Project retention purge is not tenant GDPR erasure (TB-1497).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:after|once)\s+(?:project\s+)?purge\b[^.\n]{0,60}\bno\s+trace\b",
            re.IGNORECASE,
        ),
        "Audit events and sealed runs remain after project purge (TB-1497).",
    ),
    ClaimPattern(
        re.compile(
            r"\bno\s+trace\b[^.\n]{0,40}\b(?:after|following)\b[^.\n]{0,40}\b(?:recycle\s+bin|project\s+purge|hard\s+purge)\b",
            re.IGNORECASE,
        ),
        "Soft/hard project purge adds audit rows — not zero trace (TB-1497).",
    ),
    ClaimPattern(
        re.compile(
            r"\bpermanently\s+removed\b[^.\n]{0,60}\b(?:all\s+)?(?:evidence|packages?|runs?)\b",
            re.IGNORECASE,
        ),
        "Permanent removal applies to project catalog row — not sealed evidence (TB-1497).",
    ),
    ClaimPattern(
        re.compile(
            r"\brecycle\s+bin\b[^.\n]{0,60}\b(?:erases?|wipes?|purges?)\b[^.\n]{0,40}\b(?:evidence|audit|packages?)\b",
            re.IGNORECASE,
        ),
        "Recycle bin retention purges project records — not sealed evidence (TB-1497).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing project soft-delete residue map (TB-1497)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1498)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (PURGE_SERVICE_REL, ("SqlArchitectureProjectRetentionPurgeService", "FROM dbo.Projects")),
        (PROJECT_REPO_REL, ("TrySoftDeleteAsync",)),
        (AUDIT_EVENT_TYPES_REL, ("ArchitectureProjectSoftDeleted", "ArchitectureProjectHardPurgedRetention")),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing project purge code anchor (TB-1498).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1498).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing project purge honesty scan target."]
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


def project_soft_delete_sealed_evidence_honesty_violations(root: Path) -> list[str]:
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
    violations = project_soft_delete_sealed_evidence_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"project soft-delete sealed evidence honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("project soft-delete sealed evidence honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

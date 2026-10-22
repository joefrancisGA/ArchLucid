#!/usr/bin/env python3
"""TB-1531 / M-280: Anti-exactly-once-ITSM / outbox-equals-native-create honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "itsm-outbox-dlq-delivery-honesty: allow"

CONTRACT_REL = Path("docs/library/ITSM_OUTBOX_DLQ_DELIVERY_GUARANTEE_MAP.md")
ITSM_CREATE_REL = Path(
    "ArchLucid.Application/Integrations/Itsm/Outbound/ItsmOutboundIssueCreationService.cs"
)
OUTBOX_REPO_REL = Path(
    "ArchLucid.Persistence/IntegrationOutbox/DapperIntegrationEventOutboxRepository.cs"
)

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1530**",
    "**TB-1531**",
    "M-280",
    "Too strong",
    "CI anchors for **TB-1531**",
    "IntegrationEventOutbox",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "tb-1530",
    "tb-1531",
    "tb-992",
    "tb-394",
    "m-280",
    "honesty guard",
    "non-claim",
    "≠",
    "at-least-once",
    "soft",
    "can see duplicate",
    "separate",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bintegration\s*event\s*outbox\b[^.\n]{0,80}\b(?:is|means?|equals?)\b[^.\n]{0,60}\b"
            r"(?:native\s+)?(?:jira|servicenow|itsm)\s+create\b",
            re.IGNORECASE,
        ),
        "IntegrationEventOutbox is Path B — native create uses background jobs (TB-1530).",
    ),
    ClaimPattern(
        re.compile(
            r"\bexactly[-\s]once\b[^.\n]{0,40}\b(?:itsm|jira|servicenow|ticket)\b",
            re.IGNORECASE,
        ),
        "ITSM create is at-least-once — customers can see duplicate tickets (TB-1530).",
    ),
    ClaimPattern(
        re.compile(
            r"\bat[-\s]least[-\s]once\b[^.\n]{0,60}\b(?:with\s+)?(?:receiver|itsm)\s+dedupe\b",
            re.IGNORECASE,
        ),
        "No vendor receiver dedupe — soft ArchLucid correlation skip only (TB-1530).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:deduplication\s*key|finding\s*id)\b[^.\n]{0,60}\b(?:makes?|ensures?|guarantees?)\b[^.\n]{0,40}\b"
            r"(?:native\s+)?idempoten",
            re.IGNORECASE,
        ),
        "Managed connector is not natively idempotent via deduplicationKey/findingId (TB-1530).",
    ),
    ClaimPattern(
        re.compile(
            r"\bpoison\b[^.\n]{0,40}\b(?:itsm|jira|servicenow)\s+create\b[^.\n]{0,60}\b"
            r"(?:pages?|alerts?)\b[^.\n]{0,40}\bfounder\b",
            re.IGNORECASE,
        ),
        "Poison ITSM create is warn-tier UI/Prometheus — not founder MVO paging by default (TB-1530).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing ITSM outbox/DLQ delivery map (TB-1530)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1531)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (ITSM_CREATE_REL, ("ItsmOutboundIssueCreationService", "TryGetByFindingAndProviderAsync")),
        (OUTBOX_REPO_REL, ("DapperIntegrationEventOutboxRepository", "IntegrationEventOutbox")),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing ITSM delivery code anchor (TB-1531).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1531).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing ITSM delivery honesty scan target."]
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


def itsm_outbox_dlq_delivery_honesty_violations(root: Path) -> list[str]:
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
    violations = itsm_outbox_dlq_delivery_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"ITSM outbox/DLQ delivery honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("ITSM outbox/DLQ delivery honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

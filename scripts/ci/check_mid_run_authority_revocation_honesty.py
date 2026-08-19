#!/usr/bin/env python3
"""TB-1538 / M-282: Anti-instant-global-revoke / webhook-rechecks-principal honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "mid-run-authority-revocation-honesty: allow"

CONTRACT_REL = Path("docs/library/MID_RUN_AUTHORITY_REVOCATION_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/MID_RUN_AUTHORITY_REVOCATION_PA_ONE_PAGER.md")
AUTHZ_HANDLER_REL = Path(
    "ArchLucid.Host.Core/Authorization/TenantOrProjectCapabilityAuthorizationHandler.cs"
)
API_KEY_HANDLER_REL = Path("ArchLucid.Api/Authentication/ApiKeyAuthenticationHandler.cs")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1537**",
    "**TB-1538**",
    "M-282",
    "Too strong",
    "CI anchors for **TB-1538**",
    "IOptionsMonitor",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "tb-1537",
    "tb-1538",
    "m-282",
    "honesty guard",
    "non-claim",
    "≠",
    "eventual",
    "next request",
    "next http",
    "until token",
    "not structural",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:revoke|revocation|disable)\b[^.\n]{0,60}\b(?:instantly|immediately)\b[^.\n]{0,40}\b"
            r"(?:stops?|kills?|terminates?)\b[^.\n]{0,40}\b(?:in[-\s]?flight|execute|llm)\b",
            re.IGNORECASE,
        ),
        "Revoke stops new HTTP — in-flight sync execute continues (TB-1537).",
    ),
    ClaimPattern(
        re.compile(
            r"\bscim\b[^.\n]{0,60}\b(?:active\s*=\s*false|disable)\b[^.\n]{0,60}\b(?:instantly|immediately)\b[^.\n]{0,40}\b"
            r"(?:kills?|strips?|revokes?)\b[^.\n]{0,40}\b(?:entra|jwt|roles?)\b",
            re.IGNORECASE,
        ),
        "SCIM Active=false alone does not instantly strip Entra JWT roles (TB-1537).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:webhook|outbox|itsm)\b[^.\n]{0,60}\b(?:re[-\s]?checks?|validates?)\b[^.\n]{0,40}\b"
            r"(?:architect|principal|initiator|actor)\b",
            re.IGNORECASE,
        ),
        "Queued delivery is tenant-scoped — no principal re-check at worker (TB-1537).",
    ),
    ClaimPattern(
        re.compile(
            r"\bauth\s*version\b[^.\n]{0,60}\b(?:covers?|applies?\s+to|enforces?)\b[^.\n]{0,40}\bentra\b",
            re.IGNORECASE,
        ),
        "AuthVersion is ArchLucid-issued JWT only — not Entra workforce tokens (TB-1537).",
    ),
    ClaimPattern(
        re.compile(
            r"\bapi\s*keys?\b[^.\n]{0,60}\b(?:cached|remain\s+valid)\b[^.\n]{0,40}\b(?:after|post)\s+revoke\b",
            re.IGNORECASE,
        ),
        "API keys fail closed on next authenticate via IOptionsMonitor — opposite overclaim (TB-1537).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing mid-run authority revocation claim map (TB-1537)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1538)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (AUTHZ_HANDLER_REL, ("TenantOrProjectCapabilityAuthorizationHandler",)),
        (API_KEY_HANDLER_REL, ("ApiKeyAuthenticationHandler", "IOptionsMonitor")),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing revocation code anchor (TB-1538).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1538).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing mid-run revocation honesty scan target."]
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


def mid_run_authority_revocation_honesty_violations(root: Path) -> list[str]:
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
    violations = mid_run_authority_revocation_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Mid-run authority revocation honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Mid-run authority revocation honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

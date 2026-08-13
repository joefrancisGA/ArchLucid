#!/usr/bin/env python3
"""TB-1564 / M-292: Anti-ZDT-drain-to-completion / anti-live-handoff / anti-Worker-resumes-LLM honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "worker-rolling-deploy-drain-handoff-honesty: allow"

CONTRACT_REL = Path("docs/library/WORKER_ROLLING_DEPLOY_DRAIN_HANDOFF_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/INTERRUPTED_REVIEW_BUYER_ONE_PAGER.md")
GRACEFUL_SHUTDOWN_REL = Path("ArchLucid.Host.Core/Hosting/GracefulShutdownWebApplicationBuilderExtensions.cs")
CRASH_RECOVERY_REL = Path("docs/library/CRASH_RECOVERY_LONG_RUNNING_REVIEW_CLAIM_MAP.md")

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
    "**TB-1563**",
    "**TB-1564**",
    "M-292",
    "CI anchors for **TB-1564**",
    "AddArchLucidGracefulShutdown",
    "ShutdownTimeout",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1563",
    "tb-1564",
    "tb-961",
    "tb-943",
    "tb-1523",
    "tb-1311",
    "m-292",
    "m-293",
    "m-122",
    "honesty guard",
    "non-claim",
    "not automatic",
    "not live",
    "lease",
    "reclaim",
    "api-sync",
    "45s",
    "unset",
    "open",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bworker\b[^.\n]{0,60}\b(?:rolling\s+)?(?:deploy|revision)\b[^.\n]{0,60}\b"
            r"(?:drains?|waits?\s+for)\b[^.\n]{0,60}\b(?:in[-\s]?flight|active)\b[^.\n]{0,40}\b"
            r"(?:reviews?|runs?|work)\b[^.\n]{0,40}\bto\s+completion\b",
            re.IGNORECASE,
        ),
        "Worker roll is soft drain (~45s) then kill — not drain-to-completion (TB-1563).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:in[-\s]?flight|active)\b[^.\n]{0,40}\b(?:reviews?|runs?|work)\b[^.\n]{0,60}\b"
            r"(?:hand\s*off|hands?\s*off)\b[^.\n]{0,40}\b(?:live|directly)\b[^.\n]{0,40}\b"
            r"(?:to\s+)?(?:the\s+)?new\b[^.\n]{0,20}\brevision\b",
            re.IGNORECASE,
        ),
        "In-flight work reclaims after lease expiry — not live handoff to new revision (TB-1563).",
    ),
    ClaimPattern(
        re.compile(
            r"\bworker\b[^.\n]{0,60}\b(?:resumes?|continues?)\b[^.\n]{0,60}\b"
            r"(?:agent\s+)?(?:llm\s+)?execute\b[^.\n]{0,60}\b(?:after|following)\b[^.\n]{0,40}\brevision\b",
            re.IGNORECASE,
        ),
        "Agent LLM execute is API-sync — Worker ZDT does not resume execute (TB-1563).",
    ),
    ClaimPattern(
        re.compile(
            r"\bworker\b[^.\n]{0,40}\bZDT\b[^.\n]{0,60}\b(?:protects?|covers?|includes?)\b[^.\n]{0,40}\b"
            r"(?:agent\s+)?execute\b",
            re.IGNORECASE,
        ),
        "Worker ZDT is not execute ZDT — LLM execute is API-sync (TB-1563).",
    ),
    ClaimPattern(
        re.compile(
            r"\borphaned\b[^.\n]{0,40}\bagent\s*tasks?\b[^.\n]{0,60}\b(?:always|automatically)\b[^.\n]{0,40}\b"
            r"(?:become|marked|surface)\b[^.\n]{0,40}\b(?:failed|partial)\b[^.\n]{0,40}\b(?:on\s+)?deploy\b",
            re.IGNORECASE,
        ),
        "Orphaned AgentTasks are not auto Failed/Partial on deploy — TB-943 open (TB-1563).",
    ),
    ClaimPattern(
        re.compile(
            r"\bterraform\b[^.\n]{0,60}\b(?:pins?|sets?|defines?)\b[^.\n]{0,40}\b"
            r"(?:worker\s+)?termination\s+grace\b[^.\n]{0,60}\b(?:ZDT|zero[-\s]downtime)\b",
            re.IGNORECASE,
        ),
        "Terraform does not pin a ZDT Worker termination-grace contract (TB-1563 / TB-961).",
    ),
    ClaimPattern(
        re.compile(
            r"\bzero[-\s]downtime\b[^.\n]{0,40}\bworker\b[^.\n]{0,60}\b(?:means?|implies?)\b[^.\n]{0,40}\b"
            r"(?:zero|no)\b[^.\n]{0,20}\binterrupted\b[^.\n]{0,20}\bwork\b",
            re.IGNORECASE,
        ),
        "Worker ZDT is capacity continuity — not zero interrupted work (TB-1563).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing Worker rolling-deploy claim map (TB-1563)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1564)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (GRACEFUL_SHUTDOWN_REL, ("AddArchLucidGracefulShutdown", "ShutdownTimeout")),
        (CRASH_RECOVERY_REL, ("**TB-1523**", "AuthorityPipelineWorkOutbox")),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing Worker rolling-deploy code anchor (TB-1564).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1564).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing Worker rolling-deploy honesty scan target."]
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


def worker_rolling_deploy_drain_handoff_honesty_violations(root: Path) -> list[str]:
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
    violations = worker_rolling_deploy_drain_handoff_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"worker rolling-deploy drain/handoff honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("worker rolling-deploy drain/handoff honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

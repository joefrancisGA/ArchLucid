#!/usr/bin/env python3
"""TB-1231 / M-211: Anti-Simulator-safe-equals-Real / forked-defense-stack honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "shared-hallucination-defense-plane-honesty: allow"

CONTRACT_REL = Path("docs/library/SHARED_HALLUCINATION_DEFENSE_PLANE_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/SHARED_HALLUCINATION_DEFENSE_PLANE_PA_ONE_PAGER.md")
TRACE_EVALUATOR_REL = Path("ArchLucid.AgentRuntime/Evaluation/AgentOutputTraceQualityEvaluator.cs")
CONTENT_SAFETY_REL = Path(
    "ArchLucid.AgentRuntime/Safety/ContentSafetyEnforcingAgentCompletionClient.cs"
)

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1230**",
    "**TB-1231**",
    "M-211",
    "Explicit non-claims",
    "CI anchors for **TB-1231**",
    "AgentOutputTraceQualityEvaluator",
    "SkipWhenSimulator",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "inv-002",
    "m-166",
    "tb-1230",
    "tb-1231",
    "m-211",
    "honesty guard",
    "non-claim",
    "config-only",
    "cost control",
    "≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bsimulator\b[^.\n]{0,80}\b(?:pilot\s*strict|quality\s+gate|quality\s+pass)\b"
            r"[^.\n]{0,80}\b(?:green|pass(?:es|ed)?)\b[^.\n]{0,60}\b(?:means?|proves?|equals?)\b"
            r"[^.\n]{0,40}\breal[-\s]safe\b",
            re.IGNORECASE,
        ),
        "Simulator PilotStrict/quality pass is not Real live-model sponsor safety (TB-1230 / M-166).",
    ),
    ClaimPattern(
        re.compile(
            r"\bsimulator\b[^.\n]{0,80}\b(?:green|pass(?:es|ed)?)\b[^.\n]{0,80}\b"
            r"(?:proves?|means?|guarantees?)\b[^.\n]{0,60}\b(?:real|live[-\s]model)\b[^.\n]{0,40}\bsafe",
            re.IGNORECASE,
        ),
        "Simulator quality pass does not prove Real-safe without INV-002 disclosure (TB-1230).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:parallel|separate|forked|distinct)\b[^.\n]{0,60}\b"
            r"(?:simulator|real)\b[^.\n]{0,60}\bdefense\s+stacks?\b",
            re.IGNORECASE,
        ),
        "One shared post-agent defense plane — not parallel Simulator vs Real stacks (TB-1230).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:simulator|real)\b[^.\n]{0,60}\b(?:and|vs\.?|versus)\b[^.\n]{0,60}\b(?:simulator|real)\b"
            r"[^.\n]{0,60}\b(?:defense|quality)\s+stacks?\b",
            re.IGNORECASE,
        ),
        "Mode varies thresholds/judges only — do not claim forked defense stacks (TB-1230).",
    ),
    ClaimPattern(
        re.compile(
            r"\bquick\s*start\s*forced\s*simulator\b[^.\n]{0,80}\b(?:proves?|means?)\b[^.\n]{0,60}\breal\b",
            re.IGNORECASE,
        ),
        "QuickStartForcedSimulator output is not Real execution proof (TB-1230 / INV-002).",
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
        "unsafe" in stripped
        or "forbid" in stripped
        or "too strong" in stripped
        or "intended fail" in stripped
        or "ci anchors" in stripped
    ):
        return True

    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL

    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing shared defense plane contract (TB-1230)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1231)."
        )

    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    anchors: tuple[tuple[Path, str], ...] = (
        (TRACE_EVALUATOR_REL, "AgentOutputTraceQualityEvaluator"),
        (CONTENT_SAFETY_REL, "ContentSafetyEnforcingAgentCompletionClient"),
    )

    for rel, symbol in anchors:
        path = root / rel

        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing shared defense plane code anchor (TB-1231).")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        if symbol not in text:
            violations.append(
                f"{rel.as_posix()}: expected {symbol!r} anchor (TB-1231)."
            )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing shared defense plane honesty scan target."]

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


def shared_hallucination_defense_plane_honesty_violations(root: Path) -> list[str]:
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

    violations = shared_hallucination_defense_plane_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Shared hallucination defense plane honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Shared hallucination defense plane honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

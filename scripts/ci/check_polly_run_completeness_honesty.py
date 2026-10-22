#!/usr/bin/env python3
"""TB-996 / M-146: Polly ≠ run-completeness honesty CI.

Fails dishonest stubs that claim Polly retries / circuit breaker guarantee multi-agent run
completeness, cache safety, or admit-before-spend without citing TB-995 / M-146.

Contract: docs/library/POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md (TB-995).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "polly-run-completeness-honesty: allow"

CONTRACT_REL = Path("docs/library/POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md")
LLM_RETRY_REL = Path("docs/library/LLM_RETRY_AND_CIRCUIT_BREAKER.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/POLLY_VS_RUN_LEVEL_SURFACE_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-995**",
    "**TB-996**",
    "M-146",
    "M-147",
    "Polly / CB covers?",
    "Explicit non-claims",
)

REQUIRED_LLM_RETRY_MARKERS: tuple[str, ...] = (
    "POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md",
    "TB-995",
    "TB-996",
)

CACHE_CLIENT_REL = Path("ArchLucid.AgentRuntime/Caching/CachingLlmCompletionClient.cs")

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "≠",
    "!=",
    "does not",
    "doesn't",
    "transport",
    "per-call",
    "tb-995",
    "tb-996",
    "m-146",
    "m-147",
    "forbidden",
    "too strong",
    "honesty guard",
    "non-claim",
    "residual",
    "open follow-on",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:polly|circuit\s+breaker)\b[^.\n]{0,120}\b(?:always|guarantee[ds]?|ensures?)\b[^.\n]{0,80}\b(?:complete|finish|complet(?:e|ion))\b",
            re.IGNORECASE,
        ),
        "Do not claim Polly/CB guarantees multi-agent run completion (TB-995 / M-146).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:polly|transport\s+resilien(?:ce|t))\b[^.\n]{0,120}\b(?:means|so)\b[^.\n]{0,80}\b(?:runs?\s+always|every\s+run)\b[^.\n]{0,60}\b(?:complete|finish)\b",
            re.IGNORECASE,
        ),
        "Transport resilience ≠ run completeness — cite POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md.",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:polly|circuit\s+breaker)\b[^.\n]{0,120}\b(?:never|cannot|can't)\b[^.\n]{0,80}\b(?:serve|return)\b[^.\n]{0,60}\b(?:bad|poisoned|stale)\b[^.\n]{0,40}\bcache\b",
            re.IGNORECASE,
        ),
        "Do not claim Polly/CB prevents poisoned completion cache (TB-940 / TB-944 residuals).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:polly|circuit\s+breaker)\b[^.\n]{0,120}\b(?:admit[-\s]?before[-\s]?spend|budget)\b",
            re.IGNORECASE,
        ),
        "Do not claim Polly/CB owns admit-before-spend or run budget (TB-939 / TB-941).",
    ),
    ClaimPattern(
        re.compile(
            r"\bllm\s+resilien(?:ce|t)\b[^.\n]{0,120}\b(?:guarantee[ds]?|means)\b[^.\n]{0,80}\b(?:finished|finalized)\b[^.\n]{0,60}\b(?:review|package|run)\b",
            re.IGNORECASE,
        ),
        "LLM resilience is per-call transport — not a finished architecture package (TB-995).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing Polly vs run-level contract (TB-995)."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-996)."
        )

    return violations


def llm_retry_bridge_violations(root: Path) -> list[str]:
    path = root / LLM_RETRY_REL

    if not path.is_file():
        return [f"{LLM_RETRY_REL.as_posix()}: missing LLM retry doc."]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_LLM_RETRY_MARKERS):
        violations.append(
            f"{LLM_RETRY_REL.as_posix()}: missing TB-996 bridge marker {marker!r}."
        )

    return violations


def cache_admission_anchor_violations(root: Path) -> list[str]:
    path = root / CACHE_CLIENT_REL

    if not path.is_file():
        return [f"{CACHE_CLIENT_REL.as_posix()}: missing CachingLlmCompletionClient."]

    text = path.read_text(encoding="utf-8", errors="replace")

    if "TB-940" not in text:
        return [
            f"{CACHE_CLIENT_REL.as_posix()}: must keep TB-940 schema-admission anchor visible (TB-996)."
        ]

    return []


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing Polly run-completeness honesty scan target."]

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


def polly_run_completeness_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(llm_retry_bridge_violations(root))
    violations.extend(cache_admission_anchor_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = polly_run_completeness_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Polly run-completeness honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Polly run-completeness honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

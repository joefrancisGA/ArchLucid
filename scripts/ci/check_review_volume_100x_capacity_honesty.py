#!/usr/bin/env python3
"""TB-1337 / M-237: Anti-SQL-fails-first-at-100x / premature-blob / replicas-fix-TPM honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "review-volume-100x-capacity-honesty: allow"

CONTRACT_REL = Path(
    "docs/library/REVIEW_VOLUME_100X_FAILURE_ORDER_AND_OPTION_PRESERVING_CAPACITY_CONTRACT.md"
)
SCALE_RUNBOOK_REL = Path("docs/library/SCALE_THRESHOLD_RUNBOOK.md")
DEGRADED_MODE_REL = Path("docs/library/DEGRADED_MODE.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1336**",
    "**TB-1337**",
    "M-237",
    "Explicit non-claims",
    "CI anchors for **TB-1337**",
    "LLM quota",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "tb-1032",
    "tb-1336",
    "tb-1337",
    "tb-947",
    "m-237",
    "honesty guard",
    "non-claim",
    "≠",
    "hard-first",
    "tpm",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:at|with)\b[^.\n]{0,20}\b100\s*[×x]\b[^.\n]{0,80}\b"
            r"(?:sql|manifest)\b[^.\n]{0,60}\b(?:fails?|breaks?)\s+first\b",
            re.IGNORECASE,
        ),
        "LLM quota fails first on sustained Real volume — not SQL manifests (TB-1336).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:blob\s+offload|durable\s+functions|dtf)\b[^.\n]{0,80}\b"
            r"(?:is|are)\b[^.\n]{0,40}\b(?:the\s+)?(?:cheapest|required)\b[^.\n]{0,40}\bv1\b",
            re.IGNORECASE,
        ),
        "Premature blob/DTF as cheapest V1 move without measured evidence (TB-1336).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:more|additional)\b[^.\n]{0,30}\b(?:api|worker)?\s*replicas?\b[^.\n]{0,80}\b"
            r"(?:creates?|gives?|adds?|means?)\b[^.\n]{0,40}\b(?:more\s+)?(?:llm|aoai|openai)\b"
            r"[^.\n]{0,30}\b(?:throughput|tpm)\b",
            re.IGNORECASE,
        ),
        "Replicas do not create AOAI TPM — TB-947 sizing (TB-1336).",
    ),
    ClaimPattern(
        re.compile(
            r"\bscale[-\s]out\b[^.\n]{0,60}\b(?:removes?|eliminates?|fixes?)\b[^.\n]{0,40}\b429\b",
            re.IGNORECASE,
        ),
        "Scale-out does not remove AOAI 429 ceilings without TPM uplift (TB-1336).",
    ),
    ClaimPattern(
        re.compile(
            r"\borchestration\b[^.\n]{0,60}\bqueue\s+lag\b[^.\n]{0,80}\b"
            r"(?:loses?|loses|destroys?)\b[^.\n]{0,40}\b(?:committed|sealed)\b[^.\n]{0,30}\bpackage\b",
            re.IGNORECASE,
        ),
        "Queue lag is soft SLA — not committed-package loss (TB-1336).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing 100x capacity contract (TB-1336)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1337)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (SCALE_RUNBOOK_REL, ("Signals to scale",)),
        (DEGRADED_MODE_REL, ("Degraded mode",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing 100x capacity code anchor (TB-1337).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1337).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing 100x capacity honesty scan target."]
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


def review_volume_100x_capacity_honesty_violations(root: Path) -> list[str]:
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
    violations = review_volume_100x_capacity_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Review volume 100x capacity honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("Review volume 100x capacity honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""TB-1457 / M-261: Bake-off 15-minute loser-sequence honesty CI.

Fails dishonest stubs that:
- Stage EA/portfolio tools as 15-minute bake-off losers without complement/SoR framing.
- Claim smarter-than-GPT / beats-ChatGPT / cheaper-than-seats without M-42 caveats.
- Publish measured manual/diagram/GRC kill rates without M-20 labeling.
- Claim the 15-minute bake-off protocol is complete cohort proof without package-spine language.

Contract: docs/library/BAKEOFF_15MIN_LOSER_SEQUENCE.md (TB-1456).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "bakeoff-15min-honesty: allow"

CONTRACT_REL = Path("docs/library/BAKEOFF_15MIN_LOSER_SEQUENCE.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/COMPETITIVE_POSITIONING.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md"),
    Path("docs/go-to-market/GENERIC_AI_BAKEOFF_PROTOCOL.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/library/WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md"),
    Path("fixtures/bakeoff/session-template/sponsor-safe-summary.template.md"),
    Path("fixtures/bakeoff/session-template/session-notes.template.md"),
    Path("fixtures/bakeoff/frontier-ai-scoreboard.template.md"),
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**Done**",
    "TB-1456",
    "Manual ARB",
    "Loses first",
    "complement",
    "M-42",
    "M-20",
    "goldenManifestId",
    "sponsor export",
)

REQUIRED_PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "bakeoff-15min-loser-sequence-m-262",
    "TB-1457",
    "manual ARB packaging loses first",
    "EA is complement/SoR",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "do not:",
    "don't",
    "must not",
    "never ",
    "not claim",
    "not promise",
    "forbid",
    "forbidden",
    "before m-42",
    "pre-m-42",
    "without m-42",
    "defer",
    "treat ",
    "rewrite",
    "anti-pattern",
    "anti-claim",
    "hypothesis",
    "not measured",
    "remains m-20",
    "without m-20",
    "complement",
    "out of 15-min bake-off",
    "out of bake-off",
    "review finding",
    "external claim gate",
    "verbs never",
    "say manual",
    "do-not-promise",
    "unprovable",
    "language in external",
    'no "smarter',
    "always faster / cheaper / smarter",
)


@dataclass(frozen=True)
class _LineRelativeMatch:
    start_offset: int
    end_offset: int

    def start(self) -> int:
        return self.start_offset

    def end(self) -> int:
        return self.end_offset


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:LeanIX|EA\s+tool(?:ing)?|portfolio\s+tool(?:ing)?)\b[^.\n]{0,140}"
            r"\b(?:lost|loses|lose|loser)\b[^.\n]{0,80}\b(?:15[-\s]?min(?:ute)?\s+)?bake[-\s]?off",
            re.IGNORECASE,
        ),
        "EA/portfolio tooling must not be staged as a 15-minute bake-off loser (frame as complement/SoR).",
        "docs/library/BAKEOFF_15MIN_LOSER_SEQUENCE.md",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:15[-\s]?min(?:ute)?\s+)?bake[-\s]?off\b[^.\n]{0,140}"
            r"\b(?:LeanIX|EA\s+tool(?:ing)?)\b[^.\n]{0,80}\b(?:lost|loses|lose|loser)\b",
            re.IGNORECASE,
        ),
        "EA/portfolio tooling must not be staged as a 15-minute bake-off loser (frame as complement/SoR).",
        "docs/library/BAKEOFF_15MIN_LOSER_SEQUENCE.md",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:ArchLucid|we|our product)\b[^.\n]{0,40}\bbeats?\s+(?:ChatGPT|Copilot|Claude|frontier\s+AI)\b",
            re.IGNORECASE,
        ),
        "Do not claim ArchLucid beats frontier AI seats without M-42 cohort synthesis (TB-1365).",
        "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#why-not-chatgpt-copilot-m-244",
    ),
    ClaimPattern(
        re.compile(
            r"\bsmarter\s+than\s+(?:GPT|ChatGPT|Copilot|Claude|frontier\s+AI)\b",
            re.IGNORECASE,
        ),
        "Do not claim ArchLucid is smarter than frontier AI without M-42 synthesis.",
        "docs/library/BAKEOFF_15MIN_LOSER_SEQUENCE.md",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:always|universally)\s+beats?\s+(?:frontier\s+AI|ChatGPT|Copilot|Claude)\b",
            re.IGNORECASE,
        ),
        "Do not claim universal beats-frontier-AI superiority without M-42 caveats.",
        "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#why-not-chatgpt-copilot-m-244",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:cheaper|lower)\s+TCO\s+than\s+(?:Copilot|ChatGPT|frontier)\s+seats?\b",
            re.IGNORECASE,
        ),
        "Do not claim cheaper TCO than Copilot/frontier seats without M-42 synthesis.",
        "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#why-not-chatgpt-copilot-m-244",
    ),
    ClaimPattern(
        re.compile(
            r"\bmeasured\s+(?:deal[-\s]?loss|kill|win(?:/loss)?)\s+(?:rate|frequency)\b",
            re.IGNORECASE,
        ),
        "Measured kill/win frequency requires M-20 cohort logging; label as hypothesis until then.",
        "docs/library/BAKEOFF_15MIN_LOSER_SEQUENCE.md",
    ),
    ClaimPattern(
        re.compile(
            r"\b\d{1,3}\s*%\s+of\s+deals?\s+(?:lost|killed)\s+(?:to|by)\s+(?:manual|diagram|GRC)\b",
            re.IGNORECASE,
        ),
        "Percent deal-loss claims among manual/diagram/GRC require M-20; use hypothesis language until then.",
        "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#competitive-deal-loss-closing-evidence-m-187",
    ),
    ClaimPattern(
        re.compile(
            r"\b15[-\s]?min(?:ute)?\s+bake[-\s]?off\s+(?:protocol\s+)?(?:complete|completed|done|validated|proven)\b",
            re.IGNORECASE,
        ),
        "15-minute bake-off protocol completion is not cohort proof; cite package-spine commit/export (TB-1030).",
        "docs/library/BAKEOFF_15MIN_LOSER_SEQUENCE.md",
    ),
)


def _normalize_line(line: str) -> str:
    normalized = line

    for marker in ("*", "_", "`"):
        normalized = normalized.replace(marker, "")

    return normalized.lower()


def _match_is_quoted_forbidden_example(line: str, match: re.Match[str]) -> bool:
    # Three-or-more-column tables often place quoted forbidden phrasing in the last cell.
    if "|" not in line:
        return False

    parts = line.split("|")

    if len(parts) < 4:
        return False

    cells = [part.strip() for part in parts[1:-1]]

    if len(cells) < 3:
        return False

    last_cell = cells[-1]
    cell_start = line.rfind(last_cell)

    if cell_start < 0:
        return False

    quote_pairs = (
        ('"', '"'),
        ("“", "”"),
    )

    for open_quote, close_quote in quote_pairs:
        open_index = last_cell.find(open_quote)

        if open_index < 0:
            continue

        close_index = last_cell.find(close_quote, open_index + len(open_quote))

        if close_index < 0:
            continue

        quoted_start = cell_start + open_index
        quoted_end = cell_start + close_index + len(close_quote)

        if quoted_start <= match.start() and match.end() <= quoted_end:
            return True

    return False


def _line_is_forbidden_example(line: str, match: re.Match[str]) -> bool:
    if _match_is_quoted_forbidden_example(line, match):
        return True

    stripped = line.lstrip().lower()

    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no “" in stripped):
        return True

    return False


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())

    if line_end == -1:
        line_end = len(text)

    return text[line_start:line_end]


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    missing: list[str] = []

    for marker in markers:
        if marker.lower() not in lowered:
            missing.append(marker)

    return missing


def contract_violations(root: Path) -> list[str]:
    violations: list[str] = []
    contract_path = root / CONTRACT_REL

    if not contract_path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing bake-off contract (TB-1456)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1456 / M-261)."
        )

    return violations


def procurement_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    rel = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing procurement packet for M-262 bake-off anchors"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PROCUREMENT_ANCHORS):
        violations.append(
            f"{rel.as_posix()}: missing required bake-off honesty anchor {marker!r} (M-262 / TB-1457)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted bake-off honesty scan target"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_start = text.rfind("\n", 0, match.start()) + 1
            line_match = _LineRelativeMatch(match.start() - line_start, match.end() - line_start)
            line_lower = _normalize_line(line)

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, line_match) or _line_has_caveat(line_lower):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                f"Source of truth: {claim.source_of_truth}."
            )

    return violations


def bakeoff_15min_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(procurement_anchor_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found (local exploration).",
    )
    args = parser.parse_args(argv)

    violations = bakeoff_15min_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Bake-off 15-min honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Bake-off 15-min honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

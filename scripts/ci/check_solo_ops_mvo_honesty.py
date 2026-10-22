#!/usr/bin/env python3
"""TB-991 / M-142: Solo-operator MVO honesty CI.

Fails when:
- ``SOLO_OPERATOR_MVO_OBSERVABILITY.md`` drops required honesty anchors.
- Buyer-facing copy claims per-tenant / review-path paging while **TB-958**/**TB-959** are open.
- ``prometheus_p0_rules.tf`` routes P0 rules to the ops action group instead of critical.

Pairs **TB-989** contract intent and Done **TB-957** enablement doc.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "solo-ops-mvo-honesty: allow"

MVO_DOC_REL = Path("docs/operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md")
TECH_BACKLOG_REL = Path("docs/library/TECH_BACKLOG.md")
P0_RULES_REL = Path("infra/terraform-monitoring/prometheus_p0_rules.tf")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    MVO_DOC_REL,
)

REQUIRED_MVO_MARKERS: tuple[str, ...] = (
    "TB-958",
    "TB-959",
    "Do not promise",
    "critical action group",
    "Report Problem",
    "Honesty boundaries",
    "TB-991",
)

_SINGLE_TENANT_GAP_IDS: tuple[str, ...] = ("TB-958", "TB-959")

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "never ",
    "not promise",
    "not claim",
    "≠",
    "does not prove",
    "until tb-958",
    "until tb-959",
    "open follow-on",
    "open **tb-958",
    "forbidden",
    "≠ per-tenant",
    "fleet p0",
    "report problem",
    "inbox-by-design",
    "support email",
    "support inbox",
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


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bevery\s+tenant(?:[-\s]affecting)?\s+failure\s+pages\b",
            re.IGNORECASE,
        ),
        "Do not claim every tenant failure pages before support while TB-958/TB-959 are open.",
    ),
    ClaimPattern(
        re.compile(
            r"\bpages?\s+(?:the\s+)?founder\s+before\s+(?:the\s+)?customer\b",
            re.IGNORECASE,
        ),
        "Do not claim the founder always pages before the customer opens a ticket.",
    ),
    ClaimPattern(
        re.compile(
            r"\bevery\s+failure\s+pages\b",
            re.IGNORECASE,
        ),
        "Do not claim every failure pages while single-tenant gaps remain open.",
    ),
    ClaimPattern(
        re.compile(
            r"\bper-tenant\s+paging\s+(?:is\s+)?(?:live|enabled|in\s+place|shipped)\b",
            re.IGNORECASE,
        ),
        "Do not claim per-tenant paging is live before TB-958 closes.",
    ),
    ClaimPattern(
        re.compile(
            r"\breview-path\s+canary\s+(?:is\s+)?(?:always\s+)?(?:on|enabled|pages)\b",
            re.IGNORECASE,
        ),
        "Do not claim review-path canary paging is always on before TB-959 closes.",
    ),
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    missing: list[str] = []

    for marker in markers:
        if marker.lower() not in lowered:
            missing.append(marker)

    return missing


def _summary_row_is_open(line: str, backlog_id: str) -> bool:
    if not line.startswith(f"| {backlog_id} |"):
        return False

    if "**Done**" in line or line.startswith("~~"):
        return False

    return True


def open_single_tenant_gap_ids(root: Path) -> set[str]:
    backlog_path = root / TECH_BACKLOG_REL

    if not backlog_path.is_file():
        return set(_SINGLE_TENANT_GAP_IDS)

    open_ids: set[str] = set()

    for line in backlog_path.read_text(encoding="utf-8", errors="replace").splitlines():
        for backlog_id in _SINGLE_TENANT_GAP_IDS:
            if _summary_row_is_open(line, backlog_id):
                open_ids.add(backlog_id)

    return open_ids


def mvo_doc_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / MVO_DOC_REL

    if not path.is_file():
        return [f"{MVO_DOC_REL.as_posix()}: missing solo-operator MVO doc (TB-957)."]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_MVO_MARKERS):
        violations.append(
            f"{MVO_DOC_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-991)."
        )

    open_gap_ids = open_single_tenant_gap_ids(root)

    if open_gap_ids and re.search(r"shipped\s+follow-?on", text, re.IGNORECASE):
        violations.append(
            f"{MVO_DOC_REL.as_posix()}: must not label TB-958/TB-959 as shipped while summary rows remain open."
        )

    return violations


def p0_rules_wiring_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / P0_RULES_REL

    if not path.is_file():
        return [f"{P0_RULES_REL.as_posix()}: missing P0 Prometheus rules file."]

    text = path.read_text(encoding="utf-8", errors="replace")

    if "action_group.ops" in text:
        violations.append(
            f"{P0_RULES_REL.as_posix()}: P0 rules must route to critical action group, not ops (TB-991)."
        )

    if "action_group_id" in text and "action_group.critical" not in text:
        violations.append(
            f"{P0_RULES_REL.as_posix()}: expected azurerm_monitor_action_group.critical wiring for P0 rules."
        )

    return violations


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())

    if line_end == -1:
        line_end = len(text)

    return text[line_start:line_end]


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


_QUOTE_CHARS: tuple[str, ...] = ('"', '"', "\u201c", "\u201d", "\u2018", "\u2019")
_QUOTE_PAIRS: tuple[tuple[str, str], ...] = (
    ('"', '"'),
    ("\u201c", "\u201d"),
)


def _quoted_spans_in_segment(segment: str, base_offset: int) -> list[tuple[int, int]]:
    spans: list[tuple[int, int]] = []
    cursor = 0

    while cursor < len(segment):
        best_open: int | None = None
        best_close = -1
        best_close_quote = ""

        for open_quote, close_quote in _QUOTE_PAIRS:
            open_index = segment.find(open_quote, cursor)

            if open_index < 0:
                continue

            close_index = segment.find(close_quote, open_index + len(open_quote))

            if close_index < 0:
                continue

            if best_open is None or open_index < best_open:
                best_open = open_index
                best_close = close_index
                best_close_quote = close_quote

        if best_open is None or best_close < 0:
            break

        span_start = base_offset + best_open
        span_end = base_offset + best_close + len(best_close_quote)
        spans.append((span_start, span_end))
        cursor = best_close + len(best_close_quote)

    return spans


def _match_is_quoted_forbidden_example(line: str, match: _LineRelativeMatch) -> bool:
    if "|" in line:
        parts = line.split("|")

        if len(parts) >= 4:
            cells = [part.strip() for part in parts[1:-1]]

            if len(cells) >= 3:
                last_cell = cells[-1]
                cell_start = line.rfind(last_cell)

                if cell_start >= 0:
                    for span_start, span_end in _quoted_spans_in_segment(last_cell, cell_start):
                        if span_start <= match.start() and match.end() <= span_end:
                            return True

    prefix = line[: match.start()]
    quote_count = sum(prefix.count(quote_char) for quote_char in _QUOTE_CHARS)

    return quote_count % 2 == 1


def _line_is_forbidden_example(line: str, match: _LineRelativeMatch) -> bool:
    return _match_is_quoted_forbidden_example(line, match)


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing solo-ops MVO honesty scan target"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_start = text.rfind("\n", 0, match.start()) + 1
            line_match = _LineRelativeMatch(match.start() - line_start, match.end() - line_start)
            line_lower = line.lower()

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, line_match) or _line_has_caveat(line_lower):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`."
            )

    return violations


def solo_ops_mvo_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(mvo_doc_violations(root))
    violations.extend(p0_rules_wiring_violations(root))

    if not open_single_tenant_gap_ids(root):
        return violations

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

    violations = solo_ops_mvo_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Solo-ops MVO honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Solo-ops MVO honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

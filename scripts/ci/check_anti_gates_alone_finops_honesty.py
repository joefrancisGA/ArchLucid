#!/usr/bin/env python3
"""TB-1288 / M-225: Anti-gates-alone FinOps / call-site-reserve / SDK-bypass honesty CI.

Fails dishonest stubs that:
- Equate warn/kill + monthly cap alone with mature LLM cost-control architecture.
- Claim call-site reserve/settle prevents bypass without LlmCompletionAccountingClient.
- Approve constructing wire/SDK clients outside the registered decorator chain for product hosts.
- Re-assert stale cohort $50/month cap contradicting budget.config.json ($15 since 2026-06-06).

Contract: docs/library/LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md (TB-1287).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "anti-gates-alone-finops-honesty: allow"

CONTRACT_REL = Path("docs/library/LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/LLM_COST_CONTROL_PLANE_PA_ONE_PAGER.md")
COHORT_BUDGET_CONFIG_REL = Path("tests/golden-cohort/budget.config.json")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1287**",
    "LlmCompletionAccountingClient",
    "**$15**",
    "M-225",
    "**TB-1288**",
)

REQUIRED_PA_ONE_PAGER_MARKERS: tuple[str, ...] = (
    "LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md",
    "TB-1287",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "too strong",
    "forbidden",
    "anti-claim",
    "do-not-promise",
    "does not",
    "doesn't",
    "cannot",
    "can't",
    "not ",
    "no ",
    "unsafe",
    "honest",
    "chokepoint",
    "decorator",
    "llmcompletionaccountingclient",
    "beyond-gate",
    "beyond gate",
    "not sufficient alone",
    "necessary but not sufficient",
    "not alone",
    "alone are not",
    "alone is not",
    "≠",
    "!=",
    "m-225",
    "m-226",
    "tb-1287",
    "tb-1288",
    "$15",
    "retired",
    "do not re-assert",
    "stale",
    "forbid",
    "bypass prevention",
    "inject, don't construct",
    "review finding",
    "too strong",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:warn/kill|warn\s+and\s+kill)\b[^.\n]{0,120}\b(?:monthly\s+cap|monthly\s+budget)\b[^.\n]{0,120}\b(?:alone|=|are|is)\b[^.\n]{0,80}\b(?:mature\s+finops|complete\s+cost[-\s]?control|full\s+cost[-\s]?control)\b",
            re.IGNORECASE,
        ),
        "Do not equate warn/kill + monthly cap alone with mature FinOps (TB-1287 / M-225).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:monthly\s+cap|monthly\s+budget|warn/kill)\b[^.\n]{0,120}\b(?:alone|by themselves?)\b[^.\n]{0,80}\b(?:mature\s+finops|complete\s+cost[-\s]?control|sufficient)\b",
            re.IGNORECASE,
        ),
        "Budget gates alone are not mature FinOps — cite chokepoint + beyond-gate controls (TB-1287).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:caps?|gates?|budget\s+gates?)\s+alone\b[^.\n]{0,80}\b(?:=|are|is|mean)\b[^.\n]{0,80}\b(?:mature\s+finops|complete\s+cost[-\s]?control)\b",
            re.IGNORECASE,
        ),
        "Caps/gates alone ≠ mature FinOps — accounting chokepoint required (TB-1287 / M-225).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:mature\s+finops|mature\s+cost[-\s]?control)\b[^.\n]{0,120}\b(?:warn/kill|monthly\s+cap|monthly\s+budget)\b[^.\n]{0,80}\b(?:alone|only)\b",
            re.IGNORECASE,
        ),
        "Mature FinOps requires beyond-gate controls — not warn/kill + monthly cap only (TB-1287).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bcall[-\s]?site\s+reserve\b[^.\n]{0,120}\b(?:prevents?|stops?|blocks?)\b[^.\n]{0,80}\b(?:bypass|sdk|new\s+(?:completion|call)\s+path)\b",
            re.IGNORECASE,
        ),
        "Call-site reserve does not prevent bypass — DI LlmCompletionAccountingClient chokepoint required (TB-1287).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:handler[-\s]?level|call[-\s]?site)\b[^.\n]{0,80}\breserve(?:/settle)?\b[^.\n]{0,120}\b(?:prevents?|stops?|blocks?)\b[^.\n]{0,80}\b(?:bypass|sdk)\b",
            re.IGNORECASE,
        ),
        "Handler-level reserve/settle does not prevent SDK bypass without chokepoint decorator (TB-1287).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:call[-\s]?site\s+reserve|handler[-\s]?level\s+reserve)\b[^.\n]{0,120}\b(?:substitute|replacement|enough|sufficient)\b[^.\n]{0,80}\b(?:chokepoint|accounting)\b",
            re.IGNORECASE,
        ),
        "Call-site reserve is not a substitute for LlmCompletionAccountingClient chokepoint (TB-1287).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:product\s+hosts?|any\s+host)\b[^.\n]{0,120}\b(?:may|can|should)\b[^.\n]{0,80}\b(?:call|use|invoke)\b[^.\n]{0,80}\b(?:azure\s+openai\s+sdk|openai\s+sdk)\b[^.\n]{0,80}\b(?:directly|outside\s+di)\b",
            re.IGNORECASE,
        ),
        "Product hosts must not call Azure OpenAI SDK directly outside DI decorator chain (TB-1287 / ADR 0005).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:construct(?:ing)?|creat(?:e|ing))\b[^.\n]{0,80}\b(?:wire|sdk)\s+clients?\b[^.\n]{0,120}\b(?:outside|bypass(?:ing)?)\b[^.\n]{0,80}\b(?:decorator|di|registered)\b[^.\n]{0,80}\b(?:approved|allowed|acceptable|pattern)\b",
            re.IGNORECASE,
        ),
        "Constructing wire/SDK clients outside decorator chain is not approved for product hosts (TB-1287).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bnew\s+AzureOpenAiCompletionClient\b",
            re.IGNORECASE,
        ),
        "Do not construct AzureOpenAiCompletionClient outside host registration (TB-1287 / ADR 0005).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:golden[-\s]?cohort|cohort)\b[^.\n]{0,120}(?:\$50|50\s*(?:usd|dollars?))(?:/month|(?:\s+per\s+month)|(?:\s+monthly))",
            re.IGNORECASE,
        ),
        "Cohort cap is $15/month since 2026-06-06 — do not re-assert stale $50 cohort cap (TB-1287 / budget.config.json).",
        COHORT_BUDGET_CONFIG_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"(?:\$50|50\s*(?:usd|dollars?))(?:/month|(?:\s+per\s+month)|(?:\s+monthly))[^.\n]{0,120}\b(?:golden[-\s]?cohort|cohort)\b",
            re.IGNORECASE,
        ),
        "Cohort cap is $15/month since 2026-06-06 — do not re-assert stale $50 cohort cap (TB-1287).",
        COHORT_BUDGET_CONFIG_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bmonthlyTokenBudgetUsd\b[^.\n]{0,40}\b50\b",
            re.IGNORECASE,
        ),
        "budget.config.json pins monthlyTokenBudgetUsd at 15 — do not claim cohort cap is 50 (TB-1287).",
        COHORT_BUDGET_CONFIG_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bcohort\s+cap\b[^.\n]{0,80}\b(?:is\s+still|remains?|stays?)\b[^.\n]{0,40}\$50\b",
            re.IGNORECASE,
        ),
        "Cohort cap is $15 — stale $50 claims contradict budget.config.json (TB-1287).",
        COHORT_BUDGET_CONFIG_REL.as_posix(),
    ),
)


def _normalize_line(line: str) -> str:
    normalized = line

    for marker in ("*", "_", "`"):
        normalized = normalized.replace(marker, "")

    return normalized.lower()


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())

    if line_end == -1:
        line_end = len(text)

    return text[line_start:line_end]


def _match_is_quoted_forbidden_example(line: str, match: re.Match[str]) -> bool:
    if "|" not in line:
        return False

    parts = line.split("|")

    if len(parts) < 4:
        return False

    cells = [part.strip() for part in parts[1:-1]]

    if len(cells) < 2:
        return False

    for cell in cells:
        for open_quote, close_quote in (('"', '"'), ("“", "”")):
            open_index = cell.find(open_quote)

            if open_index < 0:
                continue

            close_index = cell.find(close_quote, open_index + len(open_quote))

            if close_index < 0:
                continue

            cell_start = line.find(cell)

            if cell_start < 0:
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

    if stripped.startswith("|") and ("unsafe" in stripped or "forbid" in stripped or "too strong" in stripped):
        return True

    return False


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


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
        return [f"{CONTRACT_REL.as_posix()}: missing LLM cost-control plane contract (TB-1287)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1287 / TB-1288)."
        )

    return violations


def pa_one_pager_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / PA_ONE_PAGER_REL

    if not path.is_file():
        return [f"{PA_ONE_PAGER_REL.as_posix()}: missing PA one-pager (M-226)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PA_ONE_PAGER_MARKERS):
        violations.append(
            f"{PA_ONE_PAGER_REL.as_posix()}: missing required PA anchor {marker!r} (M-226 / TB-1288)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted anti-gates-alone FinOps honesty scan target"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = _normalize_line(line)

            if _line_is_allowlisted(line) or _line_is_forbidden_example(line, match) or _line_has_caveat(line_lower):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                f"Source of truth: {claim.source_of_truth}."
            )

    return violations


def anti_gates_alone_finops_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(pa_one_pager_violations(root))

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

    violations = anti_gates_alone_finops_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Anti-gates-alone FinOps honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Anti-gates-alone FinOps honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

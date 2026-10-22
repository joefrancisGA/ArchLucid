#!/usr/bin/env python3
"""TB-1578 / M-296: Anti-fair-share-TPM / anti-replicas-isolate-LLM / anti-silent-starvation honesty CI.

Fails dishonest stubs that:
- Claim per-tenant fair share / WFQ of shared Azure OpenAI TPM.
- Claim token budgets isolate tenants from each other's AOAI load.
- Claim more Container Apps replicas fix noisy-neighbor LLM or equal more TPM.
- Claim 429 yields graceful/queued Real success, authority slots equal LLM fairness,
  or tenant B silently starves while looking healthy.

Contract: docs/library/SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md (TB-1577).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "shared-aoai-tpm-noisy-neighbor-honesty: allow"

CONTRACT_REL = Path("docs/library/SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/SHARED_AOAI_TPM_NOISY_NEIGHBOR_PA_ONE_PAGER.md")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1577**",
    "**TB-1578**",
    "M-296",
    "WFQ",
    "Partial / Failed",
    "**TB-1336**",
    "**TB-1299**",
    "**TB-947**",
)

REQUIRED_PA_ONE_PAGER_MARKERS: tuple[str, ...] = (
    "SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md",
    "TB-1577",
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
    "not shipped",
    "no cross-tenant",
    "no wfq",
    "not fair",
    "≠",
    "!=",
    "m-296",
    "m-297",
    "tb-1577",
    "tb-1578",
    "tb-1336",
    "tb-1299",
    "tb-947",
    "tb-915",
    "forbid",
    "unsafe",
    "honest",
    "spend/http",
    "spend and http",
    "own spend",
    "amplify",
    "same tpm",
    "fail-closed",
    "partial/failed",
    "partial / failed",
    "not silent",
    "contrast only",
    "review finding",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bper[-\s]?tenant\b[^.\n]{0,80}\bfair\s+share\b[^.\n]{0,80}\b(?:of\s+)?(?:shared\s+)?(?:aoai\s+|azure\s+openai\s+)?tpm\b",
            re.IGNORECASE,
        ),
        "Do not claim per-tenant fair share of shared AOAI TPM (TB-1577 / M-296).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bfair\s+share\b[^.\n]{0,80}\b(?:of\s+)?(?:shared\s+)?(?:aoai\s+|azure\s+openai\s+)?tpm\b",
            re.IGNORECASE,
        ),
        "Shared AOAI TPM has no fair-share partition today (TB-1577 / TB-1578).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bwfq\b[^.\n]{0,80}\b(?:across|between)\b[^.\n]{0,40}\btenants?\b",
            re.IGNORECASE,
        ),
        "WFQ across tenants is not shipped (TB-1577 / M-296).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:we\s+)?(?:have|ship|provide|offer)\b[^.\n]{0,80}\b(?:wfq|fair\s+queue|weighted\s+fair)\b",
            re.IGNORECASE,
        ),
        "Do not claim WFQ / fair queue ships for shared TPM (TB-1577).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\btoken\s+budgets?\b[^.\n]{0,100}\bisolat(?:e|es|ing)\b[^.\n]{0,100}\b(?:tenants?|aoai|azure\s+openai|tpm)\b",
            re.IGNORECASE,
        ),
        "Token budgets stop own overspend — they do not isolate tenants from peers' AOAI load (TB-1577).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:llm\s+)?(?:token\s+)?budgets?\b[^.\n]{0,80}\bisolat(?:e|es)\b[^.\n]{0,80}\btenants?\b[^.\n]{0,80}\b(?:from\s+each\s+other|from\s+peers?)\b",
            re.IGNORECASE,
        ),
        "Budgets are own-spend caps — shared TPM/breaker still couples tenants (TB-1577 / M-296).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:more\s+)?(?:ca\s+|container\s+apps?\s+)?replicas?\b[^.\n]{0,100}\b(?:fix|fixes?|solve|solves?|eliminate|eliminates?)\b[^.\n]{0,80}\b(?:noisy[-\s]?neighbor|tpm\s+contention)\b",
            re.IGNORECASE,
        ),
        "More CA replicas do not fix noisy-neighbor LLM — they amplify concurrency into the same TPM (TB-1577).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\breplicas?\b[^.\n]{0,60}\b(?:=|equal|equals?|mean|means?)\b[^.\n]{0,60}\b(?:more\s+)?tpm\b",
            re.IGNORECASE,
        ),
        "Replicas ≠ more TPM on a shared AOAI deployment (TB-1577 / TB-947).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b429\b[^.\n]{0,80}\b(?:yields?|means?|becomes?|results?\s+in)\b[^.\n]{0,80}\b(?:graceful\s+)?(?:real\s+)?success\b",
            re.IGNORECASE,
        ),
        "429 does not yield graceful Real success — retry then Partial/Failed (TB-1577 / TB-1299).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bqueued\s+real\s+success\b",
            re.IGNORECASE,
        ),
        "Queued Real success is not the shared-TPM contention outcome (TB-1577 / TB-1299).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\b429\b[^.\n]{0,80}\bqueued\s+real\b",
            re.IGNORECASE,
        ),
        "Do not claim 429 maps to queued Real success (TB-1577 / M-296).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bauthority\b[^.\n]{0,80}\b(?:per[-\s]?tenant\s+)?slots?\b[^.\n]{0,80}\b(?:=|equal|equals?|are|is)\b[^.\n]{0,80}\b(?:llm\s+)?(?:tpm\s+)?fairness\b",
            re.IGNORECASE,
        ),
        "Authority per-tenant slots are not LLM TPM fairness (TB-1577 / M-296).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\bsilent(?:ly)?\s+starv(?:e|es|ation)\b",
            re.IGNORECASE,
        ),
        "Tenant B does not silently starve healthy — contention surfaces as Partial/Failed (TB-1577).",
        CONTRACT_REL.as_posix(),
    ),
    ClaimPattern(
        re.compile(
            r"\btenant\s+b\b[^.\n]{0,100}\b(?:silently|appears?\s+healthy|looks?\s+healthy)\b[^.\n]{0,80}\b(?:starve|starves|starvation|succeeds?)\b",
            re.IGNORECASE,
        ),
        "Do not claim silent healthy starvation under shared TPM saturation (TB-1577 / TB-1578).",
        CONTRACT_REL.as_posix(),
    ),
)


@dataclass(frozen=True)
class _LineRelativeMatch:
    start: int
    end: int


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


def _match_is_quoted_forbidden_example(line: str, match: _LineRelativeMatch) -> bool:
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

            if quoted_start <= match.start and match.end <= quoted_end:
                return True

    return False


def _line_is_forbidden_example(line: str, match: _LineRelativeMatch) -> bool:
    if _match_is_quoted_forbidden_example(line, match):
        return True

    stripped = line.lstrip().lower()

    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no “" in stripped):
        return True

    if stripped.startswith("|") and (
        "unsafe" in stripped or "forbid" in stripped or "too strong" in stripped
    ):
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
        return [f"{CONTRACT_REL.as_posix()}: missing shared-AOAI-TPM noisy-neighbor claim map (TB-1577)"]

    text = contract_path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required contract marker {marker!r} (TB-1577 / TB-1578)."
        )

    return violations


def pa_one_pager_violations(root: Path) -> list[str]:
    violations: list[str] = []
    path = root / PA_ONE_PAGER_REL

    if not path.is_file():
        return [f"{PA_ONE_PAGER_REL.as_posix()}: missing PA one-pager (M-297)"]

    text = path.read_text(encoding="utf-8", errors="replace")

    for marker in _missing_markers(text, REQUIRED_PA_ONE_PAGER_MARKERS):
        violations.append(
            f"{PA_ONE_PAGER_REL.as_posix()}: missing required PA anchor {marker!r} (M-297 / TB-1578)."
        )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    violations: list[str] = []
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing allowlisted shared-AOAI-TPM honesty scan target"]

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


def shared_aoai_tpm_noisy_neighbor_honesty_violations(root: Path) -> list[str]:
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

    violations = shared_aoai_tpm_noisy_neighbor_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Shared-AOAI-TPM noisy-neighbor honesty guard: FAIL ({label})", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Shared-AOAI-TPM noisy-neighbor honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

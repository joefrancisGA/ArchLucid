#!/usr/bin/env python3
"""High-risk buyer-facing claim drift in a narrow allowlisted doc set (merge-blocking by default).

Phrase inventory (Improvement #15):
- SOC 2 Type II issued / report available / published (CPA reports are not issued in V1).
- Marketplace Published / offer published|live (owner-gated; not claimed on main).
- Public Stripe checkout live (owner-gated production cutover).
- Jira / Microsoft Teams described as V1 GA capabilities (V1.1 buyer-contract integrations).

Lines containing ``buyer-claim-drift: allow`` are skipped (documented intentional phrasing).
CI runs merge-blocking via ``.github/workflows/ci.yml`` (use ``--advisory`` for warn-only local runs).
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "buyer-claim-drift: allow"


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str
    source_of_truth: str


DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/PRICING_PHILOSOPHY.md"),
    Path("docs/go-to-market/TRUST_CENTER.md"),
    Path("docs/go-to-market/SOC2_ROADMAP.md"),
    Path("docs/go-to-market/INTEGRATION_CATALOG.md"),
    Path("docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md"),
    Path("docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md"),
    Path("docs/go-to-market/PROCUREMENT_FAQ.md"),
    Path("docs/go-to-market/SOC2_STATUS_PROCUREMENT.md"),
    Path("docs/go-to-market/AI_EVIDENCE_APPENDIX.md"),
)


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(r"generic\s+OIDC\s*\([^)]*roadmap[^)]*\)", re.IGNORECASE),
        "generic OIDC must not be described as roadmap-only; V1 supports generic OIDC configuration.",
        "docs/library/V1_SCOPE.md",
    ),
    ClaimPattern(
        re.compile(r"\bSOC\s*2\s+certified\b", re.IGNORECASE),
        "SOC 2 certification must not be claimed while CPA attestation is not issued.",
        "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md",
    ),
    ClaimPattern(
        re.compile(
            r"SOC\s*2\s+Type\s*(?:I|II|1|2)\s+(?:report|opinion)?\s*(?:is\s+)?(?:issued|available|published)",
            re.IGNORECASE,
        ),
        "SOC 2 CPA reports must not be described as issued, available, or published.",
        "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md",
    ),
    ClaimPattern(
        re.compile(r"SOC\s*2\s+Type\s*(?:II|2)\s+issued", re.IGNORECASE),
        "SOC 2 Type II must not be described as issued.",
        "docs/go-to-market/SOC2_STATUS_PROCUREMENT.md",
    ),
    ClaimPattern(
        re.compile(r"third-party\s+pen(?:etration)?\s+test\s+(?:completed|executed|passed)\s+(?:for|against)\s+V1", re.IGNORECASE),
        "third-party penetration testing is planned, not yet scheduled; it is not completed for V1.",
        "docs/library/V1_DEFERRED.md",
    ),
    ClaimPattern(
        re.compile(r"third-party\s+pen(?:etration)?[-\s]test\s+(?:report|summary)\s+(?:is\s+)?(?:available|published|complete)", re.IGNORECASE),
        "third-party penetration-test report availability must not be claimed before an engagement completes.",
        "docs/library/V1_DEFERRED.md",
    ),
    ClaimPattern(
        re.compile(r"Marketplace\s+(?:SaaS\s+)?offer\s+(?:is\s+)?(?:published|live)", re.IGNORECASE),
        "Marketplace publication is owner-gated and must not be claimed as currently published.",
        "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md",
    ),
    ClaimPattern(
        re.compile(r"Marketplace\s+Published", re.IGNORECASE),
        "Marketplace Published must not appear without an explicit owner-gated marker.",
        "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md",
    ),
    ClaimPattern(
        re.compile(r"(?:public\s+)?(?:Stripe\s+)?checkout\s+(?:is\s+)?live", re.IGNORECASE),
        "public live checkout must not be claimed while live Stripe cutover is owner-gated.",
        "docs/go-to-market/PRICING_PHILOSOPHY.md",
    ),
    ClaimPattern(
        re.compile(r"\bMCP\b[^.\n]*(?:GA|generally\s+available|public\s+plugin|marketplace)", re.IGNORECASE),
        "MCP and public plugin ecosystem claims must remain deferred/roadmap, not GA.",
        "docs/library/V1_DEFERRED.md",
    ),
    ClaimPattern(
        re.compile(r"(?:full|broad|production[-\s]grade)\s+real[-\s]LLM\s+(?:validation|proof|cohort)\s+(?:is\s+)?(?:complete|available|passed)", re.IGNORECASE),
        "real-LLM proof must not be described as broad/full when only limited topology evidence exists.",
        "docs/go-to-market/AI_EVIDENCE_APPENDIX.md",
    ),
    ClaimPattern(
        re.compile(
            r"(?:first-party\s+)?(?:Jira|Microsoft\s+Teams)\s+(?:connectors?\s+)?(?:is|are)\s+(?:a\s+)?V1\s+GA",
            re.IGNORECASE,
        ),
        "Jira and Microsoft Teams must not be described as V1 GA capabilities (V1.1 buyer-contract).",
        "docs/go-to-market/INTEGRATION_CATALOG.md",
    ),
    ClaimPattern(
        re.compile(
            r"V1\s+GA\s+(?:includes|ships|offers)\s+(?:first-party\s+)?(?:Jira|Microsoft\s+Teams)",
            re.IGNORECASE,
        ),
        "Jira and Microsoft Teams must not be promised inside the V1 GA scope.",
        "docs/library/V1_DEFERRED.md",
    ),
)


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())

    if line_end == -1:
        line_end = len(text)

    return text[line_start:line_end]


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _line_is_safe_negative(line: str) -> bool:
    lower = line.lower()
    safe_prefixes = (
        "do not claim",
        "do not promise",
        "not ",
        "never ",
        "without ",
        "planned, not yet scheduled",
        "not currently",
        "must not",
        "no ",
    )

    return any(prefix in lower for prefix in safe_prefixes)


def buyer_claim_drift_violations(root: Path) -> list[str]:
    violations: list[str] = []

    for rel in DOCS_TO_SCAN:
        path = root / rel

        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing allowlisted buyer-facing doc")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        for claim in CLAIM_PATTERNS:
            match = claim.pattern.search(text)

            if match is None:
                continue

            line = _line_for_match(text, match)

            if _line_is_allowlisted(line) or _line_is_safe_negative(line):
                continue

            violations.append(
                f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`. "
                f"Update source of truth: {claim.source_of_truth}."
            )

    return violations


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found (local exploration).",
    )
    args = parser.parse_args(argv)

    violations = buyer_claim_drift_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"Buyer-facing doc claim drift {label}:", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Buyer-facing doc claim drift: OK")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

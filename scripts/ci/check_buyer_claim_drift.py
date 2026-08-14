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
    Path("docs/go-to-market/PRODUCT_DATASHEET.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/go-to-market/INTEGRATION_CATALOG.md"),
    Path("docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md"),
    Path("docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    Path("docs/go-to-market/SOC2_STATUS_PROCUREMENT.md"),
    Path("docs/go-to-market/AI_READINESS_POSTURE.md"),
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
        "docs/go-to-market/AI_READINESS_POSTURE.md",
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
    ClaimPattern(
        re.compile(
            r"(?:SQL\s+)?row[-\s]level\s+security\s*\(?RLS\)?[^.\n]{0,80}(?:multi[-\s]tenant|tenant)\s+isolation",
            re.IGNORECASE,
        ),
        "SQL RLS must not be described as the production multi-tenant isolation boundary; use database-per-tenant catalogs (ADR 0037).",
        "docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md",
    ),
    ClaimPattern(
        re.compile(r"RLS[-\s]isolated\s+tenancy", re.IGNORECASE),
        "RLS-isolated tenancy must not be claimed; production uses database-per-tenant catalogs.",
        "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview",
    ),
    ClaimPattern(
        re.compile(r"SQL\s+RLS\s+for\s+multi[-\s]tenant\s+isolation", re.IGNORECASE),
        "SQL RLS for multi-tenant isolation must not be claimed in buyer-facing docs.",
        "docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md",
    ),
    ClaimPattern(
        re.compile(
            r"prov(?:es|en)\s+(?:that\s+)?(?:your|the)\s+architecture\s+(?:is|will\s+be)\s+(?:sound|secure|correct|resilient)",
            re.IGNORECASE,
        ),
        "proof claims are scoped to review diligence and provenance, not architecture soundness.",
        "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary",
    ),
    ClaimPattern(
        re.compile(r"prov(?:es|en)\s+(?:production|runtime)\s+(?:readiness|performance)", re.IGNORECASE),
        "proof claims must not cover production readiness or runtime performance.",
        "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary",
    ),
    ClaimPattern(
        re.compile(
            r"guarantees?\s+(?:that\s+)?(?:your|the)\s+(?:architecture|design|system)",
            re.IGNORECASE,
        ),
        "ArchLucid must not guarantee outcomes for the reviewed architecture, design, or system.",
        "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary",
    ),
    ClaimPattern(
        re.compile(
            r"ask(?:\s+review)?\s+answers?\s+(?:are|is)\s+(?:the\s+)?(?:signed|sealed)\s+review\s+record",
            re.IGNORECASE,
        ),
        "Ask-review answers are advisory overlays, not substitutes for the committed sealed review record.",
        "docs/library/customer-facing/REVIEW_RECORD_INTEGRITY.md",
    ),
    ClaimPattern(
        re.compile(
            r"impact\s+preview\s+(?:auto[-\s]?)?approves?",
            re.IGNORECASE,
        ),
        "Impact preview informs review; it does not auto-approve architecture changes.",
        "docs/library/customer-facing/IMPACT_PREVIEW.md",
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

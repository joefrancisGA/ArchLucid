#!/usr/bin/env python3
"""Generate a reviewer-friendly commercial boundary audit report.

The report is intentionally repo-local and secret-free. It explains the four
separate boundaries reviewers often conflate: commercial tier, authority,
progressive disclosure/navigation, and trial limits.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from assert_commercial_tier_packaging_drift import load_fixtures, run_check
from assert_route_tier_policy_nav import load_registry, repo_root


def _fmt_cell(value: object) -> str:
    text = "" if value is None else str(value)

    return text.replace("|", "\\|")


def build_report(root: Path) -> str:
    registry = load_registry(root)
    entries = registry.get("entries")

    if not isinstance(entries, list):
        raise ValueError("route_tier_policy_nav_registry.json: 'entries' must be a list")

    fixtures = load_fixtures(root)
    errors = run_check(root)
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    tier_counts = Counter((entry.get("commercial_tier") or "none") for entry in entries if isinstance(entry, dict))
    policy_counts = Counter((entry.get("class_policy") or "none") for entry in entries if isinstance(entry, dict))

    lines: list[str] = [
        "# Commercial Boundary Audit Report",
        "",
        f"Generated UTC: **{generated}**",
        "",
        "This report is generated from `scripts/ci/data/route_tier_policy_nav_registry.json`, "
        "`scripts/ci/data/commercial_tier_drift_fixtures.json`, and operator nav configuration. "
        "It does not call billing systems, reveal hidden sub-tier capabilities, or change entitlements.",
        "",
        "## Four Boundaries",
        "",
        "| Boundary | Source of truth | Reviewer interpretation |",
        "| --- | --- | --- |",
        "| Commercial tier | `RequiresCommercialTenantTier` / `CommercialTenantTierFilter` plus packaging docs | Determines whether the tenant's paid tier may call the HTTP surface. Sub-tier denials stay anti-enumeration-safe where the filter does so. |",
        "| Authority / role | ASP.NET authorization policy such as `ReadAuthority`, `ExecuteAuthority`, or `AdminAuthority` | Determines what the signed-in principal or API key can do after tier eligibility passes. |",
        "| Progressive disclosure | `archlucid-ui/src/lib/nav-config.ts` builders and nav visibility helpers | Controls what users see in navigation. Visibility is not a guarantee of HTTP access. |",
        "| Trial limits | Trial status contracts, trial usage counters, and trial widgets | Controls trial-time run/seat/expiry experience without expanding paid-feature disclosure. |",
        "",
        "## Rollup",
        "",
        f"- Registry rows: **{len(entries)}**",
        f"- Curated commercial fixtures: **{len(fixtures)}**",
        f"- Drift findings: **{len(errors)}**",
        f"- Tier distribution: {', '.join(f'`{k}`={v}' for k, v in sorted(tier_counts.items()))}",
        f"- Policy distribution: {', '.join(f'`{k}`={v}' for k, v in sorted(policy_counts.items()))}",
        "",
        "## Drift Findings",
        "",
    ]

    if errors:
        lines.extend(f"- FAIL: {error}" for error in errors)
    else:
        lines.append("- PASS: curated commercial tier, policy, and nav fixtures match the registry.")

    lines.extend(
        [
            "",
            "## Curated Fixture Review",
            "",
            "| Label | Controller | Expected tier | Expected policy | Expected nav | Trial-limit note |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
    )

    for fixture in fixtures:
        trial_note = fixture.get(
            "trial_limit_behavior",
            "No live billing dependency; trial enforcement remains separate from route tier and authority checks.",
        )
        lines.append(
            "| "
            + " | ".join(
                [
                    _fmt_cell(fixture.get("label")),
                    f"`{_fmt_cell(fixture.get('controller_file'))}`",
                    _fmt_cell(fixture.get("expected_commercial_tier", "none")),
                    _fmt_cell(fixture.get("expected_class_policy", "")),
                    _fmt_cell(fixture.get("expected_nav_operator_href", "")),
                    _fmt_cell(trial_note),
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Full Registry",
            "",
            "| Controller | API prefix | Tier | Policy | Nav href | Exemption |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
    )

    for entry in sorted(entries, key=lambda item: item.get("controller_file", "")):
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{_fmt_cell(entry.get('controller_file'))}`",
                    f"`{_fmt_cell(entry.get('normalized_prefix'))}`",
                    _fmt_cell(entry.get("commercial_tier", "none")),
                    _fmt_cell(entry.get("class_policy", "")),
                    _fmt_cell(entry.get("nav_operator_href", "")),
                    _fmt_cell(entry.get("exemption", "")),
                ]
            )
            + " |"
        )

    lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate commercial boundary audit markdown.")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("artifacts/commercial-boundary-audit.md"),
        help="Output markdown path (default: artifacts/commercial-boundary-audit.md).",
    )
    args = parser.parse_args()
    root = repo_root()
    report = build_report(root)
    out = args.out if args.out.is_absolute() else root / args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(report, encoding="utf-8")
    print(out)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

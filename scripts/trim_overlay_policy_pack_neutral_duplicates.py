#!/usr/bin/env python3
"""Trim generic Reliability/Performance/Ops rules from provider overlay packs (Phase 2).

Neutral baseline packs (rel-base, perf-base, ops-base) now own provider-agnostic
screening. This script removes duplicated rules from Azure/AWS/GCP WAF and
Resiliency-DR overlay packs, syncs bundled headers, and prunes GA catalog stubs.

Run after editing TRIM_* constants when neutral baseline coverage changes.
"""

from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SAMPLES = REPO / "docs" / "samples" / "policy-packs"
BUNDLED = REPO / "ArchLucid.Application" / "Governance" / "DefaultPolicyPacks" / "Bundled"
GA_RULES = REPO / "ArchLucid.Decisioning" / "Compliance" / "RulePacks" / "ga-starter-compliance.rules.json"

# Generic WAF pillar rules extracted to provider-neutral baseline packs.
WAF_TRIM_SUFFIXES = frozenset({"001", "002", "003", "009", "011", "012"})

# Generic DR rules extracted to rel-base / perf-base / ops-base packs.
DR_TRIM_SUFFIXES = frozenset(
    {
        "001",  # availability targets → rel-base-002
        "002",  # RTO/RPO → rel-base-002
        "006",  # backup policy → rel-base-004
        "007",  # restore testing → rel-base-004 / rel-base-008
        "012",  # chaos / resilience testing → rel-base-008
        "013",  # dependency failure modes → rel-base-001
        "014",  # retry / circuit breaker → rel-base-006
        "015",  # queue load leveling → rel-base-005
        "016",  # autoscaling → perf-base-003
        "017",  # health probes → ops-base-003
        "018",  # blue-green deploy → ops-base-002
        "022",  # capacity headroom → rel-base-007
        "023",  # DR runbook → rel-base-008
        "028",  # post-incident learning → ops-base-008
    }
)

OVERLAY_PACKS: list[dict[str, str]] = [
    {
        "slug": "azure-waf",
        "prefix": "waf-az",
        "trim_kind": "waf",
        "bundled": "azure-waf.json",
    },
    {
        "slug": "aws-waf",
        "prefix": "waf-aws",
        "trim_kind": "waf",
        "bundled": "aws-waf.json",
    },
    {
        "slug": "gcp-architecture-framework",
        "prefix": "waf-gcp",
        "trim_kind": "waf",
        "bundled": "gcp-architecture-framework.json",
    },
    {
        "slug": "azure-resiliency-dr",
        "prefix": "az-dr",
        "trim_kind": "dr",
        "bundled": "azure-resiliency-dr.json",
    },
    {
        "slug": "aws-resiliency-dr",
        "prefix": "aws-dr",
        "trim_kind": "dr",
        "bundled": "aws-resiliency-dr.json",
    },
    {
        "slug": "gcp-resiliency-dr",
        "prefix": "gcp-dr",
        "trim_kind": "dr",
        "bundled": "gcp-resiliency-dr.json",
    },
]


def _rule_suffix(rule_id: str, prefix: str) -> str | None:
    marker = f"{prefix}-"

    if not rule_id.startswith(marker):
        return None

    return rule_id[len(marker) :]


def _should_trim(rule_id: str, prefix: str, trim_kind: str) -> bool:
    suffix = _rule_suffix(rule_id, prefix)

    if suffix is None:
        return False

    if trim_kind == "waf":
        return suffix in WAF_TRIM_SUFFIXES

    if trim_kind == "dr":
        return suffix in DR_TRIM_SUFFIXES

    raise ValueError(f"Unknown trim_kind {trim_kind!r}")


def trim_curated_rules(curated_path: Path, prefix: str, trim_kind: str) -> tuple[list[str], list[str]]:
    curated = json.loads(curated_path.read_text(encoding="utf-8"))
    rules = curated.get("rules") or []
    removed: list[str] = []
    kept: list[dict] = []

    for rule in rules:
        if not isinstance(rule, dict):
            continue

        rule_id = str(rule.get("id", "")).strip()

        if not rule_id:
            continue

        if _should_trim(rule_id, prefix, trim_kind):
            removed.append(rule_id)
            continue

        kept.append(rule)

    curated["rules"] = kept

    if isinstance(curated.get("pack"), dict):
        curated["pack"]["version"] = "1.1.0"

    curated_path.write_text(json.dumps(curated, indent=2) + "\n", encoding="utf-8")
    return removed, [str(rule["id"]) for rule in kept]


def sync_content_header(content_path: Path, rule_ids: list[str]) -> None:
    content = json.loads(content_path.read_text(encoding="utf-8"))
    content["complianceRuleKeys"] = rule_ids
    metadata = content.setdefault("metadata", {})

    if isinstance(metadata, dict):
        metadata["pack.version"] = "1.1.0"
        metadata["overlayTrimNeutralBaseline"] = "2026-08-23"

    content_path.write_text(json.dumps(content, indent=2) + "\n", encoding="utf-8")


def prune_ga_stubs(removed_rule_ids: set[str]) -> int:
    ga = json.loads(GA_RULES.read_text(encoding="utf-8"))
    rules = ga.get("rules") or []
    pruned = [rule for rule in rules if str(rule.get("ruleId", "")).strip() not in removed_rule_ids]
    removed_count = len(rules) - len(pruned)
    ga["rules"] = pruned
    GA_RULES.write_text(json.dumps(ga, indent=2) + "\n", encoding="utf-8")
    return removed_count


def main() -> None:
    all_removed: set[str] = set()
    summary: list[str] = []

    for pack in OVERLAY_PACKS:
        slug = pack["slug"]
        prefix = pack["prefix"]
        trim_kind = pack["trim_kind"]
        curated_path = SAMPLES / f"{slug}-rules-v1.json"
        content_path = SAMPLES / f"{slug}.json"
        bundled_path = BUNDLED / pack["bundled"]

        removed, kept_ids = trim_curated_rules(curated_path, prefix, trim_kind)
        sync_content_header(content_path, kept_ids)
        bundled_path.write_text(content_path.read_text(encoding="utf-8"), encoding="utf-8")
        all_removed.update(removed)
        summary.append(f"{slug}: removed {len(removed)} rules, kept {len(kept_ids)}")

    ga_removed = prune_ga_stubs(all_removed)

    print("Overlay trim complete:")
    for line in summary:
        print(f"  - {line}")
    print(f"  - GA stubs pruned: {ga_removed}")


if __name__ == "__main__":
    main()

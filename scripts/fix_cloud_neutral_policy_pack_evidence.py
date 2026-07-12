#!/usr/bin/env python3
"""Refresh cloud-neutral bundled packs with multi-cloud extractor evidence hints (TB-718)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SAMPLES = REPO / "docs" / "samples" / "policy-packs"
BUNDLED = REPO / "ArchLucid.Application" / "Governance" / "DefaultPolicyPacks" / "Bundled"

sys.path.insert(0, str(REPO / "scripts"))
from generate_multicloud_policy_pack_peers import add_cloud_neutral_extractor_hints  # noqa: E402

PACK_SLUGS = ("security-architecture-baseline", "cost-optimization")

SECURITY_PACK_DESCRIPTION = (
    "Starter security posture checks for cloud architecture reviews — identity, network, encryption, "
    "logging, and secure SDLC. Grounded in Azure, AWS, and GCP inventory ZIP manifests plus architecture "
    "manifest governance fields. Aligned to CIS and OWASP themes. Not an exhaustive compliance assessment."
)

COST_PACK_NAME = "Cost optimization (extractor-aligned)"
COST_PACK_DESCRIPTION = (
    "FinOps-oriented review prompts grounded in read-only cloud inventory ZIP output (resource manifests, "
    "optional catalog pricing overlays, policy compliance exports). Highlights common waste vectors such as "
    "orphaned addressing, oversized compute SKUs, and unattached disks. Does not replace live cost "
    "management actuals."
)

COST_OPT_003_REMEDIATION = (
    "Confirm extractor manifest SwitchesUsed includes retail or catalog pricing when financial narrative "
    "is required (IncludeRetailPrices on Azure inventory; equivalent pricing switches on AWS and GCP ZIP "
    "collections). If absent, flag that only inventory counts — not catalog-priced estimates — are "
    "available until re-collection."
)


def sync_bundled_content(slug: str) -> None:
    rules_path = SAMPLES / f"{slug}-rules-v1.json"
    curated = json.loads(rules_path.read_text(encoding="utf-8"))
    pack = curated["pack"]
    rule_ids = [rule["id"] for rule in curated["rules"]]
    content = {
        "complianceRuleIds": [],
        "complianceRuleKeys": rule_ids,
        "alertRuleIds": [],
        "compositeAlertRuleIds": [],
        "advisoryDefaults": {
            "severityFloor": "warning",
            "priorityFloor": "P0",
            "scanDepth": "standard",
        },
        "metadata": {
            "templateId": f"{slug}-v1",
            "pack.displayName": pack["name"],
            "pack.category": pack["category"],
            "pack.version": pack["version"],
            "pack.isDefault": "true",
            "pack.description": pack["description"],
            "frameworkMappingDisclaimer": (
                "CIS and OWASP references are thematic alignment only."
                if slug == "security-architecture-baseline"
                else "FinOps mapping is advisory only."
            ),
            "curatedRulesArtifact": f"docs/samples/policy-packs/{slug}-rules-v1.json",
        },
    }
    text = json.dumps(content, indent=2) + "\n"
    sample_path = SAMPLES / f"{slug}.json"
    bundled_path = BUNDLED / f"{slug}.json"
    sample_path.write_text(text, encoding="utf-8")
    bundled_path.write_text(text, encoding="utf-8")
    print(f"synced bundled content for {slug} ({len(rule_ids)} rules, v{pack['version']})")


def main() -> None:
    for slug in PACK_SLUGS:
        add_cloud_neutral_extractor_hints(slug)

    security_path = SAMPLES / "security-architecture-baseline-rules-v1.json"
    security_doc = json.loads(security_path.read_text(encoding="utf-8"))
    security_doc["pack"]["description"] = SECURITY_PACK_DESCRIPTION
    security_doc["pack"]["version"] = "1.1.1"
    security_path.write_text(json.dumps(security_doc, indent=2) + "\n", encoding="utf-8")

    cost_path = SAMPLES / "cost-optimization-rules-v1.json"
    cost_doc = json.loads(cost_path.read_text(encoding="utf-8"))
    cost_doc["pack"]["name"] = COST_PACK_NAME
    cost_doc["pack"]["description"] = COST_PACK_DESCRIPTION
    cost_doc["pack"]["version"] = "1.0.1"
    for rule in cost_doc["rules"]:
        if rule["id"] == "cost-opt-003":
            rule["remediationGuidance"] = COST_OPT_003_REMEDIATION
    cost_path.write_text(json.dumps(cost_doc, indent=2) + "\n", encoding="utf-8")

    for slug in PACK_SLUGS:
        sync_bundled_content(slug)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Apply ABQ-08 mega-zone split and ABQ-09 churn/nominate ledger updates."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEDGER = REPO_ROOT / "docs" / "library" / "AL_BUG_HUNT_LEDGER.md"

POLICY_PACKS_PATHS = [
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.cs",
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.Assignment.cs",
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.Catalog.Mutate.cs",
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.Catalog.Read.cs",
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.Catalog.Read.Effective.cs",
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.Catalog.Read.Hub.cs",
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.Catalog.Read.Versions.cs",
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.Crud.cs",
    "ArchLucid.Api/Controllers/Governance/PolicyPacksController.Simulate.cs",
]

GOVERNANCE_STICKINESS_PATHS = [
    "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.cs",
    "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.Attestation.cs",
    "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.Dispositions.cs",
    "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.Exceptions.cs",
    "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.Registers.cs",
    "ArchLucid.Api/Controllers/Governance/GovernanceStickinessController.Schedules.cs",
    "ArchLucid.Api/Controllers/Governance/GovernanceStickinessControllerCore.cs",
    "ArchLucid.Api/Controllers/Governance/GovernancePostureController.cs",
    "ArchLucid.Api/Controllers/Governance/GovernancePreCommitSimulationController.cs",
    "ArchLucid.Application/Governance/PreFinalizeChecklistService.cs",
    "ArchLucid.Application/Governance/PreFinalizeChecklistService.Items.cs",
    "ArchLucid.Application/Governance/PreFinalizeChecklistService.TrustAndPolicy.cs",
]

SCORING_SECTION = """## Scoring (picker)

Time unit is **hunts**, not wall-clock minutes. Exploit zones with a short mean hunts-per-bug; explore untried / under-sampled zones so the catalog can learn. Ledger `bugs-found` must not inflate speed when it exceeds `hunts`; scoring uses at most one hit per hunt.

```text
effective_bugs     = min(bugs-found, hunts) when hunts > 0
mean_hunts_per_bug = hunts / max(1, effective_bugs) when hunts > 0, else hunts + 2 (prior)
speed              = min(1, 1 / mean_hunts_per_bug)
explore            = 1 / sqrt(hunts + 1)
precision          = proven / (proven + invalid) when that sum >= 2, else omitted
                     (valid-no-repro is not in the denominator)

base_score =
  6 × speed
+ 3 × explore
+ 2 × recent_churn              (min(3, commitCount since last-hunt))
+ 1 × related_PD_or_TB          (min(2, id count))
+ 0.25 × min(3, hunt-ready open hypotheses)
+ 0.5 × precision               (0 when omitted)
− 2 × consecutive_dry_hunts

score = base_score × impact_multiplier   (high ×1.40, medium ×1.00, low ×0.65; missing → medium)
```

Hunt-ready count is a small tie-break only. Candidate/template rows must not inflate score or lock the catalog. Precision rewards zones whose hypotheses matched the code; it does not punish valid-no-repro exhaustion.

**Cooldown (hit-rate):** When `AL_BUG_HUNT_RUN_LOG.jsonl` is available, a zone is treated as `cooling` for picker eligibility if it has ≥ 8 hits in the last 7 calendar days **or** a 24h hit rate ≥ 0.7 with ≥ 5 hunts in that window (seed-only excluded from the rate). `cooling` zones are ineligible while any `open` or `unseeded` zone remains. Preview JSON exposes `cooledByHitRate: true` when this applies.

Rolling 24h preview warns when hit rate ≥ 0.6 with ≥ 8 hunts in the window — a catalog health signal, not a yield celebration.

Eligibility: `open` and `unseeded` always; `cooling` only when no `open` or `unseeded` zone remains; `exhausted` only when git shows commits on `paths` since `last-hunt`."""

NOMINATE_SECTION = r"""## Nominate mode

`.\scripts\agent\al-bug-pick-zone.ps1 -Nominate -Preview` (optional `-Since`, `-SkipGit` in tests) diffs recent production file churn against every zone `paths` prefix. Files with no covering zone are **gaps**. JSON includes `nominate: true`, `gaps: [{ path, commitCount }]`, and up to ~15 `proposedZones` entries (`id`, `paths`, `impact`, `testFilterGuess`). Preview prints paste-ready markdown stanzas for agent-led ledger updates — use when implicated files fall outside every current zone. Excludes tests, docs, generated OpenAPI, and lockfiles. Retired mega-zones pointing at this ledger do not cover production paths."""

CORE_CHILD_ZONES = [
    {
        "id": "core-azure-extractor",
        "title": "core-azure-extractor",
        "impact": "high",
        "aliases": "azure extractor; manifest schema; split from archlucid-core",
        "paths": "ArchLucid.Core/AzureExtractor/",
        "test_filter": "FullyQualifiedName~AzureExtractor",
    },
    {
        "id": "core-configuration-summary",
        "title": "core-configuration-summary",
        "impact": "high",
        "aliases": "configuration summary; config paths; split from archlucid-core",
        "paths": "ArchLucid.Core/Configuration/",
        "test_filter": "FullyQualifiedName~Configuration",
    },
    {
        "id": "core-findings-advice",
        "title": "core-findings-advice",
        "impact": "medium",
        "aliases": "findings advice; generic architecture advice; split from archlucid-core",
        "paths": "ArchLucid.Core/Findings/",
        "test_filter": "FullyQualifiedName~GenericArchitectureAdvicePatterns",
    },
    {
        "id": "core-requests-constraints",
        "title": "core-requests-constraints",
        "impact": "medium",
        "aliases": "request constraints; split from archlucid-core",
        "paths": "ArchLucid.Core/Requests/",
        "test_filter": "FullyQualifiedName~RequestConstraint",
    },
    {
        "id": "core-authority-runs",
        "title": "core-authority-runs",
        "impact": "high",
        "aliases": "authority runs; run lifecycle; split from archlucid-core",
        "paths": "ArchLucid.Core/Runs/; ArchLucid.Core/Authority/",
        "test_filter": "FullyQualifiedName~RunAuthority",
    },
    {
        "id": "core-tenancy-commercial",
        "title": "core-tenancy-commercial",
        "impact": "high",
        "aliases": "commercial tenant; billing; budgeting; split from archlucid-core",
        "paths": "ArchLucid.Core/Identity/; ArchLucid.Core/Billing/; ArchLucid.Core/Budgeting/",
        "test_filter": "FullyQualifiedName~CommercialTenant",
    },
    {
        "id": "core-safety-network",
        "title": "core-safety-network",
        "impact": "high",
        "aliases": "private network guard; SSRF; split from archlucid-core",
        "paths": "ArchLucid.Core/Safety/; ArchLucid.Core/Http/",
        "test_filter": "FullyQualifiedName~PrivateNetwork",
    },
    {
        "id": "core-costing",
        "title": "core-costing",
        "impact": "medium",
        "aliases": "costing; retail prices; split from archlucid-core",
        "paths": "ArchLucid.Core/Costing/",
        "test_filter": "FullyQualifiedName~Costing",
    },
    {
        "id": "core-explanation-json",
        "title": "core-explanation-json",
        "impact": "medium",
        "aliases": "run explanation; explanation json; split from archlucid-core",
        "paths": "ArchLucid.Core/Explanation/",
        "test_filter": "FullyQualifiedName~RunExplanation",
    },
]

API_CHILD_ZONES = [
    {
        "id": "api-policy-packs",
        "title": "api-policy-packs",
        "impact": "high",
        "aliases": "policy packs controller; split from api-governance-tenancy-controllers",
        "paths": "; ".join(POLICY_PACKS_PATHS),
        "test_filter": "FullyQualifiedName~PolicyPacksController",
    },
    {
        "id": "api-governance-stickiness",
        "title": "api-governance-stickiness",
        "impact": "high",
        "aliases": "governance stickiness; posture; pre-finalize checklist; split from api-governance-tenancy-controllers",
        "paths": "; ".join(GOVERNANCE_STICKINESS_PATHS),
        "test_filter": "FullyQualifiedName~GovernanceStickiness|FullyQualifiedName~GovernancePosture",
    },
    {
        "id": "api-tenancy-workspaces",
        "title": "api-tenancy-workspaces",
        "impact": "high",
        "aliases": "tenant workspaces controller; split from api-governance-tenancy-controllers",
        "paths": "ArchLucid.Api/Controllers/Tenancy/",
        "test_filter": "FullyQualifiedName~TenantWorkspaces",
    },
]

ABQ09_NEW_ZONES = [
    {
        "id": "architecture-intelligence-orchestrator",
        "title": "architecture-intelligence-orchestrator",
        "impact": "high",
        "aliases": "closed-loop orchestrator; review result cache; architecture intelligence",
        "paths": (
            "ArchLucid.Application/ArchitectureIntelligence/ClosedLoopArchitectureReasoningOrchestrator.cs; "
            "ArchLucid.Application/ArchitectureIntelligence/ReviewResultCache.cs; "
            "ArchLucid.Application/ArchitectureIntelligence/ReviewCacheManifestBuilder.cs"
        ),
        "test_filter": (
            "FullyQualifiedName~ClosedLoopArchitectureReasoningOrchestrator|"
            "FullyQualifiedName~ReviewResultCache|"
            "FullyQualifiedName~ReviewCacheManifestBuilder"
        ),
        "note": "ABQ-09 churn hotspot; orchestrator/cache slice separate from architecture-recommendation.",
    },
    {
        "id": "ui-review-detail-workspace",
        "title": "ui-review-detail-workspace",
        "impact": "high",
        "aliases": "review detail workspace; run detail page",
        "paths": "archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/",
        "test_filter": "FullyQualifiedName~RunDetail|reviewId",
        "note": "ABQ-09 churn hotspot; review detail route tree.",
    },
    {
        "id": "ui-review-intake-wizards",
        "title": "ui-review-intake-wizards",
        "impact": "high",
        "aliases": "review intake; new review wizard",
        "paths": "archlucid-ui/src/app/(operator)/architecture/reviews/new/",
        "test_filter": "FullyQualifiedName~reviews/new",
        "note": "ABQ-09 churn hotspot; intake wizard route tree.",
    },
    {
        "id": "ui-governance-findings-queue",
        "title": "ui-governance-findings-queue",
        "impact": "medium",
        "aliases": "governance findings queue",
        "paths": "archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx",
        "test_filter": "FullyQualifiedName~GovernanceFindingsQueueClient",
        "note": "ABQ-09 churn hotspot.",
    },
    {
        "id": "ui-infra-resource-hub",
        "title": "ui-infra-resource-hub",
        "impact": "medium",
        "aliases": "resource hub; infrastructure resource detail",
        "paths": "archlucid-ui/src/app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx",
        "test_filter": "FullyQualifiedName~ResourceHubClient",
        "note": "ABQ-09 churn hotspot.",
    },
    {
        "id": "host-infra-evidence-composition",
        "title": "host-infra-evidence-composition",
        "impact": "medium",
        "aliases": "infra evidence composition; host composition module",
        "paths": "ArchLucid.Host.Composition/Startup/Modules/InfraEvidenceCompositionModule.cs",
        "test_filter": "FullyQualifiedName~InfraEvidenceComposition",
        "note": "ABQ-09 churn hotspot.",
    },
    {
        "id": "ui-claim-discipline-policy",
        "title": "ui-claim-discipline-policy",
        "impact": "medium",
        "aliases": "claim discipline policy; evidence orientation strip",
        "paths": "archlucid-ui/src/lib/claim-discipline-policy.ts",
        "test_filter": "claim-discipline-policy",
        "note": "ABQ-09 churn hotspot.",
    },
]

TOPOLOGY_EXTRA_PATHS = [
    "ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEndpointIndex.cs",
    "ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEdgeMapper.cs",
]


def format_zone_block(zone: dict[str, str]) -> str:
    note = zone.get("note", zone.get("aliases", "").split(";")[-1].strip())
    if "split from" in zone.get("aliases", ""):
        split_note = f"Split from retired `{zone['aliases'].split('split from ')[-1].strip()}` (ABQ-08)."
    elif zone.get("note", "").startswith("ABQ-09"):
        split_note = zone["note"]
    else:
        split_note = zone.get("note", "")

    lines = [
        f"## Zone: {zone['title']}",
        "",
        f"- **id:** {zone['id']}",
        "- **status:** unseeded",
        f"- **impact:** {zone['impact']}",
        f"- **aliases:** {zone['aliases']}",
        f"- **paths:** {zone['paths']}",
        f"- **test-filter:** {zone['test_filter']}",
        "- **hunts:** 0",
        "- **bugs-found:** 0",
        "- **consecutive-dry-hunts:** 0",
        "- **last-hunt:** never",
        "- **last-bug:** never",
        "- **related-pd-tb:** none",
        "- **code-changed-since:** unknown",
        "",
        split_note,
        "",
        "### Hypotheses",
        "",
        "---",
        "",
    ]
    return "\n".join(lines)


def replace_section(content: str, start_marker: str, end_marker: str, replacement: str) -> str:
    pattern = rf"({re.escape(start_marker)}.*?)(?={re.escape(end_marker)})"
    match = re.search(pattern, content, flags=re.DOTALL)
    if not match:
        raise RuntimeError(f"section not found: {start_marker!r} .. {end_marker!r}")
    return content[: match.start()] + replacement + "\n\n" + content[match.end() :]


def retire_zone(content: str, zone_id: str, old_paths: str, extra_alias: str) -> str:
    zone_pattern = rf"(## Zone: {re.escape(zone_id)}\n.*?- \*\*status:\*\*) \w+"
    content, n = re.subn(zone_pattern, rf"\1 exhausted", content, count=1, flags=re.DOTALL)
    if n != 1:
        raise RuntimeError(f"failed to retire status for {zone_id}")

    paths_pattern = (
        rf"(## Zone: {re.escape(zone_id)}\n.*?- \*\*paths:\*\*) [^\n]+"
    )
    content, n = re.subn(
        paths_pattern,
        r"\1 docs/library/AL_BUG_HUNT_LEDGER.md",
        content,
        count=1,
        flags=re.DOTALL,
    )
    if n != 1:
        raise RuntimeError(f"failed to retire paths for {zone_id}")

    aliases_pattern = (
        rf"(## Zone: {re.escape(zone_id)}\n.*?- \*\*aliases:\*\*) ([^\n]+)"
    )

    def add_alias(match: re.Match[str]) -> str:
        aliases = match.group(2).strip()
        if extra_alias in aliases:
            return match.group(0)
        return f"{match.group(1)} {aliases}; {extra_alias}"

    content, n = re.subn(aliases_pattern, add_alias, content, count=1, flags=re.DOTALL)
    if n != 1:
        raise RuntimeError(f"failed to update aliases for {zone_id}")
    return content


def insert_before_zone(content: str, before_zone_id: str, blocks: str) -> str:
    marker = f"## Zone: {before_zone_id}"
    idx = content.find(marker)
    if idx == -1:
        raise RuntimeError(f"insert anchor not found: {before_zone_id}")
    return content[:idx] + blocks + content[idx:]


def zone_exists(content: str, zone_id: str) -> bool:
    return f"## Zone: {zone_id}" in content or f"- **id:** {zone_id}" in content


def extend_topology_zone(content: str) -> str:
    zone_match = re.search(
        r"(## Zone: topology-proposal-merge\n.*?- \*\*paths:\*\*) ([^\n]+)",
        content,
        flags=re.DOTALL,
    )
    if not zone_match:
        raise RuntimeError("topology-proposal-merge zone not found")

    existing_paths = [p.strip() for p in zone_match.group(2).split(";")]
    for extra in TOPOLOGY_EXTRA_PATHS:
        if extra not in existing_paths:
            existing_paths.append(extra)
    new_paths = "; ".join(existing_paths)

    content = (
        content[: zone_match.start(2)]
        + new_paths
        + content[zone_match.end(2) :]
    )

    filter_match = re.search(
        r"(## Zone: topology-proposal-merge\n.*?- \*\*test-filter:\*\*) ([^\n]+)",
        content,
        flags=re.DOTALL,
    )
    if not filter_match:
        raise RuntimeError("topology-proposal-merge test-filter not found")

    required_tokens = [
        "TopologyProposalRelationshipEndpointIndexTests",
        "TopologyProposalRelationshipEdgeMapperTests",
    ]
    current = filter_match.group(2)
    parts = [p.strip() for p in current.split("|") if p.strip()]
    for token in required_tokens:
        needle = f"FullyQualifiedName~{token}"
        if needle not in parts and token not in current:
            parts.append(needle)
    new_filter = "|".join(parts)

    return content[: filter_match.start(2)] + new_filter + content[filter_match.end(2) :]


def main() -> int:
    content = LEDGER.read_text(encoding="utf-8")
    changes: list[str] = []

    if "## Scoring (picker)" in content:
        content = replace_section(
            content,
            "## Scoring (picker)",
            "## Nominate mode",
            SCORING_SECTION,
        )
        changes.append("updated scoring section (ABQ-06 formula)")

    if "## Nominate mode" in content:
        content = replace_section(
            content,
            "## Nominate mode",
            "## Exhaustion (all must hold)",
            NOMINATE_SECTION,
        )
        changes.append("updated nominate mode section (ABQ-09)")

    before_topology = content
    content = extend_topology_zone(content)
    if content != before_topology:
        changes.append("extended topology-proposal-merge paths and test-filter")

    if "- **status:** open" in content and "## Zone: archlucid-core" in content:
        before = content
        content = retire_zone(
            content,
            "archlucid-core",
            "ArchLucid.Core/",
            "retired mega-zone",
        )
        if content != before:
            changes.append("retired archlucid-core mega-zone")

    core_blocks = "".join(format_zone_block(z) for z in CORE_CHILD_ZONES)
    if not zone_exists(content, "core-azure-extractor"):
        content = insert_before_zone(content, "archlucid-contracts", core_blocks)
        changes.append(f"inserted {len(CORE_CHILD_ZONES)} core child zones before archlucid-contracts")
    else:
        changes.append("skipped core child zones (already present)")

    if "## Zone: api-governance-tenancy-controllers" in content:
        before = content
        content = retire_zone(
            content,
            "api-governance-tenancy-controllers",
            "ArchLucid.Api/Controllers/Governance/",
            "retired mega-zone",
        )
        if content != before:
            changes.append("retired api-governance-tenancy-controllers mega-zone")

    api_blocks = "".join(format_zone_block(z) for z in API_CHILD_ZONES)
    if not zone_exists(content, "api-policy-packs"):
        content = insert_before_zone(content, "application-agents", api_blocks)
        changes.append(f"inserted {len(API_CHILD_ZONES)} API child zones before application-agents")
    else:
        changes.append("skipped API child zones (already present)")

    appended = 0
    for zone in ABQ09_NEW_ZONES:
        if zone_exists(content, zone["id"]):
            continue
        content = content.rstrip() + "\n\n" + format_zone_block(zone).rstrip() + "\n"
        appended += 1
    if appended:
        changes.append(f"appended {appended} ABQ-09 unseeded zones")

    LEDGER.write_text(content, encoding="utf-8")

    print("AL_BUG_HUNT_LEDGER.md updated:")
    for item in changes:
        print(f"  - {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Author four provider-neutral architecture-quality baseline packs (Phase 2).

Writes samples + Bundled headers, appends manifest entries, and adds GA compliance stubs.
Does not regenerate existing packs.
"""

from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SAMPLES = REPO / "docs" / "samples" / "policy-packs"
BUNDLED = REPO / "ArchLucid.Application" / "Governance" / "DefaultPolicyPacks" / "Bundled"
MANIFEST = BUNDLED / "bundled-policy-packs-v1.manifest.json"
GA_RULES = REPO / "ArchLucid.Decisioning" / "Compliance" / "RulePacks" / "ga-starter-compliance.rules.json"

EVIDENCE_HINTS = [
    "governance.PolicyConstraints",
    "governance.RequiredControls",
    "governance.ComplianceTags",
    "services[].Tags",
    "datastores[]",
    "metadata.ChangeDescription",
    "relationships",
]


def rule(
    rule_id: str,
    title: str,
    description: str,
    remediation: str,
    framework: str,
    requirement: str,
    severity: str,
    priority: str,
) -> dict:
    return {
        "id": rule_id,
        "title": title,
        "description": description,
        "severity": severity,
        "priority": priority,
        "remediationGuidance": remediation,
        "evidenceHints": list(EVIDENCE_HINTS),
        "frameworkMappings": [{"framework": framework, "requirement": requirement}],
    }


PACKS: list[dict] = [
    {
        "slug": "reliability-and-resilience",
        "displayName": "Reliability and Resilience",
        "category": "Reliability",
        "description": (
            "Provider-neutral reliability and resilience screening for architecture reviews — "
            "failure modes, recovery objectives, redundancy proportional to criticality, backup, "
            "and graceful degradation. Thematic mapping only; not a certification."
        ),
        "disclaimer": "Reliability themes are architecture-review prompts only; not certification.",
        "framework": "ArchLucid Architecture Quality Baseline",
        "appliesToCategory": "reliability",
        "rules": [
            rule(
                "rel-base-001",
                "Failure modes identified for critical dependencies",
                "Architecture context should identify how critical dependencies fail and what the workload does when they do. Missing failure-mode narrative leaves availability claims ungrounded.",
                "Document primary failure modes for tier-1 dependencies in governance.PolicyConstraints or metadata.ChangeDescription, and map owning services[].Tags to those dependencies.",
                "ArchLucid Architecture Quality Baseline",
                "Reliability — failure-mode identification",
                "High",
                "P0",
            ),
            rule(
                "rel-base-002",
                "Availability and recovery objectives defined by workload tier",
                "Tiered workloads should state availability targets plus RTO/RPO (or an explicit decision that recovery objectives are not required for this lifecycle stage).",
                "Capture RTO/RPO or availability targets per workload tier in governance.PolicyConstraints; mark non-production tiers when recovery depth is intentionally lighter.",
                "ArchLucid Architecture Quality Baseline",
                "Reliability — recovery objectives",
                "High",
                "P0",
            ),
            rule(
                "rel-base-003",
                "Redundancy proportional to criticality",
                "Redundancy (zonal, regional, or active-passive) should match stated criticality rather than being assumed from a cloud default.",
                "Describe redundancy strategy and justification against criticality in metadata.ChangeDescription; align services[] and relationships to the stated topology.",
                "ArchLucid Architecture Quality Baseline",
                "Reliability — proportional redundancy",
                "Medium",
                "P0",
            ),
            rule(
                "rel-base-004",
                "Backup and restore expectations for stateful data",
                "Stateful stores should document backup scope, retention, and restore validation cadence appropriate to data criticality.",
                "Document backup/restore expectations for datastores[] and link retention to governance.RequiredControls.",
                "ArchLucid Architecture Quality Baseline",
                "Reliability — backup and restoration",
                "High",
                "P0",
            ),
            rule(
                "rel-base-005",
                "Graceful degradation and dependency failure behavior",
                "User-facing paths should describe degraded modes when non-critical dependencies fail (timeouts, fallbacks, queueing) rather than unbounded failure cascades.",
                "Record degradation/fallback behavior in governance.PolicyConstraints and tag affected services[].Tags.",
                "ArchLucid Architecture Quality Baseline",
                "Reliability — graceful degradation",
                "Medium",
                "P1",
            ),
            rule(
                "rel-base-006",
                "Retry, timeout, and idempotency posture for remote calls",
                "Distributed call paths should state timeout, retry, and idempotency expectations to avoid retry storms and inconsistent writes.",
                "Document retry/timeout/idempotency guidance for integration edges in relationships and governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Reliability — retry and timeout behavior",
                "Medium",
                "P1",
            ),
            rule(
                "rel-base-007",
                "Capacity during partial failure",
                "Design should address whether remaining capacity can absorb load when a zone/region/instance set is unavailable, or accept an explicit tradeoff.",
                "State failure-capacity assumptions or accepted risk in metadata.ChangeDescription for production-tier workloads.",
                "ArchLucid Architecture Quality Baseline",
                "Reliability — capacity during failure",
                "Medium",
                "P1",
            ),
            rule(
                "rel-base-008",
                "Recovery procedure ownership and test cadence",
                "Recovery runbooks should have named ownership and a test/exercise cadence proportionate to criticality.",
                "Capture recovery ownership and test cadence in governance.RequiredControls; note accepted exceptions for prototypes.",
                "ArchLucid Architecture Quality Baseline",
                "Reliability — recovery testing and ownership",
                "Medium",
                "P2",
            ),
        ],
    },
    {
        "slug": "performance-and-scalability",
        "displayName": "Performance and Scalability",
        "category": "Performance",
        "description": (
            "Provider-neutral performance and scalability screening — workload assumptions, latency/throughput "
            "objectives, scaling approach, caching, and peak-demand behavior. Thematic mapping only; not a benchmark."
        ),
        "disclaimer": "Performance themes are architecture-review prompts only; not load-test certification.",
        "framework": "ArchLucid Architecture Quality Baseline",
        "appliesToCategory": "performance",
        "rules": [
            rule(
                "perf-base-001",
                "Workload and usage assumptions documented",
                "Performance claims require explicit usage assumptions (users, RPS, data volume, concurrency) or an explicit statement that targets are unknown.",
                "Record workload assumptions in metadata.ChangeDescription and governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Performance — workload assumptions",
                "High",
                "P0",
            ),
            rule(
                "perf-base-002",
                "Latency and throughput objectives stated where user-facing",
                "User-facing or SLA-bound paths should state latency/throughput objectives (or mark them out of scope for this lifecycle stage).",
                "Capture latency/throughput objectives for critical paths in governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Performance — latency and throughput objectives",
                "High",
                "P0",
            ),
            rule(
                "perf-base-003",
                "Scaling approach matched to demand shape",
                "Horizontal/vertical scaling, queue-based smoothing, or fixed capacity should be chosen deliberately against the demand shape.",
                "Describe scaling approach and triggers for services[] in metadata.ChangeDescription.",
                "ArchLucid Architecture Quality Baseline",
                "Performance — scaling approach",
                "Medium",
                "P0",
            ),
            rule(
                "perf-base-004",
                "Caching and data-access patterns explained for hot paths",
                "Hot read/write paths should explain caching, pagination, or access patterns that avoid obvious contention bottlenecks.",
                "Document caching/data-access strategy for hot paths against datastores[] and relationships.",
                "ArchLucid Architecture Quality Baseline",
                "Performance — caching and data access",
                "Medium",
                "P1",
            ),
            rule(
                "perf-base-005",
                "Capacity planning for peak and growth",
                "Design should address peak demand and near-term growth, or accept an explicit capacity risk for the current stage.",
                "State peak/growth capacity planning (or accepted risk) in governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Performance — capacity planning",
                "Medium",
                "P1",
            ),
            rule(
                "perf-base-006",
                "Performance observability for critical paths",
                "Critical paths should identify the signals used to detect latency/throughput regressions (metrics, traces, SLOs).",
                "Map performance signals to services[].Tags and governance.RequiredControls.",
                "ArchLucid Architecture Quality Baseline",
                "Performance — observability",
                "Medium",
                "P1",
            ),
            rule(
                "perf-base-007",
                "Load or soak validation proportionate to risk",
                "Production-bound workloads should describe load/soak validation plans proportionate to risk; prototypes may document deferred validation.",
                "Record load-test or deferred-validation decisions in metadata.ChangeDescription.",
                "ArchLucid Architecture Quality Baseline",
                "Performance — load validation",
                "Low",
                "P2",
            ),
            rule(
                "perf-base-008",
                "Degradation behavior under peak demand",
                "Peak demand should have an intentional degradation or shed-load strategy rather than silent overload failure.",
                "Document peak degradation/shed-load behavior in governance.PolicyConstraints for production tiers.",
                "ArchLucid Architecture Quality Baseline",
                "Performance — peak degradation",
                "Medium",
                "P2",
            ),
        ],
    },
    {
        "slug": "operational-excellence",
        "displayName": "Operational Excellence",
        "category": "Operations",
        "description": (
            "Provider-neutral operational excellence screening — ownership, deployment/rollback, observability, "
            "alerting, runbooks, change management, and incident learning. Thematic mapping only; not an ops audit."
        ),
        "disclaimer": "Operational excellence themes are architecture-review prompts only.",
        "framework": "ArchLucid Architecture Quality Baseline",
        "appliesToCategory": "operations",
        "rules": [
            rule(
                "ops-base-001",
                "Service and data ownership named",
                "Critical services and datastores should have clear operational owners; anonymous ownership blocks incident response.",
                "Capture ownership in services[].Tags / datastores[] metadata and governance.RequiredControls.",
                "ArchLucid Architecture Quality Baseline",
                "Operational excellence — ownership",
                "High",
                "P0",
            ),
            rule(
                "ops-base-002",
                "Deployment and rollback path defined",
                "Release path should include how changes are deployed and how rollback/forward-fix works for production impact.",
                "Document deploy/rollback approach in metadata.ChangeDescription and governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Operational excellence — deployment and rollback",
                "High",
                "P0",
            ),
            rule(
                "ops-base-003",
                "Observability covers health, errors, and key user journeys",
                "Operators should see health, error, and journey signals for production-facing components — not only infrastructure uptime.",
                "Map observability coverage to services[] and governance.RequiredControls.",
                "ArchLucid Architecture Quality Baseline",
                "Operational excellence — observability",
                "High",
                "P0",
            ),
            rule(
                "ops-base-004",
                "Alerting tied to actionable symptoms",
                "Alerts should map to actionable symptoms with ownership; page-on-everything and silent-failure postures both fail review.",
                "Document alert intent and owners in governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Operational excellence — alerting",
                "Medium",
                "P1",
            ),
            rule(
                "ops-base-005",
                "Runbooks for top operational scenarios",
                "Top failure and maintenance scenarios should have runbooks or an explicit backlog for when they will exist.",
                "Link runbook expectations to governance.RequiredControls; note deferred items for early lifecycle stages.",
                "ArchLucid Architecture Quality Baseline",
                "Operational excellence — runbooks",
                "Medium",
                "P1",
            ),
            rule(
                "ops-base-006",
                "Change and configuration management posture",
                "Infrastructure and application configuration changes should have a controlled path (IaC, review, or equivalent) proportionate to risk.",
                "Describe change/config management in metadata.ChangeDescription.",
                "ArchLucid Architecture Quality Baseline",
                "Operational excellence — change management",
                "Medium",
                "P1",
            ),
            rule(
                "ops-base-007",
                "Incident response and on-call support model",
                "Production workloads need a support/on-call model; prototypes may document deferred support explicitly.",
                "Capture support/on-call model in governance.RequiredControls.",
                "ArchLucid Architecture Quality Baseline",
                "Operational excellence — incident response",
                "Medium",
                "P1",
            ),
            rule(
                "ops-base-008",
                "Post-incident learning loop",
                "Material incidents should feed a learning loop (review, action tracking) rather than one-off firefighting.",
                "Document post-incident learning expectations in governance.PolicyConstraints for production tiers.",
                "ArchLucid Architecture Quality Baseline",
                "Operational excellence — post-incident learning",
                "Low",
                "P2",
            ),
        ],
    },
    {
        "slug": "sustainability-and-resource-efficiency",
        "displayName": "Sustainability and Resource Efficiency",
        "category": "Sustainability",
        "description": (
            "Provider-neutral environmental sustainability and resource-efficiency screening — utilization assumptions, "
            "idle capacity, right-sizing, data retention/lifecycle, and proportional accelerator use. "
            "Does not fabricate carbon-emission percentages; thematic architecture guidance only."
        ),
        "disclaimer": (
            "Sustainability themes screen architecture resource efficiency only. "
            "Do not interpret findings as measured carbon accounting or ESG certification."
        ),
        "framework": "ArchLucid Architecture Quality Baseline",
        "appliesToCategory": "sustainability",
        "rules": [
            rule(
                "sust-base-001",
                "Utilization assumptions for continuously allocated capacity",
                "Continuously allocated compute/storage should state utilization assumptions or why always-on capacity is required. Do not invent carbon percentages.",
                "Document utilization assumptions or always-on justification in metadata.ChangeDescription; avoid numeric emissions claims without methodology.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — utilization assumptions",
                "Medium",
                "P0",
            ),
            rule(
                "sust-base-002",
                "Idle-capacity and scheduling strategy",
                "Workloads with idle periods should describe scale-to-zero, scheduling, or accepted idle waste — distinct from pure cost optimization when environmental impact is in scope.",
                "Capture idle/scheduling strategy in governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — idle-resource management",
                "Medium",
                "P0",
            ),
            rule(
                "sust-base-003",
                "Right-sizing and accelerator proportionality",
                "SKU/accelerator choices (including GPUs) should be proportional to stated need; oversized accelerators without justification are a resource-efficiency finding.",
                "Justify compute/accelerator sizing against workload assumptions in metadata.ChangeDescription and services[].Tags.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — right-sizing and accelerators",
                "High",
                "P0",
            ),
            rule(
                "sust-base-004",
                "Data retention and storage lifecycle discipline",
                "Retention and storage lifecycle should match business need; unbounded retention is a resource-efficiency and sustainability concern as well as a cost one.",
                "Document retention/lifecycle for datastores[] in governance.RequiredControls.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — data retention and lifecycle",
                "Medium",
                "P1",
            ),
            rule(
                "sust-base-005",
                "Unnecessary replication and data movement minimized",
                "Cross-region replication and large data movement should be justified; defaulting to global copies without need wastes resources.",
                "Explain replication/data-movement necessity in relationships and governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — unnecessary replication and transfer",
                "Medium",
                "P1",
            ),
            rule(
                "sust-base-006",
                "Recomputation versus caching tradeoff considered",
                "Expensive recomputation loops (including AI inference context replay) should consider caching/batching where quality allows.",
                "Document recomputation vs caching/batching choices for heavy paths in metadata.ChangeDescription.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — recomputation versus caching",
                "Medium",
                "P1",
            ),
            rule(
                "sust-base-007",
                "Consumption observability for resource-heavy workloads",
                "Resource-heavy designs (AI/ML, large data, always-on fleets) should identify how consumption is observed so efficiency regressions are visible.",
                "Map consumption signals to governance.RequiredControls for AI/data/high-scale contexts.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — consumption observability",
                "Medium",
                "P1",
            ),
            rule(
                "sust-base-008",
                "Resource retirement and disposal path",
                "Temporary environments, abandoned capacity, and retired data paths should have a disposal/retirement expectation.",
                "Document retirement/disposal expectations in governance.PolicyConstraints.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — resource retirement",
                "Low",
                "P2",
            ),
            rule(
                "sust-base-009",
                "AI/accelerator efficiency screening when accelerators are in scope",
                "When GPUs/accelerators or generative AI are in scope, justify model size, inference frequency, batching, and always-on vs scheduled capacity without inventing emissions math.",
                "For AI/accelerator workloads, record model/inference efficiency rationale in metadata.ChangeDescription; flag missing evidence rather than fabricating carbon deltas.",
                "ArchLucid Architecture Quality Baseline",
                "Sustainability — AI and accelerator efficiency",
                "High",
                "P0",
            ),
        ],
    },
]


def build_curated(pack: dict) -> dict:
    slug = pack["slug"]
    return {
        "schemaVersion": 1,
        "kind": "archlucid.policyPack.curatedRules.v1",
        "pack": {
            "name": pack["displayName"],
            "description": pack["description"],
            "version": "1.0.0",
            "category": pack["category"],
            "isDefault": True,
            "suggestedPackType": "PlatformDefault",
            "policyPackContentDocumentPath": f"docs/samples/policy-packs/{slug}.json",
        },
        "rules": pack["rules"],
    }


def build_content(pack: dict) -> dict:
    slug = pack["slug"]
    rule_ids = [r["id"] for r in pack["rules"]]
    return {
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
            "pack.displayName": pack["displayName"],
            "pack.category": pack["category"],
            "pack.version": "1.0.0",
            "pack.isDefault": "true",
            "pack.description": pack["description"],
            "frameworkMappingDisclaimer": pack["disclaimer"],
            "curatedRulesArtifact": f"docs/samples/policy-packs/{slug}-rules-v1.json",
            "pack.qualityDimension": {
                "reliability-and-resilience": "ReliabilityAndResilience",
                "performance-and-scalability": "PerformanceAndScalability",
                "operational-excellence": "OperationalExcellence",
                "sustainability-and-resource-efficiency": "SustainabilityAndResourceEfficiency",
            }[slug],
        },
    }


def main() -> None:
    SAMPLES.mkdir(parents=True, exist_ok=True)
    BUNDLED.mkdir(parents=True, exist_ok=True)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    content_files: list[str] = list(manifest.get("contentFiles") or [])
    stubs: list[dict] = []

    for pack in PACKS:
        slug = pack["slug"]
        rules_path = SAMPLES / f"{slug}-rules-v1.json"
        content_path = SAMPLES / f"{slug}.json"
        bundled_path = BUNDLED / f"{slug}.json"
        file_name = f"{slug}.json"

        curated = build_curated(pack)
        content = build_content(pack)
        text = json.dumps(content, indent=2) + "\n"

        rules_path.write_text(json.dumps(curated, indent=2) + "\n", encoding="utf-8")
        content_path.write_text(text, encoding="utf-8")
        bundled_path.write_text(text, encoding="utf-8")

        if file_name not in content_files:
            content_files.append(file_name)

        for item in pack["rules"]:
            stubs.append(
                {
                    "ruleId": item["id"],
                    "controlId": item["id"].upper(),
                    "controlName": f"GA {pack['category']} starter rule (catalog stub)",
                    "appliesToCategory": pack["appliesToCategory"],
                    "requiredNodeType": "SecurityBaseline",
                    "requiredEdgeType": "PROTECTS",
                    "severity": "Warning",
                    "priority": item["priority"],
                    "description": (
                        f"Stub for {item['id']}; see docs/samples/policy-packs/{slug}-rules-v1.json for narrative."
                    ),
                }
            )

    manifest["contentFiles"] = content_files
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    ga = json.loads(GA_RULES.read_text(encoding="utf-8"))
    existing_ids = {r["ruleId"] for r in ga["rules"]}

    for stub in stubs:
        if stub["ruleId"] in existing_ids:
            continue

        ga["rules"].append(stub)
        existing_ids.add(stub["ruleId"])

    GA_RULES.write_text(json.dumps(ga, indent=2) + "\n", encoding="utf-8")

    print(f"packs written: {len(PACKS)}")
    print(f"manifest contentFiles: {len(content_files)}")
    print(f"ga stubs total: {len(ga['rules'])}")


if __name__ == "__main__":
    main()

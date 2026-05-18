#!/usr/bin/env python3
"""Generate V1 GA bundled policy pack samples, embedded content, manifest, and GA compliance stubs."""

from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SAMPLES = REPO / "docs" / "samples" / "policy-packs"
BUNDLED = REPO / "ArchLucid.Application" / "Governance" / "DefaultPolicyPacks" / "Bundled"
GA_RULES = REPO / "ArchLucid.Decisioning" / "Compliance" / "RulePacks" / "ga-starter-compliance.rules.json"
MANIFEST = BUNDLED / "bundled-policy-packs-v1.manifest.json"

RULES_PER_PACK = 10


def rule_entry(rule_id: str, title: str, framework: str, theme: str, severity: str = "Medium") -> dict:
    return {
        "id": rule_id,
        "title": title,
        "description": f"Architecture manifest and Azure extractor evidence should support: {title.lower()}. Thematic mapping only — not certification.",
        "severity": severity,
        "remediationGuidance": f"Document expectations in governance.PolicyConstraints and governance.RequiredControls; align services[].Tags and datastores[] with reviewer narrative in metadata.ChangeDescription.",
        "evidenceHints": [
            "governance.PolicyConstraints",
            "governance.RequiredControls",
            "governance.ComplianceTags",
            "services[].Tags",
            "metadata.ChangeDescription",
        ],
        "frameworkMappings": [{"framework": framework, "theme": theme}],
    }


def build_curated(pack: dict, rules: list[dict]) -> dict:
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
        "rules": rules,
    }


def build_content(pack: dict, rule_ids: list[str]) -> dict:
    slug = pack["slug"]
    return {
        "complianceRuleIds": [],
        "complianceRuleKeys": rule_ids,
        "alertRuleIds": [],
        "compositeAlertRuleIds": [],
        "advisoryDefaults": {"severityFloor": "warning", "scanDepth": "standard"},
        "metadata": {
            "templateId": f"{slug}-v1",
            "pack.displayName": pack["displayName"],
            "pack.category": pack["category"],
            "pack.version": "1.0.0",
            "pack.isDefault": "true",
            "pack.description": pack["description"],
            "frameworkMappingDisclaimer": pack["disclaimer"],
            "curatedRulesArtifact": f"docs/samples/policy-packs/{slug}-rules-v1.json",
        },
    }


PACKS: list[dict] = [
    {
        "slug": "ai-governance-responsible-ai",
        "prefix": "ai-gov",
        "count": 20,
        "existing_rules": True,
        "displayName": "AI Governance / Responsible AI",
        "description": "Starter baseline for AI/ML asset governance. Thematic NIST AI RMF / EU AI Act mapping only; not certification.",
        "category": "AI Governance",
        "disclaimer": "Framework references are thematic mapping for reviewers only.",
        "framework": "NIST AI RMF v1.0",
        "themes": ["Map", "Govern", "Manage", "Measure"],
    },
    {
        "slug": "security-architecture-baseline",
        "prefix": "sec-base",
        "count": 30,
        "existing_rules": True,
        "displayName": "Security Architecture Baseline",
        "description": "Starter security posture for cloud architecture reviews. CIS / OWASP themes only; not attestation.",
        "category": "Security",
        "disclaimer": "CIS and OWASP references are thematic alignment only.",
        "framework": "CIS Azure Foundations",
        "themes": ["Identity", "Logging", "Encryption", "Network"],
    },
    {
        "slug": "azure-waf",
        "prefix": "waf-az",
        "count": 12,
        "existing_rules": True,
        "displayName": "Azure Well-Architected Framework",
        "description": "WAF pillar themes grounded in Azure extractor inventory. Not a Microsoft Well-Architected Review.",
        "category": "Architecture",
        "disclaimer": "WAF references are thematic mapping only.",
        "framework": "Microsoft Azure Well-Architected",
        "themes": ["Reliability", "Security", "Cost", "Operations"],
    },
    {
        "slug": "azure-caf-landing-zone",
        "prefix": "lz-caf",
        "count": 12,
        "existing_rules": True,
        "displayName": "Azure Landing Zone / Cloud Adoption Framework",
        "description": "CAF/LZ starter prompts for platform architecture. Not LZ conformance certification.",
        "category": "Platform",
        "disclaimer": "CAF/LZ references are thematic mapping only.",
        "framework": "Microsoft Cloud Adoption Framework",
        "themes": ["Ready", "Adopt", "Govern"],
    },
    {
        "slug": "gdpr-baseline",
        "prefix": "gdpr",
        "displayName": "GDPR Compliance Baseline",
        "description": "Privacy and data-protection architecture themes (encryption, minimization, region constraints). Not legal GDPR certification.",
        "category": "Privacy",
        "disclaimer": "GDPR mapping is informative only; counsel determines applicability.",
        "framework": "GDPR",
        "themes": ["Art. 32 Security", "Art. 35 DPIA themes", "Data minimization"],
    },
    {
        "slug": "soc2-tsc-architecture",
        "prefix": "soc2",
        "displayName": "SOC 2 Type II (Architecture Themes)",
        "description": "Trust Services Criteria architecture slice for security, availability, and confidentiality. Not SOC 2 attestation.",
        "category": "Compliance",
        "disclaimer": "SOC 2 themes are architecture-review prompts only.",
        "framework": "SOC 2 TSC",
        "themes": ["CC6 Logical access", "CC7 System operations", "CC6.7 Encryption"],
    },
    {
        "slug": "cost-optimization",
        "prefix": "cost-opt",
        "count": 6,
        "existing_rules": True,
        "displayName": "FinOps & Cloud Cost Optimization",
        "description": "FinOps prompts from Azure extractor inventory. Does not replace Cost Management actuals.",
        "category": "Cost",
        "disclaimer": "FinOps mapping is advisory only.",
        "framework": "FinOps Framework",
        "themes": ["Optimize", "Operate", "Inform"],
    },
    {
        "slug": "owasp-api-top10",
        "prefix": "owasp-api",
        "displayName": "OWASP API Security Top 10",
        "description": "API architecture security themes aligned to OWASP API Top 10 motifs. Not OWASP certification.",
        "category": "Application Security",
        "disclaimer": "OWASP references are thematic only.",
        "framework": "OWASP API Security Top 10",
        "themes": ["Broken object authorization", "Unsafe consumption", "Rate limiting"],
    },
    {
        "slug": "iso27001-architecture",
        "prefix": "iso27001",
        "displayName": "ISO/IEC 27001 ISMS (Architecture Slice)",
        "description": "ISMS control themes for architecture evidence. Not ISO 27001 certification.",
        "category": "Compliance",
        "disclaimer": "ISO mapping is thematic only.",
        "framework": "ISO/IEC 27001",
        "themes": ["A.8 Asset management", "A.9 Access control", "A.10 Cryptography"],
    },
    {
        "slug": "cis-azure-foundations",
        "prefix": "cis-az",
        "displayName": "CIS Microsoft Azure Foundations Benchmark",
        "description": "CIS-aligned Azure hardening themes for architecture review. Not CIS benchmark pass/fail.",
        "category": "Security",
        "disclaimer": "CIS mapping is thematic only.",
        "framework": "CIS Azure Foundations Benchmark",
        "themes": ["Identity", "Storage", "Networking", "Logging"],
    },
    {
        "slug": "hipaa-architecture",
        "prefix": "hipaa",
        "displayName": "HIPAA / HITECH Safeguards",
        "description": "PHI handling, audit, and encryption themes for healthcare architectures. Not HIPAA certification.",
        "category": "Healthcare",
        "disclaimer": "HIPAA mapping is thematic only.",
        "framework": "HIPAA Security Rule",
        "themes": ["Administrative safeguards", "Technical safeguards", "Audit controls"],
    },
    {
        "slug": "pci-dss-architecture",
        "prefix": "pci",
        "displayName": "PCI-DSS (Architecture / Segmentation)",
        "description": "CDE segmentation and payment-data handling themes. Not PCI-DSS QSA attestation.",
        "category": "Payments",
        "disclaimer": "PCI mapping is thematic only.",
        "framework": "PCI-DSS",
        "themes": ["Network segmentation", "Encryption", "Access control"],
    },
    {
        "slug": "zero-trust-architecture",
        "prefix": "zta",
        "displayName": "Zero Trust Architecture",
        "description": "Continuous verification, identity perimeter, and micro-segmentation themes. Not a ZTA maturity certification.",
        "category": "Security",
        "disclaimer": "ZTA mapping is thematic only.",
        "framework": "NIST SP 800-207",
        "themes": ["Verify explicitly", "Least privilege", "Assume breach"],
    },
    {
        "slug": "azure-resiliency-dr",
        "prefix": "az-dr",
        "displayName": "Azure Resiliency & Disaster Recovery",
        "description": "Multi-region, availability zones, RTO/RPO, and backup themes for Azure workloads.",
        "category": "Reliability",
        "disclaimer": "DR mapping is architecture guidance only.",
        "framework": "Azure Well-Architected",
        "themes": ["Reliability — DR", "Backup", "Failover"],
    },
    {
        "slug": "aks-production-baseline",
        "prefix": "aks",
        "displayName": "AKS Production Baseline",
        "description": "Kubernetes on Azure production hardening themes (private API, network policy, identity).",
        "category": "Platform",
        "disclaimer": "AKS mapping is thematic only.",
        "framework": "AKS baseline",
        "themes": ["Private cluster", "Network policy", "Workload identity"],
    },
    {
        "slug": "data-classification-lineage",
        "prefix": "data-class",
        "displayName": "Data Classification & Lineage",
        "description": "Classification tiers and cross-boundary data-flow documentation themes.",
        "category": "Data Governance",
        "disclaimer": "Classification mapping is thematic only.",
        "framework": "Data governance",
        "themes": ["Classification", "Lineage", "Retention"],
    },
    {
        "slug": "entra-iam-baseline",
        "prefix": "entra-iam",
        "displayName": "Entra ID / IAM Architecture Baseline",
        "description": "Entra ID, RBAC, managed identity, and conditional access themes for Azure architectures.",
        "category": "Identity",
        "disclaimer": "Identity mapping is thematic only.",
        "framework": "Microsoft Entra ID",
        "themes": ["RBAC", "Managed identity", "Conditional access"],
    },
    {
        "slug": "azure-paas-security",
        "prefix": "az-paas",
        "displayName": "Serverless & PaaS Security (Azure)",
        "description": "Functions, Container Apps, and App Service private networking and identity themes.",
        "category": "Application Platform",
        "disclaimer": "PaaS mapping is thematic only.",
        "framework": "Azure PaaS",
        "themes": ["VNet integration", "Managed identity", "Public access disabled"],
    },
    {
        "slug": "nist-csf-2-architecture",
        "prefix": "nist-csf",
        "displayName": "NIST Cybersecurity Framework 2.0",
        "description": "CSF 2.0 function themes for architecture evidence (Govern, Identify, Protect, Detect, Respond, Recover).",
        "category": "Compliance",
        "disclaimer": "NIST CSF mapping is thematic only.",
        "framework": "NIST CSF 2.0",
        "themes": ["Govern", "Identify", "Protect", "Detect"],
    },
    {
        "slug": "supply-chain-sbom",
        "prefix": "supply-chain",
        "displayName": "Software Supply Chain & SBOM",
        "description": "SBOM, artifact signing, and dependency scanning themes for delivery pipelines.",
        "category": "DevSecOps",
        "disclaimer": "Supply-chain mapping is thematic only.",
        "framework": "SLSA / SSDF",
        "themes": ["SBOM", "Provenance", "Vulnerability scanning"],
    },
    {
        "slug": "dora-devsecops",
        "prefix": "dora",
        "displayName": "DORA / DevSecOps Delivery Posture",
        "description": "Delivery automation, rollback, and change-lead-time themes for architecture gates.",
        "category": "Engineering",
        "disclaimer": "DORA mapping is thematic only.",
        "framework": "DORA",
        "themes": ["Deployment frequency", "Lead time", "Change failure rate"],
    },
    {
        "slug": "observability-otel",
        "prefix": "otel",
        "displayName": "Observability & OpenTelemetry Baseline",
        "description": "Distributed tracing, metrics, and centralized logging themes before production approval.",
        "category": "Operations",
        "disclaimer": "Observability mapping is thematic only.",
        "framework": "OpenTelemetry",
        "themes": ["Traces", "Metrics", "Logs"],
    },
    {
        "slug": "azure-data-layer-security",
        "prefix": "az-data",
        "displayName": "Azure SQL / Cosmos DB Data-Layer Security",
        "description": "RLS, TDE, auditing, and private endpoint themes for Azure data platforms.",
        "category": "Data Platform",
        "disclaimer": "Data-layer mapping is thematic only.",
        "framework": "Azure data services",
        "themes": ["Encryption", "Private endpoints", "Auditing"],
    },
]


def generate_rules(pack: dict) -> list[dict]:
    count = pack.get("count", RULES_PER_PACK)
    prefix = pack["prefix"]
    themes = pack["themes"]
    framework = pack["framework"]
    rules: list[dict] = []
    for i in range(1, count + 1):
        rid = f"{prefix}-{i:03d}"
        theme = themes[(i - 1) % len(themes)]
        title = f"{pack['displayName']} — control theme {i}"
        sev = "High" if i <= 3 else "Medium"
        rules.append(rule_entry(rid, title, framework, theme, sev))
    return rules


def main() -> None:
    BUNDLED.mkdir(parents=True, exist_ok=True)
    manifest_entries: list[str] = []
    new_stubs: list[dict] = []

    for pack in PACKS:
        slug = pack["slug"]
        rules_path = SAMPLES / f"{slug}-rules-v1.json"
        content_path = SAMPLES / f"{slug}.json"
        bundled_path = BUNDLED / f"{slug}.json"

        if pack.get("existing_rules") and rules_path.exists():
            curated = json.loads(rules_path.read_text(encoding="utf-8"))
            rule_ids = [r["id"] for r in curated["rules"]]
            curated["pack"]["isDefault"] = True
            curated["pack"]["suggestedPackType"] = "PlatformDefault"
            rules_path.write_text(json.dumps(curated, indent=2) + "\n", encoding="utf-8")
        else:
            rules = generate_rules(pack)
            curated = build_curated(pack, rules)
            rules_path.write_text(json.dumps(curated, indent=2) + "\n", encoding="utf-8")
            rule_ids = [r["id"] for r in rules]

        content = build_content(pack, rule_ids)
        text = json.dumps(content, indent=2) + "\n"
        content_path.write_text(text, encoding="utf-8")
        bundled_path.write_text(text, encoding="utf-8")
        manifest_entries.append(f"{slug}.json")

        cat = pack["category"].lower().replace(" ", "-")
        if cat == "application-security":
            cat = "application"
        for rid in rule_ids:
            if any(r.get("ruleId") == rid for r in new_stubs):
                continue
            n = rid.split("-")[-1]
            new_stubs.append(
                {
                    "ruleId": rid,
                    "controlId": rid.upper().replace("-", "-"),
                    "controlName": f"GA {pack['category']} starter rule (catalog stub)",
                    "appliesToCategory": cat[:32] if len(cat) <= 32 else "governance",
                    "requiredNodeType": "SecurityBaseline",
                    "requiredEdgeType": "PROTECTS",
                    "severity": "Warning",
                    "description": f"Stub for {rid}; see docs/samples/policy-packs/{slug}-rules-v1.json for narrative.",
                }
            )

    manifest = {"version": 1, "contentFiles": manifest_entries}
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    ga = json.loads(GA_RULES.read_text(encoding="utf-8"))
    existing_ids = {r["ruleId"] for r in ga["rules"]}
    for stub in new_stubs:
        if stub["ruleId"] not in existing_ids:
            ga["rules"].append(stub)
            existing_ids.add(stub["ruleId"])
    GA_RULES.write_text(json.dumps(ga, indent=2) + "\n", encoding="utf-8")

    print(f"manifest: {len(manifest_entries)} packs")
    print(f"ga stubs total: {len(ga['rules'])}")


if __name__ == "__main__":
    main()

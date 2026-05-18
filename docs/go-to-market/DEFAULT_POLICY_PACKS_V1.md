> **Scope:** Default policy packs — V1 GA bundles - full detail, tables, and links in the sections below.

# Default policy packs — V1 GA bundles

**Audience:** pilots, procurement, CS, and sellers explaining what governance content ships **in-tenant by default**.

**Objective:** Declare **23** first-party curated categories bundled with every net-new tenant provisioning (see `IDefaultPolicyPackSeeder` / embedded manifest `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/bundled-policy-packs-v1.manifest.json`).

## The "Brain" of the Governance Model

ArchLucid's policy packs act as the active "brain" of the governance engine. By decoupling the core evaluation engine from domain-specific knowledge, policy packs future-proof the system against rapid technology shifts. Rather than updating core binaries to support a new framework or compliance standard, new logic is injected via JSON/YAML documents containing:
1. **Compliance Rules:** The actual gates that inspect architecture evidence.
2. **Alert Rules:** Operational observability rules that trigger Loki/Grafana alerts.
3. **Advisory Defaults:** Contextual guidance and remediation advice.

This design enables deep customization via hierarchical scoping (Tenant, Workspace, Project) where multiple packs are dynamically merged, allowing central security teams and individual project squads to combine their distinct governance requirements seamlessly.

**Content velocity:** Curated packs are drafted with an **LLM generator → critic model → human SME** pipeline; regenerate samples with **`python scripts/generate_v1_bundled_policy_packs.py`**. Authoring playbook: **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)**.

---

## 1. What ships for V1 GA

All rows below are seeded as **`PlatformDefault`** (Operator UI: **Bundled default (platform)**). Curated rule narratives live in **`docs/samples/policy-packs/*-rules-v1.json`**; provisioning copies are embedded under **`ArchLucid.Application/.../Bundled/`**.

| # | Bundled category | Display name | Rule key prefix (examples) |
|---|------------------|--------------|----------------------------|
| 1 | AI Governance | AI Governance / Responsible AI | `ai-gov-001` … `020` |
| 2 | Security baseline | Security Architecture Baseline | `sec-base-001` … `030` |
| 3 | Azure WAF | Azure Well-Architected Framework | `waf-az-001` … `012` |
| 4 | Azure CAF / LZ | Azure Landing Zone / Cloud Adoption Framework | `lz-caf-001` … `012` |
| 5 | Privacy | GDPR Compliance Baseline | `gdpr-001` … `010` |
| 6 | Compliance | SOC 2 Type II (Architecture Themes) | `soc2-001` … `010` |
| 7 | Cost | FinOps & Cloud Cost Optimization | `cost-opt-001` … `006` |
| 8 | Application security | OWASP API Security Top 10 | `owasp-api-001` … `010` |
| 9 | Compliance | ISO/IEC 27001 ISMS (Architecture Slice) | `iso27001-001` … `010` |
| 10 | Security | CIS Microsoft Azure Foundations Benchmark | `cis-az-001` … `010` |
| 11 | Healthcare | HIPAA / HITECH Safeguards | `hipaa-001` … `010` |
| 12 | Payments | PCI-DSS (Architecture / Segmentation) | `pci-001` … `010` |
| 13 | Security | Zero Trust Architecture | `zta-001` … `010` |
| 14 | Reliability | Azure Resiliency & Disaster Recovery | `az-dr-001` … `010` |
| 15 | Platform | AKS Production Baseline | `aks-001` … `010` |
| 16 | Data governance | Data Classification & Lineage | `data-class-001` … `010` |
| 17 | Identity | Entra ID / IAM Architecture Baseline | `entra-iam-001` … `010` |
| 18 | Application platform | Serverless & PaaS Security (Azure) | `az-paas-001` … `010` |
| 19 | Compliance | NIST Cybersecurity Framework 2.0 | `nist-csf-001` … `010` |
| 20 | DevSecOps | Software Supply Chain & SBOM | `supply-chain-001` … `010` |
| 21 | Engineering | DORA / DevSecOps Delivery Posture | `dora-001` … `010` |
| 22 | Operations | Observability & OpenTelemetry Baseline | `otel-001` … `010` |
| 23 | Data platform | Azure SQL / Cosmos DB Data-Layer Security | `az-data-001` … `010` |

**Appendices (selected):** **[`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md)** · **[`POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`](../library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md)**

Assignments are seeded **enabled** (`PolicyPackAssignments.IsEnabled = true`); merges participate in **`PolicyPackResolver`** like any other activated assignment.

---

## 2. Framework & jurisdiction disclaimers (all bundled rules)

Starter corpora use **informative thematic mapping** (`frameworkMappings`) to accelerate architecture review—they **do not** constitute statutory legal classification, conformity assessment, CIS/OWASP/PCI/HIPAA/SOC 2 pass-fail automation, **or** Microsoft Well-Architected / CAF / landing-zone **certification**.

**Operational truth:** Buyers remain responsible for jurisdictional applicability, contractual obligations, auditor evidence breadth, and any certification claims.

---

## 3. Operator UI — where bundles appear

- **Registered list & effective merge:** **`/policy-packs`** surfaces packs returned by **`GET`** list + effective merges; seeded rows show **Bundled default (platform)**.
- **Rule key inspection:** Expanded **Inspect** accordion lists merged **`complianceRuleKeys`** plus pointers to appendix / sample JSON.
- **Findings UX:** Rows in **`/governance/findings`** link to Inspect on review detail.

---

## 4. Security / tenancy posture (non-regression assertion)

Bundles are **`PlatformDefault`** rows **scoped per tenant/workspace/project**, not silently shared writable globals. Operators **cannot republish** them through the shipped HTTP surface (UI disables **Publish**, API rejects `PublishVersion`).

---

## 5. Content roadmap

The prioritized **top-20 commercial backlog** from **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)** is **included in V1 GA** (plus AI Governance and Security baseline as core corpora). Future packs expand depth (more rules per framework) via content revisions, not binary releases.

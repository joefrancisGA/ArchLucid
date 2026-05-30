> **Scope:** Default policy packs — V1 GA bundles - full detail, tables, and links in the sections below.

# Default policy packs — V1 GA bundles

**Audience:** pilots, procurement, CS, and sellers explaining what governance content ships **in-tenant by default**.

**Objective:** Declare **24** first-party curated categories bundled with every net-new tenant provisioning (see `IDefaultPolicyPackSeeder` / embedded manifest `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/bundled-policy-packs-v1.manifest.json`).

> **Note:** Pack **#24 — ARC-AMPE Architecture Themes** is **designed and queued for V1** ([`POLICY_PACK_ARC_AMPE_DESIGN.md`](../library/POLICY_PACK_ARC_AMPE_DESIGN.md)); JSON content is **not yet authored**. The manifest still ships **23** content files until the rule corpus lands; this row tracks scope so V1 GA copy and procurement responses are aligned.

## The "Brain" of the Governance Model

ArchLucid's policy packs act as the active "brain" of the governance engine. By decoupling the core evaluation engine from domain-specific knowledge, policy packs future-proof the system against rapid technology shifts. Rather than updating core binaries to support a new framework or compliance standard, new logic is injected via JSON/YAML documents containing:
1. **Compliance Rules:** The actual gates that inspect architecture evidence.
2. **Alert Rules:** Operational observability rules that trigger Loki/Grafana alerts.
3. **Advisory Defaults:** Contextual guidance and remediation advice.

This design enables deep customization via hierarchical scoping (Tenant, Workspace, Project) where multiple packs are dynamically merged, allowing central security teams and individual project squads to combine their distinct governance requirements seamlessly.

**Content velocity:** Curated packs are drafted with an **LLM generator → critic model → human SME** pipeline; regenerate samples with **`python scripts/generate_v1_bundled_policy_packs.py`**. Authoring playbook: **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)**.

**Rule count and priorities:** Bundled packs are **not** limited to a fixed number of rules per framework. Each pack should grow to cover its standard as content matures. Rules carry **`priority`** (`P0` must-have, `P1` should-have, `P2` nice-to-have). Net-new seeds default to **`priorityFloor: P0`** in `advisoryDefaults` so pilots enforce the must-have subset first; operators widen to `P1` / `P2` as governance matures. Details: **[`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../library/POLICY_PACK_RULE_PRIORITY_MODEL.md)**.

---

## 1. What ships for V1 GA

All rows below are seeded as **`PlatformDefault`** (Operator UI: **Bundled default (platform)**). Curated rule narratives live in **`docs/samples/policy-packs/*-rules-v1.json`**; provisioning copies are embedded under **`ArchLucid.Application/.../Bundled/`**.

| # | Bundled category | Display name | Rule key prefix (examples) | Notes |
|---|------------------|--------------|----------------------------|
| 1 | AI Governance | AI Governance / Responsible AI | `ai-gov-001` … `020` | Full curated corpus |
| 2 | Security baseline | Security Architecture Baseline | `sec-base-001` … `030` | Full curated corpus |
| 3 | Azure WAF | Azure Well-Architected Framework | `waf-az-001` … `012` | Full curated corpus |
| 4 | Azure CAF / LZ | Azure Landing Zone / Cloud Adoption Framework | `lz-caf-001` … `012` | Full curated corpus |
| 5 | Privacy | GDPR Compliance Baseline | `gdpr-001` … | Expand per GDPR themes |
| 6 | Compliance | SOC 2 Type II (Architecture Themes) | `soc2-001` … | Expand per TSC |
| 7 | Cost | FinOps & Cloud Cost Optimization | `cost-opt-001` … `006` | Extractor-aligned |
| 8 | Application security | OWASP API Security Top 10 | `owasp-api-001` … | ~10 categories + depth |
| 9 | Compliance | ISO/IEC 27001 ISMS (Architecture Slice) | `iso27001-001` … | Expand per Annex A slice |
| 10 | Security | CIS Microsoft Azure Foundations Benchmark | `cis-az-001` … | Prefer `cis-az-l1-*` / `l2-*` ids |
| 11 | Healthcare | HIPAA / HITECH Safeguards | `hipaa-001` … | Expand per safeguard |
| 12 | Payments | PCI-DSS (Architecture / Segmentation) | `pci-001` … | Expand per DSS area |
| 13 | Security | Zero Trust Architecture | `zta-001` … | NIST 800-207 themes |
| 14 | Reliability | Azure Resiliency & Disaster Recovery | `az-dr-001` … | |
| 15 | Platform | AKS Production Baseline | `aks-001` … | |
| 16 | Data governance | Data Classification & Lineage | `data-class-001` … | |
| 17 | Identity | Entra ID / IAM Architecture Baseline | `entra-iam-001` … | |
| 18 | Application platform | Serverless & PaaS Security (Azure) | `az-paas-001` … | |
| 19 | Compliance | NIST Cybersecurity Framework 2.0 | `nist-csf-001` … | CSF functions |
| 20 | DevSecOps | Software Supply Chain & SBOM | `supply-chain-001` … | |
| 21 | Engineering | DORA / DevSecOps Delivery Posture | `dora-001` … | Small corpus OK |
| 22 | Operations | Observability & OpenTelemetry Baseline | `otel-001` … | |
| 23 | Data platform | Azure SQL / Cosmos DB Data-Layer Security | `az-data-001` … | |
| **24** | **Compliance** | **ARC-AMPE Architecture Themes (CMS ACA / Medicaid Partner Entities)** | `arc-ampe-pillar-*`, `arc-ampe-id-*`, `arc-ampe-pr-*`, `arc-ampe-de-*`, `arc-ampe-rs-*`, `arc-ampe-rc-*`, `arc-ampe-pf-*`, `arc-ampe-erm-*`, `arc-ampe-data-us-*`, `arc-ampe-vol2-*` | **V1 queued — content authoring next; spec: [`POLICY_PACK_ARC_AMPE_DESIGN.md`](../library/POLICY_PACK_ARC_AMPE_DESIGN.md). Architecture-review themes only — not CMS conformity, SSPP authoring, or attestation.** |

**Appendices (selected):** **[`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md)** · **[`POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`](../library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md)**

Assignments are seeded **enabled** (`PolicyPackAssignments.IsEnabled = true`); merges participate in **`PolicyPackResolver`** like any other activated assignment.

---

## 2. Framework & jurisdiction disclaimers (all bundled rules)

Starter corpora use **informative thematic mapping** (`frameworkMappings`) to accelerate architecture review—they **do not** constitute statutory legal classification, conformity assessment, CIS/OWASP/PCI/HIPAA/SOC 2 pass-fail automation, Microsoft Well-Architected / CAF / landing-zone **certification**, **or** CMS ARC-AMPE conformity / SSPP authoring / ATO.

**Operational truth:** Buyers remain responsible for jurisdictional applicability, contractual obligations, auditor evidence breadth, and any certification claims.

---

## 3. Operator UI — where bundles appear

- **Registered list & effective merge:** **`/policy-packs`** surfaces packs returned by **`GET`** list + effective merges; seeded rows show **Bundled default (platform)**.
- **Rule key inspection:** Expanded **Inspect** accordion lists merged **`complianceRuleKeys`** plus pointers to appendix / sample JSON.
- **Findings UX:** Rows in **`/governance/findings`** link to Inspect on review detail.

---

## 4. Security / tenancy posture (non-regression assertion)

Bundles are **`PlatformDefault`** rows **scoped per tenant/workspace/project**, not silently shared writable globals. Operators **cannot republish** them through the shipped HTTP surface (UI disables **Publish**, API rejects `PublishVersion`).

### Content quality harness (CI)

Bundled pack JSON, manifest counts, curated rule corpora, disclaimer language, and duplicate rule keys are validated by:

```bash
python scripts/ci/check_policy_pack_content_quality.py
```

The harness fails on duplicate `complianceRuleKeys`, missing rule rationale in curated JSON, missing framework disclaimers, unsupported certification wording, or manifest/doc count drift. Unit tests live in `scripts/ci/tests/test_check_policy_pack_content_quality.py`.

---

## 5. Content roadmap

The prioritized **top-20 commercial backlog** from **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)** is **included in V1 GA** (plus AI Governance and Security baseline as core corpora). Future work **expands rule count and priority tagging** per framework via content revisions, not binary releases — see **[`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../library/POLICY_PACK_RULE_PRIORITY_MODEL.md)**.

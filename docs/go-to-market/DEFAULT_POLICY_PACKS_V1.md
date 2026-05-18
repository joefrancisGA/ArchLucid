> **Scope:** Default policy packs — V1 GA bundles - full detail, tables, and links in the sections below.

# Default policy packs — V1 GA bundles

**Audience:** pilots, procurement, CS, and sellers explaining what governance content ships **in-tenant by default**.

**Objective:** Declare exactly **four** first-party curated categories bundled with every net-new tenant provisioning (see `IDefaultPolicyPackSeeder` / `DEFAULT_POLICY_PACKS_V1`).

## The "Brain" of the Governance Model

ArchLucid's policy packs act as the active "brain" of the governance engine. By decoupling the core evaluation engine from domain-specific knowledge, policy packs future-proof the system against rapid technology shifts. Rather than updating core binaries to support a new framework or compliance standard, new logic is injected via JSON/YAML documents containing:
1. **Compliance Rules:** The actual gates that inspect architecture evidence.
2. **Alert Rules:** Operational observability rules that trigger Loki/Grafana alerts.
3. **Advisory Defaults:** Contextual guidance and remediation advice.

This design enables deep customization via hierarchical scoping (Tenant, Workspace, Project) where multiple packs are dynamically merged, allowing central security teams and individual project squads to combine their distinct governance requirements seamlessly.

**Content velocity:** Curated packs are drafted with an **LLM generator → critic model → human SME** pipeline; see **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)**.

---

## 1. What ships for V1 GA

| Bundled GA category | Display name | Pack type in UI/API | Stable rule references | Canonical narrative |
|--------------------|--------------|---------------------|-----------------------|-----------------------|
| **AI Governance** | **AI Governance / Responsible AI** | `PlatformDefault` (shown as **Bundled default (platform)** in Operator UI) | **20** curated keys (`ai-gov-001` … `ai-gov-020`) | Appendix: **[`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md)** • JSON: [`ai-governance-responsible-ai-rules-v1.json`](../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json) |
| **Security baseline** | **Security Architecture Baseline** | Same | **30** curated keys (`sec-base-001` … `sec-base-030`) | Appendix: **[`POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`](../library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md)** • JSON: [`security-architecture-baseline-rules-v1.json`](../samples/policy-packs/security-architecture-baseline-rules-v1.json) |
| **Azure WAF** | **Azure Well-Architected Framework** | Same | **12** curated keys (`waf-az-001` … `waf-az-012`) | JSON: [`azure-waf-rules-v1.json`](../samples/policy-packs/azure-waf-rules-v1.json) • content doc: [`azure-waf.json`](../samples/policy-packs/azure-waf.json) |
| **Azure CAF / LZ** | **Azure Landing Zone / Cloud Adoption Framework** | Same | **12** curated keys (`lz-caf-001` … `lz-caf-012`) | JSON: [`azure-caf-landing-zone-rules-v1.json`](../samples/policy-packs/azure-caf-landing-zone-rules-v1.json) • content doc: [`azure-caf-landing-zone.json`](../samples/policy-packs/azure-caf-landing-zone.json) |

Assignments are seeded **enabled** (`PolicyPackAssignments.IsEnabled = true`); merges participate in **`PolicyPackResolver`** like any other activated assignment.

---

## 2. Framework & jurisdiction disclaimers (all bundled rules)

Starter corpora use **informative thematic mapping** (`frameworkMappings`) to accelerate architecture review—they **do not** constitute statutory legal classification, Annex III conformity assessment, CIS benchmark pass/fail automation, OWASP certification, **or Microsoft Well-Architected / CAF / landing-zone attestation.**

**Operational truth:** Buyers remain responsible for jurisdictional applicability, contractual obligations, auditor evidence breadth, and any certification claims.

Canonical pack metadata repeats this posture in seeded JSON `description`/`metadata.disclaimer`-style strings.

---

## 3. Operator UI — where bundles appear

- **Registered list & effective merge:** **`/policy-packs`** surfaces packs returned by **`GET`** list + effective merges; seeded rows show **Bundled default (platform)**.
- **Rule key inspection:** Expanded **Inspect** accordion lists merged **`complianceRuleKeys`** plus pointers to appendix JSON.
- **Findings UX:** Rows in **`/governance/findings`** link to Inspect; **`/reviews/{runId}/findings/{id}/inspect`** surfaces titles, rationales (description), inferred severity traces, remediation blocks, reasoning payload (operator deep view), consistent with seeded compliance rule metadata mirrored into evaluation outputs where the Authority pipeline emits them against evidence.

Pilot validation path: finalize a manifest with Azure / architecture evidence intersecting seeded keys → open finding inspect for rule-backed rows.

---

## 4. Security / tenancy posture (non-regression assertion)

Bundles are **`PlatformDefault`** rows **scoped per tenant/workspace/project**, not silently shared writable globals. Operators **cannot republish** them through the shipped HTTP surface (UI disables **Publish**, API rejects `PublishVersion`). Read paths obey existing repository scoping; **tenant A cannot mutate tenant B packs** regardless of labeling.

---

## 5. Content roadmap and authoring

**Prioritized packs beyond GA**, LLM-assisted drafting pipeline, and promotion paths: **[`POLICY_PACK_CONTENT_BACKLOG.md`](../library/POLICY_PACK_CONTENT_BACKLOG.md)**.

> **Scope:** Default policy packs — V1 GA bundles - full detail, tables, and links in the sections below.

# Default policy packs — V1 GA bundles

**Audience:** pilots, procurement, CS, and sellers explaining what governance content ships **in-tenant by default**.

**Objective:** Declare exactly **two** first-party curated categories bundled with every net-new tenant provisioning (see `IDefaultPolicyPackSeeder` / `DEFAULT_POLICY_PACKS_V1`). Everything else—including **Azure Landing Zone / CAF-style** packs—falls under **explicit V1.1** messaging below.

---

## 1. What ships for V1 GA

| Bundled GA category | Display name | Pack type in UI/API | Stable rule references | Canonical narrative |
|--------------------|--------------|---------------------|-----------------------|-----------------------|
| **AI Governance** | **AI Governance / Responsible AI** | `PlatformDefault` (shown as **Bundled default (platform)** in Operator UI) | **20** curated keys (`ai-gov-001` … `ai-gov-020`) | Appendix: **[`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](../library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md)** • JSON: [`docs/samples/policy-packs/ai-governance-responsible-ai-rules-v1.json`](../samples/policy-packs/ai-governance-responsible-ai-rules-v1.json) |
| **Security baseline** | **Security Architecture Baseline** | Same | **25** curated keys (`sec-base-001` … `sec-base-025`) | Appendix: **[`POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`](../library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md)** • JSON: [`docs/samples/policy-packs/security-architecture-baseline-rules-v1.json`](../samples/policy-packs/security-architecture-baseline-rules-v1.json) |

Assignments are seeded **enabled** (`PolicyPackAssignments.IsEnabled = true`); merges participate in **`PolicyPackResolver`** like any other activated assignment.

---

## 2. Explicitly **not** a V1 GA bundle

### Azure landing-zone / Cloud Adoption Framework (CAF) curated pack → **V1.1**

> **Buyer-safe statement:** ArchLucid **V1 GA ships two thematic starter bundles** above. **A dedicated Azure landing-zone / subscription-vending / policy-initiative-aligned “LZ pack” remains a named V1.1 content slice** so GA messaging is not confused with exhaustive CAF conformance coverage.

Operational UI still supports **vertical template imports**, custom packs, and Azure extractor evidence—but **LZ-vending narrative parity** waits for curated rules + documentation in the **`V1.1`** slice (see **`docs/library/V1_DEFERRED.md` §6j**).

---

## 3. Framework & jurisdiction disclaimers (all bundled rules)

Starter corpora use **informative thematic mapping** (`frameworkMappings`) to accelerate architecture review—they **do not** constitute statutory legal classification, Annex III conformity assessment, CIS benchmark pass/fail automation, OWASP certification, **or Microsoft Well-Architected / CAF attestation.**

**Operational truth:** Buyers remain responsible for jurisdictional applicability, contractual obligations, auditor evidence breadth, and any certification claims.

Canonical pack metadata repeats this posture in seeded JSON `description`/`metadata.disclaimer`-style strings.

---

## 4. Operator UI — where bundles appear

- **Registered list & effective merge:** **`/policy-packs`** surfaces packs returned by **`GET`** list + effective merges; seeded rows show **Bundled default (platform)**.
- **Rule key inspection:** Expanded **Inspect** accordion lists merged **`complianceRuleKeys`** plus pointers to appendix JSON.
- **Findings UX:** Rows in **`/governance/findings`** link to Inspect; **`/reviews/{runId}/findings/{id}/inspect`** surfaces titles, rationales (description), inferred severity traces, remediation blocks, reasoning payload (operator deep view), consistent with seeded compliance rule metadata mirrored into evaluation outputs where the Authority pipeline emits them against evidence.

Pilot validation path: finalize a manifest with Azure / architecture evidence intersecting seeded keys → open finding inspect for rule-backed rows.

---

## 5. Security / tenancy posture (non-regression assertion)

Bundles are **`PlatformDefault`** rows **scoped per tenant/workspace/project**, not silently shared writable globals. Operators **cannot republish** them through the shipped HTTP surface (UI disables **Publish**, API rejects `PublishVersion`). Read paths obey existing repository scoping; **tenant A cannot mutate tenant B packs** regardless of labeling.

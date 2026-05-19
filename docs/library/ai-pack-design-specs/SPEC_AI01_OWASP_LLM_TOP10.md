> **Scope:** Design spec for AI policy pack **AI-01 — OWASP Top 10 for LLM Applications**. Rule JSON authoring is out of scope; this document is the architecture / content-shape contract.
> **Buyer-safe invariant:** Thematic architecture-review mapping toward OWASP LLM Top 10 — not OWASP certification, penetration-test findings, or runtime security validation.

> **Spine docs:** [`README.md`](README.md) · [`../POLICY_PACK_RULE_PRIORITY_MODEL.md`](../POLICY_PACK_RULE_PRIORITY_MODEL.md) · [`../authoring-prompts/README.md`](../authoring-prompts/README.md)

# AI-01 — OWASP Top 10 for LLM Applications — design spec

---

## 1. Objective

Ship a credible, independently recognisable pack that maps **OWASP Top 10 for LLM Applications v1.1** to architecture-evidence posture. OWASP LLM Top 10 is the most cited GenAI security checklist in enterprise RFPs and security questionnaires as of 2026. Buyers can assign this pack alongside `owasp-api-top10` (pack #8) and expect complementary rather than overlapping coverage.

**Buyer outcome:** An architecture reviewer working on a GenAI-powered application can see, from a single ArchLucid run, which OWASP LLM risk categories have architecture evidence and which are gaps requiring application-level remediation.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative source is **OWASP Top 10 for LLM Applications v1.1** (OWASP GenAI Security Project, 2025). A v2.0 revision is tracked; pack version bumps when it stabilises. | OWASP GenAI Security Project GitHub. |
| A2 | The 10 risks are: LLM01 Prompt Injection, LLM02 Insecure Output Handling, LLM03 Training Data Poisoning, LLM04 Model Denial of Service, LLM05 Supply-Chain Vulnerabilities, LLM06 Sensitive Information Disclosure, LLM07 Insecure Plugin Design, LLM08 Excessive Agency, LLM09 Overreliance, LLM10 Model Theft. | OWASP LLM Top 10 v1.1. |
| A3 | Architecture evidence covers **design** and **posture** (e.g. "does the manifest document input validation boundaries?") — not runtime attack detection, which belongs in Sentinel / Defender. | ArchLucid scope. |
| A4 | LLM07 (Insecure Plugin Design) is the primary bridge to `agentic-ai-mcp` (AI-06); cross-reference in `frameworkMappings`, do not duplicate. | Adjacent pack boundary. |
| A5 | Pack has **3 rules per risk category** at minimum (P0: must-have architecture control, P1: defence-in-depth, P2: mature posture) → target ~30 rules. | Rule sizing principle. |
| A6 | `priorityFloor: P0` default; P0 maps to OWASP-designated **Critical / High** risk classification. | Priority model. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `owasp-llm-` must not conflict with existing `owasp-api-` prefix in pack #8. | Verified distinct. |
| C2 | Rules must not reproduce OWASP text verbatim (potential copyright concern); describe architecture posture using OWASP themes. | Paraphrase + cite. |
| C3 | No `Critical` severity at V1 — architecture-review posture only, not runtime assessment. | Same pattern as ARC-AMPE. |
| C4 | LLM01 (Prompt Injection) is the highest-visibility risk; must have ≥ 4 rules (P0 × 2, P1 × 1, P2 × 1) to meet buyer expectations. | RFP signal. |
| C5 | Pack #1 (`ai-governance-responsible-ai`) covers model ownership, versioning, oversight — do not replicate. This pack is **security-attack-surface specific**. | Adjacent pack boundary. |

---

## 4. Architecture Overview

```
OWASP LLM Top 10 v1.1
        ↓
LLM generator (3 rules/risk × 10 risks)
        ↓
Critic (OWASP risk-ID accuracy, evidence-hint correctness)
        ↓
Human SME (severity / priority calibration)
        ↓
owasp-llm-top10-rules-v1.json
        ↓
Bundled → manifest → DefaultPolicyPackSeeder → PolicyPackPriorityFloor
```

No new platform code. Fits existing curated-rules pipeline.

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `owasp-llm-top10` |
| Display name | **OWASP Top 10 for LLM Applications** |
| Short name | `OWASP LLM` |
| Category | **Application Security** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Default `severityFloor` | `warning` |
| Source citation | "OWASP Top 10 for LLM Applications v1.1 (OWASP GenAI Security Project, 2025)" |

### 5.2 Sub-corpora

| Prefix | OWASP risk | Target rules | Priority skew |
|--------|------------|-------------|---------------|
| `owasp-llm-01-` | LLM01 Prompt Injection | 4 | P0-heavy |
| `owasp-llm-02-` | LLM02 Insecure Output Handling | 3 | P0/P1 |
| `owasp-llm-03-` | LLM03 Training Data Poisoning | 3 | P0/P1 |
| `owasp-llm-04-` | LLM04 Model Denial of Service | 3 | P0/P1 |
| `owasp-llm-05-` | LLM05 Supply-Chain Vulnerabilities | 3 | P0/P1 |
| `owasp-llm-06-` | LLM06 Sensitive Information Disclosure | 3 | P0-heavy |
| `owasp-llm-07-` | LLM07 Insecure Plugin Design | 3 | P0/P1 |
| `owasp-llm-08-` | LLM08 Excessive Agency | 3 | P0-heavy |
| `owasp-llm-09-` | LLM09 Overreliance | 3 | P1/P2 |
| `owasp-llm-10-` | LLM10 Model Theft | 3 | P1/P2 |
| **Total** | | **~31 rules** | |

### 5.3 Key evidence fields

`services[].Tags` (prompt boundary markers), `governance.PolicyConstraints` (input validation policy), `governance.RequiredControls` (output sanitisation, agency bounds), `metadata.ChangeDescription` (plugin inventory), `relationships[].relationshipType` (LLM-to-tool edges), `datastores[].PrivateEndpointRequired` (model-weight protection).

### 5.4 Framework mappings per rule

Each rule cites the OWASP LLM risk category + number, maps to 1–2 OWASP ASVS v4.0.3 chapter themes where overlapping (V1 architecture, V5 validation, V13 API), and closes with the Disclaimer entry.

---

## 6. Data Flow

Provisioning → assignment → `PolicyPackResolver` merges `advisoryDefaults` → `ComplianceRulePackGovernanceFilter` narrows to `owasp-llm-*` key set → `PolicyPackPriorityFloor` enforces `P0` → findings with OWASP risk category chips in UI.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Misuse as penetration-test report | Disclaimer per rule + pack metadata: "Architecture-review posture only; not runtime attack validation or penetration-test findings." |
| Overlap with runtime detection (Sentinel/Defender) | Rules are phrased as architecture-posture questions ("does the manifest document…"), not detection rules. |
| LLM01 prompt-injection rules falsely implying ArchLucid itself is vulnerable | Rules evaluate the *customer's* GenAI architecture. Pack copy does not reference ArchLucid's own LLM pipeline. |
| Adjacent-pack duplication (owasp-api, ai-gov) | LLM07/plugin rules cross-reference `agentic-ai-mcp`; LLM09/overreliance cross-references `ai-governance-responsible-ai`. No rule duplicates. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Manifest count | Bump by 1 when added; CI count test updated. |
| Adjacent packs | `owasp-api-top10` (#8), `agentic-ai-mcp` (AI-06), `ai-governance-responsible-ai` (#1). |
| Version cadence | OWASP LLM Top 10 v2.0 expected 2026; pack minor-version bump when released. |
| Procurement answer | "ArchLucid maps architecture evidence to OWASP LLM Top 10 risk categories. Not an OWASP-certified tool or penetration test." |
| No Critical severity | All rules `High` / `Medium` at V1 per common design decision. |

---

## 9. Acceptance criteria

1. ~31 rules covering all 10 OWASP LLM risk categories (≥ 1 P0 rule per category).
2. Every rule cites "OWASP Top 10 for LLM Applications v1.1" in `frameworkMappings`.
3. Disclaimer entry present on every rule.
4. No rule uses runtime/detection language ("alert", "detect", "block").
5. `metadata.frameworkMappingDisclaimer` contains "not OWASP certification".
6. CI count test passes.

---

## 10. Required FAQ wording

**Q: Does ArchLucid run a security scan against my LLM application?**
A: No. ArchLucid evaluates architecture-evidence posture — what your manifest documents about input validation, output handling, plugin design, and agency bounds. It does not perform runtime testing or prompt-injection attacks.

**Q: Is this pack the same as the OWASP API Security Top 10?**
A: No. The API Top 10 covers REST/GraphQL API surface risks. This pack covers LLM-application-specific risks: prompt injection, training-data poisoning, excessive agency, and model theft — distinct attack categories with LLM-specific architecture controls.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`README.md`](README.md) | AI pack index |
| [`SPEC_AI06_AGENTIC_AI.md`](SPEC_AI06_AGENTIC_AI.md) | Adjacent: tool-use / plugin governance |
| [`../authoring-prompts/PACK_CONTEXTS.md`](../authoring-prompts/PACK_CONTEXTS.md) | Generator/critic context block |
| `docs/samples/policy-packs/owasp-api-top10-rules-v1.json` | Adjacent pack format reference |

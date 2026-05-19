> **Scope:** Design spec for AI policy pack **AI-02 — ISO/IEC 42001 AI Management System**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Thematic architecture-review mapping toward ISO/IEC 42001:2023 — not ISO certification, conformity assessment, or accredited auditor opinion.

> **Spine docs:** [`README.md`](README.md) · [`../POLICY_PACK_RULE_PRIORITY_MODEL.md`](../POLICY_PACK_RULE_PRIORITY_MODEL.md)

# AI-02 — ISO/IEC 42001 AI Management System — design spec

---

## 1. Objective

Ship a pack covering the **ISO/IEC 42001:2023 AI Management System (AIMS)** — the ISO standard for AI governance analogous to ISO 27001 for information security. Enterprise buyers in regulated industries (financial services, healthcare, public sector) are beginning to include "ISO 42001 alignment" in AI procurement questionnaires. This pack gives those buyers architecture-evidence visibility against the standard's clauses and annexes.

**Buyer outcome:** A governance-mature enterprise can assign this pack and produce a structured gap analysis against the ISO 42001 AIMS clauses during a pre-certification architecture review, without ArchLucid claiming to replace the ISO certification body.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative source: **ISO/IEC 42001:2023** (published December 2023, ISO copyright). Rules cite clause numbers and annex themes without reproducing normative text. | ISO copyright compliance; same posture as ISO 27001 pack. |
| A2 | The standard has **10 main clauses** (4–10 normative) and **Annexes A–D**: Annex A (objectives and controls, 38 controls), Annex B (guidance on AI system impact), Annex C (sector-specific guidance), Annex D (other standards alignment). | ISO/IEC 42001:2023 TOC. |
| A3 | Architecture evidence is strongest for: Clause 4 (context/stakeholders), Clause 5 (leadership and AI policy), Clause 6 (planning / risk and opportunity), Clause 8 (operation — AI system lifecycle), Clause 9 (performance evaluation), Annex A controls (A.2–A.9). | Evidence-mappability analysis. |
| A4 | Clauses 7 (support: resources, competence, communication) and 10 (improvement: nonconformity, continual improvement) are process-oriented; rules are phrased as architecture posture ("does the manifest document…") not process audit. | ArchLucid scope. |
| A5 | Pack #1 (`ai-governance-responsible-ai`) provides general RAI posture; this pack is **specifically structured** to the ISO 42001 clause and control numbering for buyers who cite the standard by name. | Distinct from pack #1. |
| A6 | Priority mapping: Clause 4–6 normative requirements → P0; Clause 8–9 lifecycle controls → P0/P1; Annex A operational controls → P1/P2; Annex B–D informative guidance → P2. | Priority model alignment. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | ISO copyright prohibits verbatim control text reproduction. | Cite clause/control ID + brief intent. |
| C2 | "ISO 42001 certified" is a formal accreditation body process. Pack must never imply ArchLucid is a certification path. | Mandatory disclaimer on every rule and in pack metadata. |
| C3 | Rule prefix `iso-42001-` must not conflict with existing `iso27001-` prefix. | Verified distinct. |
| C4 | Annex A lists 38 controls; target ≥ 20 rules covering Annex A themes (others via narrative sections). | Coverage depth. |
| C5 | ISO 42001 applies to the *organisation's* AI system lifecycle, not just cloud architecture. Rules must be scoped to what an architecture manifest can evidence. | Avoid out-of-scope process claims. |

---

## 4. Architecture Overview

```
ISO/IEC 42001:2023 — Clauses 4–10 + Annex A (38 controls)
        ↓
LLM generator (clause-by-clause, Annex A grouped)
        ↓
Critic (clause ID accuracy, Annex A control number accuracy)
        ↓
Human SME (certification boundary calibration)
        ↓
iso-42001-aims-rules-v1.json → manifest → DefaultPolicyPackSeeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `iso-42001-aims` |
| Display name | **ISO/IEC 42001 — AI Management System Architecture Themes** |
| Short name | `ISO 42001` |
| Category | **Compliance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "ISO/IEC 42001:2023 — Information technology — Artificial intelligence — Management system" |

### 5.2 Sub-corpora

| Prefix | Clause / Annex | Target rules | Priority skew |
|--------|---------------|-------------|---------------|
| `iso-42001-ctx-` | Clause 4 — Context of the organisation (AI system scope, stakeholders, risk context) | 4 | All P0 |
| `iso-42001-lead-` | Clause 5 — Leadership (AI policy, roles, responsibilities) | 4 | All P0 |
| `iso-42001-plan-` | Clause 6 — Planning (risk/opportunity assessment, AI system impact assessment) | 5 | P0/P1 |
| `iso-42001-ops-` | Clause 8 — Operation (AI system lifecycle: design, data, testing, deployment, decommission) | 8 | P0/P1 |
| `iso-42001-eval-` | Clause 9 — Performance evaluation (monitoring, measurement, internal audit themes) | 5 | P1 |
| `iso-42001-anx-a-` | Annex A controls A.2–A.9 (policies, data governance, AI system lifecycle, 3rd-party, security, responsible AI) | 20 | Mixed P0/P1/P2 |
| `iso-42001-anx-b-` | Annex B — AI system impact categories (thematic rules) | 4 | P2 |
| **Total** | | **~50 rules** | |

### 5.3 Key Annex A control areas

A.2 (Policies for AI); A.3 (Organisational roles); A.4 (Resources for AI system lifecycle); A.5 (Impacts — assessment and management); A.6 (AI system lifecycle); A.7 (Data for AI); A.8 (Information for interested parties — transparency); A.9 (Third-party and customer relationships).

### 5.4 Evidence fields

`governance.PolicyConstraints` (AI policy documentation), `governance.RequiredControls` (lifecycle controls), `metadata.ChangeDescription` (AI system change rationale), `services[].Tags` (AI system scope markers), `datastores[].Tags` (training/inference data classification), `metadata.DecisionTraceIds` (AI impact assessment references).

---

## 6. Data Flow

Standard curated-rules pipeline. `priorityFloor: P0` surfaces must-have clauses (4–6, lifecycle basics) on first use; operators widen to P1/P2 for Annex A depth and Annex B impact categories as certification readiness matures.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Buyers treat pack output as ISO 42001 gap report for certification body | Disclaimer: "Thematic architecture-review mapping; not ISO conformity assessment, accredited certification, or auditor opinion." in pack metadata and every rule. |
| Rules reproducing ISO normative text | Authors instructed to paraphrase and cite clause ID only. Critic checks for verbatim reproduction. |
| Confusion with ISO 27001 pack | Distinct slug, category, and rule prefix. Pack description explicitly states "AI management system" scope, not information-security management. |
| Annex A control numbers incorrectly cited | Critic checklist section C verifies Annex A numbers are in the A.2–A.9 range. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Manifest count | Bump by 1; CI count test updated. |
| Adjacent packs | `ai-governance-responsible-ai` (#1), `eu-ai-act-high-risk` (AI-04), `nist-ai-600-1-genai` (AI-07). |
| Version cadence | ISO 42001 amendment cycle typically 3–5 years. Monitor ISO TC 1/SC 42 for amendments. |
| Procurement answer | "ArchLucid maps architecture evidence against ISO/IEC 42001 clause and Annex A themes. It does not perform or substitute for ISO certification body audits." |

---

## 9. Acceptance criteria

1. ~50 rules; every normative clause (4–10) and Annex A group (A.2–A.9) represented by ≥ 1 rule.
2. Every rule cites "ISO/IEC 42001:2023" in `frameworkMappings` with correct clause or annex reference.
3. `metadata.frameworkMappingDisclaimer` contains "not ISO certification".
4. No verbatim ISO normative text in any field.
5. Disclaimer entry last in every rule's `frameworkMappings`.
6. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack make my organisation ISO 42001 certified?**
A: No. ISO/IEC 42001 certification is granted by an accredited certification body following a formal audit. ArchLucid maps architecture evidence against the standard's clauses and Annex A controls to support pre-certification gap analysis — it does not replace the audit.

**Q: How does this relate to ISO 27001?**
A: ISO 27001 governs information-security management systems. ISO 42001 governs AI management systems — covering AI policy, AI system lifecycle, data for AI, transparency, and third-party AI relationships. Use both packs together for comprehensive governance coverage.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`README.md`](README.md) | AI pack index |
| [`SPEC_AI04_EU_AI_ACT.md`](SPEC_AI04_EU_AI_ACT.md) | EU AI Act high-risk pack (regulatory complement) |
| `docs/samples/policy-packs/iso27001-architecture-rules-v1.json` | Format reference |

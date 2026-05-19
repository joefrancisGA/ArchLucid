> **Scope:** Design spec for AI policy pack **AI-13 — AI in US Public Sector: OMB M-24-10**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping toward OMB M-24-10 and federal AI governance requirements — not OMB compliance determination, ATO, or federal agency legal opinion.

# AI-13 — AI in US Public Sector: OMB M-24-10 — design spec

---

## 1. Objective

Ship a pack covering US federal government AI governance requirements anchored on **OMB M-24-10** ("Advancing Governance, Innovation, and Risk Management for Agency Use of Artificial Intelligence," March 2024) and **OMB M-24-18** (AI acquisition and use). These memoranda require federal agencies to designate Chief AI Officers, maintain AI use-case inventories, and apply minimum risk practices to rights-impacting and safety-impacting AI. Federal agencies and government contractors with FedRAMP-aligned workloads are the primary buyers.

**Buyer outcome:** A federal agency or government contractor deploying AI can assign this pack and see which architecture-evidence posture exists for OMB M-24-10 requirements — AI use-case inventory, rights/safety-impacting AI controls, human oversight minimums, and CAIO accountability structure.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: OMB M-24-10 (March 28, 2024), OMB M-24-18 (August 27, 2024), NIST AI 600-1 (July 2024), Executive Order 14110 (Safe, Secure, Trustworthy AI, October 2023). | Official US government sources. |
| A2 | OMB M-24-10 defines two high-stakes categories: **rights-impacting AI** (affecting civil rights, education, employment, access to benefits, housing, credit, insurance, healthcare, criminal justice) and **safety-impacting AI** (affecting health/safety of people). | OMB M-24-10 §5. |
| A3 | Architecture evidence covers: AI use-case inventory (CAIO-maintained), rights/safety-impacting AI controls documentation, human oversight mechanism design, ATO alignment for AI systems on federal infrastructure. | Evidence-mappability. |
| A4 | Pack does not classify the customer's AI as rights-impacting or safety-impacting — conditional framing. | Auto-classification prohibition. |
| A5 | FedRAMP / FISMA alignment rules are handled by the existing `nist-csf-2-architecture` (#19) and `security-architecture-baseline` (#2) packs; this pack adds AI-specific federal requirements. | Non-duplication. |
| A6 | NIST AI 600-1 (AI-07) is the technical counterpart; this pack covers the OMB governance and accountability requirements. | Adjacent pack boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `gov-ai-` is distinct. | Verified. |
| C2 | Pack must not imply federal agency ATO or OMB compliance determination. | Mandatory disclaimer. |
| C3 | Executive branch memoranda are public domain; citation is unrestricted. | No copyright concern. |
| C4 | State and local government AI requirements (California, Colorado, etc.) are covered by AI-20; this pack is federal only. | Scope boundary. |

---

## 4. Architecture Overview

```
OMB M-24-10 + OMB M-24-18 + EO 14110 + NIST AI 600-1
        ↓
LLM generator (inventory → rights-impacting → safety-impacting → CAIO → ATO sub-corpora)
        ↓
Critic (OMB memorandum citation accuracy, rights/safety-impacting framing check)
        ↓
Human SME
        ↓
ai-public-sector-us-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `ai-public-sector-us` |
| Display name | **AI in US Public Sector — OMB M-24-10 Architecture Themes** |
| Short name | `US Gov AI` |
| Category | **Compliance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "OMB M-24-10 (March 28, 2024); OMB M-24-18 (August 27, 2024); EO 14110 (October 30, 2023)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `gov-ai-inv-` | AI use-case inventory (system registration, CAIO accountability reference, purpose documentation) | 5 | All P0 |
| `gov-ai-rights-` | Rights-impacting AI controls (human review requirement, appeal mechanism design, notice and explanation architecture) | 7 | P0-heavy |
| `gov-ai-safety-` | Safety-impacting AI controls (human oversight design, fail-safe mechanism, monitoring requirements) | 6 | P0-heavy |
| `gov-ai-caio-` | CAIO accountability architecture (governance structure evidence, escalation path) | 4 | P1 |
| `gov-ai-proc-` | AI acquisition governance (OMB M-24-18 procurement controls, vendor AI transparency requirements) | 5 | P1 |
| `gov-ai-ato-` | ATO alignment for AI systems (FISMA categorisation, continuous monitoring integration) | 5 | P0/P1 |
| **Total** | | **~32 rules** | |

### 5.3 Key evidence fields

`governance.PolicyConstraints` (rights-impacting / safety-impacting designation, CAIO reference, appeal mechanism policy), `governance.RequiredControls` (human oversight requirements, fail-safe requirements), `services[].Tags` (rights-impacting marker, safety-impacting marker, CAIO inventory reference), `metadata.ChangeDescription` (AI system change justification, ATO scope), `metadata.DecisionTraceIds` (CAIO approval audit for AI use-case changes).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces inventory, rights-impacting controls, and safety-impacting controls. CAIO accountability and ATO alignment rules surface at P1; procurement controls at P1.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Auto-classification of AI as rights-impacting or safety-impacting | All rights and safety rules use conditional framing: "if this AI system is designated rights-impacting under OMB M-24-10…". |
| Rules implying ATO | `gov-ai-ato-*` rules cover FISMA categorisation and continuous monitoring *design*, not ATO issuance. Disclaimer explicit. |
| Federal data handling (CUI, FCI) | Cross-reference to `security-architecture-baseline` (#2) and `nist-csf-2-architecture` (#19) for data classification; this pack does not duplicate data classification rules. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `nist-ai-600-1-genai` (AI-07), `nist-csf-2-architecture` (#19), `security-architecture-baseline` (#2). |
| Regulatory evolution | OMB memoranda are updated; major new memoranda trigger a pack minor-version bump. |
| Vertical positioning | Primary buyers: federal agencies, defence contractors (CMMC-adjacent), government system integrators. |

---

## 9. Acceptance criteria

1. ~32 rules; every sub-corpus represented.
2. All rights-impacting and safety-impacting rules use conditional framing.
3. `metadata.frameworkMappingDisclaimer` contains "not OMB compliance determination".
4. `gov-ai-inv-*` includes ≥ 2 P0 rules for AI use-case inventory documentation.
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack help us comply with OMB M-24-10?**
A: ArchLucid maps architecture evidence against OMB M-24-10 requirements — AI use-case inventory, rights-impacting and safety-impacting AI controls, and CAIO governance structure. It does not perform OMB compliance determinations, issue ATO documentation, or provide legal opinions on agency obligations under the memorandum.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI07_NIST_AI_600_1.md`](SPEC_AI07_NIST_AI_600_1.md) | NIST AI 600-1 technical counterpart |
| [`SPEC_AI20_US_STATE_AI_LAWS.md`](SPEC_AI20_US_STATE_AI_LAWS.md) | State-level AI requirements |

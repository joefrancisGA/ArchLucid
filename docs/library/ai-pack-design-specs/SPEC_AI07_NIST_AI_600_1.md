> **Scope:** Design spec for AI policy pack **AI-07 — NIST AI 600-1 Generative AI Profile**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Thematic architecture-review mapping toward NIST AI 600-1 — not NIST endorsement or formal risk assessment.

# AI-07 — NIST AI 600-1 — Generative AI Profile — design spec

---

## 1. Objective

Ship a pack aligned to **NIST AI 600-1** (July 2024) — the US NIST Generative AI Profile, which maps 12 unique GenAI risks to the NIST AI RMF v1.0 Govern/Map/Measure/Manage framework. Pack #1 covers NIST AI RMF v1.0 cross-cutting themes; this pack provides **GenAI-specific** depth using the 12 GAI risk taxonomy. This is the US government counterpart to the EU AI Act pack (AI-04) and will be referenced in federal AI governance and DoD AI adoption contexts.

**Buyer outcome:** A US federal agency, DoD contractor, or enterprise buyer citing NIST AI 600-1 in their AI governance programme can assign this pack and see which of the 12 GenAI risks have architecture-evidence posture and where gaps exist.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative source: **NIST AI 600-1** "Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile" (NIST, July 2024). | Official NIST publication. |
| A2 | The 12 GenAI risks (GAI risks) are: CBRN Information, Confabulation, Data Privacy, Data Poisoning, Homogenisation, Human-AI Configuration, Information Integrity, Information Security, Intellectual Property, Obscene/Degrading/Abusive Content (ODA), Societal Impacts, Value Chain/Component Integration. | NIST AI 600-1 §2. |
| A3 | Each risk maps to Govern/Map/Measure/Manage functions with suggested actions. Architecture evidence covers actions that have manifest-level posture (not policy-only or HR-only actions). | Evidence-mappability analysis. |
| A4 | Pack #1 covers NIST AI RMF v1.0 Map/Govern/Manage/Measure themes at a cross-cutting level. This pack adds **GAI-risk-specific** depth using the 600-1 taxonomy. | Non-overlap. |
| A5 | CBRN, ODA, and Societal Impacts risks are content-policy concerns with limited architecture evidence; rules for these are P2 and phrased as "does the architecture document content-policy controls?". | Evidence limitation. |
| A6 | Value Chain / Component Integration risk maps to supply-chain architecture; cross-reference `supply-chain-sbom` (#20). | Adjacent pack boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `nist-ai-600-` is distinct. | Verified. |
| C2 | NIST publications are US government work; citation style follows NIST report number and section. | No copyright restriction but cite accurately. |
| C3 | Confabulation / hallucination rules must not claim ArchLucid can detect confabulation. | Architecture-posture framing only. |
| C4 | GAI risk 12 (Value Chain) overlaps with `supply-chain-sbom`; cross-reference only. | Adjacent pack boundary. |

---

## 4. Architecture Overview

```
NIST AI 600-1 (July 2024) — 12 GAI risks × Govern/Map/Measure/Manage
        ↓
LLM generator (one sub-corpus per GAI risk, 3–5 rules each)
        ↓
Critic (GAI risk number and name accuracy, RMF function mapping accuracy)
        ↓
Human SME (CBRN/ODA scope calibration)
        ↓
nist-ai-600-1-genai-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `nist-ai-600-1-genai` |
| Display name | **NIST AI 600-1 — Generative AI Risk Profile** |
| Short name | `NIST AI 600-1` |
| Category | **Compliance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "NIST AI 600-1: Artificial Intelligence Risk Management Framework — Generative Artificial Intelligence Profile (NIST, July 2024)" |

### 5.2 Sub-corpora (one per GAI risk)

| Prefix | GAI Risk | Target rules | Priority skew |
|--------|---------|-------------|---------------|
| `nist-ai-600-gai1-` | CBRN Information | 2 | P2 (content-policy) |
| `nist-ai-600-gai2-` | Confabulation | 4 | P0/P1 |
| `nist-ai-600-gai3-` | Data Privacy | 4 | P0-heavy |
| `nist-ai-600-gai4-` | Data Poisoning | 3 | P0/P1 |
| `nist-ai-600-gai5-` | Homogenisation | 2 | P1/P2 |
| `nist-ai-600-gai6-` | Human-AI Configuration | 3 | P0/P1 |
| `nist-ai-600-gai7-` | Information Integrity | 3 | P0/P1 |
| `nist-ai-600-gai8-` | Information Security | 4 | P0-heavy |
| `nist-ai-600-gai9-` | Intellectual Property | 3 | P1 |
| `nist-ai-600-gai10-` | ODA Content | 2 | P1/P2 |
| `nist-ai-600-gai11-` | Societal Impacts | 2 | P2 |
| `nist-ai-600-gai12-` | Value Chain / Component Integration | 3 | P0/P1 |
| **Total** | | **~35 rules** | |

### 5.3 Key evidence fields

`governance.PolicyConstraints` (content policy, human-AI configuration policy), `governance.RequiredControls` (confabulation mitigation, data poisoning controls), `services[].Tags` (model vendor markers, IP provenance), `datastores[].Tags` (training data classification), `metadata.ChangeDescription` (model change rationale, supply chain change evidence).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces Confabulation, Data Privacy, Information Security, and Human-AI Configuration must-haves. CBRN and Societal Impacts (P2) surface for advanced governance tenants.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| CBRN rules creating liability | CBRN rules are P2, phrased as architecture-posture documentation checks ("does the manifest document content-policy controls for dual-use information?"), not risk assessments. |
| GAI risk numbers cited incorrectly | Critic checklist verifies GAI risk 1–12 numbering. |
| Confabulation rules implying detection capability | Rules ask whether grounding and citation policies are documented, not whether confabulation occurs. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `ai-governance-responsible-ai` (#1), `eu-ai-act-high-risk` (AI-04), `rag-architecture` (AI-05), `supply-chain-sbom` (#20). |
| Federal buyer framing | Federal and DoD buyers citing NIST AI 600-1 are a primary audience; pack description should reference OMB M-24-10 alignment. |

---

## 9. Acceptance criteria

1. ~35 rules covering all 12 GAI risks.
2. Every rule cites "NIST AI 600-1" with correct GAI risk number and name.
3. No confabulation or CBRN rule implies runtime detection capability.
4. `metadata.frameworkMappingDisclaimer` contains "not NIST endorsement".
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack certify compliance with NIST AI 600-1?**
A: No. NIST AI 600-1 is a voluntary risk management profile, not a certification standard. ArchLucid maps architecture evidence against the 12 GenAI risk categories and suggested actions to help teams identify gaps in their AI governance posture.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI04_EU_AI_ACT.md`](SPEC_AI04_EU_AI_ACT.md) | EU AI Act (regulatory complement) |
| [`SPEC_AI13_AI_PUBLIC_SECTOR.md`](SPEC_AI13_AI_PUBLIC_SECTOR.md) | OMB M-24-10 US public sector |

> **Scope:** Design spec for AI policy pack **AI-12 — AI in Healthcare: FDA SaMD / GMLP / PCCP**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping toward FDA AI/ML-based SaMD guidance — not FDA 510(k) clearance, De Novo determination, PMA approval, or regulatory legal advice.

# AI-12 — AI in Healthcare: FDA SaMD / GMLP / PCCP — design spec

---

## 1. Objective

Ship a pack covering the architecture posture of **AI/ML-based Software as a Medical Device (SaMD)** regulated by the US FDA. Primary references: FDA's Good Machine Learning Practice (GMLP) 10 guiding principles (2021), FDA Predetermined Change Control Plan (PCCP) final guidance (December 2024), and the International Medical Device Regulators Forum (IMDRF) SaMD framework. This pairs naturally with the ARC-AMPE (#24), HIPAA (#11), and MITA (#35) packs for comprehensive healthcare AI governance.

**Buyer outcome:** A medical device software company or health system developing AI diagnostic, clinical decision support, or monitoring tools can assign this pack and see which architecture-evidence posture exists for FDA SaMD expectations — training/test data separation, PCCP documentation, algorithm change protocol, and post-market performance monitoring.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: FDA GMLP 10 guiding principles (2021); FDA PCCP final guidance (December 2024); IMDRF SaMD framework (2013–2014); FDA AI Action Plan (2025). | Official FDA publications. |
| A2 | Pack does **not** determine whether a software product meets the FDA SaMD definition — that is a legal / regulatory determination. Rules are conditionally framed. | Auto-classification prohibition. |
| A3 | Architecture evidence for FDA SaMD: training/validation/test data separation (data split governance), algorithm change protocol (PCCP documentation), bias and subgroup analysis documentation, post-market performance monitoring design. | Evidence-mappability. |
| A4 | GMLP Principle 3 (data relevance, quality, protection) and Principle 4 (algorithm transparency) are the most architecture-evidenced; Principles 5–10 span operations and clinical validation. | Priority mapping. |
| A5 | PCCP is a mechanism allowing manufacturers to make predetermined algorithm changes without new 510(k) submission; rules cover PCCP architecture evidence (change scope, impact assessment, monitoring triggers). | PCCP relevance. |
| A6 | This pack pairs with `hipaa-architecture` (#11) for PHI handling; cross-reference at data governance boundary. | Adjacent pack boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `fda-samd-` is distinct. | Verified. |
| C2 | Pack must not imply FDA regulatory approval, clearance, or determination. | Mandatory disclaimer. |
| C3 | Clinical validation (sensitivity, specificity, intended population) is out of scope — clinical evidence, not architecture posture. | Scope boundary. |
| C4 | No `Critical` severity — FDA regulatory determination is not a binary architecture outcome. | Common design decision. |

---

## 4. Architecture Overview

```
FDA GMLP principles + FDA PCCP guidance (Dec 2024) + IMDRF SaMD framework
        ↓
LLM generator (data governance → algorithm change → monitoring → bias sub-corpora)
        ↓
Critic (FDA guidance document citation accuracy, principle number accuracy)
        ↓
Human SME (regulatory boundary calibration)
        ↓
ai-healthcare-fda-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `ai-healthcare-fda` |
| Display name | **AI in Healthcare — FDA SaMD / GMLP / PCCP Architecture Themes** |
| Short name | `FDA SaMD` |
| Category | **Compliance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "FDA Good Machine Learning Practice Guiding Principles (2021); FDA PCCP Final Guidance (December 2024); IMDRF SaMD Framework (2013)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `fda-samd-data-` | Data governance (train/val/test split, data quality, PHI handling, demographic representativeness) | 6 | P0-heavy |
| `fda-samd-alg-` | Algorithm transparency (model card for SaMD, intended use documentation, GMLP Principles 4–6) | 5 | P0/P1 |
| `fda-samd-pccp-` | PCCP architecture evidence (change scope definition, impact assessment, monitoring triggers) | 5 | P0/P1 |
| `fda-samd-bias-` | Bias and subgroup analysis (subgroup performance documentation, representative data evidence) | 4 | P0/P1 |
| `fda-samd-monitor-` | Post-market monitoring (performance monitoring design, real-world data collection, alert thresholds) | 5 | P1 |
| `fda-samd-cyber-` | Cybersecurity (GMLP Principle 10 — device security, update mechanism, incident response) | 4 | P0/P1 |
| **Total** | | **~29 rules** | |

### 5.3 Key evidence fields

`datastores[].Tags` (training/validation/test split markers, PHI classification), `services[].Purpose` (SaMD inference service, clinical decision support), `governance.PolicyConstraints` (PCCP scope, GMLP compliance reference), `governance.RequiredControls` (bias analysis requirements, monitoring SLAs), `metadata.ChangeDescription` (algorithm change rationale, PCCP trigger evidence), `metadata.DecisionTraceIds` (algorithm change approval audit).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces data governance and cybersecurity must-haves. PCCP and bias analysis rules surface at P0/P1; post-market monitoring at P1.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Rules implying FDA approval | Every rule: "Thematic architecture-review mapping; not FDA 510(k) clearance, De Novo determination, PMA approval, or regulatory legal advice." |
| PHI in training data handled incorrectly | `fda-samd-data-*` P0 rule cross-references HIPAA pack; requires PHI handling evidence and de-identification documentation. |
| Auto-classification of software as SaMD | Conditional framing: "if this software is developed or used as SaMD under FDA jurisdiction…". |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `hipaa-architecture` (#11), `arc-ampe-architecture-themes` (#24), `mita-architecture` (#35), `ai-governance-responsible-ai` (#1). |
| FDA AI Action Plan (2025) | FDA released updated AI action plan; rules reference guidance document categories rather than specific draft guidance to avoid rapid obsolescence. |
| IMDRF international alignment | IMDRF SaMD framework is internationally aligned (EU, Canada, Japan, Australia); pack description notes non-US applicability for international SaMD buyers. |

---

## 9. Acceptance criteria

1. ~29 rules; every sub-corpus represented.
2. All rules use conditional framing ("if this software is developed as SaMD…").
3. `metadata.frameworkMappingDisclaimer` contains "not FDA clearance".
4. `fda-samd-data-*` includes ≥ 2 P0 rules for train/val/test separation.
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does ArchLucid help us get FDA clearance for our AI medical device?**
A: No. FDA 510(k) clearance, De Novo determination, and PMA approval are regulatory processes with specific submission requirements and clinical evidence standards. ArchLucid evaluates architecture-level posture — data split governance, PCCP documentation design, cybersecurity posture, and post-market monitoring design — to support pre-submission preparation, not to substitute for FDA review.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI11_AI_FINANCIAL_MRM.md`](SPEC_AI11_AI_FINANCIAL_MRM.md) | Financial services vertical counterpart |
| [`../POLICY_PACK_ARC_AMPE_DESIGN.md`](../POLICY_PACK_ARC_AMPE_DESIGN.md) | ARC-AMPE healthcare complement |

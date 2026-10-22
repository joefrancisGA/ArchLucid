> **Scope:** Design spec for AI policy pack **AI-11 — AI in Financial Services: Model Risk Management**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping toward SR 11-7 / MRM principles for AI — not OCC/Fed examination or regulatory determination of model risk adequacy.

# AI-11 — AI in Financial Services: Model Risk Management — design spec

---

## 1. Objective

Ship a pack covering **model risk management (MRM) themes applied to AI models** in financial services. The primary regulatory anchor is **Federal Reserve SR 11-7** (2011) as extended to AI/ML models — still the dominant MRM framework referenced by US banking regulators. Secondary references: OCC Bulletin 2011-12, FRB SR 23-4 (model risk governance updates), and the OCC's 2023 AI in banking guidance. This is a high-value vertical pack: US banks and insurance companies integrating AI into credit decisions, fraud detection, pricing, and AML are required to subject these models to MRM governance.

**Buyer outcome:** A bank's model risk management function or vendor serving financial institutions can assign this pack and see which architecture-evidence posture exists for MRM requirements — model inventory, independent validation, ongoing monitoring, champion/challenger, model retirement.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: Federal Reserve SR 11-7 (2011), OCC Bulletin 2011-12, FRB SR 23-4 (2023), OCC AI Guidance (2023). | Regulatory basis. |
| A2 | SR 11-7 has three pillars: (1) Model development, implementation, and use; (2) Model validation; (3) Governance, policies, and controls. Architecture evidence exists for all three. | SR 11-7 structure. |
| A3 | "Model" in financial services context = any quantitative method, system, or approach applied to financial risk decisions (credit, market, AML, fraud). AI/ML models are a subset. | SR 11-7 definition. |
| A4 | Architecture evidence for MRM: model inventory (registry), development documentation (model card + training lineage), validation independence (separate validation environment, access controls), ongoing monitoring (performance degradation alerts, outcome analysis), and change management. | Evidence-mappability analysis. |
| A5 | Third-party model risk (vendor models, API-accessed models) is explicitly in scope per SR 11-7 §II.F; rules cover third-party model due diligence architecture evidence. | Regulatory requirement. |
| A6 | This pack is US-banking specific. EU equivalents (EBA AI guidelines) are deferred to a future EU financial services pack. | Scope boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `fin-mrm-` is distinct. | Verified. |
| C2 | Pack must not imply that ArchLucid provides model validation opinions — independent validation is a human / statistician function. | Critical legal boundary. |
| C3 | SR 11-7 applies to models used in material risk decisions; rules use conditional framing: "if this model is used in material financial decisions…". | Auto-classification prohibition. |
| C4 | No `Critical` severity — MRM adequacy is a regulatory judgment, not a binary architecture check. | Common design decision. |

---

## 4. Architecture Overview

```
SR 11-7 (Fed, 2011) + OCC 2011-12 + SR 23-4 + OCC AI guidance (2023)
        ↓
LLM generator (inventory → development → validation → monitoring → governance sub-corpora)
        ↓
Critic (SR 11-7 pillar accuracy, regulatory citation accuracy)
        ↓
Human SME (MRM boundary calibration)
        ↓
ai-financial-mrm-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `ai-financial-mrm` |
| Display name | **AI in Financial Services — Model Risk Management** |
| Short name | `AI MRM` |
| Category | **Compliance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Federal Reserve SR 11-7 (2011); OCC Bulletin 2011-12; FRB SR 23-4 (2023)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `fin-mrm-inv-` | Model inventory (all in-use AI models registered, purpose and risk tier documented) | 5 | All P0 |
| `fin-mrm-dev-` | Model development (training documentation, data quality evidence, assumption documentation) | 5 | P0/P1 |
| `fin-mrm-val-` | Independent validation (validator access isolation, challenge model evidence, validation independence) | 6 | P0-heavy |
| `fin-mrm-monitor-` | Ongoing monitoring (performance drift, outcome analysis, back-testing architecture evidence) | 5 | P0/P1 |
| `fin-mrm-champ-` | Champion/challenger patterns (A/B deployment architecture, challenger model access control) | 4 | P1 |
| `fin-mrm-3p-` | Third-party model risk (vendor model due diligence documentation, access controls, SLA evidence) | 4 | P0/P1 |
| `fin-mrm-govern-` | Governance and policies (model risk policy documentation, escalation path, board-level attestation reference) | 4 | P1/P2 |
| **Total** | | **~33 rules** | |

### 5.3 Key evidence fields

`services[].Tags` (model risk tier, model type, validation status), `services[].Purpose` (model purpose — credit, fraud, AML, pricing), `datastores[].Tags` (training data classification, validation data separation), `governance.RequiredControls` (validation independence controls, monitoring SLAs), `governance.PolicyConstraints` (MRM policy reference, escalation threshold), `metadata.DecisionTraceIds` (model change approval audit).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces model inventory and validation independence must-haves. Champion/challenger and third-party model rules surface at P1; governance narrative rules at P1/P2.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Rules implying MRM adequacy determination | Disclaimer: "Thematic architecture-review mapping; not OCC/Federal Reserve examination or determination of model risk management adequacy." |
| Auto-classification of model as material / in-scope | Rules use conditional framing: "if this model is used in material financial decisions…". |
| Validation independence rules being read as audit opinion | Rules ask for access-control evidence of isolation, not validation adequacy opinion. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `ai-governance-responsible-ai` (#1), `mlops-platform` (AI-09), `llm-observability-evals` (AI-10). |
| Regulatory evolution | OCC and Fed are updating AI guidance regularly; pack is versioned and can be updated as guidance evolves. |
| Vertical positioning | Primary buyer: US bank technology / model risk functions, FinTech serving banks. Pack should be highlighted in financial services GTM materials. |

---

## 9. Acceptance criteria

1. ~33 rules; every sub-corpus represented.
2. All rules use conditional framing for materiality scope.
3. `metadata.frameworkMappingDisclaimer` contains "not OCC/Federal Reserve examination".
4. `fin-mrm-val-*` includes ≥ 2 P0 rules for validation independence architecture.
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does ArchLucid validate AI models for SR 11-7 compliance?**
A: No. SR 11-7 model validation is a function performed by independent model validators — humans with quantitative expertise who challenge model assumptions and test performance. ArchLucid evaluates architecture-level posture: whether a model inventory exists, whether validation environments are isolated from development, and whether ongoing monitoring is architecturally designed. It does not perform quantitative model validation.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI09_MLOPS_PLATFORM.md`](SPEC_AI09_MLOPS_PLATFORM.md) | MLOps lifecycle posture |
| [`SPEC_AI12_AI_HEALTHCARE_FDA.md`](SPEC_AI12_AI_HEALTHCARE_FDA.md) | Healthcare vertical counterpart |

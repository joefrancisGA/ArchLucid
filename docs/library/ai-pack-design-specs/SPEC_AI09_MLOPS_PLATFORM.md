> **Scope:** Design spec for AI policy pack **AI-09 — MLOps Platform Architecture**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for MLOps platform posture — not model performance certification or reproducibility guarantee.

# AI-09 — MLOps Platform Architecture — design spec

---

## 1. Objective

Ship a pack covering the **architecture posture of an MLOps platform** — the infrastructure and pipeline layer responsible for model training, experiment tracking, model registry, promotion gates, deployment, and monitoring. Pack #1 has 2 rules touching model versioning and evaluation; this pack provides **platform-level depth** covering Azure ML, MLflow, Databricks ML, and Weights & Biases patterns, with specific attention to model registry governance, promotion gates, model card emission, and shadow/canary deployment patterns.

**Buyer outcome:** A data science / ML engineering team can assign this pack and see which MLOps platform posture gaps exist — specifically around registry security, promotion gate enforcement, model card completeness, and deployment isolation.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Primary MLOps platforms in scope: **Azure Machine Learning** (workspace, model registry, pipelines, endpoints), **MLflow** (tracking server, model registry, deployment), **Databricks ML** (Unity Catalog + MLflow), **Weights & Biases** (experiment tracking, artifacts). | Market coverage. |
| A2 | Architecture evidence: model training jobs, pipelines, registries = `services[]`; model artifact stores = `datastores[]`; pipeline → registry → endpoint edges = `relationships[]`. | Manifest schema. |
| A3 | **Model card** = structured documentation of model purpose, training data, evaluation results, limitations, and intended use. Model cards are an architecture artifact, not a product deliverable. | Model card definition. |
| A4 | **Promotion gate** = a documented approval step (automated check + human review) required before a model version advances from development → staging → production. | MLOps maturity definition. |
| A5 | Experiment tracking credential security overlaps with `security-architecture-baseline` (#2); MLOps pack adds model-specific context (tracking server access, artifact encryption). | Non-duplication. |
| A6 | Model training data governance overlaps with `ai-training-data-provenance` (AI-15); cross-reference, do not duplicate lineage rules. | Adjacent pack boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `mlops-` is distinct. | Verified. |
| C2 | Rules must not assert model quality or reproducibility claims. | Scope boundary. |
| C3 | Shadow deployment patterns overlap with `azure-caf-landing-zone` (#4) at deployment isolation level; MLOps rules add model-specific context (shadow traffic routing, champion/challenger comparison). | Adjacent pack boundary. |

---

## 4. Architecture Overview

```
Azure ML docs + MLflow docs + Databricks ML docs + Google MLOps maturity model
        ↓
LLM generator (registry → gates → cards → deployment → monitoring sub-corpora)
        ↓
Critic (platform API field accuracy, promotion gate definition accuracy)
        ↓
Human SME
        ↓
mlops-platform-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `mlops-platform` |
| Display name | **MLOps Platform Architecture** |
| Short name | `MLOps` |
| Category | **AI Governance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "Azure ML documentation; MLflow documentation; Databricks ML (Unity Catalog) documentation; Google MLOps Maturity Model" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `mlops-registry-` | Model registry (security, access control, versioning, immutability of promoted versions) | 6 | P0-heavy |
| `mlops-pipeline-` | Training pipeline (pipeline-as-code, reproducibility, environment isolation, compute security) | 5 | P0/P1 |
| `mlops-gate-` | Promotion gates (dev → staging → prod promotion: automated quality check + human approval) | 6 | P0-heavy |
| `mlops-card-` | Model card governance (model card presence, content fields, update on re-train) | 4 | P0/P1 |
| `mlops-deploy-` | Deployment patterns (shadow traffic, canary, blue/green, endpoint isolation) | 5 | P1 |
| `mlops-drift-` | Model drift monitoring (data drift, concept drift, performance degradation alerting) | 4 | P1/P2 |
| `mlops-retire-` | Model decommission (decommission policy, inference endpoint shutdown, artifact retention) | 4 | P1/P2 |
| **Total** | | **~34 rules** | |

### 5.3 Key evidence fields

`services[].ServiceName` (model registry, training cluster, inference endpoint), `services[].Tags` (model version, model card reference, deployment pattern), `services[].Purpose` (training, serving, shadow, champion, challenger), `datastores[].Tags` (artifact store, training data version), `relationships[].relationshipType` (`ProducesModel`, `DeploysTo`, `ShadowTraffics`), `governance.RequiredControls` (promotion gate requirements), `metadata.DecisionTraceIds` (promotion decision audit).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces registry security, promotion gates, and model card presence. Drift monitoring and decommission rules (P1/P2) surface as operational governance matures.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Model registry access control gaps | `mlops-registry-*` P0 rule: registry access controlled via RBAC (Azure ML workspace roles or MLflow server auth), not open to all team members. |
| Artifact tampering | `mlops-registry-*` P1 rule: promoted model artifacts should be immutable (digest-pinned); registry should log all write operations. |
| Training pipeline secret leakage | `mlops-pipeline-*` P0 rule: training pipeline must not embed credentials; use Key Vault or compute identity. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `ai-governance-responsible-ai` (#1), `ai-training-data-provenance` (AI-15), `llm-observability-evals` (AI-10). |
| Platform breadth | Rules use generic MLOps concepts; platform-specific evidence hints are tagged to `services[].RuntimePlatform` values (azure-machine-learning, mlflow, databricks, wandb). |

---

## 9. Acceptance criteria

1. ~34 rules; every sub-corpus represented.
2. `mlops-gate-*` includes ≥ 2 P0 rules (automated quality check + human approval pattern).
3. `mlops-card-*` includes a P0 rule requiring model card presence before production promotion.
4. No rule asserts model performance quality.
5. `metadata.frameworkMappingDisclaimer` contains "not model performance certification".
6. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack evaluate model accuracy or fairness?**
A: No. ArchLucid evaluates architecture-level posture: model registry security, promotion gate design, model card governance, and deployment isolation. Model accuracy, fairness metrics, and reproducibility are evaluated by your MLOps platform's evaluation harness and data science team — see the LLM Observability pack for eval architecture posture.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI10_LLM_OBSERVABILITY.md`](SPEC_AI10_LLM_OBSERVABILITY.md) | Eval harness posture |
| [`SPEC_AI15_TRAINING_DATA.md`](SPEC_AI15_TRAINING_DATA.md) | Training data governance |

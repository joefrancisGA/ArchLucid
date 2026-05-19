> **Scope:** Design spec for AI policy pack **AI-10 — LLM Observability & Evaluation Architecture**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for LLM eval and observability posture — not certification of LLM output quality or faithfulness guarantee.

# AI-10 — LLM Observability & Evaluation Architecture — design spec

---

## 1. Objective

Ship a pack covering the **architecture posture of LLM observability and evaluation systems** — covering eval harness design, golden-set governance, online vs offline evaluation, trace fidelity, prompt-version pinning, regression gating, and faithfulness/grounding metrics. This complements the existing `observability-otel` pack (#22), which covers application-layer instrumentation. This pack covers the **AI-specific evaluation and observability layer** — distinct and technically deeper for GenAI buyers.

**Buyer outcome:** An ML engineering team can assign this pack and see whether their LLM evaluation architecture (eval harness, golden datasets, online monitoring, trace capture) has the posture needed to detect regressions, catch hallucinations before they reach production, and audit model behaviour over time.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: OpenTelemetry GenAI semantic conventions (gen_ai.* attributes), OpenLLMetry (open-source LLM observability SDK), Microsoft Azure AI Evaluation SDK, HELM (Holistic Evaluation of Language Models), MLflow evaluation module. | Multi-source. |
| A2 | **Eval harness** = automated framework for evaluating LLM outputs against ground truth or metrics (BLEU, ROUGE, G-Eval, faithfulness, relevance, toxicity). | Standard definition. |
| A3 | **Golden dataset** = curated representative inputs with expected outputs used for regression testing and baseline comparison. Governance of this dataset (versioning, coverage, access control) is an architecture concern. | Definition. |
| A4 | Online evaluation = continuous monitoring of LLM outputs in production (sampling, metric aggregation). Offline evaluation = batch evaluation before deployment. Both are in scope. | Coverage. |
| A5 | Trace fidelity = the completeness and accuracy of LLM trace data (input, output, token counts, latency, model version, prompt version). Related to ArchLucid's own `ExplainabilityTrace` concept. | Relevant to ArchLucid's architecture. |
| A6 | `observability-otel` (#22) covers infrastructure and application OTel instrumentation. This pack covers **AI-evaluation-specific observability** — eval harness, golden sets, metric pipelines. | Non-overlapping. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `llm-eval-` is distinct. | Verified. |
| C2 | Rules must not assert that eval harness catches all hallucinations. | Scope boundary. |
| C3 | Eval harness data (golden datasets) governance overlaps with `ai-training-data-provenance` (AI-15) at dataset-versioning level; cross-reference, do not duplicate. | Adjacent pack boundary. |
| C4 | OTel trace format rules overlap with `observability-otel` (#22) at the instrumentation level; LLM eval rules add AI-specific trace attributes (gen_ai.* semantic conventions). | Adjacent pack boundary. |

---

## 4. Architecture Overview

```
OTel GenAI semantic conventions + Azure AI Eval SDK + HELM + MLflow eval
        ↓
LLM generator (trace → golden-set → offline-eval → online-eval → regression sub-corpora)
        ↓
Critic (OTel attribute name accuracy, eval metric name accuracy)
        ↓
Human SME
        ↓
llm-observability-evals-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `llm-observability-evals` |
| Display name | **LLM Observability & Evaluation Architecture** |
| Short name | `LLM Evals` |
| Category | **AI Governance** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "OpenTelemetry GenAI semantic conventions; Azure AI Evaluation SDK; HELM (Stanford, 2023–2024)" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `llm-eval-trace-` | LLM trace design (gen_ai.* attribute coverage, prompt version pinning, session correlation) | 5 | P0-heavy |
| `llm-eval-golden-` | Golden dataset governance (dataset versioning, coverage, access control, update cadence) | 5 | P0/P1 |
| `llm-eval-offline-` | Offline evaluation pipeline (eval harness presence, metric selection, gating threshold) | 5 | P0/P1 |
| `llm-eval-online-` | Online monitoring (production sampling, metric aggregation, drift alerting) | 5 | P1 |
| `llm-eval-regress-` | Regression gating (promotion blocker on metric degradation, canary eval before full rollout) | 5 | P0/P1 |
| **Total** | | **~25 rules** | |

### 5.3 Key evidence fields

`services[].Tags` (eval harness platform, OTel exporter, sampling rate), `services[].Purpose` (evaluation service, monitoring service), `datastores[].Tags` (golden dataset version, eval results store), `governance.RequiredControls` (regression gate thresholds, promotion blockers), `metadata.ChangeDescription` (model version change and eval evidence link), `metadata.DecisionTraceIds` (eval run → deployment decision trace).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces trace design, golden dataset governance, and regression gating. Online monitoring (P1) surfaces as deployment matures.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Golden dataset containing PII / sensitive data | `llm-eval-golden-*` P0 rule: golden datasets must be classified and access-controlled; PII must be anonymised or replaced with synthetic data. |
| Eval result tampering | `llm-eval-regress-*` P1 rule: eval results should be stored in an immutable, access-controlled store with audit log. |
| Rules implying eval harness catches all quality failures | Disclaimer and description framing: "does the architecture document an eval harness?" not "does the eval harness ensure quality?". |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `observability-otel` (#22), `mlops-platform` (AI-09), `rag-architecture` (AI-05), `ai-red-team-safety` (AI-18). |
| OTel GenAI semantic conventions | Conventions are v0.x as of 2025; attribute names may change. Rules reference attribute categories (request, response, token counts) not specific attribute strings. |

---

## 9. Acceptance criteria

1. ~25 rules; every sub-corpus represented.
2. `llm-eval-regress-*` includes ≥ 1 P0 rule for promotion blocking on metric degradation.
3. `llm-eval-golden-*` includes a P0 rule for dataset access control and versioning.
4. No rule implies eval harness eliminates production quality failures.
5. `metadata.frameworkMappingDisclaimer` contains "not certification of LLM output quality".
6. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Does this pack replace our LLM evaluation testing?**
A: No. ArchLucid evaluates whether your evaluation architecture is designed correctly — whether an eval harness exists, golden datasets are governed, and regression gates are built into the promotion pipeline. The actual evaluation results are produced by your eval harness, not ArchLucid.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI09_MLOPS_PLATFORM.md`](SPEC_AI09_MLOPS_PLATFORM.md) | MLOps promotion gates |
| [`SPEC_AI18_AI_RED_TEAM.md`](SPEC_AI18_AI_RED_TEAM.md) | Red-team and safety testing |

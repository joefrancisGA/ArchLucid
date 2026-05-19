> **Scope:** Design spec for AI policy pack **AI-17 — LLM Cost & Token Governance (FinOps for AI)**. Rule JSON authoring is out of scope.
> **Buyer-safe invariant:** Architecture-review mapping for LLM cost governance posture — not cost guarantee or billing commitment.

# AI-17 — LLM Cost & Token Governance (FinOps for AI) — design spec

---

## 1. Objective

Ship a pack covering **FinOps principles applied to LLM and AI workloads** — token budget governance, model-tier routing, semantic caching, kill-switch design, batch vs realtime split optimisation, and per-tenant / per-workload cost allocation. ArchLucid's own platform implements several of these patterns (per-tenant daily budget tracker, kill-switch, golden-cohort budget probe); this pack externalises the architectural posture as customer-facing governance rules. This complements the existing `cost-optimization` pack (#7), which covers general Azure FinOps; AI-17 is AI/LLM-specific and significantly more granular.

**Buyer outcome:** An enterprise deploying LLM workloads at scale can assign this pack and see which LLM cost governance architecture gaps exist — particularly around per-consumer token budgets, model-tier routing strategy, semantic caching design, and cost-kill-switch safety mechanisms.

---

## 2. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | Authoritative sources: FinOps Foundation FOCUS (FinOps Open Cost & Usage Specification), Azure OpenAI cost guidance, Azure API Management token-limit policy documentation, semantic-caching design patterns. | Multi-source. |
| A2 | LLM cost drivers: (1) Input/output token count per request; (2) Model tier (GPT-4o vs GPT-4o-mini, GPT-4.1 vs o1, etc.); (3) Provisioned Throughput Unit (PTU) vs consumption; (4) Embedding calls; (5) Fine-tuning jobs. | Azure OpenAI pricing model. |
| A3 | Architecture evidence: per-consumer token limits documented in `governance.PolicyConstraints` or services tags; model routing strategy in `services[]` relationships; semantic cache in `services[]` (separate caching service entry). | Manifest schema. |
| A4 | **Kill-switch** = a mechanism to automatically halt LLM spending when a cost threshold is exceeded. ArchLucid has its own (`killSwitchThresholdPercent` in `budget.config.json`). Rules require a kill-switch or budget-alert mechanism to be architecturally documented. | Internal precedent. |
| A5 | Pack #7 (`cost-optimization`) covers general Azure resource cost optimisation. This pack is AI/LLM-specific — token-level economics that pack #7 has no rules for. | Non-duplication. |
| A6 | `ai-gateway` (AI-08) covers gateway-level token-limit policy enforcement. This pack covers the architectural **design** of token budgets and cost governance — tenant-level, workload-level, and executive visibility. | Adjacent pack boundary. |

---

## 3. Constraints

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | Rule prefix `llm-cost-` is distinct. | Verified. |
| C2 | Rules must not imply specific cost savings figures. | Scope boundary. |
| C3 | PTU sizing and capacity planning rules must not claim to optimise PTU allocation — that is an operational forecasting task. | Scope boundary. |

---

## 4. Architecture Overview

```
FinOps Foundation FOCUS + Azure OpenAI cost guidance + APIM token-limit docs
        ↓
LLM generator (budget → routing → caching → kill-switch → allocation sub-corpora)
        ↓
Critic (FOCUS spec accuracy, token-limit policy name accuracy)
        ↓
Human SME
        ↓
llm-finops-rules-v1.json → manifest → Seeder
```

---

## 5. Component Breakdown

### 5.1 Pack identity

| Field | Value |
|-------|-------|
| Slug | `llm-finops` |
| Display name | **LLM Cost & Token Governance (FinOps for AI)** |
| Short name | `LLM FinOps` |
| Category | **Cost** |
| Pack type | `PlatformDefault` |
| Version | `1.0.0` |
| Default `priorityFloor` | `P0` |
| Source citation | "FinOps Foundation FOCUS specification; Microsoft Azure OpenAI cost documentation; APIM AI token-limit policy documentation" |

### 5.2 Sub-corpora

| Prefix | Theme | Target rules | Priority skew |
|--------|-------|-------------|---------------|
| `llm-cost-budget-` | Per-consumer / per-tenant token budgets (budget definition, monitoring, alert thresholds) | 5 | P0-heavy |
| `llm-cost-route-` | Model-tier routing (primary/fallback model documented, tier selection criteria, cost-vs-quality routing) | 4 | P0/P1 |
| `llm-cost-cache-` | Semantic caching design (cache strategy documented, TTL policy, cache bypass rules) | 4 | P1 |
| `llm-cost-kill-` | Kill-switch and circuit-breaker (hard spend limit, automatic suspension, executive alert) | 4 | P0-heavy |
| `llm-cost-alloc-` | Cost allocation and tagging (per-workload cost tags, showback / chargeback design, FOCUS-aligned tagging) | 4 | P1 |
| `llm-cost-batch-` | Batch vs realtime optimisation (batch endpoint vs realtime, async request design for cost reduction) | 3 | P1/P2 |
| **Total** | | **~24 rules** | |

### 5.3 Key evidence fields

`services[].Tags` (token budget per service, model tier, batch/realtime marker, cache enabled), `governance.PolicyConstraints` (token budget limits, kill-switch threshold, cost-alert policy), `governance.RequiredControls` (budget enforcement requirements, tier routing policy), `metadata.ChangeDescription` (model tier change justification, budget change rationale).

---

## 6. Data Flow

Standard pipeline. `priorityFloor: P0` surfaces per-consumer token budgets and kill-switch design. Semantic caching and batch optimisation (P1/P2) surface as cost maturity grows.

---

## 7. Security Model

| Concern | Mitigation |
|---------|------------|
| Kill-switch rules creating operational dependency | Rules ask "is a kill-switch mechanism architecturally documented?" — not prescribe a specific implementation. |
| Cost allocation rules implying specific FOCUS field names | Rules reference FOCUS tagging categories (service, SKU, region, consumer) not specific field names. |

---

## 8. Operational Considerations

| Area | Action |
|------|--------|
| Adjacent packs | `cost-optimization` (#7), `ai-gateway` (AI-08), `llm-observability-evals` (AI-10). |
| ArchLucid internal precedent | ArchLucid's own budget probe and kill-switch design can be cited as an example architecture in remediation guidance (making ArchLucid itself a reference customer). |
| FinOps Foundation FOCUS | FOCUS is versioned; reference FOCUS capability categories not specific schema version. |

---

## 9. Acceptance criteria

1. ~24 rules; every sub-corpus represented.
2. `llm-cost-kill-*` includes ≥ 2 P0 rules for kill-switch architecture.
3. No rule implies specific cost reduction percentage.
4. `metadata.frameworkMappingDisclaimer` contains "not cost guarantee".
5. No `Critical` severity.

---

## 10. Required FAQ wording

**Q: Will this pack reduce our LLM costs?**
A: ArchLucid identifies architecture-level cost governance gaps — missing token budgets, absent kill-switch mechanisms, unoptimised model routing. Addressing these gaps may reduce costs, but the actual reduction depends on your workload characteristics and implementation decisions.

---

## 11. Related documents

| Doc | Purpose |
|-----|---------|
| [`SPEC_AI08_AI_GATEWAY.md`](SPEC_AI08_AI_GATEWAY.md) | Gateway-layer token enforcement |
| `docs/samples/policy-packs/cost-optimization-rules-v1.json` | General FinOps pack reference |

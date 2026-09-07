> **Scope:** Internal engineering strategy for raising **Decision-Changing Insight Density** (assessment pillar 1, weight 13). Not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Pillar definition:** [`../assessments/ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md) · **Gate behavior:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Miss clause:** [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)
> **Related prompts (shipped / ready):** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-21–DX-28** — run these; DX-17/DX-20 next; DX-18/DX-19 held) · [`INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS.md) · [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) · [`POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`](POLICY_PACK_MOAT_COMPOSER_PROMPTS.md)

# Insight density — excellence strategy

**Created:** 2026-09-06 · **Status:** Owner-facing strategy note. **DX-01–DX-16 shipped.** Next batches: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (one DX prompt per chat).

## Executive summary

Excellent insight density is a **generation** problem, not a filtering problem. The shipped stack (`DeterministicInsightDensityGate`, Critic pruner, optional LLM judge) is overwhelmingly **subtractive**: it can demote generic phrasing but cannot invent findings a frontier model would miss. ADR 0070 made typed-engine classification honest (scores can demote to checklist), but relabeling does not raise the pillar score. The golden-corpus distribution shows **15 engines with median score 100** and **zero production demotions** — the gate is not broken; it is scoring checklist-shaped engine output as Decision-grade.

**To reach excellent density:** add **new information sources** (live inventory, actor materialization, cross-source contradiction, generative critic allowed to invent findings), tighten dismiss so new engines are not all stamped Decision-grade, package findings into governance (policy-pack moat beyond compliance-only), and replace the synthetic frontier-delta instrument with live baselines plus human “I did not think of that” signal.

---

## Pillar definition (canonical)

From [`ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md):

> Non-obvious, correct findings a skilled architect using frontier AI would **miss**, **dismiss**, fail to **operationalize**, or fail to **package** into governance. Do not credit articulate-but-generic output.

| Pillar clause | Current mechanisms | Gap |
|---------------|-------------------|-----|
| **Miss** | ID-05/06/07 (open commitment, portfolio recurrence, premise conflict); partial via inventory/declaration when intake is complete | Most reviews never hit actor-dependent or inventory engines; no generative agent that may create findings |
| **Dismiss** | Gate, Critic pruner, LLM judge (default off) | Category protection + loose evidence refs prevent demotion on engine rows |
| **Operationalize** | Governance queue, ITSM export | Not density-gated; checklist rows can still clutter the desk |
| **Package** | ADR 0070 classification, sealed snapshot | Policy packs change compliance; declaration moat still CIS-heavy (PP-01 remainder) |

See [`INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md): **a filter cannot raise density** by itself.

---

## Current architecture (what ships)

### Subtractive layer

| Component | Role | Limit |
|-----------|------|-------|
| `DeterministicInsightDensityGate` | Penalties: generic (−35), no evidence (−25), no anchor (−15), duplication (−15/−30); demotion when score &lt; 50 and predicates fail | Does not create findings |
| `InsightDensityAgentCategoryRules` | Category-protected categories skip demotion | Most engine categories (Security, Topology, Compliance, …) never demote |
| `GenericArchitectureAdvicePatterns` | Phrase deny-list + anchor/evidence heuristics | `*UnderSpecified` titles score as architecture-specific; loose evidence fallback |
| `CriticFindingObviousnessPruner` | Downgrades obvious Critic advice to Advisory | Does not remove; named-service generic advice can stay PolicyViolation |
| `PremiumInsightDensityLlmJudge` | So What loop; **not to generate new findings** | `EnableLlmJudge` / `EnableLlmJudgeForEngineFindings` default **false**; cap 12/snapshot |

### Generative layer (partial)

| Component | Information source | Notes |
|-----------|-------------------|-------|
| 39 registered finding engines | Graph, declarations, inventory (when run), governance trail | Golden harness runs **16**; **24** product engines absent from distribution table |
| `OpenCommitmentFindingEngine` | Governance trail (effectful) | Shipped ID-05 |
| `PortfolioRecurrenceFindingEngine` | Cross-run SQL (effectful) | Default **off** |
| `DeclarationPremiseConflictFindingEngine` | Declaration vs baseline intent | Policy-gated via `DeclarationSignalPolicyKeyMap` |

### Production gate (ADR 0070)

- Typed-engine findings use the **same demotion predicate** as agent findings (`score < DemotionThreshold && !anchor && !concrete evidence`, then category-protected undo).
- Rows **remain on the package** as `ChecklistCoverage` when demoted — not deleted.
- Assessment text that cites `typed-engine-protected` Promote bypass at `DeterministicInsightDensityGate.cs:87` is **stale** post–ADR 0070; telemetry is now `typed-engine-scored`.

### Measurement instruments

| Instrument | Location | Limit |
|------------|----------|-------|
| Engine distribution | [`../quality/insight-density-engine-distribution.md`](../quality/insight-density-engine-distribution.md) | 16-engine golden slice; medians mostly 100 |
| Frontier delta | [`../quality/insight-density-frontier-delta.md`](../quality/insight-density-frontier-delta.md) | Three hand-authored scenarios — regression only, not moat proof |
| Measurement floor UI | `InsightDensityMeasurementFloorPresenter`, SPA strips | Honesty; does not raise numerator |

---

## Why the gate cannot reach “excellent” alone

### 1. Demotion is a triple-AND plus category veto

Demotion requires score &lt; 50 **and** no architecture anchor **and** no concrete evidence **and** demotion-eligible category (`Insight`, `General`, `Critic`, empty). Engine rows in Security, Topology, Compliance, Requirement, Cost are **category-protected**.

### 2. “Concrete evidence” is nearly any ref

After skipping `request`, `critic-checklist`, `architecture-request`, any other evidence ref counts as concrete — including graph node ids engines attach by default. Anchor detection also returns true when evidence is “concrete,” so the two checks are not independent.

### 3. Title shape is rewarded, not insight

Patterns like `SecretManagementUnderSpecified` match architecture-anchor and falsifiability (+10). Critic messages naming `CheckoutApi` in generic MFA advice can remain PolicyViolation. Naming a service in a generic sentence is not decision-changing insight.

### 4. LLM judge cannot rescue generation

Judge defaults off, caps at 12, and explicitly forbids generating findings. Enabling it improves captions on existing rows, not the count of novel rows.

**Conclusion:** Filtering improves precision. Density is **numerator growth** from information frontier chat sessions structurally lack.

---

## Program: four workstreams

Do **not** add a 40th engine that only re-reads `GraphSnapshot` ([`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md) until deep categories are owner-named — cost is not the binding constraint for the strategy below; validation discipline is).

### Workstream 1 — New information sources (density win)

These are the only changes that can move the pillar from ~66 toward 90+.

#### A. Always-on live estate (not optional inventory)

Make customer-run extractors (Azure/AWS/GCP inventory, Advisor, cost) a **first-review default**, not a later Operate add-on. Engines already exist (`orphaned-*`, `*-inventory-reconciliation`, `*-inventory-security-baseline`, `*-cost-recommendation`) but are **absent from the golden harness**. IaC-only reviews never produce “declared private in Terraform, public in Azure.”

#### B. Materialize actors from declarations

`external-exposure`, `trust-boundary`, `privileged-access` are silent without Actor nodes. Parse identity from Bicep/ARM/TF/K8s (managed identities, RoleAssignments, ServiceAccounts, Ingress, Front Door, API Management) into Actor + TrustBoundary + data-flow edges **without** guided-intake typing. Information-source change, not a new coverage engine.

#### C. Deep interaction engines (lift hold selectively)

Lift [`HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md) for engines that reason over **paths and contradictions**, not node presence:

| Engine family | Inputs beyond bare GraphSnapshot | Example insight |
|---------------|----------------------------------|-----------------|
| Blast-radius / identity path | RBAC/IAM bindings + graph edges | Function MI can write production Key Vault used by PCI datastore |
| Data-flow vs trust-boundary | Actor→datastore paths × NSG/NetworkPolicy/PE | SqlDb reachable without crossing modeled trust boundary |
| Secrets lifecycle | KV/Secrets Manager refs × rotation/expiry from inventory | Payment secret not rotated 410 days; waiver expires in 6 days |
| DR / RPO vs topology | Requirement RPO × replica/failover properties | RPO 15 min declared; SQL has no geo-replica |
| Segmentation semantics | NSG/ASG/NetworkPolicy **rules** | NSG permits 22/3389 from Internet to jump box with path to data subnet |

**Acceptance:** On a golden fixture, frontier baseline with same files does not emit the finding; principal-architect rubric marks it decision-changing.

#### D. Cross-source synthesis (`ContradictionOrchestrator`)

Emit only when two sources disagree:

- Declaration vs inventory (recon engines exist — productize as Decision-grade)
- Requirement vs declaration (expand beyond premise-conflict themes)
- Governance trail vs current graph (join `open-commitment` to **this** run’s topology)
- Policy pack vs declared vs live control (three-way)

**TB-885** (policy-pack compounding-evidence ledger): dry-run older vs newer pack on same historical run; incremental catches by finding id — **package into governance** with a number.

#### E. Graph-RAG community summarization (live)

ADR 0057 option (a) owner override: community detection + hierarchical summaries on embedding refresh. Bounded 1–2 hop cannot surface “PCI payment community whose only egress is a Function with a public hostname.” Use summaries as **retrieval context for generative critic**. Pair with **TB-883** live ablation before buyer claims.

#### F. Generative critic allowed to invent findings

New agent role `InsightGenerator` (or extend Critic contract):

- Inputs: graph, community summaries, policy remainder, inventory delta, open commitments, prior-run diffs
- Output: candidate findings with evidence refs **only from the package**
- Then deterministic gate + stricter judge filter
- Real mode only; raise `MaxJudgedFindingsPerSnapshot` beyond 12 under tenant LLM budget

Replace judge’s “not to generate new findings” for this path only.

#### G. Ingestion completeness (beyond ID-08)

ID-08 shipped Bicep body + K8s spec. Still missing for first-review density: ARM nested/linked templates, Bicep modules/`.bicepparam`, Helm/Kustomize, TF modules/`for_each`, Pulumi/CDK, pipeline OIDC trust, DNS/Front Door routes, private DNS links. Expand property bag before new engines.

#### H. Finding verification loop (ADR 0062 / TB-2033–2037)

Post-finalize re-ingest → Materialized / Mitigated / Not observed / Not verifiable. Does not raise first-review density; **sustains** excellence by demoting generators that never materialize.

---

### Workstream 2 — Make dismiss bite (precision)

Parallel with Workstream 1 so new engines are not all Decision-grade.

| Change | Rationale |
|--------|-----------|
| Tighten `HasConcreteEvidenceCitation` | Require resolvable package ref (`doc:…#L`, ARM id, graph node on **this** snapshot, surviving `PolicyRuleId`) — remove fallback `return true` |
| Redesign category protection | Demotion-eligible by default; protect only when surviving policy rule **and** resolvable evidence **and** score ≥ threshold |
| Change demotion predicate | Demote on `score < threshold` **or** (generic-advice **and** no resolvable evidence) — do not require missing both anchor and evidence |
| Real-mode LLM judge default on | Include engine findings; faithfulness validator already exists; off in Simulator |
| Reject named-service generic advice | `Enable MFA on CheckoutApi` stays generic unless control contradiction (inventory/declaration) |
| Default-on portfolio recurrence | Cross-system recurrence is structurally frontier-novel |

---

### Workstream 3 — Package and operationalize

| Item | Action |
|------|--------|
| **PP-01** | Map SOC 2 / GDPR / HIPAA / ISO / PCI / ZTA / CIS AWS-GCP / AKS-EKS-GKE onto `DeclarationSignalPolicyKeyMap` — [`POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`](POLICY_PACK_MOAT_COMPOSER_PROMPTS.md) |
| Selective policy-awareness | `external-exposure`, `trust-boundary`, `privileged-access`, `security-gap`, `cost-constraint`, inventory security-baseline — same theme→rule map pattern |
| ITSM path | Decision-grade tickets only; refuse `ChecklistCoverage` |
| Finalize stamp | Measurement floor: engines run vs registered, actor engines skipped, judge skipped-by-cap, novelty vs tenant frontier baseline |
| Golden harness | Expand from 16 → all product engines with actors, inventory, narrowed pack fixtures |

---

### Workstream 4 — Live frontier instrument

Replace synthetic [`insight-density-frontier-delta.md`](../quality/insight-density-frontier-delta.md) fixtures with:

1. **20–30 frozen architectures** (pilot ZIPs + golden with actors/inventory)
2. **Committed frontier transcripts** per case (model label + date; same evidence package)
3. **CI novelty metric** on Decision-grade findings via `InsightDensityFrontierDeltaCalculator`
4. **Ship gate:** novelty **and** precision (e.g. ≥40% novel vs baseline; ≥80% human “would change decision” on sample)
5. **In-product signal:** “I did not think of that” disposition on finding desk → feeds generator tuning

---

## What not to do

- Another coverage engine that emits “X node missing” from `GraphSnapshot` — grows denominator (`topology-coverage` median 60 is the warning).
- Phrase-list tuning in `GenericArchitectureAdvicePatterns` as the main program — engines emit `*UnderSpecified` titles.
- Treating ADR 0070, ID-11 honesty, or sort-by-density as density — packaging only.
- Simulator-only proof — Real mode + live extractors + live judge required for claims.
- Fake frontier transcripts without real architectures ([`INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md) forbidden list).

---

## Recommended execution sequence

| Order | Item | Raises numerator? |
|-------|------|-------------------|
| 1 | **PP-01** (declaration policy vocabulary) | Packaging / moat |
| 2 | Evidence + category + demotion predicate rewrite | Precision (prerequisite) |
| 3 | Actor materialization from IaC | **Yes** |
| 4 | ContradictionOrchestrator (declaration × inventory × requirement × commitments) | **Yes** |
| 5 | InsightGenerator agent + Real-mode judge | **Yes** |
| 6 | Three deep path engines (identity blast radius, segmentation semantics, DR/RPO) | **Yes** |
| 7 | Live frontier corpus + “I did not think of that” instrument | Measurement |
| 8 | Community Graph-RAG + TB-885 ledger + ADR 0062 verification | Sustained excellence |
| 9 | **DX-21–DX-28** (judge-cap priority, checklist synthesis, novelty rate, dangling refs, SKU/tier, counterfactual line, nested ingest, path-engine goldens) | Mixed — see DX-21 file |

Items 1–2 do not raise the numerator; they stop overstating it. Items 3–6 are the product. Items 7–8 prove and sustain excellence. Item 9 is the Cursor-ready follow-on after DX-01–DX-16 landed.

---

## Security, scalability, reliability, cost

| Dimension | Notes |
|-----------|-------|
| **Security** | New information sources reuse customer-run extractors (no vendor cloud credentials); tenant isolation ADR 0037 unchanged; generative paths must keep faithfulness validation and evidence-bound refs only |
| **Scalability** | Inventory + judge spend scale with review volume — route through existing per-tenant LLM dollar budget; community summarization adds recurring AOAI cost per graph refresh (ADR 0057 trade-off) |
| **Reliability** | Contradiction and verification passes must fail closed (`Not verifiable`) rather than hallucinate; Simulator must not run paid generative paths |
| **Cost** | Strategy explicitly accepts higher spend (extractors, Premium judge, community summaries, live frontier capture) in exchange for pillar score and buyer defensibility — budget gates exist; defaults should shift for Real pilot tenants only until G4 evidence |

---

## Related documents

| Doc | Role |
|-----|------|
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) | **DX-01–DX-16** shipped — do not re-run |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) | **DX-21–DX-28** Cursor-implementable batches (run these); DX-17/DX-20 next; DX-18/DX-19 held |
| [`INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS.md) | Shipped ID-01–07; subtractive + first generative batch |
| [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) | Shipped ID-08–10; ID-11 honesty |
| [`POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`](POLICY_PACK_MOAT_COMPOSER_PROMPTS.md) | PP-01 ready |
| [`WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md`](WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md) | WK-15 / WK-20 holds |
| [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) | Production gate |
| [`adrs/0062-finding-verification-loop.md`](adrs/0062-finding-verification-loop.md) | Proof-of-prediction (V1.1) |
| [`adrs/0057-graph-rag-community-summarization-scope-decision.md`](adrs/0057-graph-rag-community-summarization-scope-decision.md) | Community summarization options |
| [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) | §7.1 pillar score (~66); assessment may lag ADR 0070 |
| [`../library/FINDING_ENGINE_OUTPUT_REFERENCE.md`](../library/FINDING_ENGINE_OUTPUT_REFERENCE.md) | Engine catalog |

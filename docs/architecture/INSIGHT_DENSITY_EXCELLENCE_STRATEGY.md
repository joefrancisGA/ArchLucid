> **Scope:** Internal engineering strategy for raising **Decision-Changing Insight Density** (assessment pillar 1, weight 13). Not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Pillar definition:** [`../assessments/ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md) · **Gate behavior:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Miss clause:** [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)
> **Related prompts (shipped / ready):** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) (**DX-36–DX-41 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) (**DX-42–DX-46 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md) (**DX-47–DX-50 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md) (**DX-51–DX-56 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md) (**DX-58–DX-62 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md) (**DX-63–DX-68 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md) (**DX-69–DX-72 shipped** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md) (**DX-73–DX-76 ready**) · [`INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS.md) · [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) · [`POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`](POLICY_PACK_MOAT_COMPOSER_PROMPTS.md)

# Insight density — excellence strategy

**Created:** 2026-09-06 · **Status:** Owner-facing strategy note. **DX-01–DX-72 shipped** (2026-09-09). Next Cursor-implementable set: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md) (**DX-73–DX-76** — re-record distribution after DX-69–DX-72, AWS/GCP IAM path edges, parse-through data-flow golden, NSG/SG rule promotion). Still owner-gated: live frontier corpus **G-REAL-06**, `EnableProseAssumptionExtraction` default-on, Graph-RAG live ablation **TB-883**. **DX-57** already made ranking priors and the insight generator effective-on in Real mode. **DX-59** already raised `DemotionThreshold` to 65.

## Executive summary

Excellent insight density is a **generation** problem, not a filtering problem. The shipped stack (`DeterministicInsightDensityGate`, Critic pruner, optional LLM judge) is overwhelmingly **subtractive**: it can demote generic phrasing but cannot invent findings a frontier model would miss. ADR 0070 made typed-engine classification honest (scores can demote to checklist), but relabeling does not raise the pillar score. Post–DX-72 golden corpus (`case-01`…`case-65`, **42** harness engines) still **reports** a **60 / 65 / 75 / 80 / 85** ladder in the last recorded distribution table (pre–DX-69 slice): absence-shaped engines (`topology-coverage`, `requirement-expectation`) dominate volume and demote; path/contradiction engines score 80–85. **DX-69** added Azure declaration IAM / data-flow path edges (**case-65** proves blast-radius without overlay). AWS/GCP IAM, parse-through data-flow, and NSG rule edges are still missing (**DX-73–DX-76**). Whether DX-72 actually spread scores is unmeasured until DX-73 re-records. The distribution table reports **heavy** `WouldDemoteIfUnprotectedCount` after DX-50 + threshold 65 (for example 61 of 63 on `topology-coverage`) — that demotion is honest, not a scoring bug.

**To reach excellent density:** add **new information sources** (live inventory, actor materialization, cross-source contradiction, generative critic allowed to invent findings), tighten dismiss so new engines are not all stamped Decision-grade, package findings into governance (policy-pack moat beyond compliance-only), and replace the synthetic frontier-delta instrument with live baselines plus human “I did not think of that” signal.

---

## Pillar definition (canonical)

From [`ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md):

> Non-obvious, correct findings a skilled architect using frontier AI would **miss**, **dismiss**, fail to **operationalize**, or fail to **package** into governance. Do not credit articulate-but-generic output.

| Pillar clause | Current mechanisms | Gap |
|---------------|-------------------|-----|
| **Miss** | ID-05/06/07 (open commitment, portfolio recurrence, premise conflict); partial via inventory/declaration when intake is complete | Most reviews never hit actor-dependent or inventory engines; no generative agent that may create findings |
| **Dismiss** | Gate, Critic pruner, LLM judge (default off) | Resolvable package evidence prevents demotion; generic engine rows can still demote when evidence refs are absent |
| **Operationalize** | Governance queue, ITSM export | Not density-gated; checklist rows can still clutter the desk |
| **Package** | ADR 0070 classification, sealed snapshot | Policy packs change compliance; declaration moat still CIS-heavy (PP-01 remainder) |

See [`INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md): **a filter cannot raise density** by itself.

---

## Current architecture (what ships)

### Subtractive layer

| Component | Role | Limit |
|-----------|------|-------|
| `DeterministicInsightDensityGate` | Penalties: generic (−35), no evidence (−25), no anchor (−15), duplication (−15/−30); demotion when score &lt; 50 and predicates fail | Does not create findings |
| `InsightDensityAgentCategoryRules` | Legacy helper; `IsDemotionEligibleCategory` always **true** and unused by gate | All categories demote when predicate fires; evidence refs block demotion |
| `GenericArchitectureAdvicePatterns` | Phrase deny-list + anchor/evidence heuristics | `*UnderSpecified` titles score as architecture-specific; **DX-50** tightened `graph-node:` to product-shaped ARM/ARN/GCP only |
| `CriticFindingObviousnessPruner` | Downgrades obvious Critic advice to Advisory | Does not remove; named-service generic advice can stay PolicyViolation |
| `PremiumInsightDensityLlmJudge` | So What loop; **not to generate new findings** | `EnableLlmJudge` / `EnableLlmJudgeForEngineFindings` **effective on in Real mode** (DX-02 / DX-57); host JSON default still `false`; cap **40**/snapshot (DX-62 may shrink from remaining USD, must not raise the default) |

### Generative layer (partial)

| Component | Information source | Notes |
|-----------|-------------------|-------|
| 41 registered finding engines | Graph, declarations, inventory (when run), governance trail | Golden harness registers **41** of **52** catalog engines; **11** absent-with-reason; **39** appear in the distribution table on the current `case-63` slice |
| `OpenCommitmentFindingEngine` | Governance trail (effectful) | Shipped ID-05 |
| `PortfolioRecurrenceFindingEngine` | Cross-run SQL (effectful) | Default **off** |
| `DeclarationPremiseConflictFindingEngine` | Declaration vs baseline intent | Policy-gated via `DeclarationSignalPolicyKeyMap` |

### Production gate (ADR 0070)

- Typed-engine findings use the **same demotion predicate** as agent findings: `(score < DemotionThreshold || genericWithoutEvidence || falsifiableWithoutEvidence) && !hasConcreteEvidence` (see `DeterministicInsightDensityGate`).
- Rows **remain on the package** as `ChecklistCoverage` when demoted — not deleted.
- Assessment text that cites `typed-engine-protected` Promote bypass at `DeterministicInsightDensityGate.cs:87` is **stale** post–ADR 0070; telemetry is now `typed-engine-scored`.

### Measurement instruments

| Instrument | Location | Limit |
|------------|----------|-------|
| Engine distribution | [`../quality/insight-density-engine-distribution.md`](../quality/insight-density-engine-distribution.md) | 41-engine golden harness; medians mostly 60–85 post–DX-50 on current slice |
| Frontier delta | [`../quality/insight-density-frontier-delta.md`](../quality/insight-density-frontier-delta.md) | Three hand-authored scenarios — regression only, not moat proof |
| Measurement floor UI | `InsightDensityMeasurementFloorPresenter`, SPA strips | Honesty; does not raise numerator |

---

## Why the gate cannot reach “excellent” alone

### 1. Demotion is evidence-gated, not category-vetoed (DX-01)

Demotion fires when `(score < DemotionThreshold || genericAdviceWithoutEvidence || falsifiableWithoutEvidence) && !hasConcreteEvidence`. **Superseded 2026-09-07:** the pre–DX-01 triple-AND plus category veto (`Security` / `Topology` / `Compliance` protected) no longer applies — `IsDemotionEligibleCategory` always returns true and is unused. Architecture-specific anchors affect score penalties but **do not** alone prevent demotion without resolvable evidence refs.

### 2. “Concrete evidence” tightened (DX-01 + DX-50)

**Partially addressed 2026-09-07:** DX-01 dropped the unmatched-string `return true` fallback and rewrote the demotion predicate. **DX-50** further tightened `HasConcreteEvidenceCitation` so `graph-node:` counts only when the remainder is a product-shaped ARM resource id, AWS ARN, or GCP `projects/` path (via `FindingEvidenceRefs.TryFormatInventoryResourceId`). Label-shaped refs such as `graph-node:storage-1` no longer block demotion. **DX-47** populated honest ARM/ARN citations on cost and path engines when the package already had them. Remaining Workstream 2 items (Real-mode judge default-on, category protection redesign) stay owner-gated.

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

`external-exposure`, `trust-boundary`, `privileged-access` are silent without Actor nodes. **DX-03 shipped** Actor + TrustBoundary seeding. **DX-69 shipped** Azure IAM / data-flow path edges (**case-65** parse-through). **Still missing (DX-74–DX-76):** AWS/GCP IAM property promotion into the same path materializer; a parse-through `data-flow-trust-boundary` golden (**case-60** is still an overlay); declared NSG/SG/firewall rule blobs + association edges so `segmentation-semantics` fires without **case-39** / **case-44** overlays. Information-source change, not a new coverage engine.

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

ID-08 plus **DX-27 / DX-30 / DX-31 / DX-37 / DX-42** shipped nested ARM (inline + in-batch `templateLink`), Bicep modules/`.bicepparam`, Helm/Kustomize, TF modules/`for_each`/HCL local modules, pipeline OIDC bag keys, Front Door / private DNS properties, and in-batch **Pulumi stack export**, **CloudFormation**, and **CDK `cdk.out` templates** (synthesized artifacts only — no compilers). **DX-48** added golden cases **`case-58`–`case-60`** proving those parsers feed path and contradiction engines. Still missing for first-review density: live extractor-as-default (product/GTM) so inventory engines fire on first review without pinned fixtures.

#### H. Finding verification loop (ADR 0062 / TB-2033–2037)

Post-finalize re-ingest → Materialized / Mitigated / Not observed / Not verifiable. Does not raise first-review density; **sustains** excellence by demoting generators that never materialize.

---

### Workstream 2 — Make dismiss bite (precision)

Parallel with Workstream 1 so new engines are not all Decision-grade.

| Change | Rationale | Status |
|--------|-----------|--------|
| Tighten `HasConcreteEvidenceCitation` | Require resolvable package ref (`doc:…#L`, ARM id, product-shaped `graph-node:`, surviving `PolicyRuleId`) — remove fallback `return true` | **Shipped** — DX-01 + DX-47 + DX-50 + **DX-70** (unanchored `doc:` / `finding:` no longer veto) |
| Redesign category protection | Demotion-eligible by default; protect only when surviving policy rule **and** resolvable evidence **and** score ≥ threshold | Owner-gated |
| Change demotion predicate | Demote on `score < threshold` **or** (generic-advice **and** no resolvable evidence) — do not require missing both anchor and evidence | **Shipped** — DX-01 |
| Real-mode LLM judge default on | Include engine findings; faithfulness validator already exists; off in Simulator | Owner-gated |
| Reject named-service generic advice | `Enable MFA on CheckoutApi` stays generic unless control contradiction (inventory/declaration) | Partial — phrase deny-list exists |
| Default-on portfolio recurrence | Cross-system recurrence is structurally frontier-novel | Shipped opt-in engine; default still off |

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
| 9 | **DX-21–DX-28** (judge-cap priority, checklist synthesis, novelty rate, dangling refs, SKU/tier, counterfactual line, nested ingest, path-engine goldens) | Mixed — shipped; see DX-21 file |
| 10 | **DX-29–DX-35** (golden depth, ingest slices 2–3, data-flow × trust-boundary, three-way pack contradiction, preferred-engine catch-up, optional novelty-rate sort) | **Shipped** (2026-09-07) — see DX-29 file |
| 11 | **DX-36–DX-41** (harness data-flow/three-way, ARM templateLink, novelty→InsightGenerator, pack-gated graph/inventory security, Azure inventory goldens, docs honesty) | Mixed — **shipped**; see DX-36 file |
| 12 | **DX-42–DX-46** (Pulumi/CFN/CDK ingest, three-way theme expansion, AWS/GCP inventory goldens, honest EvidenceRefs, cost-recommendation goldens) | Mixed — **shipped**; see DX-42 file |
| 13 | **DX-47–DX-50** (EvidenceRefs remainder, DX-42 ingest goldens, absent-engine goldens, citation tightening) | Mixed — **shipped** (2026-09-07); see DX-47 file |
| 14 | **DX-51–DX-56** (decision-grade fusion, held-check ledger, portfolio shared-topology, frontier harness, prose extraction, verification priors) | Mixed — **shipped** (2026-09-08); see DX-51 file |
| 15 | **DX-57** (Real-mode ranking-prior defaults + insight-generator tenant opt-out) | Precision — **shipped** `#2242` |
| 16 | **DX-58–DX-62** (penalty telemetry, threshold 65, held-check second pass, assumption register, judge budget cap) | Mixed — **shipped** (2026-09-08); see DX-58 file |
| 17 | **DX-63–DX-68** (corroboration scoring, topology security drift, impact witness, NotVerifiable asks, human calibration, IE-12 → open-commitment) | Mixed — **shipped**; see DX-63 file |
| 18 | **DX-69–DX-72** (declaration IAM/data-flow path edges, remaining evidence-ref vetoes, fuse-then-demote, graduated evidence-quality scores) | Mixed — **shipped** `#2447`; see DX-69 file |
| 19 | **DX-73–DX-76** (re-record distribution, AWS/GCP IAM path edges, parse-through data-flow golden, NSG/SG rule promotion) | Mixed — **ready**; see DX-73 file |

Items 1–2 do not raise the numerator; they stop overstating it. Items 3–6 are the product. Items 7–8 prove and sustain excellence. Item 9 shipped after DX-01–DX-16. Item 10 shipped after DX-21–DX-28. Item 11 shipped after DX-29–DX-35. Item 12 shipped after DX-36–DX-41. Item 13 shipped after DX-42–DX-46. Item 14 shipped after DX-50. Item 15 shipped as `#2242`. Item 16 shipped after DX-57. Item 17 shipped after DX-62. Item 18 shipped as `#2447`. Item 19 is the remaining Cursor-implementable density work after DX-72: measure whether scores actually spread; feed AWS/GCP IAM, declared ingress backends, and NSG/SG rules into the **existing** path engines without overlays.

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
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) | **DX-17–DX-28** shipped (including **DX-18** / **DX-19**) |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) | **DX-29–DX-35** shipped (2026-09-07) — do not re-run |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) | **DX-36–DX-41** shipped (2026-09-07) — do not re-run |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) | **DX-42–DX-46** shipped (2026-09-07) — do not re-run |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md) | **DX-47–DX-50** shipped (2026-09-07) — do not re-run |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md) | **DX-51–DX-56** shipped (2026-09-08) |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md) | **DX-58–DX-62** shipped (2026-09-08) |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md) | **DX-63–DX-68** shipped (2026-09-08) |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md) | **DX-69–DX-72** shipped (2026-09-09) |
| [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md) | **DX-73–DX-76** ready (2026-09-09) |
| [`INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS.md) | Shipped ID-01–07; subtractive + first generative batch |
| [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) | Shipped ID-08–10; ID-11 honesty |
| [`POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`](POLICY_PACK_MOAT_COMPOSER_PROMPTS.md) | PP-01 ready |
| [`WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md`](WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md) | WK-15 / WK-20 holds |
| [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) | Production gate |
| [`adrs/0062-finding-verification-loop.md`](adrs/0062-finding-verification-loop.md) | Proof-of-prediction (V1.1) |
| [`adrs/0057-graph-rag-community-summarization-scope-decision.md`](adrs/0057-graph-rag-community-summarization-scope-decision.md) | Community summarization options |
| [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) | §7.1 pillar score (~66); assessment may lag ADR 0070 |
| [`../library/FINDING_ENGINE_OUTPUT_REFERENCE.md`](../library/FINDING_ENGINE_OUTPUT_REFERENCE.md) | Engine catalog |

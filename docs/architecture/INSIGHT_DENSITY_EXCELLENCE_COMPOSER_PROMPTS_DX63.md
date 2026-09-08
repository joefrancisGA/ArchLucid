> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-62**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) (**DX-36–DX-41** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) (**DX-42–DX-46** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md) (**DX-47–DX-50** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md) (**DX-51–DX-56** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md) (**DX-58–DX-62** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-63–DX-68)

**Created:** 2026-09-08 · **Status:** Ready to run. **DX-01–DX-62 shipped on `master`.** Do **not** re-run them.

DX-01–DX-50 closed engine, ingest, and citation holes. DX-51–DX-56 added fusion, the held-check ledger, portfolio shared-topology, the idle frontier harness, prose extraction, and verification priors. **DX-57** (`#2242`) turned ranking priors and the insight generator effective-on in Real mode. **DX-58–DX-62** made dismiss measurable (threshold **65**), converted held-checks into a second pass, persisted the prose assumption register, and shrank the Premium judge cap from remaining tenant USD. Latest golden case is **`case-63`**. Harness registers **41** engines; catalog has **52**; **11** absent-with-reason.

This set grows the **numerator** from information sources the subtractive stack still throws away or never diffs: independent engines agreeing (today a Jaccard **penalty**), security-semantic graph drift vs the prior sealed snapshot (today only **category** add/remove), path-engine hop counts unused by the gate, `NotVerifiable` assumptions unused as asks, human “I did not think of that” unused as calibration, and IE-12 operational exceptions unused by `open-commitment` (which already reads **risk** waivers).

**This set adds at most one `EngineType`:** `topology-security-drift` (**DX-64** only). **DX-63 / DX-65 / DX-66 / DX-67 / DX-68 add zero engines.** Do not add a 5th `AgentType`.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-50** | Gate, path/contradiction engines, InsightGenerator, ingest slices, goldens through `case-63`, citation tightening |
| **DX-51–DX-56** | Fusion, held-check ledger, portfolio shared-topology, frontier harness, prose extraction, verification priors |
| **DX-57** | Real-mode ranking-prior defaults (`#2242`) |
| **DX-58–DX-62** | Penalty telemetry, `DemotionThreshold` 65, held-check second pass, prose assumption register, judge budget cap |
| Coverage-only engines | Still forbidden. **DX-64** is the only new `EngineType`, and it is a **security-semantic prior-vs-current contradiction**, not “node type missing.” |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-63** | Cross-engine corroboration scoring | First | DX-51, DX-59 shipped | Precision (stop punishing independent agreement) |
| **DX-64** | Topology security drift vs prior graph | Yes with DX-63 | Prior graph load already ships | **Generative** (run-over-run miss clause) |
| **DX-65** | Path-engine impact witness on the gate | After DX-63 | DX-63, DX-26 shipped | Precision (positive term for consequence size) |
| **DX-66** | `NotVerifiable` assumptions as held-check asks | Yes with DX-63 | DX-61, DX-52 shipped | Adoption (second-pass numerator) |
| **DX-67** | Gate vs human novelty calibration | Yes with DX-63 | DX-13, DX-23, DX-58 shipped | Measurement (feeds DX-21 spend) |
| **DX-68** | IE-12 exception expiry into `open-commitment` | Yes with DX-63 | DX-05 shipped | **Generative** (reuse, no new engine) |

**Start DX-63, DX-64, DX-66, DX-67, and DX-68 now** (independent except DX-65). **Start DX-65 only after DX-63 has merged** — both edit `DeterministicInsightDensityGate.Score`.

**Do not start from this document:** live extractor-as-default (product/GTM), fake named-model frontier transcripts, Graph-RAG buyer claims (ADR 0057 / **TB-883**), `EnableProseAssumptionExtraction` default-on, raising `MaxJudgedFindingsPerSnapshot` above 40, `portfolio-shared-topology` default-on, SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType`, coverage engines parked on **G-REAL-06**, a “Decision-grade for N consecutive runs” engine (forbidden by DX-58 — that duplicates `open-commitment` / `portfolio-recurrence`), a second fusion engine (DX-51 already joins Decision-grade preferred rows that share `RelatedNodeIds`).

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). Effectful engines use `IScopeContextProvider`.
- **New finding engine checklist** — **only DX-64** may add an engine (catalog map + DI + `FINDING_ENGINE_OUTPUT_REFERENCE.md` row + tests). All other prompts in this set must not.
- Payload DTOs live in `ArchLucid.Contracts/Findings/Payloads/` (prefer Contracts + `FindingPayloadRegistry`). There is **no** `ArchLucid.Decisioning.Findings.Payloads` namespace.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless the prompt says the wire schema changes. If it does, follow [`../library/OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md).
- SQL: numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus rollback under `Migrations/Rollback/` when a peer exists.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- R5: missing properties / missing inventory / missing prior graph → no finding (or explicit `NotVerifiable` / held-check), never invent a resource.
- Do not add engines that only emit “node type X is missing from GraphSnapshot.”
- Do not change `DeterministicInsightDensityGate` demotion **predicate** (DX-01 already shipped). **DX-63** and **DX-65** may change **score terms** only. `DemotionThreshold` stays **65**.
- Do not auto-Promote from `DidNotThinkOfThat`. Do not write novelty rates into buyer-polished copy or the golden distribution markdown.
- Golden cases: start after **`case-63`**. Read `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` at the start of any golden prompt.
- Do not turn `EnableProseAssumptionExtraction` **on by default**. DX-57 already made ranking priors and the insight generator effective-on in Real mode — do not undo that.

---

# DX-63 — Cross-engine corroboration scoring

**Closes:** Strategy Workstream 2 remainder after DX-51. `DecisionGradeFusionApplicator` already **joins** Decision-grade preferred-engine rows that share a `RelatedNodeIds` node into a new `decision-grade-fusion` finding and **leaves constituents on the package**. `DeterministicInsightDensityGate` still applies Jaccard duplication (−15/−30) whenever `InsightDensityTextSimilarity.MaxPeerSimilarity` is high — **including when the similar peer is a different `EngineType`**. Independent information sources agreeing is the density win; the gate currently **punishes** it. That is backwards.
**Depends on:** DX-51 shipped (do not add a second fusion engine); DX-59 shipped (`DemotionThreshold` is 65)
**Branch suggestion:** `cursor/dx-63-cross-engine-corroboration`

### Design intent

Score terms only. No new `EngineType`. No OpenAPI unless you cannot avoid putting EngineType on a public DTO (you should not — keep it on the gate candidate). Skip the duplication penalty when the max-similarity peer has a **different** non-empty `EngineType`. Add a **+10** corroboration bonus (cap 100) when a preferred-engine candidate shares at least one `RelatedNodeIds` node with a **different** `EngineType` peer. Same-engine near-duplicates still penalize (two `topology-coverage` rows saying the same thing are still duplication). Do **not** delete or merge rows — fusion already creates the compound claim. Do **not** change the demotion predicate.

`InsightDensityGateCandidate` today has `CandidateKey`, `Message`, `EvidenceRefs`, `Severity`, `Category`, `IsAgentArchitectureFinding` — **not** `EngineType` or `RelatedNodeIds`. `FromFinding` drops `finding.EngineType`. That is why the gate cannot tell engines apart.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: stop DeterministicInsightDensityGate from applying Jaccard duplication penalties across distinct EngineType values, and add a +10 corroboration bonus when a preferred-engine finding shares a RelatedNodeIds node with a different EngineType peer. Do not add EngineType. Do not change the demotion predicate. Do not change DemotionThreshold (65). Do not merge or delete constituent findings (DX-51 fusion already joins them).

Why: Fusion creates a compound row but leaves constituents. Those constituents still Jaccard-match and eat −15/−30, so independent agreement looks worse than a singleton coverage row. A chat session does not run two typed engines; cross-engine agreement is structurally novel.

Read first:
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs (high-duplication / moderate-duplication)
- ArchLucid.Core/Findings/InsightDensityTextSimilarity.cs
- ArchLucid.Core/Findings/InsightDensityGateCandidate.cs (FromFinding does not copy EngineType or RelatedNodeIds)
- ArchLucid.Core/Findings/InsightDensityPreferredEngineTypes.cs
- ArchLucid.Core/Findings/InsightDensityDemotionPredicate.cs (do not edit the boolean)
- ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs
- ArchLucid.Decisioning/Findings/DecisionGradeFusionApplicator.cs (do not duplicate this join)
- ArchLucid.Decisioning.Tests/Findings/InsightDensityEngineDistributionCalculatorTests.cs (PenaltyReasons tokens)

Work:

1. Extend InsightDensityGateCandidate (own properties, default empty):
   - EngineType (string, empty when unknown)
   - RelatedNodeIds (IReadOnlyList<string>, never null)
   FromFinding: copy finding.EngineType (trim; null → empty) and finding.RelatedNodeIds (skip whitespace, distinct OrdinalIgnoreCase). FromArchitectureFinding: EngineType empty, RelatedNodeIds empty (agent rows are not typed engines). Update every constructor call site the compiler flags — do not leave a second constructor overload that drops the new fields.

2. Duplication: after MaxPeerSimilarity, identify the peer that produced that similarity (extend InsightDensityTextSimilarity with MaxPeerSimilarityWithPeer that returns (double similarity, InsightDensityGateCandidate? peer) in its own file next to the existing helper, or return the peer from the existing method — do not fork Jaccard). Apply high/moderate duplication penalties ONLY when the peer is null OR peer.EngineType is empty OR peer.EngineType equals the candidate EngineType (OrdinalIgnoreCase). Different non-empty EngineType → skip both duplication penalties (do not add high-duplication / moderate-duplication to PenaltyReasons).

3. Corroboration bonus: if InsightDensityPreferredEngineTypes.IsPreferred(candidate.EngineType) AND candidate.RelatedNodeIds has at least one non-empty id that appears on any snapshot peer whose EngineType is non-empty and not equal (OrdinalIgnoreCase) to the candidate, score = Min(100, score + 10) and PenaltyReasons.Add("cross-engine-corroboration"). Two coverage engines sharing a node with neither preferred → no bonus. Preferred + coverage sharing a node → bonus (the preferred row is the one being scored). Empty RelatedNodeIds → no bonus.

4. Tests (concrete types, null checks, no ConfigureAwait(false)):
   - Two identity-blast-radius messages at Jaccard ≥ 0.85 → still high-duplication, no corroboration
   - identity-blast-radius + segmentation-semantics, Jaccard ≥ 0.85, disjoint RelatedNodeIds → no duplication penalty, no corroboration
   - identity-blast-radius + segmentation-semantics, Jaccard low, shared RelatedNodeIds node → +10, PenaltyReasons contains cross-engine-corroboration, score capped at 100
   - topology-coverage + security-coverage sharing a node → no corroboration (neither preferred)
   - identity-blast-radius + topology-coverage sharing a node → identity-blast-radius gets +10
   - Existing demotion tests still pass (predicate helper untouched; DemotionThreshold still 65)
   - FromFinding copies EngineType and RelatedNodeIds; FromArchitectureFinding leaves them empty

5. Distribution calculator: if it constructs InsightDensityGateCandidate by hand, pass EngineType from the finding. Do not add a corroboration column to the markdown in this prompt (DX-58 vocabulary stays closed unless you also update InsightDensityEngineDistributionRow + header tests — skip the column; PenaltyReasons telemetry for cross-engine-corroboration can wait for a follow-on).

6. claimBoundary: scoring change, not a named-model beat, not SOC 2 Type II, not a claim that two engines prove a breach.

Do not: add EngineType catalog rows; change InsightDensityDemotionPredicate; delete constituents; bonus same-EngineType duplicates; raise DemotionThreshold; push master; regenerate OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'
Test:
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~DeterministicInsightDensityGate|FullyQualifiedName~InsightDensityGateCandidate|FullyQualifiedName~InsightDensityTextSimilarity"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityEngineDistribution"

Done when: distinct-engine Jaccard no longer penalizes; preferred-engine rows that share a node with another engine gain +10 capped at 100; same-engine duplicates still penalize; demotion predicate and threshold 65 unchanged.
```

---

# DX-64 — Topology security drift vs prior graph

**Closes:** Strategy Workstream 1 “new information sources / run-over-run miss.” `TopologyCrossRunDiffFindingEngine` (`topology-cross-run-diff`) already loads the prior sealed graph via `PriorReviewSnapshots.PriorGraphSnapshotId` and `CrossRunDiffFindingPriorGuard`, but it only diffs **topology category sets** (`GraphSnapshotTopologyDiffAnalyzer.AnalyzeCategoryDelta`) — “categories expanded/regressed.” That is coverage-shaped and is **not** on `InsightDensityPreferredEngineTypes`. A frontier chat session has no memory of the previous sealed snapshot; “public inbound appeared,” “geo-replica removed,” “NSG admin inbound widened,” or “write/admin role edge added” is the miss clause. DX-58 forbade a “Decision-grade for N consecutive **findings**” engine (that duplicates `open-commitment` / `portfolio-recurrence`). This prompt diffs the **graph**, not finding identity.
**Depends on:** Prior graph load already ships (`FindingAnalysisContextBuilder.PriorResolve`, `IGraphSnapshotRepository`)
**Branch suggestion:** `cursor/dx-64-topology-security-drift`

### Design intent

One new `EngineType`: **`topology-security-drift`**. Contradiction, not coverage. Closed delta vocabulary — do **not** emit “node type X is absent.” Reuse the prior-graph load + pin-fingerprint guards from `TopologyCrossRunDiffFindingEngine`; do **not** replace that engine. Fail closed when prior graph is missing (`HeldCheckInputCode.PriorRunSnapshot`). Simulator: no prior → empty, no throw. Add to preferred-engine list. Golden after `case-63`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add EngineType topology-security-drift that emits Decision-grade findings when the current GraphSnapshot shows a closed set of security-semantic deltas versus the prior committed graph on the same architecture. Do not replace topology-cross-run-diff. Do not emit category-presence findings. Do not change DeterministicInsightDensityGate. Do not add a 5th AgentType.

Why: topology-cross-run-diff only compares topology category strings. Reviewers miss “this SQL lost its geo-replica” and “this NSG now permits 3389 from Internet” because those are property/edge deltas, not category add/remove. A point-in-time frontier session cannot see the previous sealed graph.

Read first:
- ArchLucid.Decisioning/Services/TopologyCrossRunDiffFindingEngine.cs (load + guard pattern — copy, do not edit unless you must share a helper)
- ArchLucid.Decisioning/Findings/CrossRunDiffFindingPriorGuard.cs
- ArchLucid.Decisioning/Analysis/GraphSnapshotTopologyDiffAnalyzer.cs (category-only — do not overload it with security deltas)
- ArchLucid.Application/Runs/Orchestration/Pipeline/FindingAnalysisContextBuilder.PriorResolve.cs
- ArchLucid.Contracts/Architecture/PriorReviewSnapshots.cs
- ArchLucid.Contracts/Findings/HeldCheckInputCode.cs (PriorRunSnapshot already exists)
- ArchLucid.Decisioning/Services/IdentityBlastRadiusFindingEngine.cs (IdentityPathAnalyzer / role-edge shape)
- ArchLucid.Decisioning/Services/SegmentationSemanticsFindingEngine.cs (admin inbound ports)
- ArchLucid.Decisioning/Services/DrRpoTopologyFindingEngine.cs (replica/failover properties)
- ArchLucid.Core/Findings/InsightDensityPreferredEngineTypes.cs
- ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs (52 entries today — you will add one)
- docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md
- docs/quality/HOLD_NO_COVERAGE_ENGINES.md (this prompt is the authorized exception)
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (currently 63)

Work:

1. New analyzer TopologySecurityDeltaAnalyzer (own file under Decisioning/Analysis/): given (current, prior) GraphSnapshot, return IReadOnlyList<TopologySecurityDelta> (own record file). Closed TopologySecurityDeltaKind enum (own file): PublicInboundAdded, ReplicaOrFailoverRemoved, AdminInboundWidened, WriteAdminRoleAdded. Exhaustive switch in any mapper. Matching rules (all fail closed — missing property → skip that node, do not invent):
   - PublicInboundAdded: current node has an internet-facing inbound/public-network property that prior same NodeId did not (reuse the property keys segmentation-semantics / external-exposure already treat as public — do not invent a third vocabulary)
   - ReplicaOrFailoverRemoved: prior node had replica/geo/failover property that current same NodeId no longer has (reuse dr-rpo-topology property keys)
   - AdminInboundWidened: current NSG/NetworkPolicy/security-group rule set newly permits an admin port (22, 3389, 1433, 3306, 5432) from Internet relative to prior rules on the same node — reuse SegmentationSemantics port list
   - WriteAdminRoleAdded: a write/admin role edge (IdentityBlastRadiusRoleNames.IsWriteAdminRole) exists on current and did not exist on prior between the same actor and target NodeIds
   Node identity: same NodeId OrdinalIgnoreCase. New NodeId that looks public is PublicInboundAdded only when you can cite a current property; do not emit “node appeared” as its own kind.

2. Engine TopologySecurityDriftFindingEngine : IFindingEngine, EngineType "topology-security-drift", Category Security. AnalyzeAsync: copy TopologyCrossRunDiffFindingEngine's TryLoadPriorGraphAsync + CrossRunDiffFindingPriorGuard sequence. If prior graph id missing → HeldCheckLedger.TryRecord(PriorRunSnapshot) and return []. If prior graph load fails the existing pin-fingerprint guards, propagate the same throw/fail-closed those guards already use (do not invent a new pin rule). For each delta, one Finding: FindingType TopologySecurityDriftFinding, payload TopologySecurityDriftFindingPayload (Contracts/Findings/Payloads/, register in FindingPayloadRegistry) with Kind, NodeId, PriorRunId, PriorGraphSnapshotId. EvidenceRefs via FindingGraphEvidenceRefs.CollectFromNodeIds on the current graph for the cited nodes (empty refs if the bag has no ARM/ARN — do not synthesize graph-node: labels). RelatedNodeIds = cited nodes. Title/rationale name the kind and the node label, not “therefore PCI is breached.”

3. Cap: Max 10 drift findings per snapshot (constant on the engine, XML-comment). Prefer Error severity for ReplicaOrFailoverRemoved / AdminInboundWidened / WriteAdminRoleAdded; Warning for PublicInboundAdded. Do not emit Info category-expansion rows (that is topology-cross-run-diff).

4. Register: BuiltInFindingEngineTypeCatalog + ServiceCollectionExtensions.Decisioning + FINDING_ENGINE_OUTPUT_REFERENCE.md row. Add "topology-security-drift" to InsightDensityPreferredEngineTypes. Golden harness: register the engine; bump LatestGoldenCorpusCaseNumber.

5. Golden: case-64 (or Latest+1 if another prompt landed first — read the constant). Two graph snapshots in the fixture: prior has a replica (or tight NSG / no write-admin edge); current removes the replica (or widens 3389 / adds Contributor). Overlay edges/properties the parser cannot emit, same discipline as DX-48. Expected: ≥1 topology-security-drift finding. case-01..current still pass. Do not make topology-cross-run-diff tests fail.

6. Tests:
   - No PriorGraphSnapshotId → empty findings, HeldCheck PriorRunSnapshot recorded
   - Identical graphs → empty
   - Replica property present on prior, absent on current, same NodeId → one ReplicaOrFailoverRemoved
   - Admin inbound newly open from Internet → one AdminInboundWidened
   - Write-admin role edge added → one WriteAdminRoleAdded
   - Category-only add (new topology category, no security property) → empty from THIS engine; topology-cross-run-diff still emits its Info row in its own tests
   - BuiltInFindingEngineTypeCatalogTests still pass (count +1)

7. claimBoundary: diffs two customer-sealed graphs the tenant already stored; not live cloud polling; not a named-model beat; not SOC 2 Type II.

Do not: delete or rewrite topology-cross-run-diff category behavior; emit “node type missing”; invent ARM ids; add AgentType; default EnableProseAssumptionExtraction on; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~TopologySecurityDrift|FullyQualifiedName~TopologyCrossRunDiff|FullyQualifiedName~GoldenCorpus|FullyQualifiedName~BuiltInFindingEngineTypeCatalog|FullyQualifiedName~InsightDensityPreferredEngineTypes"

Done when: a prior-vs-current replica removal (or equivalent closed kind) emits topology-security-drift; missing prior is a held-check not a finding; topology-cross-run-diff category tests still pass; preferred list includes the new id; golden case exists after case-63.
```

---

# DX-65 — Path-engine impact witness on the gate

**Closes:** Strategy “consequence size” hole after DX-26. `IdentityBlastRadiusPath.HopCount` and `IdentityBlastRadiusCounterfactualFormatter` already write a counterfactual sentence into `Trace.Notes`. The gate never reads hop count: positive terms are only `falsifiability-signal` (+10) and `severity-calibration` (+5). A 1-hop MI-to-vault path and a 6-hop path to a PCI datastore score the same before evidence penalties. That under-states decision-changing path engines relative to coverage rows after DX-59 (threshold 65).
**Depends on:** DX-63 merged (both edit `DeterministicInsightDensityGate.Score` — do not parallel); DX-26 shipped
**Branch suggestion:** `cursor/dx-65-path-impact-witness`

### Design intent

Score term only. No new engine. Copy hop count onto `InsightDensityGateCandidate` from path-engine findings that already computed it — **do not** infer hops from `RelatedNodeIds.Count` (that is node cardinality, not path length). +5 when `ImpactHopCount >= 2` and the candidate already has concrete evidence; +10 when `ImpactHopCount >= 4` and concrete evidence. Never bonus when evidence is missing (R5 / DX-01: do not keep generic rows alive with a hop story). Cap 100. PenaltyReasons token `impact-witness`. Do not change the demotion predicate.

### Prompt (copy below)

```text
OWNER SEQUENCE — stop if DX-63 has not merged to master (InsightDensityGateCandidate must already carry EngineType + RelatedNodeIds). You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add an impact-witness positive term to DeterministicInsightDensityGate from path-engine hop counts the engines already compute. Do not add EngineType. Do not change the demotion predicate. Do not change DemotionThreshold. Do not infer hops from RelatedNodeIds.Count.

Why: DX-26 put the counterfactual in Trace.Notes for operators. The gate still treats a 1-hop and a 6-hop identity-blast-radius row as equal. After DX-59, that wasted signal is the difference between staying Decision-grade and looking like coverage.

Read first:
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs (post-DX-63 Score)
- ArchLucid.Core/Findings/InsightDensityGateCandidate.cs
- ArchLucid.Decisioning/Analysis/IdentityBlastRadiusPath.cs (HopCount)
- ArchLucid.Decisioning/Findings/IdentityBlastRadiusCounterfactualFormatter.cs
- ArchLucid.Decisioning/Findings/FindingCounterfactualNotes.cs
- ArchLucid.Decisioning/Services/IdentityBlastRadiusFindingEngine.cs (BuildFinding)
- DataFlowTrustBoundary / SegmentationSemantics engines — only copy a hop count if they already store an int path length on the payload or path record. If they do not, skip them in this prompt (do not invent hop math).
- Finding payloads for identity-blast-radius (Contracts/Findings/Payloads/)

Work:

1. InsightDensityGateCandidate: add int? ImpactHopCount (null = unknown). FromFinding: populate when EngineType is identity-blast-radius (and any other path engine you confirmed has a real hop int) by reading the payload hop field OR parsing FindingCounterfactualNotes only if that parser already returns hop count — prefer the payload int. Do not regex the title. Null when unknown.

2. Gate: after corroboration (DX-63), if hasConcreteEvidence && ImpactHopCount is int hops:
   - hops >= 4 → score = Min(100, score + 10), PenaltyReasons.Add("impact-witness")
   - hops >= 2 → score = Min(100, score + 5), PenaltyReasons.Add("impact-witness")
   - hops < 2 → no bonus
   If !hasConcreteEvidence, do not bonus even when hops is large.

3. Do not add ImpactHopCount to Finding wire schema if the payload already has it. No OpenAPI unless you truly must add a Finding-level field — prefer payload + candidate only.

4. Tests:
   - identity-blast-radius, product-shaped ARM EvidenceRef, hops 1 → no impact-witness
   - same, hops 2 → +5, token present
   - same, hops 4 → +10, score capped at 100
   - hops 6, empty EvidenceRefs → no impact-witness (still no-concrete-evidence)
   - topology-coverage with RelatedNodeIds.Count == 6 → ImpactHopCount null, no bonus
   - DX-63 corroboration tests still pass (re-run the Core gate filter)

5. claimBoundary: hop count is graph-derived path length already computed by the engine; not blast-radius in the attacker sense beyond what identity-blast-radius already claims; not a named-model beat.

Do not: change InsightDensityDemotionPredicate; bonus missing evidence; parse RelatedNodeIds.Count as hops; add EngineType; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'
Test:
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~DeterministicInsightDensityGate|FullyQualifiedName~InsightDensityGateCandidate"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~IdentityBlastRadius"

Done when: hop >= 2 with concrete evidence raises the score; hop without evidence does not; coverage engines cannot fake hops via RelatedNodeIds; DX-63 behavior preserved.
```

---

# DX-66 — `NotVerifiable` assumptions as held-check asks

**Closes:** Strategy Workstream 1 “extractors as first-review default” remainder after DX-61 + DX-52 + DX-60. `ProseAssumptionRegisterEntry` already stores `NotVerifiable` when a grounded design-doc claim could not be contradicted because inventory/property was absent (R5). The register is telemetry. DX-52 already ranks `HeldCheckInputCode` (Azure/Aws/GcpInventoryZip, ActorNodes, …) and DX-60 already rebuilds findings after a ZIP ingest. Nothing maps “the design doc said private endpoint” → “upload Azure inventory to verify.” That mapping is adoption, not a coverage engine: it pulls the missing information source so contradiction engines can fire on the second pass.
**Depends on:** DX-61 shipped (register on `InsightDensityCurationSummary`); DX-52 shipped (`HeldCheckInputCode`)
**Branch suggestion:** `cursor/dx-66-notverifiable-held-check-asks`

### Design intent

No new engine. No Decision-grade rows from unmapped prose. Map `NotVerifiable` register entries whose `LogicalPropertyName` is in the existing DX-55 property map onto a `HeldCheckInputCode`. Merge those codes into the existing held-check rollup / “do this next” strip (do not invent a second strip). Cap asks using `MaxProseAssumptionCandidatesPerSnapshot`. Flag stays **off** when extraction is off (empty register → no asks). Do not Promote `NotVerifiable`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: turn DX-61 NotVerifiable prose-assumption register rows into HeldCheckInputCode asks on the existing measurement-floor / do-this-next strip so the operator is told which package to upload to verify the design-doc claim. Do not add EngineType. Do not emit findings from NotVerifiable rows. Do not default EnableProseAssumptionExtraction on. Do not change DeterministicInsightDensityGate.

Why: Extraction already spent Premium tokens (when the flag is on). “Could not verify private-endpoint claim in docs/design.md#L12” without an upload ask wastes the only information source a chat session cannot see.

Read first:
- ArchLucid.Contracts/Findings/ProseAssumptionRegisterEntry.cs
- ArchLucid.Contracts/Findings/ProseAssumptionDisposition.cs
- ArchLucid.Application/Findings/ProseAssumption/ProseAssumptionRegisterBuilder.cs
- ArchLucid.Application/Findings/ProseAssumption/ProseAssumptionContradictionService.cs (logical property map)
- ArchLucid.Contracts/Findings/HeldCheckInputCode.cs
- HeldCheckInputCodeLabels / measurement-floor presenter / RunDetailReviewPackageDoThisNextResolved.tsx
- ArchLucid.Contracts/Findings/InsightDensityCurationSummary.cs
- scripts/ci/check_insight_density_advisory_surfaces.py (keep advisory markers)

Work:

1. Own mapper ProseAssumptionHeldCheckAskMapper (Application or Core — own file): (LogicalPropertyName, Disposition) → HeldCheckInputCode?. Only Disposition.NotVerifiable. Mapped public-network / private-endpoint / SKU-tier properties that DX-55 already treats as inventory-backed → AzureInventoryZip / AwsInventoryZip / GcpInventoryZip using the same cloud the contradiction pass used (if the pass is cloud-agnostic, prefer the HeldCheckInputCode already recorded on the snapshot for inventory; if none, omit rather than guess a cloud). Actor/RBAC-shaped logical properties → ActorNodes or RbacBindings. Unmapped LogicalPropertyName → null (no ask). Exhaustive switch on Disposition; NotVerifiable is the only emitting arm.

2. Merge: when building the held-check rollup / do-this-next list, union mapper results with DX-52 ledger codes. Deduplicate by HeldCheckInputCode. Each ask carries one truncated Statement + EvidenceRef (doc:path#L) as the reason clause so the strip can say “Upload Azure inventory ZIP to verify: ‘must not be public’ (docs/design.md#L12).” Reuse HeldCheckInputCodeLabels nouns. Do not show Contradicted or Consistent rows as asks.

3. UI: one additional sentence on the existing advisory strip, not a second findings table. Keep check_insight_density_advisory_surfaces.py markers. If the strip is server-rendered from InsightDensityCurationSummary, prefer adding a small collection ProseAssumptionHeldCheckAsks on that summary (OpenAPI regen per OPENAPI_CONTRACT_DRIFT.md) over parsing register rows in the SPA.

4. Tests:
   - Flag off / empty register → no asks
   - NotVerifiable + mapped public-network property + no inventory → one Azure/Aws/GcpInventoryZip ask with doc: EvidenceRef
   - Consistent row → no ask
   - Contradicted row → no ask (finding already exists)
   - Unmapped NotVerifiable → no ask
   - Duplicate codes from DX-52 ledger + mapper → one strip row
   - UI/presenter: sentence contains the HeldCheck noun and does not call the row Decision-grade

5. claimBoundary: ask is not a finding; not live polling; not a named-model beat; not SOC 2 Type II. EnableProseAssumptionExtraction remains default false.

Do not: emit Decision-grade from NotVerifiable; guess cloud when none is in scope; default the extraction flag on; add EngineType; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~ProseAssumption"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityMeasurementFloor|FullyQualifiedName~HeldCheck|FullyQualifiedName~ProseAssumption"
cd archlucid-ui && npx vitest run --reporter=dot src/lib/findings src/components/findings 2>/dev/null || npx vitest run --reporter=dot -t "prose assumption|held-check|do this next"

Done when: a NotVerifiable mapped assumption produces one held-check ask naming the upload; unmapped/consistent/contradicted rows do not; DX-52 codes still appear; no new EngineType.
```

---

# DX-67 — Gate vs human novelty calibration

**Closes:** Strategy Workstream 4 “in-product signal feeds generator tuning” after DX-13 + DX-23 + DX-58. `FindingInsightSignalKind.DidNotThinkOfThat` and `EngineInsightNoveltyRateRow` already exist. `InsightDensityEngineDistributionRow` now has penalty counts and scores. Nothing joins **human novelty rate** to **gate median score** per engine, so DX-21 judge-cap priority (`InsightDensityPreferredEngineTypes` + optional `PreferHighNoveltyEngines`) cannot see engines that humans mark novel but the gate scores like coverage (or the reverse). Auto-Promote from `DidNotThinkOfThat` remains forbidden.
**Depends on:** DX-13, DX-23, DX-58 shipped
**Branch suggestion:** `cursor/dx-67-gate-human-calibration`

### Design intent

Measurement instrument first. Internal markdown under `docs/quality/` (same class as `insight-density-engine-distribution.md` / novelty-rate artifacts). Join per-engine: Decision-grade count, median gate score, `DidNotThinkOfThat` rate, residual (novelty rate rank minus score rank). Sample floor: omit rate when Decision-grade count &lt; **5**. Do **not** write rates into buyer-polished copy or the golden distribution markdown. Optional host flag `PreferHighHumanAcceptResidual` **default false** — when true, `InsightDensityJudgeCandidateSelector` may use residual as a tertiary sort after existing preferred-engine + novelty sorts. Do not change host JSON defaults for ranking priors (DX-57).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: publish an internal per-engine calibration table that joins DeterministicInsightDensityGate median scores to DidNotThinkOfThat novelty rates, and optionally (default off) use the residual as a tertiary judge-cap sort. Do not add EngineType. Do not auto-Promote from DidNotThinkOfThat. Do not write novelty rates into buyer-polished copy or docs/quality/insight-density-engine-distribution.md. Do not change DemotionThreshold.

Why: DX-21 spends the (now DX-62-shrunken) Premium cap on a static preferred list. Humans already mark “I did not think of that” per finding. Without a residual, engines that are novel-but-low-scoring never get judge slots, and high-scoring coverage that humans never mark novel still can.

Read first:
- ArchLucid.Contracts/Findings/EngineInsightNoveltyRateRow.cs
- ArchLucid.Contracts/Findings/FindingInsightSignalKind.cs
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionRow.cs
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionCalculator.cs
- ArchLucid.AgentRuntime/InsightDensityJudgeCandidateSelector.cs
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs (PreferHighNoveltyEngines — do not flip the host default)
- scripts/ci/insight_density_frontier_delta.py (instrument pattern, not transcripts)
- docs/quality/insight-density-engine-distribution.md (do not add novelty columns here)

Work:

1. Own types InsightDensityGateHumanCalibrationRow / Calculator / Markdown (Decisioning/Findings/, each own file). Per EngineType:
   - FindingCount, MedianScore (reuse distribution calculator; do not fork scoring)
   - DecisionGradeCount, DidNotThinkOfThatCount, NoveltyRate (null when DecisionGradeCount < 5)
   - Residual: if NoveltyRate is null or MedianScore has no row, Residual is null; else NoveltyRate percentile rank among engines with a rate minus MedianScore percentile rank among engines with a median (higher residual = more novel than the gate score suggests)
   Do not call LLMs.

2. Markdown writer → docs/quality/insight-density-gate-human-calibration.md. claimBoundary: internal engineering; rates are human marks on Decision-grade rows, not a named-model beat; sample floor 5; not SOC 2 Type II. Record-mode test following InsightDensityEngineDistributionReportTests. Empty novelty (no signals in golden) is valid — table still lists medians, Residual null.

3. Golden harness: do not fabricate DidNotThinkOfThat marks. If the golden corpus has zero signals, unit tests must inject a fake in-memory row set rather than polluting expected-findings JSON.

4. Optional sort: InsightDensityGateOptions.PreferHighHumanAcceptResidual default false. XML comment + CONFIGURATION_REFERENCE.md row: tertiary judge sort when true AND PreferHighNoveltyEngines is already effective; never overrides preferred-engine membership. InsightDensityJudgeCandidateSelector: when the flag is true and a residual map is provided, sort remaining candidates by residual descending then existing order. When the map is null/empty, behave as today. Do not default the flag on in host JSON or Real-mode resolver (unlike DX-57).

5. Tests:
   - Sample floor: 4 Decision-grade + 4 DidNotThinkOfThat → NoveltyRate null, Residual null
   - Engine A median 60 rate 0.8 vs engine B median 85 rate 0.1 → A residual > B residual
   - PreferHighHumanAcceptResidual false → selector order unchanged
   - Flag true + residual map → under-scored high-novelty engine judged before over-scored low-novelty engine among non-preferred leftovers (do not reorder preferred-list membership)
   - Markdown contains claimBoundary substring; distribution.md header tests still pass (untouched)

6. Do not add Residual to Finding or OpenAPI unless the selector cannot take an in-memory map — prefer the map the judge already uses for novelty rates.

Do not: auto-Promote; write rates into SPA buyer copy; default the new flag on; add EngineType; push master; invent golden human marks.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityGateHumanCalibration|FullyQualifiedName~InsightDensityEngineDistribution"
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~InsightDensityJudgeCandidateSelector|FullyQualifiedName~PremiumInsightDensityLlmJudge"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~InsightDensityGateOptions"

Done when: the calibration markdown exists with a sample floor; Residual is null below 5 Decision-grade; the judge sort flag is default false and only reorders when on; distribution.md and buyer copy are untouched.
```

---

# DX-68 — IE-12 operational exception expiry into `open-commitment`

**Closes:** Strategy Workstream 1D “governance trail vs current graph” remainder after DX-05. `OpenCommitmentFindingEngine` already emits `ExpiredWaiver` / `ExpiringWaiver` from **`IRiskExceptionService`** (`RiskExceptionRecord` — finding-desk risk waivers). IE-12 **`OperationalSecurityExceptionRecord`** (`IOperationalSecurityExceptionRepository`, statuses Active / Expired / Revoked, `FindingId`, `CloudResourceId`, `ExpirationUtc`) is a **different table**. `NoOpOperationalSecurityExceptionRepository` is registered in in-memory composition. Decisioning has **zero** references to operational exceptions. Expired/expiring IE-12 exceptions that still protect a live finding (or a live graph node) are a time-based contradiction a chat session cannot produce. Secrets-lifecycle expiry is **inventory rotation**, not this table. Do **not** add a new `EngineType` — reuse `open-commitment` signal kinds.
**Depends on:** DX-05 shipped (`open-commitment` + `StillOpenOnCurrentGraph`)
**Branch suggestion:** `cursor/dx-68-operational-exception-open-commitment`

### Design intent

Reuse. Inject `IOperationalSecurityExceptionRepository` (or the existing `IOperationalSecurityExceptionService`) into `OpenCommitmentFindingEngine`. Map Active+within `WaiverExpiryWarningDays` of `ExpirationUtc` → `ExpiringWaiver`; Expired (or Active with `ExpirationUtc` in the past) → `ExpiredWaiver` when the source finding is still on the current snapshot **or** `CloudResourceId` matches a current graph node. Skip `Revoked`. Skip rows with neither FindingId nor CloudResourceId (R5). EvidenceRefs: existing open-commitment graph cites plus a package-resolvable exception id if one already exists — do not invent `graph-node:` labels. NoOp repository → no extra signals (in-memory / Simulator stay quiet). Do not double-emit when the same FindingId already produced a RiskException waiver signal (distinct by exception table + id).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: feed IE-12 OperationalSecurityException records into OpenCommitmentFindingEngine as ExpiringWaiver / ExpiredWaiver signals, without a new EngineType. Do not change DeterministicInsightDensityGate. Do not re-read RiskException logic except to de-dupe FindingId collisions. Do not treat secrets-lifecycle inventory expiry as this table.

Why: open-commitment already joins governance risk waivers to current topology (DX-05). Operational security exceptions are stored, swept, and audited (OperationalSecurityException.Expired) but never become findings. That is a wasted information source.

Read first:
- ArchLucid.Application/Findings/OpenCommitmentFindingEngine.cs
- ArchLucid.Application.Tests/Findings/OpenCommitmentFindingEngineTests.cs
- OpenCommitmentSignalKind (ExpiredWaiver / ExpiringWaiver)
- ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IOperationalSecurityExceptionRepository.cs
- ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/OperationalSecurityExceptionRecord.cs
- ArchLucid.Core/InfraEvidence/OperationalSecurityExceptionStatus.cs
- ArchLucid.Persistence/InfraEvidence/NoOpOperationalSecurityExceptionRepository.cs
- IOperationalSecurityExceptionService.SweepExpiredAsync (do not call Sweep from the engine — read current rows only; expiry sweep is a different job)
- OpenCommitmentOptions.WaiverExpiryWarningDays
- FINDING_ENGINE_OUTPUT_REFERENCE.md open-commitment row (extend the sentence: also IE-12 operational exceptions)

Work:

1. Inject IOperationalSecurityExceptionRepository into OpenCommitmentFindingEngine (keep IRiskExceptionService). ListByTenantAsync (or the narrowest existing list that is tenant-scoped via IScopeContextProvider). Ignore Revoked. For each remaining row:
   - If ExpirationUtc <= utcNow OR Status == Expired → ExpiredWaiver
   - Else if ExpirationUtc <= utcNow + WaiverExpiryWarningDays → ExpiringWaiver
   - Else skip
   Require FindingId still present on the current findings snapshot OR CloudResourceId matching a current graph node id/property (reuse the DX-05 topology match helper if one exists). Neither → skip (R5).

2. De-dupe: if a RiskException signal already exists for the same FindingId and the same Expired/Expiring kind, do not emit a second open-commitment finding. Distinct operational ExceptionId vs risk waiver id may both exist for different findings.

3. Trace notes: include exception id and ExpirationUtc. EvidenceRefs: CollectFromNodeIds for matched topology; do not add synthetic graph-node: for the exception row. Title may say “operational security exception” so operators can tell it from a finding-desk risk waiver.

4. Tests:
   - NoOp repository → existing open-commitment tests unchanged (no extra findings)
   - Active exception, ExpirationUtc in 3 days, warning days 7, FindingId still on snapshot → one ExpiringWaiver
   - Expired status, FindingId still on snapshot → one ExpiredWaiver
   - Revoked → none
   - Active, expiry in 3 days, FindingId not on snapshot and CloudResourceId not on graph → none
   - RiskException already emitted ExpiringWaiver for that FindingId → no second finding
   - Simulator/in-memory composition still resolves (NoOp)

5. Docs: FINDING_ENGINE_OUTPUT_REFERENCE.md open-commitment cell mentions IE-12 OperationalSecurityException alongside risk waivers. claimBoundary: not live cloud polling; not secrets-lifecycle inventory rotation; not a named-model beat; not SOC 2 Type II.

6. No new EngineType. No preferred-list change (open-commitment is already preferred). No golden case required unless you can pin an exception fixture without a new catalog id — prefer unit tests.

Do not: add EngineType; call SweepExpiredAsync from AnalyzeAsync; invent findings for revoked rows; default EnableProseAssumptionExtraction on; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~OpenCommitmentFindingEngine"

Done when: an expiring IE-12 exception attached to a still-present finding emits open-commitment ExpiringWaiver; NoOp/revoked/unmatched rows stay silent; risk-waiver tests still pass; catalog engine count unchanged.
```

---

## Held (do not duplicate)

**DX-57** already flipped Real-mode ranking priors — do not re-open host JSON defaults. **DX-59** already raised `DemotionThreshold` to 65 — do not retune it here. **DX-51** already fuses Decision-grade preferred rows that share a node — DX-63 must not add a second fusion engine. **DX-05** already joins risk waivers via `IRiskExceptionService` — DX-68 is the IE-12 table only. **`topology-cross-run-diff`** already diffs category sets — DX-64 must not re-emit those Info rows.

Live frontier **pilot-pending** captures need owner **G-REAL-06** runs. Graph-RAG buyer claims need ADR 0057 owner override + **TB-883** ablation. `EnableProseAssumptionExtraction` default-on stays owner-gated.

GTM cohorts **M-90 / M-44 / M-91 / M-92**, SOC 2 CPA (**G-REAL-05**), and third-party pen test (**G-ASSURANCE-02**) stay off the engineering batch list.

Coverage-shaped engines (observability completeness, capacity planning, IAM depth as node-exists) remain held until **G-REAL-06**.

Do not add a “Decision-grade for N consecutive runs” engine (DX-58 hold). Do not add a citation pass that stuffs synthetic `graph-node:` labels onto coverage engines (DX-50 / DX-58 hold).

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- DX-01–DX-16: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- DX-17–DX-28: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)
- DX-29–DX-35: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md)
- DX-36–DX-41: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md)
- DX-42–DX-46: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md)
- DX-47–DX-50: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md)
- DX-51–DX-56: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md)
- DX-58–DX-62: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
- Miss clause: [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)

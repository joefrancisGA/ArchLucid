> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-68**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) (**DX-36–DX-41** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) (**DX-42–DX-46** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md) (**DX-47–DX-50** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md) (**DX-51–DX-56** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md) (**DX-58–DX-62** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md) (**DX-63–DX-68** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-69–DX-72)

**Created:** 2026-09-08 · **Status:** **DX-69–DX-72 shipped / implemented (`#2447`) — do not re-run.** **DX-73–DX-76 shipped (`#2530`) — do not re-run.** See [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) for owner-gated next levers.

DX-01–DX-50 closed engine, ingest, and citation holes. DX-51–DX-62 added fusion, held-checks, Real-mode ranking, threshold **65**, and judge budget. **DX-63–DX-68** added corroboration scoring, `topology-security-drift`, hop-count impact witness, `NotVerifiable` held-check asks, gate-vs-human calibration, and IE-12 exceptions into `open-commitment`. Latest golden case after this set is **`case-65`**. Harness registers **42** engines including `topology-security-drift`.

The remaining Cursor-implementable density work is **not** another subtractive flag. The distribution table is a 5-rung ladder (60 / 65 / 75 / 80 / 85) dominated by absence-shaped engines (`topology-coverage` 63 findings, 61 demote). The engines that score 80–85 (`identity-blast-radius`, `data-flow-trust-boundary`, `segmentation-semantics`, inventory contradiction) almost never fire on IaC-only reviews because DX-03 created `Actor` nodes but **not** declaration-derived IAM / data-flow path edges. Meanwhile `HasConcreteEvidenceCitation` still treats `doc:` without a line and `finding:{id}` as enough to **veto all demotion**, and DX-51 fusion **appends** a synthesis row while leaving both constituents Decision-grade.

**This set adds zero `EngineType`.** Do not add a 5th `AgentType`. Do not add a coverage engine.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-62** | Gate, path/contradiction engines, InsightGenerator, ingest, goldens, citation tightening, fusion, held-checks, threshold 65 |
| **DX-63–DX-68** | Corroboration scoring, topology-security-drift, impact witness, NotVerifiable asks, human calibration, IE-12 → open-commitment |
| Coverage-only engines | Still forbidden. This set adds **no** new `EngineType`. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-69** | Declaration-derived IAM + data-flow path edges | First (largest) | DX-03, DX-06, DX-32 shipped | **Generative** (path engines fire on IaC-only reviews) |
| **DX-70** | Tighten remaining evidence-ref vetoes | Yes with DX-69 | DX-50 shipped | Precision (weak `doc:` / `finding:` no longer block demotion) |
| **DX-71** | Fuse-then-demote constituents | Yes with DX-69 | DX-51, DX-63 shipped | Precision (one Decision-grade row per corroborated cluster) |
| **DX-72** | Graduated evidence-quality score terms | After DX-70 | DX-70, DX-65 shipped | Precision (break the 60/65/75/80/85 ladder) |

**Start DX-69, DX-70, and DX-71 now** (independent). **Start DX-72 only after DX-70 has merged** — both edit `HasConcreteEvidenceCitation` consumers in `DeterministicInsightDensityGate.Score`.

**Do not start from this document:** live extractor-as-default (product/GTM), `EnableProseAssumptionExtraction` default-on, fake named-model frontier transcripts, Graph-RAG buyer claims (ADR 0057 / **TB-883**), raising `MaxJudgedFindingsPerSnapshot` above 40, `portfolio-shared-topology` default-on, SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType`, coverage engines parked on **G-REAL-06**, a second fusion engine, a new path/contradiction `EngineType` (DX-06 / DX-32 already exist — this set only **feeds** them).

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). Effectful engines use `IScopeContextProvider`.
- **No new finding engine.** Catalog map, DI, and `FINDING_ENGINE_OUTPUT_REFERENCE.md` stay unchanged except comments that existing path engines now consume declaration path edges.
- Payload DTOs live in `ArchLucid.Contracts/Findings/Payloads/` (prefer Contracts + `FindingPayloadRegistry`). There is **no** `ArchLucid.Decisioning.Findings.Payloads` namespace.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless the prompt says the wire schema changes. If it does, follow [`../library/OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md).
- SQL: numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus rollback under `Migrations/Rollback/` when a peer exists. This set should not need SQL.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- R5: missing properties / missing inventory / missing prior graph → no finding (or explicit `NotVerifiable` / held-check), never invent a resource **or an edge**.
- Do not add engines that only emit “node type X is missing from GraphSnapshot.”
- Do not change `InsightDensityDemotionPredicate` (DX-01 already shipped). `DemotionThreshold` stays **65**.
- Do not auto-Promote from `DidNotThinkOfThat`. Do not write novelty rates into buyer-polished copy or the golden distribution markdown.
- Golden cases: start after **`case-64`**. Read `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` at the start of any golden prompt.
- Do not turn `EnableProseAssumptionExtraction` **on by default**. DX-57 already made ranking priors and the insight generator effective-on in Real mode — do not undo that.

---

# DX-69 — Declaration-derived IAM and data-flow path edges

**Closes:** Strategy Workstream 1B remainder after DX-03. `DeclarationIdentityActorMaterializer` already emits `Actor` + optional `TrustBoundary` from IaC property heuristics, and `DeclarationIdentityEdgeMaterializer` adds `RELATES_TO` from the actor back to its **source** topology node. Path engines (`identity-blast-radius`, `data-flow-trust-boundary`) walk **graph adjacency** from machine/external actors through role-assignment or `CONNECTS_TO` hops. Golden **case-59** / **case-60** still **hand-overlay** those hops because parsers never promote `principalId` / role scope / backend targets, and no materializer writes Actor → RoleAssignment → datastore or Ingress → compute → datastore edges. A chat session with the same ZIP cannot emit those findings.
**Depends on:** DX-03, DX-06, DX-32 shipped
**Branch suggestion:** `cursor/dx-69-declaration-path-edges`

### Design intent

Information-source change. **Zero new `EngineType`.** Do not invent edges: only emit a hop when a **declared** property names both ends (principal, scope/target resource, backend service, depends-on). Prefer matching existing graph node ids / resource ids already on the snapshot. `TopologyRelationshipEdgeInferenceRule` already emits `CONNECTS_TO` when a topology node has `connectedToNodeIds` — reuse that property or write edges in a new materializer; do not fork Jaccard, do not add a 9th coverage engine.

Target shape `IdentityPathAnalyzer` already walks (undirected adjacency + `roleName` on role-assignment topology nodes):

- Machine `Actor` (`kind=Machine`) —`RELATES_TO`→ RoleAssignment `TopologyResource` (`terraformType` contains `role_assignment` **or** `resourceType` contains `roleAssignments`) —`APPLIES_TO`→ data-bearing datastore
- External `Actor` —`CONNECTS_TO`→ compute —`CONNECTS_TO`→ datastore, with no trust-boundary hop, for `DataFlowTrustBoundaryPathAnalyzer`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: materialize declaration-derived IAM path edges and data-flow CONNECTS_TO hops so identity-blast-radius and data-flow-trust-boundary fire on IaC-only graphs without hand-authored overlays. Do not add EngineType. Do not invent edges when principal, scope, or backend is missing. Do not change DeterministicInsightDensityGate or DemotionThreshold.

Why: DX-03 seeds Actor nodes. Path engines stay silent unless Actor → role assignment → datastore (or Ingress → compute → datastore) exists as graph adjacency. case-59/case-60 still overlay those edges in GoldenCorpusIngestDeclarationGraphFactory. That is the unfinished half of Workstream 1B.

Read first:
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityActorMaterializer.cs
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityEdgeMaterializer.cs
- ArchLucid.KnowledgeGraph/Materialization/GraphMaterializationStages.cs (declaration-identity-actors stage)
- ArchLucid.KnowledgeGraph/Builders/DefaultGraphBuilder.cs
- ArchLucid.KnowledgeGraph/Inference/Rules/TopologyRelationshipEdgeInferenceRule.cs (CONNECTS_TO via connectedToNodeIds — reuse, do not duplicate blindly)
- ArchLucid.KnowledgeGraph/WellKnownGraph.cs (GraphEdgeTypes.ConnectsTo / RelatesTo / AppliesTo)
- ArchLucid.KnowledgeGraph/GraphEdgeInferenceSources.cs
- ArchLucid.Decisioning/Analysis/IdentityPathAnalyzer.cs (TryResolveRoleAssignment keys: roleName, terraformType role_assignment, resourceType roleAssignments; machine actors need kind=Machine)
- ArchLucid.Decisioning/Analysis/DataFlowTrustBoundaryPathAnalyzer.cs
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusIngestDeclarationGraphFactory.cs (case-59/60 overlays)
- docs/library/CONTEXT_INGESTION.md § Declaration identity materialization
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (next case is 65 if still 64)

Work:

1. Parser property promotion (own mapper or extend InfrastructureDeclarationSpecialPropertyMapper — do not inline a second copy). When the declaration body has them, write stable keys the path analyzers already read:
   - principalId / principal_id / identity.principalId / tf.principal_id → principalId
   - roleDefinitionName / role_definition_name / tf.role_definition_name / roleName → roleName
   - scope / tf.scope / targetResourceId → declarationTargetResourceId (raw ARM/ARN/GCP id or local declaration name)
   - backend service / ingress backend / function app identity target when present
   Missing property → omit the key. Never guess a principal.

2. New DeclarationIdentityPathEdgeMaterializer (own file next to DeclarationIdentityEdgeMaterializer):
   - IAM: for each RoleAssignment-shaped TopologyResource (same predicates IdentityPathAnalyzer.IsRoleAssignmentTerraformType / IsRoleAssignmentResourceType, or extract shared helpers into KnowledgeGraph so Decisioning does not take a new dependency the other way — prefer duplicating the small predicate in the materializer OR moving both to a shared KnowledgeGraph helper used by Decisioning). If principalId matches a declaration-seeded Actor (or the Actor's source topology resourceId / node id) AND declarationTargetResourceId matches an existing topology node, emit:
     Actor --RELATES_TO--> RoleAssignment --APPLIES_TO--> target
     InferenceSource: new GraphEdgeInferenceSources.DeclarationIdentityIamPath (own const).
   - Data-flow: for each declaration-seeded external Actor whose source is Ingress / LoadBalancer Service / Front Door / APIM, if a declared backend/compute node id exists on the snapshot, emit Actor --CONNECTS_TO--> compute. If that compute has a declared depends-on / connectedTo / datastore target that exists, emit compute --CONNECTS_TO--> datastore. InferenceSource: DeclarationIdentityDataFlowPath.
   - Deduplicate edges (From+To+EdgeType, OrdinalIgnoreCase). Skip if either end is missing. No edges when principal/scope/backend is blank.

3. Wire into GraphMaterializationStages after declaration-identity-actors (actors must exist first). DefaultStageOrder comment + GraphMaterializationStageTests. Do not skip the new stage when canonical Actor objects exist — those are intake actors; declaration IAM edges can still apply. If that skip currently lives on the actor stage, leave it; only skip the path-edge stage when there are zero declaration-seeded actors AND zero role-assignment nodes.

4. Tests (concrete types, null checks, no ConfigureAwait(false)):
   - Materializer: MI actor + role assignment (Contributor) + SQL node with matching principalId and scope → two edges; IdentityPathAnalyzer.Analyze on the resulting GraphSnapshot returns a path with HopCount >= 2
   - Missing principalId → zero IAM edges
   - Scope id not on the snapshot → zero IAM edges (do not invent a datastore)
   - Ingress actor + declared backend compute + SQL connectedTo → DataFlowTrustBoundaryPathAnalyzer returns a path when the actor is external-facing and SQL is data-bearing; a TrustBoundary hop on the path suppresses the finding (existing analyzer behavior)
   - GraphMaterializationStageTests: new stage name in DefaultStageOrder
   - KnowledgeGraph integration: feed CanonicalObjects that mimic parsed TF/ARM (not a hand-built Actor) through DefaultGraphBuilder / the materialization pipeline and assert an Actor plus IAM path edges appear

5. Golden case-65 (or LatestGoldenCorpusCaseNumber+1): parse a real in-batch Terraform or ARM snippet that includes (a) a user-assigned identity or function app with identity, (b) a role assignment Contributor/write on a SQL/storage resource, (c) that datastore marked data-bearing. Run through the same parse path as case-59 BUT do not overlay Actor/edges by hand. Expected findings must include identity-blast-radius. Update GoldenCorpusRegressionTests expected count, DECISIONING_GOLDEN_CORPUS.md, harness engine tests only if registration changes (it should not). Keep case-59/60 as historical overlays — do not delete them in this prompt.

6. Docs: CONTEXT_INGESTION.md — DX-03 seeds actors; DX-69 adds IAM/data-flow path edges from declared principal/scope/backend only. claimBoundary: not a named-model beat, not SOC 2 Type II, not live IAM graph from the customer directory.

Do not: add EngineType; invent edges; change IdentityPathAnalyzer hop semantics except shared predicate extraction; change the demotion predicate; push master; regenerate OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'
Test:
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter "FullyQualifiedName~DeclarationIdentity"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~IdentityPathAnalyzer|FullyQualifiedName~DataFlowTrustBoundary|FullyQualifiedName~GoldenCorpusCase65|FullyQualifiedName~GoldenCorpusRegressionTests"
```

**Done when:** A golden case parsed from IaC (no hand-authored Actor/path overlay) emits `identity-blast-radius`. Missing principal/scope emits nothing. No new `EngineType`.

---

# DX-70 — Tighten remaining evidence-ref demotion vetoes

**Closes:** Strategy Workstream 2 remainder after DX-01 + DX-50. `HasConcreteEvidenceCitation` already rejects label-shaped `graph-node:storage-1` and generic `request` / `critic-checklist`. It still returns true for `doc:` with **any** non-empty suffix (`doc:manifest.json#services` has no line) and for `finding:{guid}` (can be self-referential). `InsightDensityDemotionPredicate` is `(score < 65 || genericWithoutEvidence || falsifiableWithoutEvidence) && !hasConcreteEvidence` — one weak ref blocks **all** demotion. Gate tests still promote `SecretManagementUnderSpecified` on `doc:manifest.json#services`.
**Depends on:** DX-50 shipped
**Branch suggestion:** `cursor/dx-70-evidence-ref-strictness`

### Design intent

Citation helper only. Do **not** change the demotion boolean. `DemotionThreshold` stays 65. After this prompt, `doc:` counts only with a line anchor `#L` + digits (optionally `#L12-18`). `finding:` never counts as concrete for the gate (it may still appear on `EvidenceRefs` for navigation). `policy-rule:`, product-shaped `graph-node:`, ARM, `aws:arn:`, and GCP `projects/` stay as they are.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: stop HasConcreteEvidenceCitation from treating unanchored doc: refs and finding: refs as concrete evidence that vetoes demotion. Do not edit InsightDensityDemotionPredicate. Do not change DemotionThreshold (65). Do not add EngineType.

Why: ADR 0070 demotion is evidence-gated. DX-50 closed label-shaped graph-node: fallbacks. Remaining loose paths (doc: without #L, finding:{id}) still promote generic UnderSpecified titles. That overstates Decision-grade density.

Read first:
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (IsResolvableEvidenceRef)
- ArchLucid.Core/Findings/FindingEvidenceRefs.cs (do not make finding: appenders fail — only citation-for-demotion changes)
- ArchLucid.Core/Findings/InsightDensityDemotionPredicate.cs (do not edit)
- ArchLucid.Core.Tests/Findings/GenericArchitectureAdvicePatternsEvidenceCitationTests.cs
- ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs (doc:manifest.json#services call sites)
- ArchLucid.Core.Tests/Findings/FindingEnforcementTierClassifierTests.cs (same fixture string if it asserts concreteness)

Work:

1. IsResolvableEvidenceRef:
   - doc: → true only when the remainder contains #L followed by at least one digit (allow #L12 or #L12-18). doc:manifest.json, doc:manifest.json#services, doc:architecture.md#overview → false.
   - finding: → always false for concreteness (keep scanning other refs on the same finding).
   - policy-rule:, product-shaped graph-node:, aws:arn:, raw ARM (/subscriptions/ + resourceGroups/), GCP projects/ → unchanged.
   Extract a small helper HasLineAnchoredDocRef(string) in GenericArchitectureAdvicePatterns or FindingEvidenceRefs (own method, commented) so DX-72 can reuse it without copying regex.

2. Update tests that used doc:manifest.json#services as a concrete ref to doc:manifest.json#L10 (or a real line-anchored fixture). Add theory cases:
   - doc:architecture.md#L12 → true
   - doc:architecture.md#L12-18 → true
   - doc:architecture.md → false
   - doc:architecture.md#services → false
   - finding:{any guid} → false even when non-empty
   - policy-rule:cis-az-006 still true
   - graph-node:{ARM id} still true; graph-node:storage-1 still false
   - Gate: SecretManagementUnderSpecified + doc:manifest.json#services now demotes at threshold 65 (score < 65 or falsifiableWithoutEvidence) because hasConcreteEvidence is false
   - Gate: same title + doc:manifest.json#L10 still promotes when other predicates allow

3. Search tests and engines for doc:...#services and finding: as the sole EvidenceRefs used to prove concreteness. Fix call sites this prompt breaks. Do not mass-rewrite honest ARM/ARN citations.

4. claimBoundary: scoring/citation strictness, not a named-model beat, not SOC 2 Type II.

Do not: change InsightDensityDemotionPredicate; raise/lower DemotionThreshold; reject policy-rule; add EngineType; push master; regenerate OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'
Test:
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~HasConcreteEvidenceCitation|FullyQualifiedName~DeterministicInsightDensityGate|FullyQualifiedName~GenericArchitectureAdvicePatternsEvidenceCitation|FullyQualifiedName~FindingEnforcementTierClassifier"
```

**Done when:** Unanchored `doc:` and any `finding:` ref no longer block demotion. Line-anchored `doc:` and product-shaped inventory refs still do. Predicate helper untouched.

---

# DX-71 — Fuse-then-demote corroborated constituents

**Closes:** Strategy Workstream 2/3 packaging after DX-51 + DX-63. `DecisionGradeFusionApplicator` joins preferred-engine Decision-grade rows that share `RelatedNodeIds` and **leaves constituents on the package as Decision-grade**. `DeterministicInsightDensityGate` now **skips** Jaccard duplication across distinct `EngineType` and **adds +10** `cross-engine-corroboration` when a preferred engine shares a node with a different engine. Result: two engine rows plus one fusion row can all be Decision-grade for the same node. ITSM export is Decision-grade only (DX-12) — the desk and ticket queue see triplicates. Corroboration and fusion are the right signals; leaving every constituent Decision-grade is the packaging bug.
**Depends on:** DX-51, DX-63 shipped
**Branch suggestion:** `cursor/dx-71-fuse-then-demote`

### Design intent

Post-gate packaging only. Do **not** re-introduce cross-engine Jaccard penalties (DX-63). Do **not** delete rows. After fusion findings are appended, reclassify **fused constituents** to `ChecklistCoverage` + `DemoteToChecklist` and add a trace note pointing at the fusion finding id. The fusion row stays `DecisionGradeFinding`. Copy the **max** constituent `InsightDensityScore` onto the fusion row (and the corroboration penalty reason if any constituent has it) so the synthesis row is not an unscored 0. Cap fusion count remains `MaxFusionFindings` (5). `MinClusterSize` stays 2.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: after DecisionGradeFusionApplicator creates synthesis rows, demote the fused constituents to ChecklistCoverage so only the fusion row remains Decision-grade for that cluster. Do not delete constituents. Do not re-apply cross-engine Jaccard duplication penalties. Do not add EngineType. Do not change DemotionThreshold or InsightDensityDemotionPredicate.

Why: DX-63 rewards independent agreement; DX-51 appends a compound claim. Both are correct. Keeping constituents Decision-grade inflates the numerator with the same insight three times and emits duplicate ITSM tickets.

Read first:
- ArchLucid.Decisioning/Findings/DecisionGradeFusionApplicator.cs
- ArchLucid.Decisioning/Services/Findings/FindingsDecisionGradeFusionStage.cs
- ArchLucid.Decisioning.Tests/Findings/DecisionGradeFusionApplicatorTests.cs (or equivalent)
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs (corroboration bonus — do not revert)
- ArchLucid.Contracts/Findings/FindingClassification.cs / FindingTreatment.cs

Work:

1. DecisionGradeFusionApplicator: keep Apply() returning new fusion findings. Add DemoteFusedConstituents(IReadOnlyList<Finding> packageFindings, IReadOnlyList<Finding> fusionFindings) in the same class or an own file DecisionGradeFusionConstituentDemoter.cs:
   - For each fusion row, parse constituent finding ids from the payload/trace (reuse whatever Apply already stamps — do not invent a second id scheme).
   - For each matching constituent still on the package: Classification = ChecklistCoverage, Treatment = DemoteToChecklist; append a trace note evidence:fused-into:{fusionFindingId}. Do not clear EvidenceRefs.
   - Skip if the constituent is already checklist. Never demote the fusion row itself. Never demote findings whose ids are not listed as constituents.
   - Copy Max(constituent.InsightDensityScore) onto the fusion finding when the fusion score is 0/null/unset. If all constituents lack a score, leave fusion score unset (do not invent 100).

2. FindingsDecisionGradeFusionStage: after AddRange(fusionFindings), call the demoter on context.Snapshot.Findings. If fusionFindings is empty, no-op (today's behavior).

3. Tests:
   - Two preferred Decision-grade findings sharing RelatedNodeIds → one fusion Decision-grade + both constituents ChecklistCoverage, still present on the list
   - Unfused Decision-grade row (no shared node) stays Decision-grade
   - Empty input / single finding → no fusion, no demotion
   - Fusion InsightDensityScore equals the higher constituent score
   - Trace note on constituents contains fused-into and the fusion id
   - Existing fusion payload/engine-type tests still pass
   - Do not change DeterministicInsightDensityGateTests corroboration cases

4. Docs: FINDING_ENGINE_OUTPUT_REFERENCE.md row for decision-grade-fusion — constituents remain on the snapshot as checklist after DX-71. claimBoundary: packaging, not a named-model beat.

Do not: delete findings; demote unfused rows; revert DX-63 skip-duplication; add EngineType; change ITSM filters (DX-12 already Decision-grade only — this is what makes that filter honest); push master; OpenAPI unless fusion payload already is public and you change it (prefer not to).

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DecisionGradeFusion"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~DeterministicInsightDensityGate"
```

**Done when:** A two-engine shared-node cluster yields **one** Decision-grade fusion row; constituents remain visible as checklist. Cross-engine corroboration scoring is unchanged.

---

# DX-72 — Graduated evidence-quality score terms

**Closes:** Measurement honesty after DX-59 + DX-65 + DX-70. `DeterministicInsightDensityGate` starts at 100 and applies coarse flags: generic −35, no evidence −25, no anchor −15, falsifiability +10, severity +5, duplication −15/−30, corroboration +10, impact witness +5/+10. Corpus medians collapse to **60 / 65 / 75 / 80 / 85**. Threshold 65 sits on a populated rung. Judge-cap sorts (including `PreferHighHumanAcceptResidual`) cannot distinguish two rows that share the same flag set. DX-65 already added hop bonuses; DX-70 made remaining concrete citations actually concrete — now **grade** them.
**Depends on:** DX-70 merged (line-anchored `doc:` helper exists); DX-65 shipped
**Branch suggestion:** `cursor/dx-72-score-gradation`

### Design intent

Score terms only. Do **not** change the demotion predicate or threshold 65. Do **not** add markdown columns to `insight-density-engine-distribution.md` unless you also update header tests — prefer skipping new columns (PenaltyReasons already carries tokens). Evidence quality is a **bonus when `hasConcreteEvidence` is already true**, capped so inventory-shaped + line-anchored doc together add at most **+10**. Weak architecture anchor (quoted name only, no product-shaped ref) becomes −8 instead of the full −15. Coverage engines without citations stay at 60 — do not “fix” them by stuffing fake refs.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add graduated evidence-quality bonuses and a weaker-anchor penalty so DeterministicInsightDensityGate scores are not a five-rung ladder. Do not change InsightDensityDemotionPredicate. Do not change DemotionThreshold (65). Do not add EngineType. Do not give coverage engines fake EvidenceRefs.

Why: Sort-by-density and PreferHighHumanAcceptResidual need a continuous-ish score. Today 60 = no evidence and no anchor, 85 = missing anchor only. DX-70 made remaining concrete refs real; grade them instead of treating all concrete refs as equal.

Read first:
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (HasConcreteEvidenceCitation, HasArchitectureSpecificAnchor, HasLineAnchoredDocRef from DX-70)
- ArchLucid.Core/Findings/FindingEvidenceRefs.cs (TryFormatInventoryResourceId)
- ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs (do not add columns unless tests are updated — skip columns)

Work:

1. After existing hasConcreteEvidence / hasArchitectureAnchor computation, if hasConcreteEvidence:
   - If any evidence ref is product-shaped inventory (TryFormatInventoryResourceId on ARM/ARN/GCP, or graph-node: with product-shaped remainder, or aws:arn:/raw ARM/GCP projects/) → score = Min(100, score + 10), PenaltyReasons.Add("inventory-shaped-evidence")
   - Else if any evidence ref is HasLineAnchoredDocRef → score = Min(100, score + 5), PenaltyReasons.Add("line-anchored-doc")
   - Do not stack both; inventory-shaped wins. policy-rule: alone is already concrete (no extra bonus — it is the baseline that avoided -25).

2. Architecture anchor: if !hasArchitectureAnchor, keep -15 no-architecture-anchor. If hasArchitectureAnchor but the only reason is a quoted name / UnderSpecified title without a product-shaped inventory ref, apply -8 weak-architecture-anchor INSTEAD of the full -15 (do not also apply -15). If a product-shaped inventory ref is present, apply neither missing-anchor penalty. Keep the existing HasArchitectureSpecificAnchor boolean for demotion; this is score-only. If implementing “quoted name only” is ambiguous, add GenericArchitectureAdvicePatterns.HasProductShapedInventoryEvidence(evidenceRefs) and treat: no anchor → -15; anchor && !product-shaped inventory → -8; product-shaped inventory → 0 anchor penalty. That is enough.

3. Existing terms unchanged: generic -35, no-concrete-evidence -25, falsifiability +10, severity +5, duplication, corroboration +10, impact-witness +5/+10. Final Clamp 0..100.

4. Tests:
   - No refs: still ~60, no-concrete-evidence, no-architecture-anchor, demotes at 65
   - policy-rule only + architecture-specific title: concrete, no inventory-shaped-evidence bonus, no line-anchored-doc bonus
   - product-shaped ARM graph-node + otherwise same as a 75/80 fixture: +10 inventory-shaped-evidence vs the policy-rule-only sibling
   - doc:...#L12 only: +5 line-anchored-doc, not +10
   - inventory-shaped + line-anchored together: +10 once (not +15)
   - Impact witness still stacks with inventory-shaped (DX-65) but clamp 100
   - DemotionThreshold 65 still demotes the no-ref 60 case; ARM-cited identity-blast-radius still promotes
   - Distribution calculator still runs (no new markdown column required)

5. claimBoundary: scoring granularity, not a named-model beat, not SOC 2 Type II, not permission to raise coverage-engine scores with invented ARM ids.

Do not: change the demotion predicate; raise DemotionThreshold; invent EvidenceRefs on topology-coverage; add EngineType; push master; OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'
Test:
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~DeterministicInsightDensityGate"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityEngineDistribution"
```

**Done when:** Two findings that both “have evidence” can score differently because one cites a product-shaped inventory id and the other cites only a policy rule or line-anchored doc. Uncited coverage rows stay at 60 and still demote. Predicate and threshold unchanged.

---

## After this set

Still owner-gated (not Cursor-default):

| Item | Why it stays parked |
|------|---------------------|
| Live extractor-as-default | Product/GTM — inventory engines already score 85 when they fire |
| `EnableProseAssumptionExtraction` default-on | Cost scales per in-batch document (DX-55 / merger comment) |
| Live frontier corpus **G-REAL-06** | Needs frozen architectures + committed transcripts |
| Graph-RAG live ablation **TB-883** | ADR 0057 buyer-claim gate |
| `PreferHighHumanAcceptResidual` default-on | DX-67 flag; needs calibration table volume |

Do **not** follow this set with another coverage engine or another fusion `EngineType`. Declaration path-feed work through **DX-76** is shipped ([`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX73.md), `#2530`).

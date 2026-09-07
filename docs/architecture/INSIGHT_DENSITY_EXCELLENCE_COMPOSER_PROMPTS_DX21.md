> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-16**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-17–DX-28)

**Created:** 2026-09-07 · **Status:** **DX-17–DX-28 shipped on `master`** (2026-09-07) except **DX-18** (TB-885 hold), **DX-19** (ADR 0062 hold), and **DX-20** (open PR until merged). Do not re-run shipped prompts.

These prompts grow the **numerator** (new information sources, synthesis of demoted rows, richer ingest) and close measurement loops DX-13/DX-15 opened. They do **not** add coverage-only “node type X is missing” engines.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-16** | On `master` as of 2026-09-07 (gate, Real judge, actor expansion, contradiction/path engines, InsightGenerator, recurrence default-on, ITSM Decision-grade, novelty signal, harness 32/45, measurement floor, starter catalog) |
| **DX-17–DX-28** | Shipped on `master` as of 2026-09-07 (see sequencing table — **DX-18**/**DX-19** held; **DX-20** in PR #2002 until merged) |
| Louvain detector | `LouvainGraphCommunityDetector` + `GraphCommunitySummarizationService` already exist — **DX-17 wires summaries into InsightGenerator**, does not recreate community detection |
| `SelectJudgedCandidates` severity sort | Judge already orders by severity then lowest score — **DX-21 adds engine-type priority** so path/contradiction rows are not skipped by cap |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-21** | Judge cap prefers path/contradiction engines | Yes | DX-02 (shipped) | Precision (same budget, better rows) |
| **DX-22** | Checklist-cluster synthesis | After DX-01 | DX-01 (shipped) | **Generative** (numerator from demoted rows) |
| **DX-23** | Novelty-signal → per-engine rate | After DX-13 | DX-13 (shipped) | Measurement (feeds generator tuning later) |
| **DX-24** | Dangling declaration references | Yes | none | **Generative** (IaC-only, no extractor) |
| **DX-25** | Requirement × SKU/tier contradiction | After DX-08 | DX-08 (shipped) | **Generative** |
| **DX-26** | Deterministic counterfactual line | After DX-06 | DX-06 (shipped) | Operationalize |
| **DX-27** | Ingestion completeness slice 1 | Yes | none | **Generative** (property bag) |
| **DX-28** | Path-engine golden fixtures + floor derive | After DX-14 | DX-14 (shipped) | Measurement |
| **DX-17** | Community summaries → InsightGenerator | After DX-10 | DX-10 (shipped) | **Generative** (retrieval context) |
| **DX-20** | Live frontier capture schema + one labeled synthetic | After DX-13 | DX-13 preferred | Measurement |
| **DX-18** | TB-885 compounding ledger | **Held** | Owner unparks TB-885 | Packaging |
| **DX-19** | ADR 0062 verification slice 1 | **Held** | Owner unparks TB-2033 | Sustains excellence |

**Start DX-21–DX-28 now.** Start **DX-17** and **DX-20** after those land if capacity remains. Do **not** start **DX-18** or **DX-19** unless the owner explicitly unparks the matching TB row.

> **2026-09-07 closure:** DX-21–DX-28, DX-17 landed on `master`. DX-20 is in PR #2002. Remaining runnable items: **DX-18** / **DX-19** only when owner unparks TB-885 / TB-2033.

**Do not start from this document:** SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, fake named-model frontier transcripts, a 5th `AgentType` enum value.

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). Effectful engines use `IScopeContextProvider`.
- **New finding engine checklist** (all four or `BuiltInFindingEngineTypeCatalogTests` fails):
  1. `IFindingEngine` (graph-pure) **or** `IEffectfulFindingEngine` (I/O).
  2. Row in `ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs`.
  3. `services.AddScoped<Di.IFindingEngine, …>()` or `IEffectfulFindingEngine` in `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.Decisioning.cs`.
  4. Catalog guard test still green. If the engine is not in `GoldenCorpusHarness`, add an absent-reason in `GoldenCorpusHarnessEngineInventory`.
- Payload DTOs live in `ArchLucid.Contracts/Findings/Payloads/` (or existing Decisioning Models only if that engine family already stores payloads there — prefer Contracts + `FindingPayloadRegistry`). There is **no** `ArchLucid.Decisioning.Findings.Payloads` namespace.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless the prompt says the wire schema changes. If it does, follow [`../library/OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md).
- SQL: numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus rollback under `Migrations/Rollback/` when a peer exists.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- R5: missing properties / missing inventory → no finding (or explicit `NotVerifiable`), never invent a resource.
- Do not add engines that only emit “node type X is missing from GraphSnapshot.”

---

# DX-21 — Judge cap prefers path and contradiction engines

**Closes:** `MaxJudgedFindingsPerSnapshot` still spends budget on topology-coverage / security-coverage rows; DX-15 now reports `JudgeSkippedByCap` but the skip set is the wrong tail.
**Depends on:** DX-02 (shipped)
**Branch suggestion:** `cursor/dx-21-judge-cap-engine-priority`

### Design intent

`PremiumInsightDensityLlmJudge.SelectJudgedCandidates` already sorts by **severity descending**, then **lowest `InsightDensityScore`**, then `FindingId`. That is precision-oriented within a severity band, but 40 `topology-coverage` rows still crowd out one `identity-blast-radius` finding.

Reuse the preferred engine list already in `InsightGeneratorEvidenceSummary.PreferredEngineTypes`. Do not raise the cap. Do not change Simulator skip.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: when PremiumInsightDensityLlmJudge applies MaxJudgedFindingsPerSnapshot, prefer path/contradiction EngineTypes so JudgeSkippedByCap lands on coverage-shaped rows, not blast-radius / segmentation / secrets / DR / declaration-inventory-contradiction / open-commitment / insight-generator / declaration-premise-conflict.

Why: DX-15 reports skipped-by-cap. SelectJudgedCandidates currently OrderByDescending Severity then ThenBy lowest InsightDensityScore. A snapshot with 41 topology-coverage findings and 1 identity-blast-radius finding with cap 12 judges 12 coverage rows and skips the path finding.

Read first:
- ArchLucid.AgentRuntime/PremiumInsightDensityLlmJudge.EngineFindings.cs (SelectJudgedCandidates)
- ArchLucid.AgentRuntime/InsightGeneratorEvidenceSummary.cs (PreferredEngineTypes — reuse, do not fork a third list)
- ArchLucid.AgentRuntime.Tests/PremiumInsightDensityLlmJudgeTests.cs
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs (MaxJudgedFindingsPerSnapshot — do not change the default)

Work:

1. Extract a shared preferred-engine helper if PreferredEngineTypes is private — public static FrozenSet or IReadOnlySet on InsightGeneratorEvidenceSummary (or a tiny Core helper both judge and generator use). Keep one list.

2. SelectJudgedCandidates order:
   - Preferred EngineType first (1) vs other (0)
   - Then Severity descending (existing)
   - Then InsightDensityScore ascending with nulls last (existing — judge borderline rows)
   - Then FindingId ordinal (existing)

3. Tests: 12 topology-coverage + 1 identity-blast-radius, cap 12 → blast-radius is among judged; skipped count is 1 and the skipped finding is topology-coverage. Equal-priority rows still respect severity then score.

4. Do not change EnableLlmJudge defaults. Do not change faithfulness. Do not add telemetry labels beyond existing InsightDensityJudgeSkippedByCapTotal.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~PremiumInsightDensityLlmJudge"

Done when: a preferred-engine finding is judged ahead of coverage engines under a tight cap; cap value unchanged.
```

---

# DX-22 — Checklist-cluster synthesis (one Decision-grade from N demoted rows)

**Closes:** DX-01 demotes generic engine rows to `ChecklistCoverage`; nothing turns a shared root cause into a single decision-changing finding.
**Depends on:** DX-01 (shipped)
**Branch suggestion:** `cursor/dx-22-checklist-cluster-synthesis`

### Design intent

This is **synthesis**, not a coverage engine. After typed engines + gate, cluster `ChecklistCoverage` rows that share a control theme (same `FindingType` prefix, same policy theme, or same normalized title stem) with **≥3** members. Emit **one** new Decision-grade finding whose evidence refs are the clustered finding ids + their resolvable `evidence:` notes. Cap **5** synthesis findings per snapshot.

Must run **after** `FindingInsightDensityGateApplicator` (orchestrator post-merge stage), not as a parallel graph engine that cannot see sibling findings.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add a post-gate FindingsOrchestrator stage that clusters ChecklistCoverage findings and emits up to 5 Decision-grade synthesis findings when ≥3 demoted rows share a root-cause key. Do not delete the checklist rows. Do not invent resources.

Why: Dismiss without synthesis wastes numerator. "Enable HTTPS on ApiA/ApiB/ApiC" as three checklist rows is weaker than "one platform TLS policy remediates 6 services" with those rows as evidence.

Read first:
- ArchLucid.Decisioning/Services/FindingsOrchestrator.cs
- ArchLucid.Decisioning/Services/Findings/IFindingsMergeAndGateStage.cs (run AFTER gate)
- FindingClassification.ChecklistCoverage / DecisionGradeFinding
- BuiltInFindingEngineTypeCatalog + ServiceCollectionExtensions.Decisioning.cs
- HOLD_NO_COVERAGE_ENGINES.md excellence exception — this prompt is authorized as synthesis, not coverage

Work:

1. IFindingsChecklistClusterStage (or applicator) invoked after merge+gate, before snapshot emit. Input: current finding list. Output: same list plus synthesis findings.

2. Cluster key (deterministic): prefer PolicyRuleId when non-blank; else FindingType; else normalized title stem (strip resource tokens / quoted names, keep control phrase). Ignore clusters with fewer than 3 members. Ignore Decision-grade members (they already survived dismiss).

3. Finding: EngineType "checklist-cluster-synthesis". Category Insight. Title names the control and the count ("TLS minimum missing on 6 services"). Trace.Notes include evidence:finding:{id} for each member (that prefix must be treated as resolvable by HasConcreteEvidenceCitation — add finding: to the accept list if DX-01's citation helper would otherwise reject it). Payload: MemberFindingIds, ClusterKey, MemberCount.

4. Catalog + DI: prefer a no-op IFindingEngine that returns [] so skip-set/catalog stay complete, with the stage attaching EngineType checklist-cluster-synthesis — same pattern as insight-generator. Register payload in FindingPayloadRegistry.

5. Cap 5 clusters, largest first, then ClusterKey ordinal. R5: if members lack any resolvable evidence among them, skip that cluster (do not emit a generic "several services").

6. Tests: 6 HTTPS checklist rows → 1 synthesis finding + original 6 remain; 2 rows → no synthesis; Decision-grade rows are not clustered.

Do not: auto-Promote members; call LLM; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~ChecklistCluster|FullyQualifiedName~FindingsOrchestrator"

Done when: three-plus demoted siblings produce one Decision-grade synthesis finding with finding: evidence refs; members stay ChecklistCoverage.
```

---

# DX-23 — Close the DX-13 loop (per-engine novelty rate)

**Closes:** `FindingInsightSignals` stores `DidNotThinkOfThat` but nothing aggregates it; excellence strategy said the signal “feeds generator tuning.”
**Depends on:** DX-13 (shipped)
**Branch suggestion:** `cursor/dx-23-novelty-rate-by-engine`

### Design intent

Read-only aggregation. Do **not** auto-Promote from the signal (DX-13 forbid). Add a tenant-scoped query: for each `EngineType` on Decision-grade findings in a date window, count distinct findings with ≥1 `DidNotThinkOfThat` vs Decision-grade emissions. Surface as a column or sibling section on `docs/quality/insight-density-engine-distribution.md` **only when** `ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1` is **not** the path — this is a **live SQL report**, not golden-corpus fiction.

Operator-facing: a Working-mode scorecard strip or findings-workspace footnote is enough. No buyer claim.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: aggregate FindingInsightSignals.DidNotThinkOfThat per EngineType and surface an internal novelty rate. Do not change classification. Do not add buyer copy.

Why: DX-13 shipped POST /v1/runs/{runId}/findings/{findingId}/insight-signal and FindingDidNotThinkOfThatButton. IFindingInsightSignalRepository only TryInsertAsync + ListKindsForUserAsync. Generators cannot learn which engines earn novelty marks.

Read first:
- ArchLucid.Core/Findings/IFindingInsightSignalRepository.cs
- ArchLucid.Persistence/Findings/SqlFindingInsightSignalRepository.cs
- ArchLucid.Persistence/Migrations/370_FindingInsightSignals.sql
- ArchLucid.Api/Controllers/Findings/FindingInsightSignalController.cs
- archlucid-ui/src/components/findings/FindingDidNotThinkOfThatButton.tsx
- docs/quality/insight-density-engine-distribution.md (do NOT invent golden-corpus novelty rates)

Work:

1. Repository method ListNoveltyRatesAsync(tenantId, fromUtc, toUtc, ct) joining signals to findings snapshot rows already stored for those runs (use existing finding read model / sealed snapshot JSON — do not denormalize EngineType onto the signal table unless a join is impossible; prefer join on FindingId+RunId). Return EngineType, DecisionGradeCount, DidNotThinkOfThatCount, Rate.

2. GET /v1/tenants/current/insight-density/novelty-rates?from=&to= (or a run-admin diagnostics route already used for Working desk). Tenant isolation: other tenant 404. OpenAPI regen required — follow OPENAPI_CONTRACT_DRIFT.md.

3. UI: Working-mode only helper line on the findings workspace or measurement strip — "Novelty marks: N of M decision-grade findings (internal)." Vitest. Hide on buyer-polished shell.

4. Optional markdown writer for operators (docs/quality/ or a diagnostics download) labeled claimBoundary: internal metric, not G-REAL-06 proof. Never write fake rates into the golden distribution table.

5. Tests: insert signals + findings; rates match; second tenant empty.

Do not: auto-Promote; use the rate as a gate penalty in this prompt (that is a later owner decision); push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
Follow OpenAPI drift after the controller exists.
Test: Api.Tests FindingInsightSignal + Persistence novelty-rate tests; Vitest for the helper line.

Done when: Working desk shows a tenant-scoped novelty count; golden distribution markdown is unchanged unless you only add a claimBoundary sentence pointing at the live API.
```

---

# DX-24 — Dangling declaration references (IaC-only contradiction)

**Closes:** DX-04 needs live inventory; IaC-only reviews (the ones where actor engines used to skip) still miss “Function app settings point at a Key Vault that is not in this package.”
**Depends on:** none
**Branch suggestion:** `cursor/dx-24-dangling-declaration-refs`

### Design intent

Graph-pure `IFindingEngine`. Scan node property bags for ARM ids, resourceIds, Key Vault URIs, subnet ids, and managed-identity principal names. If the referenced id/name does not match any node’s `NodeId`, ARM id property, or label in **this** snapshot, emit a Warning. Fail closed when the property is empty or looks like a parameter expression (`[parameters('…')]`, `${…}`, `var.`). Cap 20.

This is a **cross-file reference contradiction**, not “node type missing.”

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add DanglingDeclarationReferenceFindingEngine (IFindingEngine) that emits when a graph node's property bag references a resource id/name that is not present in this GraphSnapshot. Category Security. EngineType dangling-declaration-reference. Cap 20. R5: skip parameter/variable expressions and empty values.

Why: DX-04 joins declaration vs inventory and is silent without extractors. First reviews are IaC-only. Frontier chat often misses dangling Key Vault / subnet / identity refs across files.

Read first:
- ArchLucid.Decisioning/Services/DeclarationInventoryContradictionFindingEngine.cs (evidence: style)
- ArchLucid.ContextIngestion/Infrastructure/CanonicalInfrastructurePropertyBag.cs
- GraphSnapshot node Properties
- BuiltInFindingEngineTypeCatalog + GoldenCorpusHarnessEngineInventory (add harness OR absent-reason)
- GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation (use graph-node: and doc: if source path exists)

Work:

1. Analyzer (pure, own file): given GraphSnapshot, build a set of known identities (NodeId, Label, properties named resourceId / id / armId / name, lowercase). Scan other properties for:
   - /subscriptions/…/resourceGroups/… ARM ids
   - vault.azure.net URIs / secrets/ names
   - subnetId / subnet_id
   - managedIdentity / userAssignedIdentities keys
   Skip values containing [parameters(, [variables(, ${, var., local., module. (Terraform/Bicep unevaluated).

2. Finding title names the source node label and the dangling token. Trace.Notes: evidence:graph-node:{sourceNodeId}. Payload: SourceNodeId, PropertyName, ReferencedToken, ReferenceKind (ArmId | KeyVaultUri | Subnet | Identity).

3. Tests: Function node appSettings vault URI with no Key Vault node → 1 finding; both nodes present → 0; parameter expression → 0.

4. Golden: either a tiny case or absent-reason until DX-28-style fixture exists. Prefer one unit-test graph over a full golden case in this prompt.

Do not: require inventory; emit for missing node types with no dangling token; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DanglingDeclaration|FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: dangling Key Vault URI emits one finding; resolved refs and parameter expressions emit none.
```

---

# DX-25 — Requirement × SKU / replication tier contradiction

**Closes:** DX-08 joins RPO minutes to replica topology; declared SKU/replication still contradicts “zone-redundant” / “geo-redundant” / “multi-region” requirement text.
**Depends on:** DX-08 (shipped)
**Branch suggestion:** `cursor/dx-25-requirement-sku-tier`

### Design intent

Reuse `DrRpoRequirementParser` style (lexical, conservative). New parser for redundancy language on Requirement nodes. Compare to datastore/SKU properties (`sku`, `skuName`, `replication`, `accountReplicationType`, `zoneRedundant`, `geoRedundant`). Emit only when **both** sides parsed. No finding when SKU property absent.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add RequirementSkuTierFindingEngine (IFindingEngine) that emits when a Requirement node asks for zone-redundant / geo-redundant / multi-region and a linked datastore SKU is LRS / Standard_LRS / single-region / zoneRedundant=false. Follow DrRpoTopologyFindingEngine evidence style. Category Reliability (or Requirement if that is the family used by DX-08). EngineType requirement-sku-tier.

Why: DX-08 already parses RPO/RTO. The same join pattern extends to SKU/replication without a new information plane.

Read first:
- ArchLucid.Decisioning/Analysis/DrRpoRequirementParser.cs
- ArchLucid.Decisioning/Services/DrRpoTopologyFindingEngine.cs
- ArchLucid.Decisioning/Analysis/DrRpoTopologyAnalyzer.cs (how requirements link to datastores — reuse the same linking if one exists; otherwise match Requirement → datastore edges already on the graph)
- Finding payload registry

Work:

1. RequirementRedundancyParser.TryParse: Zone / Geo / MultiRegion / None. Conservative regex on requirement label + properties text/description. Do not parse cost or SKU from the requirement unless it clearly says zone-redundant, ZRS, GRS, geo-redundant, multi-region, availability zones.

2. DatastoreSkuReader: sku, skuName, replication, accountReplicationType, zoneRedundant, geoRedundant, locationCount. Map Standard_LRS / LRS / ragrs-absent to SingleRegion. Unknown SKU → skip (R5).

3. Finding when requirement Zone|Geo|MultiRegion and datastore SingleRegion. Title names requirement label, datastore label, both values. evidence:graph-node: for both ids. Payload: RequirementNodeId, DatastoreNodeId, RequiredRedundancy, ObservedSku.

4. Tests: "zone-redundant SQL" + sku Standard_LRS → 1 finding; sku Premium_ZRS → 0; missing sku → 0.

5. Catalog + DI + harness absent-reason or register with a unit-test-only graph.

Do not: emit “SKU property missing”; invent Azure SKU catalogs beyond the mapped tokens; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~RequirementSku|FullyQualifiedName~RequirementRedundancy|FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: zone-redundant requirement vs LRS datastore emits one finding; missing SKU emits none.
```

---

# DX-26 — Deterministic counterfactual line on Decision-grade path findings

**Closes:** Operationalize clause — findings name a blast-radius path but do not say what changes if the operator scopes the identity down.
**Depends on:** DX-06 (shipped)
**Branch suggestion:** `cursor/dx-26-path-counterfactual-line`

### Design intent

No new LLM call. Template from `IdentityBlastRadiusFindingPayload` (and optionally `DrRpoTopologyFindingPayload` / segmentation payload if fields exist). Surface a one-line `Counterfactual` on the finding inspect / dense table, Working mode. Do not invent USD.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add a deterministic counterfactual sentence for identity-blast-radius (and DR/RPO if payload fields support it) Decision-grade findings, shown on the finding inspect / dense table in Working mode. No LLM. No new AgentType.

Why: TradeoffConflictExplanationComposer already has counterfactualStatement for WAF tradeoffs. Path engines do not. “If this MI loses Key Vault Secrets Officer on PaymentsKv, write path to the PCI datastore is removed” is the operationalize clause.

Read first:
- ArchLucid.Decisioning/Models/IdentityBlastRadiusFindingPayload.cs
- ArchLucid.Decisioning/Services/IdentityBlastRadiusFindingEngine.cs
- archlucid-ui/src/components/findings/RunDetailFindingsDenseTableRow.tsx
- Finding inspect actions (FindingDidNotThinkOfThatButton sibling)
- ArchLucid.Decisioning/Risk/TradeoffConflictExplanationComposer.cs (do not reuse WAF catalog keys — different domain)

Work:

1. IdentityBlastRadiusCounterfactualFormatter (Decisioning, pure): input payload + actor/datastore labels. Output: "If {actor} lost {role} on {datastore}, the write/admin path ({hopCount} hops) would be removed." Null if any field blank.

2. Attach on emit: store the sentence in Trace.Notes as counterfactual:… OR a small optional field on Finding if one already exists for explanations. Prefer Trace.Notes prefix to avoid OpenAPI churn. UI helper parses counterfactual: lines.

3. UI: show the line under the finding title in dense table + inspect, Working mode only, sentence case, not a primary CTA. Vitest.

4. Tests: payload with all fields → exact sentence; missing RoleName → no line.

Do not: call Premium completion; show on buyer-polished shell; claim dollar savings; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test: formatter tests + Vitest dense-table / inspect.

Done when: Working dense table shows the counterfactual for an identity-blast-radius fixture; buyer shell does not.
```

---

# DX-27 — Ingestion completeness slice 1 (ARM nested, Bicep modules, TF for_each)

**Closes:** ID-08 shipped Bicep body + K8s spec; nested ARM `template` objects, Bicep `module` calls, and Terraform `for_each` instances still never reach declaration engines.
**Depends on:** none
**Branch suggestion:** `cursor/dx-27-ingestion-nested-modules`

### Design intent

Information-source change, not a new engine. Bound this prompt to **three** parsers already in `ArchLucid.ContextIngestion`. Leave Helm/Kustomize/Pulumi/CDK for a later chat.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: expand existing infrastructure declaration parsers so nested/linked ARM templates, Bicep modules, and Terraform for_each instances contribute CanonicalObjects (and thus graph property bags). Do not add a finding engine.

Why: Strategy workstream 1G. Contradiction and SKU engines cannot see resources the parser dropped. ID-08 covered Bicep resource bodies + K8s spec.

Read first:
- ArchLucid.ContextIngestion/Infrastructure/ArmJsonInfrastructureDeclarationParser.cs (Microsoft.Resources/deployments already walks inline resources[] — extend to properties.template.resources and skip templateLink URI fetches)
- ArchLucid.ContextIngestion/Infrastructure/BicepInfrastructureDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/BicepResourceBodyParser.cs
- ArchLucid.ContextIngestion/Infrastructure/SimpleTerraformDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/TerraformShowJsonInfrastructureDeclarationParser.cs (show JSON may already expand for_each — do not duplicate; fix SimpleTerraform HCL path)
- ArchLucid.ContextIngestion.Tests/*ParserTests.cs

Work:

1. ARM: when type is Microsoft.Resources/deployments, parse properties.template.resources recursively (same TryAddResource). Do NOT HTTP-fetch templateLink.uri. If only templateLink is present, skip silently (R5). Tests: nested storage account inside deployments.properties.template.resources appears as a CanonicalObject.

2. Bicep: parse `module name 'path.bicep'` when the referenced file content is already in the same declaration batch (match relative path / name). If the module file is not in the batch, skip (do not invent). Recurse one level (cap depth 3). Tests: parent + module file in one Parse pipeline → module resources present.

3. Terraform HCL SimpleTerraformDeclarationParser: resource blocks with for_each = { k1 = … k2 = … } emit one CanonicalObject per key with a stable suffix, using the same property bag rules. If for_each is an unresolved expression, emit the single block as today (do not explode). terraform show JSON path: add a test proving instances already expand; if they do, do not change that parser.

4. Do not add Helm/Kustomize/Pulumi in this prompt. Do not raise MaxTfPropertyCount.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
Test:
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter "FullyQualifiedName~ArmJson|FullyQualifiedName~Bicep|FullyQualifiedName~SimpleTerraform|FullyQualifiedName~TerraformShowJson"

Done when: nested ARM template resources and in-batch Bicep modules parse; TF for_each with a literal map emits two objects; missing module file is a no-op.
```

---

# DX-28 — Path-engine golden fixtures (distribution table still 16 of 32)

**Closes:** Harness registers **32** engines and catalog is **45**, but `insight-density-engine-distribution.md` still lists **16** engines with ≥1 finding; `identity-blast-radius`, `segmentation-semantics`, and `dr-rpo-topology` are absent-with-reason for missing fixtures.
**Depends on:** DX-14 (shipped)
**Branch suggestion:** `cursor/dx-28-path-engine-golden-fixtures`

### Design intent

Do not fake distribution rows. Add **three** golden cases (next indexes after case-37) whose graphs fire those engines. Derive floor constants from catalog/harness so they cannot drift (if still hardcoded, replace with `BuiltInFindingEngineTypeCatalog.EngineTypeIds.Count` and `GoldenCorpusHarnessEngineInventory.RegisteredEngineCount`).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add golden corpus cases that cause identity-blast-radius, segmentation-semantics, and dr-rpo-topology to emit ≥1 finding each, move those EngineTypes from AbsentReasons into the harness registered list if they are not already registered, regenerate docs/quality/insight-density-engine-distribution.md, and keep measurement-floor catalog/harness counts derived from catalog + harness (currently 45 and 32).

Why: DX-14 expanded registration; the distribution table still shows 16 engines because path engines have no fixtures. Measurement honesty is already 32/45 — this prompt raises the measured numerator in the table.

Read first:
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarnessEngineInventory.cs (AbsentReasons for the three engines)
- tests/golden-corpus/decisioning/case-37/ (pattern)
- IdentityPathAnalyzer / Segmentation semantics analyzer / DrRpoTopologyAnalyzer unit tests (copy graph shapes)
- InsightDensityEngineDistributionMarkdown.cs
- InsightDensityEngineDistributionReportTests (record env var)

Work:

1. Three new cases (case-38, 39, 40 or next free indexes). Each README states which engine must appear in expected-findings.json. Do not delete cases 01–37.

2. Register the three engines in CreateEngines() if not already; remove their AbsentReasons. Keep insight-generator absent (NoOp).

3. ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1 (or the existing record switch) and commit the markdown. Table must include the three engine rows.

4. Measurement floor tests: CatalogEngineCount == BuiltInFindingEngineTypeCatalog.EngineTypeIds.Count; HarnessEngineCount == registered harness count. Prefer deriving Present() counts from those sources instead of duplicated literals.

Do not: require live Azure; invent findings in expected JSON the engine would not emit; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution|FullyQualifiedName~InsightDensityMeasurementFloor"

Done when: distribution markdown lists identity-blast-radius, segmentation-semantics, and dr-rpo-topology; old cases still pass.
```

---

# DX-17 — Community summaries as InsightGenerator retrieval context

**Closes:** ADR 0057 option (a) remainder — Louvain + hierarchical summaries exist but InsightGenerator never sees community documents.
**Depends on:** DX-10 (shipped)
**Branch suggestion:** `cursor/dx-17-community-summaries-generator`

### Design intent

`EnableCommunitySummarization` stays **default false**. When true (Real mode), append bounded community summary text to `InsightGeneratorEvidenceSummary` allow-listed as `community:{id}` refs that already exist as retrieval documents. Do not change Graph snapshot fingerprint exclusion rules except to keep community docs out of canonical graph hash (already required by ADR 0057).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: when AdvancedRetrievalOptions.EnableCommunitySummarization is true, include GraphCommunitySummary text in PremiumInsightFindingGenerator's evidence pack (InsightGeneratorEvidenceSummary) with allow-listed community:{communityId} refs. Default flag remains false. Simulator / NoOp generator unchanged.

Why: Bounded 1–2 hop Graph-RAG cannot surface “PCI payment community whose only egress is a Function with a public hostname.” Summaries already build RetrievalDocuments (GraphCommunitySummarizationService). DX-10 generator does not read them.

Read first:
- ArchLucid.Retrieval/Graph/GraphCommunitySummarizationService.cs
- ArchLucid.AgentRuntime/InsightGeneratorEvidenceSummary.cs
- ArchLucid.AgentRuntime/PremiumInsightFindingGenerator.cs
- ArchLucid.Core/Retrieval/GraphCommunity.cs
- adrs/0057-graph-rag-community-summarization-scope-decision.md (fingerprint exclusion, cost)
- GraphRagProductionLikeConfigurationLint (do not weaken)

Work:

1. IGraphCommunitySummaryLookup or reuse IGraphCommunitySummarizationService from the generator (AgentRuntime → abstraction in Core/Retrieval). Cap summaries (e.g. 8 communities, 500 chars each).

2. Allow-list community:{id} only for ids returned this call. Generator JSON evidenceRefs must pass faithfulness; unlisted community refs dropped.

3. Tests: flag false → no community lines and no completion mention of communities; flag true + fake summaries → user prompt contains the summary and a finding with community:community-0 is kept; community:other dropped.

4. Docs: claimBoundary — off by default; not a buyer Graph-RAG proof.

Do not: default the flag on; add a 5th AgentType; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~InsightFindingGenerator|FullyQualifiedName~InsightGeneratorEvidence"
dotnet test ArchLucid.Retrieval.Tests/ArchLucid.Retrieval.Tests.csproj --filter "FullyQualifiedName~GraphCommunity"

Done when: flag-on generator can cite an allow-listed community ref; flag-off is a no-op.
```

---

# DX-20 — Live frontier capture fixture schema (one synthetic labeled)

**Closes:** `insight-density-frontier-delta.md` is three hand-authored scenarios — regression only. Strategy workstream 4 needs a **schema** and operator script; not fake named-model beat claims.
**Depends on:** DX-13 preferred (novelty signal exists)
**Branch suggestion:** `cursor/dx-20-frontier-capture-schema`

### Design intent

Ship the **instrument**, not a leaderboard. One committed fixture **must** be labeled `synthetic`. No buyer-facing “beats GPT-x” sentences ([`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md) forbidden list).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add a frontier-capture fixture schema + operator script that records (architecture zip hash, frozen findings snapshot ids, optional human DidNotThinkOfThat marks) and feeds InsightDensityFrontierDeltaCalculator. Commit exactly one synthetic regression fixture. Do not claim a named model was beaten.

Why: Workstream 4. Current docs/quality/insight-density-frontier-delta.md is empty-baseline / highly-novel / mostly-duplicate — not moat proof.

Read first:
- ArchLucid.Decisioning/Findings/InsightDensityFrontierDeltaCalculator.cs
- docs/quality/insight-density-frontier-delta.md
- docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md (forbidden: fake named-model transcripts)
- FindingInsightSignals (optional join — do not require DX-23)

Work:

1. JSON schema under tests/ or docs/quality/fixtures/: architecturePackageSha256, capturedUtc, label (synthetic | pilot-pending), decisionGradeFindingTitles[], optional noveltyFindingIds[].

2. Script (ps1 or python in scripts/) that given a runId (dev/test only) writes the JSON from the sealed snapshot. No production cron.

3. CI test: synthetic fixture still matches calculator within existing threshold. Pilot-pending fixtures are not required in CI.

4. Markdown: keep the existing three-row table; add a section “Capture schema (not a named-model benchmark)” with claimBoundary.

Do not: invent OpenAI/Anthropic transcripts; add GTM cohort work; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityFrontierDelta"

Done when: schema + one synthetic fixture + calculator regression still PASS; docs forbid named-model claims.
```

---

# DX-18 — TB-885 policy-pack compounding ledger (**held**)

**Status:** **Do not run** until the owner unparks **TB-885** in `docs/library/TECH_BACKLOG.md` (currently Hold for reassessment / G-REAL-06). Prompt is stored so the chat is ready.

**Closes:** “Compounds over time” remains narrative; dry-run exists but no older-vs-newer ledger.
**Depends on:** owner unpark
**Branch suggestion:** `cursor/dx-18-tb-885-compounding-ledger`

### Prompt (copy below) — only after owner unparks TB-885

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: script-driven JSON+MD ledger that dry-runs an older policy-pack change-log version vs current against the same historical run id. No mutation of packs, assignments, or findings snapshots. Cite finding/rule ids.

STOP if TECH_BACKLOG.md TB-885 is still Hold for reassessment — do not implement.

Read first:
- docs/library/TECH_BACKLOG.md section TB-885
- IPolicyPackChangeLogRepository
- POST policy-packs/{id}/dry-run
- docs/library/POLICY_PACK_DELTA_DEMO_SCRIPT.md Phase C

Work: generator script + tests; empty incremental catch is valid. claimBoundary: internal differentiability instrument, not a buyer compounding-rate.

Done when: one pack with 2+ versions + one historical run produces a ledger file in tests or docs/quality.
```

---

# DX-19 — ADR 0062 verification loop slice 1 (**held**)

**Status:** **Do not run** until the owner unparks **TB-2033** (ADR 0062 is Proposed / V1.1). Prompt is stored so the chat is ready.

**Closes:** First-review density is not raised; excellence is **sustained** by scoring whether findings materialized.
**Depends on:** owner unpark
**Branch suggestion:** `cursor/dx-19-verification-loop-slice-1`

### Prompt (copy below) — only after owner unparks TB-2033

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: ADR 0062 slice 1 — FindingVerificationReports + FindingVerificationResults tables (migration + ArchLucid.sql), IFindingVerificationService that writes a linked artifact for a finalized package + later snapshot, statuses Materialized | Mitigated | Not observed | Not verifiable. Do not mutate ManifestHash. Do not put confirmation rates in buyer copy.

STOP if ADR 0062 is still Proposed without owner ratification / TB-2033 still parked.

Read first:
- docs/architecture/adrs/0062-finding-verification-loop.md
- ADR 0039 / 0045 immutability
- PUBLIC_CLAIM_BOUNDARY_GUIDE.md proof-scope-boundary

Work: DDL, repository, operator-triggered API, tests for tenant isolation and NotVerifiable when snapshot lacks the evidence scope. No marketing rates.

Done when: POST writes a report artifact; sealed package unchanged; 404 cross-tenant.
```

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- DX-01–DX-16: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

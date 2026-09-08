> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-50**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) (**DX-36–DX-41** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) (**DX-42–DX-46** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md) (**DX-47–DX-50** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-51–DX-56)

**Created:** 2026-09-08 · **Status:** **DX-51–DX-56 shipped on `master` (2026-09-08).** Do **not** re-run. **DX-58–DX-62 shipped.** Next set: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md) (**DX-63–DX-68**).

DX-01–DX-50 closed the Cursor-implementable *engine + ingest + citation* holes. Latest golden case is **`case-63`**. Harness registers **41** engines; catalog has **50**; **9** absent-with-reason. This set does **not** add coverage engines. It raises density by joining information the DX set already produces (fusion, portfolio topology, held-check ledger), by making the frontier instrument usable without fake transcripts (DX-54), and by two later prompts that need LLM budget (DX-55) or verification volume (DX-56).

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-50** | Gate, path/contradiction engines, InsightGenerator, ingest slices, goldens through `case-63`, citation tightening |
| Coverage-only engines | Still forbidden. This set adds **at most two** `EngineType` values (`decision-grade-fusion`, `portfolio-shared-topology`) — both synthesis/contradiction, never “node missing.” |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-51** | Decision-grade finding fusion (post-gate join) | First | DX-22, DX-50 shipped | **Generative** (compound claim from existing rows) |
| **DX-52** | Held-check ledger (missing-input attribution) | Yes with DX-51 | DX-15 shipped | Adoption (second-pass numerator) |
| **DX-53** | Portfolio shared-topology join | After DX-51 preferred | DX-11 shipped | **Generative** (cross-architecture shared node) |
| **DX-54** | Frontier-baseline harness (instrument only) | Yes with DX-51 | DX-20 shipped | Measurement |
| **DX-55** | Prose assumption extraction | After DX-51 | DX-10 shipped; Real-mode | **Generative** (new information source) |
| **DX-56** | Verification-calibrated engine priors | After TB-2034 volume | TB-2034; DX-23 | Precision (empirical penalties) |

**Start DX-51 and DX-52 now** (independent). Start **DX-53** after DX-51 if you share `case-NN` numbers, or in parallel if you pick unused numbers after checking `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` (currently **63**). Start **DX-54** in parallel with DX-51. **Do not start DX-55** until DX-51 has merged (fusion must exist so extracted assumptions can join existing rows). **Do not start DX-56** until the owner confirms a tenant has enough verification reports for a minimum-sample floor (see that prompt).

**Do not start from this document:** live extractor-as-default (product/GTM), fake named-model frontier transcripts, Graph-RAG buyer claims (ADR 0057 / **TB-883**), Real-mode judge **default-on**, `PreferHighNoveltyEngines` **default-on**, `EnableInsightGenerator` **default-on**, SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType` enum value, coverage engines parked on **G-REAL-06**.

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). Effectful engines use `IScopeContextProvider`.
- **New finding engine checklist** (all four or `BuiltInFindingEngineTypeCatalogTests` fails): catalog map + DI registration + `FINDING_ENGINE_OUTPUT_REFERENCE.md` row + tests. **DX-51** and **DX-53** add engines; the others must not.
- Payload DTOs live in `ArchLucid.Contracts/Findings/Payloads/` (prefer Contracts + `FindingPayloadRegistry`). There is **no** `ArchLucid.Decisioning.Findings.Payloads` namespace.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless the prompt says the wire schema changes. If it does, follow [`../library/OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md).
- SQL: numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus rollback under `Migrations/Rollback/` when a peer exists.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- R5: missing properties / missing inventory → no finding (or explicit `NotVerifiable`), never invent a resource.
- Do not add engines that only emit “node type X is missing from GraphSnapshot.”
- Do not change `DeterministicInsightDensityGate` demotion predicate (DX-01 already shipped).
- Do not auto-Promote from `DidNotThinkOfThat`. Do not write novelty rates into buyer-polished copy or the golden distribution markdown.
- Golden cases: start after **`case-63`**. Read `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` at the start of any golden prompt.
- Do not turn `EnableLlmJudge`, `EnableInsightGenerator`, or `PreferHighNoveltyEngines` **on by default**.

---

# DX-51 — Decision-grade finding fusion (post-gate join)

**Closes:** Strategy remaining Workstream 1D hole after DX-22. `ChecklistClusterSynthesisApplicator` clusters **demoted** `ChecklistCoverage` rows (min 3) into synthesis findings. Duplication in `DeterministicInsightDensityGate` is only a Jaccard penalty (−15/−30) — it never *joins* correlated **Decision-grade** rows from different engines into one compound claim. Three medium rows (NSG permits 3389 from Internet + jump box path to PCI datastore + waiver expires in six days) stay three medium rows; a reviewer can dismiss each in isolation.
**Depends on:** DX-22 shipped (checklist-cluster stage pattern); DX-50 shipped (citation honesty)
**Branch suggestion:** `cursor/dx-51-decision-grade-fusion`

### Design intent

Synthesis, not coverage. New `EngineType` **`decision-grade-fusion`**. Mirror DX-22: a catalog placeholder `IFindingEngine` that returns empty from `AnalyzeAsync`, plus a **post-gate pipeline stage** that reads the snapshot *after* `DeterministicInsightDensityGate` has classified rows. Join only existing **Decision-grade** findings that share a graph node (`RelatedNodeIds` intersection) **and** come from **at least two** distinct `EngineType` values among the preferred path/contradiction set (`InsightDensityPreferredEngineTypes`). Leave constituent rows on the package. Union their `EvidenceRefs` (already resolvable or the gate would have demoted them). Cap fused findings (suggest **5** per snapshot, same as DX-22 `MaxSynthesisFindings`). Fail closed when fewer than two Decision-grade members share a node. Do **not** invent a causal verb the constituents did not already state — title/description must name the joined engines and the shared node, not “therefore PCI is breached.”

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add EngineType decision-grade-fusion as a post-gate synthesis stage that joins two or more Decision-grade findings from distinct preferred engines that share a RelatedNodeIds node. Leave constituents on the package. Do not change DeterministicInsightDensityGate. Do not fuse ChecklistCoverage rows (that is DX-22). Do not add a coverage engine.

Why: DX-22 only clusters demoted checklist rows. Jaccard duplication is a penalty, not a join. A reviewer can dismiss “NSG permits 3389,” “jump box path to PCI datastore,” and “waiver expires in 6 days” separately; the compound claim is the density win and is frontier-novel because a chat session does not hold graph + governance trail + expiry together.

Read first:
- ArchLucid.Decisioning/Findings/ChecklistClusterSynthesisApplicator.cs (DX-22 — copy the post-snapshot merge pattern, not the checklist filter)
- ArchLucid.Decisioning/Services/Findings/FindingsChecklistClusterStage.cs
- ArchLucid.Decisioning/Services/ChecklistClusterSynthesisFindingEngine.cs (empty AnalyzeAsync placeholder)
- ArchLucid.Core/Findings/InsightDensityPreferredEngineTypes.cs
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs (do not edit the predicate)
- ArchLucid.Contracts/Findings/Finding.cs (Classification, RelatedNodeIds, EvidenceRefs, EngineType)
- ArchLucid.Contracts/Findings/Payloads/ (existing synthesis payload if any; add DecisionGradeFusionFindingPayload)
- ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs (50 engines — this prompt makes 51)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarnessEngineInventoryTests.cs (registered + absent = catalog)
- Host composition / findings pipeline where FindingsChecklistClusterStage is registered (register the fusion stage AFTER the gate and AFTER checklist-cluster)
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (63)
- docs/quality/HOLD_NO_COVERAGE_ENGINES.md (path/contradiction exception — fusion is synthesis of existing Decision-grade rows)
- docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md (currently has unresolved git conflict markers at secrets-lifecycle / portfolio-recurrence — resolve those markers in this prompt: keep BOTH engine rows; portfolio-recurrence default-on matches DX-11 / code Enabled = true)

Work:

1. New files (each class its own file):
   - DecisionGradeFusionApplicator (static, like ChecklistClusterSynthesisApplicator) in ArchLucid.Decisioning/Findings/
   - DecisionGradeFusionFindingEngine : IFindingEngine with EngineType "decision-grade-fusion", Category "Insight", AnalyzeAsync returns empty
   - FindingsDecisionGradeFusionStage : IFindings*Stage that runs after gate + checklist-cluster, calls Applicator.Apply(snapshot.Findings), AddRange, SuccessfulEngineTypes.Add
   - DecisionGradeFusionFindingPayload in ArchLucid.Contracts/Findings/Payloads/ with ConstituentFindingIds, SharedNodeIds, SourceEngineTypes
   - Register payload in FindingPayloadRegistry

2. Join rules (deterministic, no LLM):
   - Members: Classification == DecisionGradeFinding (or the enum member DX-01 uses for Promote — read FindingClassification; do not invent a new band)
   - Member EngineType is in InsightDensityPreferredEngineTypes OR is open-commitment / secrets-lifecycle (already preferred)
   - Shared node: RelatedNodeIds intersection length ≥ 1 after OrdinalIgnoreCase trim; ignore empty/null RelatedNodeIds
   - Distinct EngineType count in the cluster ≥ 2
   - Min cluster size 2 (not 3 — two Decision-grade path findings are enough)
   - Max fused findings per snapshot: 5. Order by (distinct engine count desc, shared-node count desc, first FindingId ordinal)
   - Do not fuse two findings from the same EngineType only
   - Do not remove or reclassify constituents
   - EvidenceRefs = distinct union of member EvidenceRefs (already package-resolvable or the gate demoted them)
   - Title shape: "Joined: {engineA} × {engineB} on {sharedNodeId}" — do not add causal verbs (compromises, breaches, therefore). Description lists each constituent FindingId + one-line title. Trace.Notes may keep evidence:graph-node: for operator explainability; EvidenceRefs must not gain synthetic graph-node: labels (DX-50)
   - RelatedNodeIds = shared nodes only
   - FindingId deterministic from sorted constituent ids (hash helper already used by DX-22 if one exists; otherwise SHA256 of sorted FindingId join, hex prefix)

3. Catalog / DI / harness:
   - BuiltInFindingEngineTypeCatalog: DecisionGradeFusionFindingEngine → decision-grade-fusion (catalog 51)
   - Register engine + stage in the same composition module as checklist-cluster
   - InsightDensityPreferredEngineTypes: add "decision-grade-fusion"
   - Golden harness: register like checklist-cluster-synthesis (placeholder engine + stage if the harness runs stages; if the harness only calls AnalyzeAsync, add a golden that feeds pre-classified Decision-grade rows through the Applicator in a dedicated test — do not fake GraphSnapshot coverage). Update GoldenCorpusHarnessEngineInventory: registered + absent = 51. If the harness cannot fire fusion honestly from AnalyzeAsync, list it absent-with-reason "post-gate synthesis; needs Decision-grade members" (same shape as checklist-cluster-synthesis) and cover Apply() with unit tests + one golden case that records Applicator output in expected findings — XML-comment the choice.
   - FINDING_ENGINE_OUTPUT_REFERENCE.md: add the row; claimBoundary: fusion does not create evidence, only joins Decision-grade rows that already passed the gate. Resolve the existing <<<<<<< HEAD conflict: keep secrets-lifecycle AND portfolio-recurrence; portfolio-recurrence is default on (DX-11).

4. Tests (concrete types, null checks, no ConfigureAwait(false)):
   - Two Decision-grade preferred-engine findings sharing node nsg-1 → one fused finding; constituents still present; EvidenceRefs unioned
   - Two Decision-grade findings, disjoint RelatedNodeIds → no fusion
   - Two findings same EngineType sharing a node → no fusion
   - One Decision-grade + one ChecklistCoverage sharing a node → no fusion (DX-22 owns checklist)
   - Three engines sharing sql-pay → one fused finding, SourceEngineTypes length 3, cap still 5
   - Empty snapshot / all checklist → empty
   - Golden: if you add case-64, it must not expect fusion from a coverage-shaped “node missing” graph. Prefer reusing case-38 + case-47 node ids in a dedicated Applicator unit fixture rather than a weak golden.

5. claimBoundary everywhere you touch density docs: fusion is not a named-model beat; not SOC 2 Type II; not live inventory.

Do not: change DX-01 demotion predicate; default LLM judge / InsightGenerator / PreferHighNoveltyEngines on; delete constituents; invent causal language; add a 5th AgentType; push master; regenerate OpenAPI unless the payload registry forces a contract snapshot (prefer not).

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DecisionGradeFusion|FullyQualifiedName~ChecklistCluster|FullyQualifiedName~GoldenCorpusHarnessEngineInventory|FullyQualifiedName~BuiltInFindingEngineTypeCatalog"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~InsightDensityPreferredEngineTypes"

Done when: two distinct preferred Decision-grade findings that share a node produce one fused row; constituents remain; catalog/DI/reference updated; FINDING_ENGINE_OUTPUT_REFERENCE.md has no conflict markers; golden inventory identity still holds.
```

---

# DX-52 — Held-check ledger (missing-input attribution)

**Closes:** Strategy Workstream 3 “Finalize stamp / measurement floor” remainder after DX-15. `InsightDensityMeasurementFloorPresenter` reports catalog / harness / measured-this-run counts and skipped **actor** engine types. Engines already fail closed (`return []`) when inventory, RBAC bindings, or rotation metadata are missing — but the operator is not told *which single missing input would make the most silent engines decidable*. That is an adoption lever: “upload the Azure inventory ZIP and seven held checks become decidable.”
**Depends on:** DX-15 shipped
**Branch suggestion:** `cursor/dx-52-held-check-ledger`

### Design intent

Attribution, not a new engine. Introduce a small closed set of **held-check input codes** (inventory ZIP by cloud, actor nodes, RBAC/IAM bindings, secret rotation metadata, replica/failover properties, NSG/NetworkPolicy rules, prior-run snapshot, assigned policy pack). Each engine that currently `return []` on missing input records `(EngineType, InputCode)` when it would have analyzed had the input been present. Roll up on the measurement floor: rank input codes by how many engines they unblock. Do **not** emit findings for missing inputs (that would be a coverage engine). Do **not** change fail-closed behavior.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: attribute silent fail-closed engine exits to a closed set of missing-input codes and surface a ranked “upload X to unblock N engines” rollup on the existing measurement floor. Do not add EngineType. Do not emit findings for missing inputs. Do not change DeterministicInsightDensityGate.

Why: DX-15 tells the operator how many engines ran vs catalog. It does not say which one file would make the silent path/contradiction engines decidable. That conversion of “we found nothing” into a second-pass numerator is the cheapest remaining density lever.

Read first:
- ArchLucid.Decisioning/Findings/InsightDensityMeasurementFloorPresenter.cs
- ArchLucid.Decisioning/Findings/InsightDensityMeasurementFloorContext.cs (or equivalent context type next to the presenter)
- ArchLucid.Decisioning.Tests/Findings/InsightDensityMeasurementFloorPresenterTests.cs
- archlucid-ui/src/lib/quality/insight-density-measurement-floor.ts
- archlucid-ui/src/components/reviews/RunDetailInsightDensityMeasurementDenominatorStrip.tsx
- Actor-dependent skip derivation already in InsightDensityMeasurementFloorContext.DeriveSkippedActorEngineTypes
- Path engines that return []: IdentityBlastRadiusFindingEngine, SegmentationSemanticsFindingEngine, DrRpoTopologyFindingEngine, DataFlowTrustBoundaryFindingEngine, SecretsLifecycleFindingEngine, OpenCommitmentFindingEngine, DeclarationInventoryContradictionFindingEngine, PolicyDeclarationInventoryContradictionFindingEngine, inventory/orphan/cost engines
- FindingAnalysisContext (where to hang a collector without a static ambient)
- docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md (claimBoundary — this is not a finding)

Work:

1. Closed enum / static codes (own file in ArchLucid.Core/Findings/):
   HeldCheckInputCode: AzureInventoryZip, AwsInventoryZip, GcpInventoryZip, ActorNodes, RbacBindings, SecretRotationMetadata, ReplicaOrFailoverProperties, NetworkPolicyRules, PriorRunSnapshot, AssignedPolicyPack
   Exhaustive switch in any mapper. Do not add “Unknown” that engines dump into.

2. Collector (own file): IHeldCheckLedger (or a list on FindingAnalysisContext) with Record(engineType, inputCode). Thread through AnalyzeAsync via FindingAnalysisContext — do not use AsyncLocal or static mutable. If FindingAnalysisContext is a record, add an optional IHeldCheckLedger property; engines no-op when it is null (golden harness stays silent).

3. Instrument fail-closed exits without changing when they fire. For each engine in the read list, at every `return []` that means “input missing” (not “analyzed and nothing wrong”), call ledger.Record(EngineType, code) then return []. Do not record on the happy empty path (e.g. inventory present and no orphans). XML-comment the distinction at each site. Prefer a one-line helper HeldCheckLedger.TryRecord(context, engineType, code) so null ledger is safe.

   Suggested mapping (adjust only if the engine’s actual early-return is different — read the method):
   - orphaned-* / *-inventory-reconciliation / *-inventory-security-baseline / *-cost-recommendation / secrets-lifecycle → matching *InventoryZip (and SecretRotationMetadata for secrets-lifecycle when the ZIP exists but rotation/expiry fields are absent)
   - identity-blast-radius / privileged-access / external-exposure / trust-boundary → ActorNodes (already partially in DeriveSkippedActorEngineTypes — reuse that code rather than forking)
   - identity-blast-radius also RbacBindings when actors exist but no role edges
   - segmentation-semantics / data-flow-trust-boundary → NetworkPolicyRules when graph has nodes but no NSG/NetworkPolicy rule properties
   - dr-rpo-topology → ReplicaOrFailoverProperties
   - requirement-cross-run-diff / topology-cross-run-diff / portfolio-recurrence when disabled-or-no-prior → PriorRunSnapshot
   - policy-declaration-inventory-contradiction when no assigned pack → AssignedPolicyPack

4. Presenter: extend InsightDensityMeasurementFloorPresentation with IReadOnlyList<HeldCheckLedgerEntry> (InputCode, EngineCount, EngineTypes). Rank by EngineCount desc then InputCode ordinal. Sentence may add one clause: “Uploading Azure inventory would unblock 7 engines” when the top code has EngineCount ≥ 2; omit the clause when the ledger is empty so existing DX-15 copy tests stay stable. Do not mention novelty rates.

5. UI: measurement-floor strip already exists — add a compact ranked list (codes as operator nouns: “Azure inventory ZIP”, not enum names). Advisory only. Keep typed-engine-protected / measurement floor / advisory markers for check_insight_density_advisory_surfaces.py.

6. Tests:
   - secrets-lifecycle with no inventory ZIP records SecretRotationMetadata or AzureInventoryZip (whichever the engine actually returns on) and emits no finding
   - identity-blast-radius with zero actors records ActorNodes
   - contradiction engine with inventory present and no mismatch does NOT record AzureInventoryZip
   - Presenter ranks two codes; sentence includes unblock clause only when top count ≥ 2
   - UI unit/Vitest if a test file already covers the strip; otherwise presenter tests are enough
   - Golden corpus: engines must still return [] the same way — do not add findings. Re-record distribution only if counts change (they should not).

7. claimBoundary: held-check codes are missing-input attribution, not findings, not a named-model beat, not SOC 2 Type II.

Do not: add EngineType; emit “inventory missing” findings; change DX-01 predicate; default LLM flags on; push master; regenerate OpenAPI unless you add a run-detail DTO field (if you do, follow OPENAPI_CONTRACT_DRIFT.md and include the floor object only).

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityMeasurementFloor|FullyQualifiedName~HeldCheck|FullyQualifiedName~IdentityBlastRadius|FullyQualifiedName~SecretsLifecycle"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~HeldCheck|FullyQualifiedName~SecretsLifecycle|FullyQualifiedName~Orphaned"

Done when: silent fail-closed exits record a closed input code; the measurement floor ranks which upload unblocks the most engines; no new findings appear on missing-input graphs.
```

---

# DX-53 — Portfolio shared-topology join

**Closes:** Strategy Workstream 1D remainder after DX-11. `PortfolioRecurrenceFindingEngine` matches the **same finding identity** across systems (ADR 0063 merge key). It does not report that two architectures in the same tenant catalog resolve to the **same live resource** (Key Vault, VNet, subscription) while declaring incompatible posture (PCI RPO 15 min vs a sandbox). Shared infrastructure is information a chat session structurally cannot have.
**Depends on:** DX-11 shipped (`portfolio-recurrence` default on); DX-51 preferred so fusion can join this row later
**Branch suggestion:** `cursor/dx-53-portfolio-shared-topology`

### Design intent

Contradiction, not coverage. New `EngineType` **`portfolio-shared-topology`**. Effectful, tenant-catalog scoped (ADR 0037). Reuse `IPortfolioRunScanSource` / latest-committed-system scan from `PortfolioRecurrenceFindingEngine`. Match on product-shaped inventory resource ids (`FindingEvidenceRefs.TryFormatInventoryResourceId`) collected from this run’s graph node property bags **and** from other systems’ sealed graphs — not on labels. Emit only when the shared node’s **security/DR posture disagrees** (public vs private, replica vs none, RPO requirement vs none). Cap systems scanned like recurrence. Default **off** (`Enabled = false`) until the owner turns it on for Real pilot tenants — cross-run I/O is the same cost profile as recurrence; do not surprise tenants. Fail closed with no other committed systems, no product-shaped ids, or identical posture.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add effectful EngineType portfolio-shared-topology that reports when this run and another committed system in the same tenant catalog share a product-shaped inventory resource id and disagree on security or DR posture. Default the engine OFF. Do not change portfolio-recurrence. Do not scan other tenants (ADR 0037). Do not add a coverage engine.

Why: Recurrence joins the same finding identity. Shared Key Vault / VNet / subscription across a PCI architecture and a sandbox is a different information source — the tenant’s other architectures. Chat sessions cannot see that.

Read first:
- ArchLucid.Application/Findings/PortfolioRecurrenceFindingEngine.cs
- ArchLucid.Application/Findings/PortfolioRecurrence/ (IPortfolioRunScanSource, options resolver, Enabled flag)
- ArchLucid.Core/Findings/FindingEvidenceRefs.cs (TryFormatInventoryResourceId, TryCollectFromNodeProperties)
- ArchLucid.Decisioning/Findings/FindingGraphEvidenceRefs.cs
- ArchLucid.Application.Tests/Findings/PortfolioRecurrenceFindingEngineTests.cs
- ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs
- ArchLucid.Core/Findings/InsightDensityPreferredEngineTypes.cs
- GoldenCorpusHarnessEngineInventory (effectful engines often absent-with-reason — follow that if the harness cannot supply a second committed system)
- docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md
- HOLD_NO_COVERAGE_ENGINES.md (contradiction exception)

Work:

1. Options: PortfolioSharedTopologyFindingOptions with Enabled default false, MaxSystemsScanned copied from recurrence’s default. Resolver parallel to IPortfolioRecurrenceFindingOptionsResolver. Do not change recurrence Enabled.

2. Engine PortfolioSharedTopologyFindingEngine : IEffectfulFindingEngine, EngineType "portfolio-shared-topology", Category "Topology".
   - If !Enabled or no scope → []
   - Collect product-shaped resource ids from this GraphSnapshot node bags (FindingGraphEvidenceRefs / TryFormatInventoryResourceId). Label-only node ids → skip that node.
   - Scan latest committed systems via existing IPortfolioRunScanSource (same tenant catalog). Skip the current run id.
   - For each other system, load its sealed graph or inventory resource-id set through an existing query port if one exists; do not add a cross-tenant connection string. If no port can return resource ids without a large new read model, add a narrow IPortfolioSharedResourceIndex (tenant-scoped) populated at finalize from already-computed EvidenceRefs / ARM ids — SQL in the tenant catalog only, numbered migration + ArchLucid.sql + rollback. Index columns: TenantId, WorkspaceId, SystemId, RunId, ResourceIdNormalized, PostureCode, CreatedUtc. Unique (TenantId, ResourceIdNormalized, SystemId).
   - PostureCode: small closed set from properties already on the node (PublicNetworkAccess, HttpsOnly, HasGeoReplica / equivalent DR bag keys the DR engine already reads). Unknown posture → do not emit (fail closed, do not invent).
   - Emit when the same ResourceIdNormalized appears in this run and another system AND PostureCode differs. Finding RelatedNodeIds = this run’s node; EvidenceRefs = the ARM/ARN; payload includes OtherSystemId, OtherRunId, ThisPosture, OtherPosture.
   - Title: "Shared resource {resourceId} disagrees on {posture} with system {otherSystemId}" — no causal verb.
   - Cap: MaxSystemsScanned; max findings 8 per snapshot.

3. Catalog / DI / preferred list / FINDING_ENGINE_OUTPUT_REFERENCE.md row. Catalog becomes 52 if DX-51 already merged, else 51 — read EngineTypeIds.Count at start. InsightDensityPreferredEngineTypes: add "portfolio-shared-topology".
   Harness: absent-with-reason "effectful cross-system index; not in single-snapshot corpus" unless you can pin two synthetic systems in a unit test only (preferred). Do not add a weak golden that expects this engine on case-01.

4. Tests:
   - Disabled → []
   - Two systems, same ARM id, Public vs Private → one finding
   - Two systems, same ARM id, same posture → []
   - Two systems, label-only node ids (storage-1) → [] (DX-50)
   - Other tenant’s id must be unreachable (scope filter) — assert the scan source is called with current ScopeContext only
   - Enabled false in Simulator host defaults

5. claimBoundary: tenant-catalog only; not live cloud polling; not a named-model beat; default off.

Do not: default Enabled true; join on finding identity (that is recurrence); invent posture; scan master catalog; push master; change DX-01 predicate.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~PortfolioSharedTopology|FullyQualifiedName~PortfolioRecurrence"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~BuiltInFindingEngineTypeCatalog|FullyQualifiedName~GoldenCorpusHarnessEngineInventory"

Done when: shared product-shaped resource + disagreeing posture emits one finding; labels and identical posture stay silent; default off; ADR 0037 preserved.
```

---

# DX-54 — Frontier-baseline harness (instrument only)

**Closes:** Strategy Workstream 4 remainder after DX-20. Capture schema and `scripts/capture_insight_density_frontier.py` exist. `InsightDensityFrontierDeltaCalculator` plus three hand-authored scenarios in `docs/quality/insight-density-frontier-delta.md` are a **regression** instrument, not a ship gate. Live architectures are owner-blocked (**G-REAL-06**). The measuring device can still be built so that when pilot ZIPs arrive they slot in without inventing transcripts.
**Depends on:** DX-20 shipped
**Branch suggestion:** `cursor/dx-54-frontier-baseline-harness`

### Design intent

Measurement only. No new engine. Extend the DX-20 schema with an explicit `frontierBaseline.source` of `human-authored` | `pilot-pending` | `empty` — **not** `named-model`. Add a CI job (or extend `scripts/ci/insight_density_frontier_delta.py`) that: (1) validates capture JSON against the schema, (2) computes novelty via `InsightDensityFrontierDeltaCalculator`, (3) fails the job only when a `synthetic` fixture’s novelty drifts from `expectedNoveltyPercentage` (today’s regression). `pilot-pending` fixtures with empty baseline must **pass** CI (idle). Document the ship-gate numbers (≥40% novel, ≥80% human “would change decision”) as **owner-applied after G-REAL-06**, not as a CI fail tonight. Forbidden: checking in fake GPT/Claude transcripts (`INSIGHT_DENSITY_MISS_CLAUSE.md`).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make the frontier-delta instrument accept idle pilot-pending captures and document the owner ship-gate, without adding named-model transcripts or a new engine. Do not fail CI on missing live pilots.

Why: Workstream 4 cannot prove density until G-REAL-06, but the harness should not have to be invented the week pilots land. DX-20 schema + three synthetic scenarios already exist.

Read first:
- docs/quality/fixtures/insight-density-frontier-capture.schema.json
- docs/quality/insight-density-frontier-delta.md
- docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md (forbidden fake transcripts)
- scripts/ci/insight_density_frontier_delta.py
- scripts/capture_insight_density_frontier.py
- ArchLucid.Decisioning/Findings/InsightDensityFrontierDeltaCalculator.cs
- ArchLucid.Decisioning.Tests/Findings/InsightDensityFrontierDeltaCalculatorTests.cs
- tests/eval-corpus/insight-density-frontier-capture/
- docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md Workstream 4 (20–30 frozen architectures, ≥40% novel, ≥80% human would-change-decision)

Work:

1. Schema: add frontierBaseline.source enum human-authored | pilot-pending | empty (required). Keep label synthetic | pilot-pending. Add optional humanWouldChangeDecisionCount / humanWouldChangeDecisionSampleSize (integers, for later G-REAL-06; CI must not require them). expectedNoveltyPercentage stays required for synthetic; for label=pilot-pending allow omitting it (or null) so idle fixtures do not invent a number.

2. Validator / calculator: synthetic fixtures still must match expectedNoveltyPercentage within the existing 0.60 Jaccard threshold. pilot-pending + empty baseline → novelty 100% or “idle”; CI outcome PASS. Do not generate baseline findings.

3. Docs: insight-density-frontier-delta.md — keep the three synthetic rows; add a “Ship gate (owner, after G-REAL-06)” section that states ≥40% novel vs committed human-authored baseline AND ≥80% of sampled Decision-grade findings marked DidNotThinkOfThat or human would-change-decision — and that this section is not a CI required check today. claimBoundary: not a named-model beat.

4. capture script: when writing pilot-pending, set frontierBaseline.source=empty and do not invent findings. Keep --dev-only.

5. Tests: schema unit tests for the new enum; calculator idle case; python tests for the CI script if test_insight_density_frontier_delta.py exists. Do not add eval-corpus JSON that lists GPT/Claude/Opus as the author.

6. Do not wire this as a merge-blocking required GitHub check for pilot-pending emptiness. Synthetic regression may stay in the existing workflow if it already is.

Do not: check in fake named-model transcripts; add EngineType; default LLM flags on; claim ArchLucid beats GPT; push master; fail CI because G-REAL-06 is empty.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityFrontierDelta"
python scripts/ci/tests/test_insight_density_frontier_delta.py

Done when: synthetic fixtures still regress; an idle pilot-pending capture with empty baseline is valid and CI-green; ship-gate numbers are documented as owner-applied; no named-model transcripts exist.
```

---

# DX-55 — Prose assumption extraction (Real-mode)

**Closes:** Strategy Workstream 1B remainder — “materialize actors from declarations” shipped as DX-03 for IaC identity; narrative Word/Confluence assumptions (“the payment provider owns PCI scope,” “traffic never leaves the VNet”) are still not contradictable against graph/inventory. That is an information-source change, not a coverage engine.
**Depends on:** DX-51 shipped (extracted assumptions should be fusion-eligible once they become Decision-grade); DX-10 shipped (InsightGenerator / faithfulness validator pattern)
**Branch suggestion:** `cursor/dx-55-prose-assumption-extraction`

### Design intent

New information source. Prefer **no new `AgentType`** (DX-10 rule): a Real-mode-only extractor behind `InsightDensityGateOptions.EnableProseAssumptionExtraction` default **false**, using the existing Premium deployment and faithfulness validator. Inputs: in-batch documents already on the package (`doc:` citations). Outputs: candidate **assumption** records with `doc:path#L` evidence refs, then a **deterministic** contradiction pass against declaration/inventory/graph (reuse `DeclarationPremiseConflictFindingEngine` themes / `DeclarationInventoryContradictionAnalyzer` where the assumption maps to an existing logical property). Unmapped prose → no finding (R5). Simulator ignores the flag. Do not emit the raw LLM sentence as a Decision-grade finding without the contradiction pass.

### Owner unpark (required)

Paste this and **wait**. Do not implement until the owner answers `ok` / `yes` or “unpark DX-55”.

```text
DX-55 spends Real-mode Premium tokens to extract assumptions from in-batch prose and contradict them against the graph. Default stays off. Reply yes / ok to unpark DX-55 for this request only.
```

### Prompt (copy below) — run only after unpark + DX-51 on master

```text
OWNER-GATED — stop if the owner has not unparked DX-55, or if EnableInsightGenerator-style Premium spend is not acceptable on this tenant path. You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: extract architecture assumptions from in-batch prose documents and emit findings only when a deterministic contradiction against declaration/inventory/graph succeeds. Default the flag OFF. No 5th AgentType. Do not change DeterministicInsightDensityGate.

Why: IaC identity materialization (DX-03) does not read “payment provider owns PCI scope” from a Word doc. That sentence is contradictable against a public datastore path.

Read first:
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs (add EnableProseAssumptionExtraction default false next to EnableInsightGenerator)
- ArchLucid.Decisioning/Services/InsightGeneratorFindingEngine.cs (Real-mode, evidence-bound, cap)
- Premium / faithfulness validator used by InsightGenerator (do not fork a second validator)
- DeclarationPremiseConflictFindingEngine
- DeclarationInventoryContradictionAnalyzer
- GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation (doc:…#L already counts — DX-50)
- CONTEXT_INGESTION.md (which document types are already in-batch)
- HOLD_NO_COVERAGE_ENGINES.md (information source, not node-missing)

Work:

1. Flag EnableProseAssumptionExtraction default false. Simulator short-circuits to [] regardless of flag (mirror InsightGenerator). Cap extracted candidates (suggest 8) and cap emitted contradiction findings (suggest 8).

2. Extractor (own class): given in-batch text documents, Premium completion with a bounded prompt that may ONLY quote spans from the provided documents. Each candidate: statement, doc: path + line, optional mapped logical property name from DeclarationSecurityPropertyLogicalNames. Faithfulness validator must reject candidates whose span is not in the document. Unmapped statement (no logical property) → keep as assumption record but do not emit a finding.

3. Contradiction pass (deterministic, own class): for mapped candidates, reuse existing analyzers. Emit EngineType — prefer extending declaration-premise-conflict with a payload Source = "prose-assumption" rather than a new EngineType. If a new EngineType is unavoidable, stop and ask (this prompt prefers zero new EngineType). EvidenceRefs must include the doc: citation AND any ARM/ARN the analyzer already had.

4. Tests: Simulator + flag true → []; Real-mode flag false → []; document contains “must not be public” + inventory public on matching node → one finding with doc: EvidenceRefs; document with no mappable span → []; faithfulness reject when the model quotes a line not in the doc (unit-test the validator hook with a stubbed completion).

5. claimBoundary: Real-mode opt-in; not first-review default; not a named-model beat; not SOC 2 Type II.

Do not: default the flag on; add AgentType; emit unmapped prose as Decision-grade; skip faithfulness; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~ProseAssumption|FullyQualifiedName~InsightGenerator|FullyQualifiedName~DeclarationPremise"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~InsightDensityGateOptions"

Done when: only mapped, faithfulness-valid, deterministically contradicted assumptions emit; default off; Simulator silent.
```

---

# DX-56 — Verification-calibrated engine priors

**Closes:** Strategy Workstream 1H / ADR 0062 remainder after TB-2034. Gate penalties (−35 generic, −25 no evidence, −15 no anchor) are hand-tuned. Per-engine `Materialized` / `Mitigated` rates from append-only verification reports are an empirical prior for judge-cap ordering and (optionally) a **bounded** score adjustment. This is precision, not a new engine.
**Depends on:** TB-2034 scoring in production with real reports; DX-23 novelty-rate plumbing
**Branch suggestion:** `cursor/dx-56-verification-engine-priors`

### Design intent

Reuse `IFindingInsightSignalRepository` / novelty-rate lookup shape (DX-23) for **verification confirmed-rate by EngineType** in the current tenant catalog. Minimum-sample floor (suggest **n ≥ 20** verifiable findings per engine, excluding `NotVerifiable` from the denominator — same basis as TB-2035). Below floor → treat as “no prior” (do not suppress a rarely-firing engine). Use the prior only to **rank** judge-cap / InsightGenerator candidates (extend `InsightDensityJudgeCandidateSelector` / `PreferHighNoveltyEngines` pattern with `PreferHighVerificationEngines` default **false**). Do **not** auto-demote engines with low confirmation in v1 of this prompt — that needs owner unpark later. Do not write rates into buyer copy.

### Owner unpark (required)

```text
DX-56 reads tenant verification reports to rank engines in the Premium judge cap. It needs TB-2034 volume (n ≥ 20 verifiable results per engine or the engine is skipped). Default stays off. Reply yes / ok to unpark DX-56 for this request only.
```

### Prompt (copy below) — run only after unpark + TB-2034 reports exist

```text
OWNER-GATED — stop if TB-2034 has no tenant reports, or if the owner has not unparked DX-56. You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: compute per-engine confirmed rate (Materialized+Mitigated)/(total−NotVerifiable) from FindingVerificationReports in the current tenant catalog, and use it only to rank judge-cap candidates when PreferHighVerificationEngines is true. Default the flag false. Do not change the DX-01 demotion predicate. Do not auto-demote low-confirmation engines. Do not add EngineType.

Why: Hand-tuned gate penalties cannot learn. TB-2035 already defined the confirmed-rate basis. DX-23 already ranks by novelty. Verification rate is a better internal ranking signal once volume exists.

Read first:
- ArchLucid.Application/Findings/FindingVerification/FindingVerificationReportConfirmedRateCalculator.cs
- ArchLucid.Core/Findings/IAppendOnlyFindingVerificationReportRepository.cs
- ArchLucid.AgentRuntime/InsightDensityNoveltyRateLookup.cs
- ArchLucid.AgentRuntime/InsightDensityJudgeCandidateSelector.cs
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs (PreferHighNoveltyEngines — copy that shape)
- ArchLucid.Api/Controllers/Findings/InsightDensityNoveltyRatesController.cs (operator measurement — optional sibling GET, not buyer copy)
- docs/architecture/adrs/0062-finding-verification-loop.md

Work:

1. Options: PreferHighVerificationEngines default false, VerificationPriorMinSample default 20, VerificationPriorWindowDays default 90. Simulator ignores the flag.

2. Lookup (own class, parallel to novelty lookup): tenant-scoped SQL aggregating verification results joined to finding EngineType (if EngineType is not on the result row, join via FindingId to the source findings snapshot — fail closed / skip that result when EngineType is unknown). Confirmed rate null when verifiable denominator < MinSample.

3. JudgeCandidateSelector: when both PreferHighVerificationEngines and EnableLlmJudgeForEngineFindings, sort by verification rate desc then existing preferred-engine / novelty / severity order. Missing prior → sort as 0.5 (neutral), not 0 (do not bury new engines).

4. Do not feed the rate into DeterministicInsightDensityGate scores in this prompt.

5. Tests: n=19 → null prior; n=20 with 10 Materialized + 5 Mitigated + 5 NotVerifiable → rate 15/15 = 1.0; NotVerifiable excluded; selector with flag false unchanged; flag true puts high-rate engine first; other tenant’s reports are invisible (scope).

6. claimBoundary: internal ranking; not a buyer “X% of findings confirmed” claim (that is TB-2037); not SOC 2 Type II.

Do not: default the flag on; auto-demote; write rates into golden distribution markdown; push master; skip the min-sample floor.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~JudgeCandidate|FullyQualifiedName~VerificationPrior|FullyQualifiedName~NoveltyRate"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~FindingVerificationReportConfirmedRate"

Done when: engines below min-sample are neutral; engines at/above min-sample rank the judge cap when the flag is on; defaults stay off; no buyer copy change.
```

---

## Held (do not duplicate)

Live frontier **pilot-pending** captures need owner **G-REAL-06** runs. DX-54 builds the instrument; it must not invent named-model transcripts. Graph-RAG buyer claims need ADR 0057 owner override + **TB-883** ablation.

Workstream 2 remainder: **`EnableProseAssumptionExtraction` default-on** stays owner-gated (DX-57 flipped ranking priors and the insight generator, not prose extraction). GTM cohorts **M-90 / M-44 / M-91 / M-92**, SOC 2 CPA (**G-REAL-05**), and third-party pen test (**G-ASSURANCE-02**) stay off the engineering batch list.

**TB-2035** (verification report export) is a separate backlog row — do not re-implement export in DX-56.

Coverage-shaped engines (observability completeness, capacity planning, IAM depth as node-exists) remain held until **G-REAL-06**.

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- DX-01–DX-16: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- DX-17–DX-28: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)
- DX-29–DX-35: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md)
- DX-36–DX-41: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md)
- DX-42–DX-46: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md)
- DX-47–DX-50: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md)
- Next **DX-58–DX-62:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
- Miss clause: [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)

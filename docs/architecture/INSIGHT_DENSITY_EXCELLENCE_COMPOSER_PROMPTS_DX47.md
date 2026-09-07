> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-46**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run; **DX-18**/**DX-19** still held) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) (**DX-36–DX-41** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) (**DX-42–DX-46** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-47–DX-50)

**Created:** 2026-09-07 · **Status:** Ready to run. One prompt per chat.

DX-01–DX-46 shipped on `master` (2026-09-07) except **DX-18** (TB-885 hold) and **DX-19** (ADR 0062 / TB-2033 hold). Latest golden case is **`case-57`**. Harness registers **38** engines; catalog has **50**; **12** absent-with-reason. This set closes the **remaining Cursor-implementable** density holes after DX-42–DX-46: honest `EvidenceRefs` on cost-recommendation and path engines DX-45 left empty, golden cases that prove DX-42 Pulumi/CloudFormation/CDK ingest actually feeds path/contradiction engines, harness registration for three absent-with-reason engines that only need fixtures, and (owner-gated) Workstream 2 tightening of `HasConcreteEvidenceCitation`.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-16** | Gate, Real judge, actor expansion, contradiction/path engines, InsightGenerator, recurrence, ITSM, novelty signal, harness, measurement floor, starter catalog |
| **DX-17, DX-20–DX-28** | Community summaries, frontier capture schema, judge-cap priority, checklist synthesis, novelty-rate API, dangling refs, SKU/tier, counterfactual, nested ingest, path-engine goldens |
| **DX-29–DX-35** | Golden depth, Helm/Kustomize/`.bicepparam`, TF modules/OIDC/DNS, data-flow × trust-boundary, three-way pack contradiction, preferred-engine catch-up, optional novelty-rate judge sort |
| **DX-36–DX-41** | Harness data-flow/three-way, ARM `templateLink`, novelty→InsightGenerator, pack-gated graph/inventory security, Azure inventory goldens (`case-48`–`case-50`), docs honesty |
| **DX-42–DX-46** | Pulumi/CloudFormation/CDK in-batch ingest, five-theme three-way contradiction, AWS/GCP inventory goldens (`case-51`–`case-54`), honest `EvidenceRefs` on inventory/orphan/contradiction/coverage/secrets-lifecycle, Advisor/AWS/GCP cost goldens (`case-55`–`case-57`) |
| Coverage-only engines | Still forbidden. This set adds **no** new `EngineType`. **DX-49** only registers three catalog engines that already exist. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-47** | Honest `EvidenceRefs` remainder (cost + path engines) | Yes | DX-45 shipped | Precision (dismiss honesty) |
| **DX-48** | Golden fixtures proving DX-42 ingest feeds density engines | Yes | DX-42 shipped | Measurement |
| **DX-49** | Golden harness for three absent-with-reason engines | After DX-48 preferred | engines already shipped | Measurement |
| **DX-50** | Tighten `HasConcreteEvidenceCitation` (Workstream 2) | **OWNER-GATED** — after DX-47 | DX-47 shipped | Precision |

**Start DX-47 and DX-48 now** (independent). Start **DX-49** after DX-48 if you share `case-NN` numbers, or in parallel if you pick unused numbers after checking `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` (currently **57**). **Do not start DX-50** until the owner explicitly unparks Workstream 2 remainder in this conversation (or a later message that names **DX-50**). Prerequisite for DX-50 is **DX-47 shipped** so path/cost findings already carry ARM/ARN citations when the package has them.

**Do not start from this document:** **DX-18** / **DX-19** (held until the owner unparks **TB-885** / **TB-2033**), **DX-50** until the owner unparks it, a Pulumi or CDK **compiler** / live `pulumi up` / `cdk synth`, live extractor-as-default (product/GTM), fake named-model frontier transcripts, Graph-RAG buyer claims (ADR 0057 / TB-883), SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType` enum value, turning `PreferHighNoveltyEngines` or the LLM judge **on by default**. DX-47 must **not** change `HasConcreteEvidenceCitation` prefixes (that is DX-50, owner-gated).

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). Effectful engines use `IScopeContextProvider`.
- **New finding engine checklist** (all four or `BuiltInFindingEngineTypeCatalogTests` fails) — **this set should not add engines**. If a prompt forces you to, stop and ask.
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
- Golden cases: start after **`case-57`**. Read `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` at the start of any golden prompt.

---

# DX-47 — Honest EvidenceRefs remainder (cost-recommendation + path engines)

**Closes:** DX-45 populated `Finding.EvidenceRefs` on inventory, orphan, recon, contradiction, declaration-security, secrets-lifecycle, and coverage engines that already had ARM/ARN/policy ids. It did **not** touch `advisor-cost-recommendation`, `aws-cost-recommendation`, `gcp-cost-recommendation`, `identity-blast-radius`, `segmentation-semantics`, `dr-rpo-topology`, or `data-flow-trust-boundary`. Cost engines already parse `advisor-cost.json` / cost-recommendation JSON that often carries `resourceId` / ARN. Path engines already set `RelatedNodeIds` and write `evidence:graph-node:{id}` into `Trace.Notes`, but `EvidenceRefs` stay empty and those synthetic `graph-node:` labels are not package-resolvable ARM/ARN. `secrets-lifecycle` **already** calls `FindingEvidenceRefs.TryAppendInventoryResourceId` — do **not** re-work it.
**Depends on:** DX-45 shipped
**Branch suggestion:** `cursor/dx-47-evidence-refs-remainder`

### Design intent

Same design intent as DX-45: dismiss honesty, not a new engine and not a gate rewrite. Copy **genuine** resolvable refs the engine already computed into `EvidenceRefs` using prefixes `HasConcreteEvidenceCitation` already accepts. Cost engines: format the inventory resource id from the Advisor/cloud cost JSON row via `FindingEvidenceRefs.TryAppendInventoryResourceId` (same helper DX-45 added). Path engines: call `FindingGraphEvidenceRefs.CollectFromNodeIds` on the related path nodes and copy ARM/ARN/`projects/` values from those nodes’ property bags when present. Do **not** copy bare `graph-node:{label}` synthetic refs onto `EvidenceRefs`. Do **not** change `GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation` (Workstream 2 / **DX-50**).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: populate Finding.EvidenceRefs from identifiers the engine already has on (1) advisor-cost-recommendation / aws-cost-recommendation / gcp-cost-recommendation and (2) identity-blast-radius / segmentation-semantics / dr-rpo-topology / data-flow-trust-boundary. Do not change DeterministicInsightDensityGate. Do not change HasConcreteEvidenceCitation. Do not add EngineType. Do not re-touch secrets-lifecycle (DX-45 already did).

Why: DX-45 made inventory/orphan/contradiction/coverage dismiss scoring honest. Median-60 cost rows and path-engine rows still leave EvidenceRefs empty. Advisor/cloud cost JSON already has resourceId / ARN on many rows. Path engines already know RelatedNodeIds and write evidence:graph-node: into Trace.Notes; those labels are not package-resolvable. FindingGraphEvidenceRefs already collects ARM/ARN from node property bags for coverage engines — reuse it.

Read first:
- ArchLucid.Core/Findings/FindingEvidenceRefs.cs (TryAppendInventoryResourceId, TryFormatInventoryResourceId, TryCollectFromNodeProperties)
- ArchLucid.Decisioning/Findings/FindingGraphEvidenceRefs.cs (CollectFromNodeIds — coverage engines already use this)
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (HasConcreteEvidenceCitation — do not edit prefixes)
- ArchLucid.Application/Findings/AdvisorCostRecommendationFindingEngine.cs
- ArchLucid.Application/Findings/CloudCostRecommendationFindingAnalyzer.cs (shared AWS/GCP mapper)
- ArchLucid.ArtifactSynthesis/Classifiers/ExtractorAdvisorCostClassifier.cs (AdvisorCostRecommendationFinding record — no ResourceId today)
- ArchLucid.Contracts/Findings/Payloads/AdvisorCostRecommendationFindingPayload.cs (do not add a payload field unless you must; EvidenceRefs is enough)
- ArchLucid.Decisioning/Services/IdentityBlastRadiusFindingEngine.cs (RelatedNodeIds + evidence:graph-node: Trace.Notes, empty EvidenceRefs)
- ArchLucid.Decisioning/Services/SegmentationSemanticsFindingEngine.cs
- ArchLucid.Decisioning/Services/DrRpoTopologyFindingEngine.cs
- ArchLucid.Decisioning/Services/DataFlowTrustBoundaryFindingEngine.cs
- ArchLucid.Application/Findings/SecretsLifecycleFindingEngine.cs (already calls TryAppendInventoryResourceId — leave it)
- ArchLucid.Core.Tests/Findings/FindingEvidenceRefsTests.cs
- ArchLucid.Application.Tests/Findings/AdvisorCostRecommendationFindingEngineTests.cs
- ArchLucid.Application.Tests/Findings/AwsCostRecommendationFindingEngineTests.cs
- ArchLucid.Decisioning.Tests/Services/IdentityBlastRadiusFindingEngineTests.cs
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (57)

Work:

1. Cost engines — resource id from advisor-cost.json / cost JSON:
   - Extend ExtractorAdvisorCostClassifier / AdvisorCostRecommendationFinding to carry an optional ResourceId when the row already has one. Read, in order, resourceMetadata.resourceId, resourceId, arn, then id/name only when TryFormatInventoryResourceId would accept it (ARM path with /subscriptions/ + resourceGroups/, arn:aws…, or projects/…). Skip recommendation-only ids that are not inventory-shaped (e.g. rec-1, advisor-cost-entry-0).
   - AdvisorCostRecommendationFindingEngine and CloudCostRecommendationFindingAnalyzer: FindingEvidenceRefs.TryAppendInventoryResourceId(evidenceRefs, resourceId) and set Finding.EvidenceRefs. Missing / non-product-shaped id → EvidenceRefs stay empty (do not invent, do not copy RecommendationId as ARM).
   - Do not regenerate OpenAPI. Do not add a payload ResourceId field unless a test cannot assert EvidenceRefs without it; EvidenceRefs is the gate input.

2. Path engines — collect from graph node property bags:
   - After RelatedNodeIds are known, List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectFromNodeIds(graphSnapshot, relatedNodeIds) (pass the GraphSnapshot into BuildFinding). Set Finding.EvidenceRefs = evidenceRefs.
   - That helper already walks azureResourceId / armResourceId / resourceId / arn / tf.id keys via TryFormatInventoryResourceId. Empty bag / label-only node ids → empty EvidenceRefs.
   - Do NOT append graph-node:{RelatedNodeId} to EvidenceRefs. Do NOT copy RelatedNodeIds as citations. Trace.Notes may keep evidence:graph-node: for operator explainability (DX-50 will stop counting those unless the remainder is ARM/ARN); do not add new synthetic graph-node refs to EvidenceRefs.

3. Tests (concrete types, null checks, no ConfigureAwait(false)):
   - Advisor cost JSON row with resourceMetadata.resourceId ARM path → EvidenceRefs contains that ARM id. Row with only id "rec-1" → EvidenceRefs empty.
   - AWS cost JSON row with arn:aws:… → EvidenceRefs contains aws:arn:…. GCP row with projects/… → EvidenceRefs contains that path.
   - IdentityBlastRadiusFindingEngine (and at least one other path engine): node property bag with resourceId ARM path → EvidenceRefs contains the ARM id. Fixture whose nodes have no ARM/ARN properties → EvidenceRefs empty (RelatedNodeIds unchanged).
   - secrets-lifecycle tests still pass; do not change that engine.
   - Golden corpus: if case-38..47 / case-55..57 scores change because EvidenceRefs now resolve, re-record those cases and docs/quality/insight-density-engine-distribution.md. Do not edit HasConcreteEvidenceCitation to force the old 60/100.

4. claimBoundary in FINDING_ENGINE_OUTPUT_REFERENCE.md: EvidenceRefs on cost/path engines are package citations from ids the JSON or graph already had, not a new information source. This does not tighten the citation helper (Workstream 2 remainder / DX-50). Do not claim SOC 2 Type II. Do not claim cost engines are first-review default.

Do not: change DX-01 demotion predicate; default PreferHighNoveltyEngines on; attach synthetic graph-node refs on EvidenceRefs; re-work secrets-lifecycle; push master; regenerate OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~CostRecommendation|FullyQualifiedName~AdvisorCost"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~IdentityBlastRadius|FullyQualifiedName~SegmentationSemantics|FullyQualifiedName~DrRpoTopology|FullyQualifiedName~DataFlowTrustBoundary|FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~FindingEvidenceRefs"

Done when: cost-engine unit tests assert a resolvable EvidenceRefs prefix when the JSON has an ARM/ARN; path-engine unit tests assert EvidenceRefs from node property bags and stay empty without them; secrets-lifecycle untouched; golden corpus green after any honest expected-file updates.
```

---

# DX-48 — Golden fixtures proving DX-42 ingest feeds density engines

**Closes:** DX-42 shipped in-batch parsers for `pulumi-stack-json`, `cloudformation`, and `cdk-synth`, with unit tests that CanonicalObjects appear. No golden case proves those formats drive **path** or **contradiction / declaration-security** engines. `case-37` is Terraform-shaped `tf.public_network_access`; `case-38`/`case-47` are hand-authored graphs, not parser output. Measurement still cannot show that a first-review ZIP of CloudFormation or Pulumi stack export would raise the numerator.
**Depends on:** DX-42 shipped
**Branch suggestion:** `cursor/dx-48-ingest-density-goldens`

### Design intent

Measurement only. Do not add an engine. Do not run `pulumi`, `cdk synth`, `node`, or `python`. Prefer a factory that **actually parses** DX-42 fixture content (`CloudFormationInfrastructureDeclarationParser` / `PulumiStackJsonInfrastructureDeclarationParser` / `CdkSynthInfrastructureDeclarationParser`) then maps `CanonicalObject`s through `GraphNodeFactory.CreateNode` (and `DeclarationIdentityActorMaterializer` when identity-shaped nodes exist). Do not hand-author property bags the parser would not emit. Plan **`case-58`+** (three cases so DX-49 can start at **`case-61`**).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add golden corpus cases starting at case-58 that prove DX-42 in-batch Pulumi / CloudFormation / CDK parsers produce graphs density engines actually fire on. At least two cases required; plan three so the next unused number for DX-49 is case-61. Do not add EngineType. Do not run pulumi, cdk synth, node, or python. Do not HTTP-fetch.

Why: DX-42 parsers have unit tests; insight-density-engine-distribution.md still has no case whose TopologyResource / Actor nodes came from cloudformation, pulumi-stack-json, or cdk-synth. Path and contradiction engines stay silent on those formats in the harness.

Read first:
- ArchLucid.ContextIngestion/Infrastructure/CloudFormationInfrastructureDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/CloudFormationTemplateParser.cs
- ArchLucid.ContextIngestion/Infrastructure/PulumiStackJsonInfrastructureDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/CdkSynthInfrastructureDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/InfrastructureDeclarationCloudResourceMapper.cs
- ArchLucid.ContextIngestion.Tests/CloudFormationInfrastructureDeclarationParserTests.cs
- ArchLucid.ContextIngestion.Tests/PulumiStackJsonInfrastructureDeclarationParserTests.cs
- ArchLucid.KnowledgeGraph/Mapping/GraphNodeFactory.cs
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityActorMaterializer.cs
- ArchLucid.Core/Findings/DeclarationSecurityPropertyKeyResolver.cs (keys the declaration-security / contradiction engines actually read)
- tests/golden-corpus/decisioning/case-37 (tf.public_network_access vs inventory — pattern for contradiction + pin)
- tests/golden-corpus/decisioning/case-33 (declaration-security-baseline)
- tests/golden-corpus/decisioning/case-38 (identity-blast-radius)
- tests/golden-corpus/decisioning/case-47 (data-flow-trust-boundary)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusMaterializerTests.cs (hand-authored record helpers)
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (57)
- docs/library/DECISIONING_GOLDEN_CORPUS.md

Work:

1. Factory (own file under ArchLucid.Decisioning.Tests/GoldenCorpus/): given in-batch declaration content + format, parse with the DX-42 parser, map each CanonicalObject through GraphNodeFactory.CreateNode, optionally run DeclarationIdentityActorMaterializer. Add a ContextIngestion ProjectReference to Decisioning.Tests only if needed (Host.Composition already pulls ingestion). Do not duplicate parser logic. Do not invent bag keys the parser did not emit.

2. Add three hand-authored cases (vary ids from unit tests; do not copy production account numbers). README names the EngineType and the DX-42 format:
   - case-58: CloudFormation declaration (format cloudformation) whose parser-emitted properties the declaration-security classifier or declaration-inventory-contradiction already reads (public access / HTTPS / equivalent scalar). Prefer contradiction with a pinned inventory ZIP (copy case-37 pin shape; CloudProvider Azure or Aws to match the resource). If CFN nested objects do not flatten to a key DeclarationSecurityPropertyKeyResolver understands, promote only a plain scalar the parser already copied — do not invent a CMK/NSG property. If contradiction still cannot fire honestly, declaration-security-baseline on the parser-emitted node is acceptable. Template with only Parameters and no Resources must not be a golden that expects a finding.
   - case-59: Pulumi stack-export JSON (format pulumi-stack-json) that materializes an identity-shaped node and a regulated datastore (or equivalent) so identity-blast-radius or data-flow-trust-boundary emits ≥1 finding when actors exist. Reuse IdentityPathAnalyzer / DataFlowTrustBoundaryPathAnalyzer unit-test topology (role edge, hops) only as overlay edges/nodes the parser cannot emit (Actor kind, CONNECTS_TO). Overlay must not invent parser properties. If the parser maps AWS::IAM::Role / azure-native identity / aws:iam:Role to TopologyResource and DeclarationIdentityActorMaterializer already seeds an Actor from those properties, prefer that over overlay.
   - case-60: CDK cdk.out/*.template.json (format cdk-synth) driving the path engine case-59 did not use (if case-59 is blast-radius, this is data-flow-trust-boundary, or the reverse). Same overlay rule. A .ts CDK app file must remain a parser no-op — do not add a golden that expects a finding from program source.

3. Record distribution markdown. Targeted EngineTypes must appear with Findings ≥ 1 on the new cases (they may already have findings from case-33/37/38/47 — the README must still name the DX-42 format as the source of the topology/declaration nodes). Update LatestGoldenCorpusCaseNumber and DECISIONING_GOLDEN_CORPUS.md. GoldenCorpusHarnessEngineInventoryTests: registered + absent = catalog count. Keep open-commitment / portfolio-recurrence disabled.

4. claimBoundary: in-batch synthesized artifacts only. Do not claim live Pulumi/CDK compile, remote template fetch, or CloudFormation change-set apply.

Do not: add a Pulumi/CDK SDK; HTTP-fetch; add EngineType; push master; regenerate OpenAPI; invent actor/datastore nodes whose properties contradict parser output.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter "FullyQualifiedName~Pulumi|FullyQualifiedName~CloudFormation|FullyQualifiedName~CdkSynth"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"

Done when: at least one CloudFormation-sourced case fires declaration-inventory-contradiction or declaration-security-baseline; at least one Pulumi or CDK-sourced case fires identity-blast-radius or data-flow-trust-boundary; case-01..case-57 still pass; LatestGoldenCorpusCaseNumber is 60 (or the last case you added if you needed fewer than three — then XML-comment why DX-49 should start after that number).
```

---

# DX-49 — Golden harness for three absent-with-reason engines (fixtures only)

**Closes:** `GoldenCorpusHarnessEngineInventory.AbsentReasons` still lists `topology-anti-pattern` (“richer topology fixtures than case-01..case-50”), `security-baseline-expectation` (“declaration fixtures beyond default graphs”), and `required-capability-coverage` (“inventory-shaped graph not in corpus”). All three are **already catalog engines** with unit tests (`TopologyAntiPatternFindingEngineTests`, `TopologyWaveFindingEngineTests.SecurityBaselineExpectationFindingEngine_WhenCategoryUnprotected_EmitsFinding`, `RequiredCapabilityCoverageAnalyzerTests`). They are not cross-run diffs and not real-mode LLM engines. `requirement-gap` / `*-cross-run-diff` / `insight-generator` / `cost-breach` / `policy-applicability` stay absent.
**Depends on:** none (engines shipped); run after DX-48 if you share `case-NN` numbers
**Branch suggestion:** `cursor/dx-49-absent-engine-goldens`

### Design intent

Measurement only. One golden case per engine minimum, starting at **`case-61`** if DX-48 took `case-58`–`case-60`. Register the three engines in `GoldenCorpusHarness.CreateEngines()` and `GoldenCorpusHarnessEngineRegistration.RegisteredEngineTypeIds`. Remove their `AbsentReasons` rows. Do not add `EngineType`. Do not turn these into new coverage-only engines — they already exist; this prompt only gives the harness a graph they already emit on in unit tests.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add golden corpus cases (next unused case-NN after DX-48; currently plan case-61+ if DX-48 took 58–60) that fire topology-anti-pattern, security-baseline-expectation, and required-capability-coverage, register those engines in the merge harness, and remove them from AbsentReasons. Do not add EngineType. Do not register cross-run, insight-generator, cost-breach, or policy-applicability.

Why: Catalog is 50; harness registers 38; 12 absent-with-reason. Three of those twelve are fixture-only. Unit tests already emit. docs/quality/insight-density-engine-distribution.md cannot score them until they are in CreateEngines() and have a case.

Read first:
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarnessEngineInventory.cs (AbsentReasons — those three rows)
- ArchLucid.Decisioning/Findings/GoldenCorpusHarnessEngineRegistration.cs (RegisteredEngineTypeIds, LatestGoldenCorpusCaseNumber — read at start)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs (CreateEngines — currently 22 graph engines; GoldenCorpusHarnessEngineTests asserts count 22)
- ArchLucid.Decisioning/Services/TopologyAntiPatternFindingEngine.cs (datastore with no CONNECTS_TO/DEPENDS_ON from compute; publicEndpoint true / "public"+"sql|storage|blob" label)
- ArchLucid.Decisioning/Services/SecurityBaselineExpectationFindingEngine.cs (IGraphCoverageAnalyzer.AnalyzeSecurityBaselineExpectations — topology node with no PROTECTS)
- ArchLucid.Decisioning/Services/RequiredCapabilityCoverageFindingEngine.cs (RequiredCapabilityCoverageAnalyzer — ContextSnapshot RequiredCapabilities token with no matching evidence)
- ArchLucid.Decisioning.Tests/TopologyAntiPatternFindingEngineTests.cs
- ArchLucid.Decisioning.Tests/TopologyWaveFindingEngineTests.cs (SecurityBaselineExpectationFindingEngine_WhenCategoryUnprotected_EmitsFinding)
- ArchLucid.Decisioning.Tests/Analysis/RequiredCapabilityCoverageAnalyzerTests.cs
- docs/quality/HOLD_NO_COVERAGE_ENGINES.md (do not add a fourth coverage engine; registering these three is allowed)
- docs/library/DECISIONING_GOLDEN_CORPUS.md

Work:

1. Register in CreateEngines() next to the other graph engines:
   - new TopologyAntiPatternFindingEngine()
   - new SecurityBaselineExpectationFindingEngine(analyzer) — analyzer is already constructed
   - new RequiredCapabilityCoverageFindingEngine(new RequiredCapabilityCoverageAnalyzer()) — own analyzer instance is fine
   Update GoldenCorpusHarnessEngineTests count (22 → 25) and Contain() assertions. Add the three EngineType strings to GoldenCorpusHarnessEngineRegistration.RegisteredEngineTypeIds.

2. Remove the three AbsentReasons entries. Leave requirement-gap, requirement-cross-run-diff, topology-cross-run-diff, policy-applicability, policy-coverage, cost-breach, checklist-cluster-synthesis, insight-generator, policy-declaration-inventory-contradiction. ValidateCatalogCoverage must still hold (registered + absent = catalog 50). After this prompt: 41 registered, 9 absent.

3. Add at least three cases, copying unit-test graph shape with varied node ids (do not reuse cmp-1/ds-1 if that collides with an existing case’s expected files):
   - case-61: compute TopologyResource + data TopologyResource with no CONNECTS_TO/DEPENDS_ON → topology-anti-pattern (datastore-without-compute-dependency). Optional second finding if a node is publicly exposed; do not force it.
   - case-62: compute TopologyResource with no SecurityBaseline PROTECTS edge → security-baseline-expectation. Empty-graph must stay silent (engine already returns empty when TopologyNodeCount == 0) — do not add an empty-graph golden that expects this engine.
   - case-63: ContextSnapshot with RequiredCapabilities "encryption-at-rest" (or equivalent token the analyzer already splits on '|') plus a compute node that does not evidence that capability → required-capability-coverage. Do not invent a capability token the analyzer does not score.

4. Record distribution markdown. Those three EngineTypes must show Findings ≥ 1. Update LatestGoldenCorpusCaseNumber and DECISIONING_GOLDEN_CORPUS.md. Keep open-commitment / portfolio-recurrence disabled. Do not write novelty rates into the distribution markdown.

5. claimBoundary in FINDING_ENGINE_OUTPUT_REFERENCE.md if those engines’ rows are stale: they are now harness-visible. Still not a new EngineType. Still not SOC 2 Type II. required-capability-coverage is not live inventory; it reads graph tokens only.

Do not: add EngineType; register cross-run / insight-generator / cost-breach; enable OpenCommitmentFindingOptions; push master; regenerate OpenAPI; weaken HOLD_NO_COVERAGE_ENGINES.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution|FullyQualifiedName~TopologyAntiPattern|FullyQualifiedName~SecurityBaselineExpectation|FullyQualifiedName~RequiredCapabilityCoverage"

Done when: topology-anti-pattern, security-baseline-expectation, and required-capability-coverage appear in the distribution table with Findings ≥ 1; they are absent from AbsentReasons; CreateEngines count matches registration; case-01..prior still pass.
```

---

# DX-50 — Tighten HasConcreteEvidenceCitation (Workstream 2 remainder)

**OWNER-GATED. Do not start this prompt until the owner explicitly unparks it** (names **DX-50** in this conversation, or replies that Workstream 2 citation tightening is released). Shipping it without that unpark fights the DX-01 / DX-45 hold that generic `graph-node:` must keep counting until path/cost engines have honest ARM/ARN citations.

**Closes:** Strategy Workstream 2: “Tighten `HasConcreteEvidenceCitation` — require resolvable package ref (`doc:…#L`, ARM id, graph node on **this** snapshot, surviving `PolicyRuleId`) — remove fallback `return true`.” DX-01 already dropped unmatched-string `return true` in the citation helper, but `IsProductShapedGraphNodeId` still returns true for any non-GUID string of length ≥ 3. Combined with path-engine `Trace.Notes` of `evidence:graph-node:{label}`, `InsightDensityGateCandidate.ExtractEvidenceRefs` still treats `graph-node:storage-1` as concrete evidence. After DX-47, cost/path engines copy real ARM/ARN into `EvidenceRefs` when the package has them, so tightening no longer silently demotes every path finding.
**Depends on:** **DX-47 shipped** (do not start if DX-47 has not merged). Owner unpark required.
**Branch suggestion:** `cursor/dx-50-evidence-citation-tightening`

### Design intent

Precision, not a new engine and not a gate-predicate rewrite. `graph-node:` counts **only** when the remainder is product-shaped ARM/ARN/GCP (`FindingEvidenceRefs.TryFormatInventoryResourceId` already knows those shapes). Unmatched strings stay `false`. Do **not** turn the Real-mode LLM judge or `PreferHighNoveltyEngines` on by default (those Workstream 2 rows stay held). **Must re-record the golden corpus and `insight-density-engine-distribution.md`** — medians will drop for findings that only had label-shaped `graph-node:` traces.

### Owner unpark (required before any DX-50 implementation)

Paste this into the chat that would run DX-50 and **wait**. Do not implement from the copy block until the owner answers.

```text
DX-50 is owner-gated Workstream 2 remainder. It will stop treating graph-node:storage-1 / graph-node:actor-checkout as concrete evidence, re-record the entire decisioning golden corpus, and likely lower several engine medians in insight-density-engine-distribution.md. Prerequisite DX-47 (honest EvidenceRefs on cost + path engines) must already be on master. Reply yes / ok to unpark DX-50 for this request only, or name a different hold.
```

Accept only `ok` or `yes` (case-insensitive, surrounding whitespace ignored), matching the workspace model-allowlist override convention, **or** an explicit “unpark DX-50” sentence from the owner. `sure` / `go ahead` is not enough if you are using the strict override protocol; if the owner said “unpark DX-50” in the same request that named this prompt, that is sufficient.

### Prompt (copy below) — run only after unpark + DX-47 on master

```text
OWNER-GATED — stop if DX-47 is not on this branch's merge-base / master, or if the owner has not unparked DX-50. You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: tighten GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation so graph-node: counts only when the node id is a product-shaped ARM resource id, AWS ARN, or GCP projects/ path, using FindingEvidenceRefs.TryFormatInventoryResourceId. Remove any leftover unmatched-string return true. Do not change DeterministicInsightDensityGate's demotion predicate. Do not default PreferHighNoveltyEngines or the LLM judge on. Do not add EngineType.

Why: Strategy Workstream 2 remainder. IsProductShapedGraphNodeId currently returns true for any non-GUID length ≥ 3, so evidence:graph-node:sql-pay-prod from path-engine Trace.Notes still Promote. After DX-47, genuine ARM/ARN live on EvidenceRefs when the graph/JSON had them. Label-only graph-node: refs must stop counting.

Read first:
- docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md (Workstream 2 — Tighten HasConcreteEvidenceCitation)
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (HasConcreteEvidenceCitation, IsResolvableEvidenceRef, IsProductShapedGraphNodeId)
- ArchLucid.Core/Findings/FindingEvidenceRefs.cs (TryFormatInventoryResourceId — reuse; do not fork ARM/ARN detection)
- ArchLucid.Core/Findings/InsightDensityGateCandidate.cs (ExtractEvidenceRefs — do not resume copying RelatedNodeIds)
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs (do not change the DX-01 predicate)
- ArchLucid.AgentRuntime/CriticFindingEvidenceCitationRules.cs (wrapper — should keep delegating)
- ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs
- ArchLucid.AgentRuntime.Tests/AgentRuntimePackageCoverageBatch14Tests.cs
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber
- docs/quality/insight-density-engine-distribution.md
- docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md (EvidenceRefs claimBoundary)

Work:

1. IsResolvableEvidenceRef graph-node: branch: after stripping the prefix, treat the remainder as an inventory resource id. Count as resolvable only when FindingEvidenceRefs.TryFormatInventoryResourceId(nodeId) is non-null (ARM /subscriptions/…/resourceGroups/…, aws:arn: / arn:aws, projects/). Empty, GUID, "storage-1", "actor-checkout", "sql-pay-prod" → false. Prefer calling the existing internal helper (same assembly) over copying the if-ladder. Delete or rewrite IsProductShapedGraphNodeId so it cannot accept length ≥ 3 labels.

2. Confirm HasConcreteEvidenceCitation / IsResolvableEvidenceRef have no unmatched-string fallback return true (the foreach should still end in return false). Keep skip list: request, critic-checklist, architecture-request. Keep doc:, policy-rule:, finding:, aws:arn:, ARM paths, projects/ as they are.

3. ExtractEvidenceRefs: do not copy RelatedNodeIds. Trace notes that start with evidence: still flow in; after step 1, evidence:graph-node:storage-1 will no longer count. That is intended.

4. Tests:
   - graph-node:storage-1 → HasConcreteEvidenceCitation false.
   - graph-node:{ARM path} → true.
   - graph-node:arn:aws:s3:… or graph-node:aws:arn:arn:aws:… → true when TryFormatInventoryResourceId would format it.
   - graph-node:projects/… → true.
   - empty list / only request → false.
   - doc:manifest.json#L10 and policy-rule:cis-az-006 still true.
   - DeterministicInsightDensityGate: Security finding with only graph-node:sql-pay-prod demotes (or at least does not get the concrete-evidence pass); same finding with ARM EvidenceRefs still Promote when the rest of DX-01 allows it.
   - Update AgentRuntimePackageCoverageBatch14Tests if it asserted label-shaped graph-node: as concrete.

5. Re-record the golden corpus (ARCHLUCID_RECORD_DECISIONING_GOLDEN=1 / existing record helpers) and docs/quality/insight-density-engine-distribution.md. Scores will drop where the only citation was a label-shaped graph-node. Do not weaken fixtures to keep median 100. Do not write novelty rates into that markdown. Update FINDING_ENGINE_OUTPUT_REFERENCE.md claimBoundary: graph-node: is resolvable only when the id is product-shaped ARM/ARN/GCP; this is Workstream 2 citation tightening, not a new information source. Still not SOC 2 Type II.

Do not: change DX-01 demotion predicate; default PreferHighNoveltyEngines or the Real-mode judge on; resume RelatedNodeIds-as-evidence; add EngineType; push master; skip the corpus re-record.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'
Test:
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~HasConcreteEvidenceCitation|FullyQualifiedName~DeterministicInsightDensityGate|FullyQualifiedName~GenericArchitectureAdvice|FullyQualifiedName~FindingEvidenceRefs"
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~HasConcreteEvidenceCitation|FullyQualifiedName~AgentRuntimePackageCoverageBatch14"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"

Done when: label-shaped graph-node: refs do not count; ARM/ARN graph-node: and EvidenceRefs still count; golden corpus and distribution markdown are re-recorded and green; judge / PreferHighNoveltyEngines defaults unchanged.
```

---

## Held (do not duplicate)

**DX-18** (TB-885 compounding ledger) and **DX-19** (ADR 0062 verification slice 1) stay in [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md). Do not start them until the owner unparks **TB-885** / **TB-2033**.

Live frontier **pilot-pending** captures need owner **G-REAL-06** runs. DX-20 shipped the schema; do not invent named-model transcripts. Graph-RAG buyer claims need ADR 0057 owner override + **TB-883** ablation.

Workstream 2 remainder: **Real-mode judge default-on** and **`PreferHighNoveltyEngines` default-on** stay owner-gated and are **not** in this file. **Tighten `HasConcreteEvidenceCitation`** is **DX-50** above — still owner-gated; do not run it from DX-47/DX-48/DX-49. GTM cohorts **M-90 / M-44 / M-91 / M-92**, SOC 2 CPA (**G-REAL-05**), and third-party pen test (**G-ASSURANCE-02**) stay off the engineering batch list.

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- DX-01–DX-16: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- DX-17–DX-28: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)
- DX-29–DX-35: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md)
- DX-36–DX-41: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md)
- DX-42–DX-46: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
- Miss clause: [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)

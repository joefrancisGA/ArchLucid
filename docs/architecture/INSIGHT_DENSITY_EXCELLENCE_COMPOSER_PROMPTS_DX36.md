> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-35**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run; **DX-18**/**DX-19** still held) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-36–DX-41)

**Created:** 2026-09-07 · **Status:** **DX-36–DX-41 shipped on `master` (2026-09-07).** Do **not** re-run. Next set: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) (**DX-42–DX-46**).

DX-01–DX-41 shipped on `master` (2026-09-07) except **DX-18** (TB-885 hold) and **DX-19** (ADR 0062 / TB-2033 hold). This set closed harness visibility for shipped path/contradiction engines, in-batch ARM `templateLink` ingest, novelty write-back into `InsightGenerator`, pack gating on graph/inventory security engines, Azure inventory-shaped golden cases (`case-48`–`case-50`), and stale measurement copy.

**Do not re-run.** Archive only.

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-16** | Gate, Real judge, actor expansion, contradiction/path engines, InsightGenerator, recurrence, ITSM, novelty signal, harness, measurement floor, starter catalog |
| **DX-17, DX-20–DX-28** | Community summaries, frontier capture schema, judge-cap priority, checklist synthesis, novelty-rate API, dangling refs, SKU/tier, counterfactual, nested ingest, path-engine goldens |
| **DX-29–DX-35** | Golden depth, Helm/Kustomize/`.bicepparam`, TF modules/OIDC/DNS, data-flow × trust-boundary, three-way pack contradiction, preferred-engine catch-up, optional novelty-rate judge sort |
| **DX-36–DX-41** | This file — shipped; do not re-run |
| Coverage-only engines | Still forbidden. This set added **no** new `EngineType`. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-36** | Golden harness: data-flow + three-way contradiction | Yes | DX-32, DX-33 shipped | Measurement |
| **DX-37** | ARM `templateLink` in-batch resolution | Yes | DX-27 shipped | **Generative** (property bag) |
| **DX-38** | Novelty rates into InsightGenerator (default off) | Yes | DX-10, DX-23, DX-35 shipped | **Generative** (retrieval context) |
| **DX-39** | Policy maps on graph + inventory security engines | Yes | PP-01 / DX-33 shipped | Packaging / moat |
| **DX-40** | Inventory-shaped golden fixtures for silent registered engines | Yes | DX-14, DX-36 preferred | Measurement |
| **DX-41** | Measurement-copy honesty (ingest docs, ADR 0070, miss clause) | Yes | none | Honesty (not numerator) |

**2026-09-07 closure:** DX-36–DX-41 landed on `master`. Do **not** re-run this file.

**Do not start from this document:** **DX-18** / **DX-19** (held until the owner unparks **TB-885** / **TB-2033**). Pulumi/CDK / CloudFormation ingest, three-way theme expansion, AWS/GCP goldens, evidence-ref honesty, and cost-recommendation goldens live in [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md). Live extractor-as-default (product/GTM), fake named-model frontier transcripts, Graph-RAG buyer claims (ADR 0057 / TB-883), SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType` enum value, and turning `PreferHighNoveltyEngines` on by default remain held.

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

---

# DX-36 — Golden harness: `data-flow-trust-boundary` + three-way pack contradiction

**Closes:** `GoldenCorpusHarnessEngineInventory` still lists `data-flow-trust-boundary` and `policy-declaration-inventory-contradiction` as absent-with-reason. Both engines shipped (DX-32 / DX-33) and have unit tests, but `docs/quality/insight-density-engine-distribution.md` cannot score them. Latest hand-authored case is **`case-46`**.
**Depends on:** DX-32, DX-33 shipped
**Branch suggestion:** `cursor/dx-36-golden-data-flow-three-way`

### Design intent

Do not fake distribution rows. Register the **graph-pure** path engine in `GoldenCorpusHarness.CreateEngines()` and add a hand-authored case copied from the unit-test fixture (vary ids/labels). For the **effectful** three-way engine, reuse the harness inventory + pack path that `case-37` already uses for two-way `declaration-inventory-contradiction`; if the merge harness cannot supply an assigned pack, add a dedicated sibling golden test (same pattern as `ChecklistClusterSynthesisGoldenCorpusTests`) and keep a *shortened* absent-reason that names that sibling — do not leave “unit tests only.”

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make shipped engines data-flow-trust-boundary and policy-declaration-inventory-contradiction visible to insight-density measurement. Add golden cases starting at case-47. Do not add a new EngineType. Do not invent findings the engines would not emit.

Why: DX-32 and DX-33 raised the numerator in unit tests only. The distribution table still cannot list them. Measurement honesty requires a harness-visible fixture, not another engine.

Read first:
- docs/library/DECISIONING_GOLDEN_CORPUS.md (no-deletion; case-NN two-digit; latest is case-46)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs (CreateEngines)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarnessEngineInventory.cs (AbsentReasons)
- ArchLucid.Decisioning/Findings/GoldenCorpusHarnessEngineRegistration.cs (RegisteredEngineTypeIds, LatestGoldenCorpusCaseNumber)
- ArchLucid.Decisioning.Tests/Services/DataFlowTrustBoundaryFindingEngineTests.cs (BuildIngressToSqlFixture)
- ArchLucid.Application.Tests/Findings/PolicyDeclarationInventoryContradictionFindingEngineTests.cs
- tests/golden-corpus/decisioning/case-37 (two-way inventory contradiction shape)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusEffectfulEngineFactory.cs
- InsightDensityEngineDistributionMarkdown.cs and the record env switch

Work:

1. data-flow-trust-boundary:
   - Add DataFlowTrustBoundaryFindingEngine to GoldenCorpusHarness.CreateEngines().
   - Add it to GoldenCorpusHarnessEngineRegistration.RegisteredEngineTypeIds.
   - Add case-47: hand-authored graph matching the unit-test ingress→app→sql path WITHOUT a trust-boundary hop and WITHOUT private-endpoint on the datastore. Vary node ids/labels from the unit test so the finding is distinct.
   - README must name EngineType data-flow-trust-boundary.
   - Remove the AbsentReasons row for data-flow-trust-boundary.

2. policy-declaration-inventory-contradiction:
   - Prefer registering PolicyDeclarationInventoryContradictionFindingEngine in GoldenCorpusEffectfulEngineFactory (it is already IEffectfulFindingEngine in Application) and adding case-48 that pins: declaration publicNetworkAccess Disabled + inventory Enabled + a filtered pack that maps the theme (reuse cis-az-006 or soc2-018 — ids already in DeclarationSignalPolicyKeyMap).
   - If the merge harness cannot load an assigned pack without changing production providers, do NOT stub TenantUsesDeclarationVocabulary to always false. Instead add ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyDeclarationInventoryContradictionGoldenCorpusTests.cs (Suite=Core) that runs the engine via FixedComplianceRulePackProvider + pinned inventory, and shorten the AbsentReasons text to point at that sibling (same claimBoundary as WK-22: not the merge harness).
   - Do not change GoldenCorpusHarness production FileComplianceRulePackProvider for this engine if that would alter case-01..case-46 expected files.

3. Bump LatestGoldenCorpusCaseNumber. Update docs/library/DECISIONING_GOLDEN_CORPUS.md coverage map.

4. Record: ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1 (or existing record switch) and commit docs/quality/insight-density-engine-distribution.md. data-flow-trust-boundary must appear with Findings ≥ 1. Do not write novelty rates into that markdown.

Do not: HTTP-fetch inventory; enable insight-generator in the harness; push master; claim the table is a named-model benchmark.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution|FullyQualifiedName~DataFlowTrustBoundary"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~PolicyDeclarationInventoryContradiction" (if you touch Application)

Done when: data-flow-trust-boundary is registered and appears in the distribution table; three-way contradiction is either in the merge harness with a case or has a sibling golden test named from AbsentReasons; case-01..case-46 still pass.
```

---

# DX-37 — ARM `templateLink` in-batch resolution

**Closes:** `ArmJsonInfrastructureDeclarationParser` expands **inline** nested `Microsoft.Resources/deployments` (`properties.template.resources`). `properties.templateLink.uri` is skipped silently (`ParseAsync_DeploymentTemplateLinkOnly_SkipsSilently`). Linked templates that **are already in the same declaration batch** never become CanonicalObjects. `docs/library/CONTEXT_INGESTION.md` § `arm-json` still claims nested deployments are skipped — that is stale after DX-27.
**Depends on:** DX-27 shipped
**Branch suggestion:** `cursor/dx-37-arm-templatelink-in-batch`

### Design intent

Information-source change, not a new engine. Resolve `templateLink.uri` **only** against other ARM JSON items in the same batch (relative path / file name), same pattern as `BicepDeclarationBatchIndex` / `InfrastructureDeclarationBatchPathIndex`. **No HTTP fetch.** Unresolved links stay silent (R5). Recursion cap matches nested deployments (do not infinite-loop linked↔parent).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: when an ARM JSON declaration contains Microsoft.Resources/deployments with properties.templateLink.uri, and another declaration in the same batch is that template JSON, parse the linked resources into CanonicalObjects. Do not HTTP-fetch. Do not add a finding engine.

Why: Strategy workstream 1G remainder after DX-27/DX-30/DX-31. Path and contradiction engines cannot see resources the parser dropped because the parent was a linked deployment.

Read first:
- ArchLucid.ContextIngestion/Infrastructure/ArmJsonInfrastructureDeclarationParser.cs (inline nested Microsoft.Resources/deployments already handled)
- ArchLucid.ContextIngestion/Infrastructure/InfrastructureDeclarationBatchPathIndex.cs
- ArchLucid.ContextIngestion/Infrastructure/BicepDeclarationBatchIndex.cs (in-batch resolution pattern)
- ArchLucid.ContextIngestion/ConnectorStages/InfrastructureDeclarationsPayloadNormalizer.cs (how batch indexes are built and referenced files skipped as duplicate top-level)
- ArchLucid.ContextIngestion.Tests/ArmJsonInfrastructureDeclarationParserTests.cs (ParseAsync_DeploymentTemplateLinkOnly_SkipsSilently)
- docs/library/CONTEXT_INGESTION.md § arm-json (stale “skips nested templates” sentence)

Work:

1. Add an in-batch ARM linked-template index (own file, e.g. ArmJsonLinkedTemplateBatchIndex) that maps relative uri / file name → InfrastructureDeclarationReference with Format arm-json or json. Reuse InfrastructureDeclarationBatchPathIndex.TryResolve. Do not treat https:// or http:// URIs as batch keys.

2. Wire the index through InfrastructureDeclarationsPayloadNormalizer the same way Bicep modules are: pass the batch into the ARM parser; skip linked files as separate top-level declarations when the parent already expanded them (avoid duplicate CanonicalObjects).

3. Parser behavior:
   - Inline properties.template.resources: keep today’s recursive expand.
   - templateLink.uri that resolves in-batch: parse that declaration’s resources through the existing TryAddResource path (cap recursion at the same depth used for nested deployments / Bicep modules — 3 is the house default).
   - templateLink.uri that is http(s) or does not resolve: skip silently (keep ParseAsync_DeploymentTemplateLinkOnly_SkipsSilently for https://example.com/template.json).
   - Fail-open on unparseable JSON (R5).

4. Tests:
   - Parent ARM + linked child ARM in the same batch, uri "./linked.json" or "linked.json" matching Name → child storage/public-access property lands on a CanonicalObject.
   - https:// URI only → empty / no fetch (existing test still passes).
   - Linked file missing from batch → no invented objects.
   - Recursion cap: A links B links A → does not stack-overflow; stop at cap.

5. Fix docs/library/CONTEXT_INGESTION.md § arm-json: nested inline deployments ARE expanded; linked templateLink is in-batch only, never fetched.

Do not: add an HTTP client; Pulumi/CDK; push master; regenerate OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
Test:
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter "FullyQualifiedName~ArmJsonInfrastructureDeclarationParser|FullyQualifiedName~InfrastructureDeclarationsPayloadNormalizer"

Done when: in-batch relative templateLink expands child resources; remote URI still skips; CONTEXT_INGESTION.md matches the parser.
```

---

# DX-38 — Novelty rates into InsightGenerator (default off)

**Closes:** DX-13/DX-23 persist “I did not think of that” and expose `GET /v1/tenants/current/insight-density/novelty-rates`. DX-35 uses those rates only in `InsightDensityJudgeCandidateSelector` (judge-cap sort). `PremiumInsightFindingGenerator` / `InsightGeneratorEvidenceSummary.BuildUserPrompt` still do not see rates, so the generative pass cannot prefer EngineTypes operators actually marked novel.
**Depends on:** DX-10, DX-17, DX-23, DX-35 shipped
**Branch suggestion:** `cursor/dx-38-novelty-insight-generator`

### Design intent

**Default off — reuse `InsightDensityGateOptions.PreferHighNoveltyEngines`.** When that flag is true (Real mode only; Simulator merger already forces it false), load tenant novelty rates the same way DX-35 does (`IFindingInsightSignalRepository.ListNoveltyRatesAsync`, 90-day window, missing = 0, repository throw → omit the section). Inject rates as **retrieval context**, not evidence, and prefer sampling existing engine findings from high-rate EngineTypes. Do **not** auto-Promote. Do **not** add rates to the allowed evidenceRefs list.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: when PreferHighNoveltyEngines is true in Real mode, PremiumInsightFindingGenerator includes tenant novelty rates in the InsightGenerator user prompt and prefers sampling existing findings from high-rate EngineTypes. Default stays false. Do not auto-Promote. Do not treat rates as evidenceRefs.

Why: DX-35 closed judge-budget ranking. Strategy workstream 4 item 5 (in-product signal feeds generator tuning) is still open. This is owner-gated write-back — still not a buyer claim.

Read first:
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs (PreferHighNoveltyEngines, NoveltyRateWindowDays)
- ArchLucid.AgentRuntime/InsightDensityJudgeCandidateSelector.cs (TryLoadNoveltyRatesAsync — reuse, do not duplicate the SQL query)
- ArchLucid.AgentRuntime/PremiumInsightFindingGenerator.cs
- ArchLucid.AgentRuntime/InsightGeneratorEvidenceSummary.cs (BuildUserPrompt, AppendPreferredFindings)
- ArchLucid.AgentRuntime/Prompts/InsightGeneratorSystemPromptTemplate.cs
- ArchLucid.Application/Configuration/InsightDensityGateEffectiveOptionsMerger.cs (Simulator forces PreferHighNoveltyEngines false)
- ArchLucid.AgentRuntime.Tests/InsightGeneratorEvidenceSummaryTests.cs
- Existing PremiumInsightFindingGenerator tests (create if missing)

Work:

1. Reuse PreferHighNoveltyEngines. Do not add a second flag. XML-comment the option: Real mode only; ignored when EnableInsightGenerator is false; internal ranking, not G-REAL-06 proof (same claimBoundary as DX-35).

2. Extract shared novelty-rate load if the judge selector’s TryLoadNoveltyRatesAsync is private — move the load helper to its own file (e.g. InsightDensityNoveltyRateLookup) used by both the judge selector and the generator. Keep fail-open: OperationCanceledException rethrows; other exceptions log a warning and return null.

3. PremiumInsightFindingGenerator: inject IFindingInsightSignalRepository?, IScopeContextProvider?, TimeProvider (nullable repo/scope for tests without DI). When PreferHighNoveltyEngines && EnableInsightGenerator && Real mode && repo+scope present, load rates. Pass them into InsightGeneratorEvidenceSummary.BuildUserPrompt.

4. InsightGeneratorEvidenceSummary:
   - New optional parameter IReadOnlyDictionary<string, double>? noveltyRatesByEngineType.
   - Append a section AFTER community summaries, BEFORE graph labels: “Tenant novelty rates (internal ranking, not evidence — do not copy these as evidenceRefs):” listing EngineType and Rate (0.000 format). Include the DX-23 claimBoundary sentence: rates are DidNotThinkOfThatCount / DecisionGradeCount, not a named-model benchmark.
   - AppendPreferredFindings: keep preferred-engine first (InsightDensityPreferredEngineTypes.IsPreferred), then novelty rate descending, then existing order. Missing rate = 0.
   - CollectAllowedEvidenceRefs must NOT add rate rows or synthetic novelty:* refs.

5. InsightGeneratorSystemPromptTemplate: one extra rule line — “A novelty-rate table, if present, is ranking context only; never copy rates as evidenceRefs.” Bump Version.

6. Tests:
   - Flag false → user prompt has no novelty section; preferred-finding sample order unchanged.
   - Flag true + rates { dangling-declaration-reference: 0.8, topology-coverage: 0.0 } → section present; sample lists dangling finding before topology-coverage at equal severity.
   - Repository throw → no section, generation still proceeds (empty extra context).
   - Rates are not in allowedEvidenceRefs.
   - Simulator merger still forces PreferHighNoveltyEngines false (existing Application test).
   - Second tenant: ScopeContext from IScopeContextProvider; do not pass another tenant id.

Do not: default the flag on; auto-Promote from DidNotThinkOfThat; surface rates on buyer-polished shell; change MaxGeneratedInsightFindingsPerSnapshot; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~InsightGenerator|FullyQualifiedName~PremiumInsightFindingGenerator|FullyQualifiedName~InsightDensityJudgeCandidateSelector|FullyQualifiedName~PremiumInsightDensityLlmJudge"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~InsightDensityGateOptions"

Done when: default-off preserves today’s prompt; flag-on injects rates and reorders the existing-finding sample; faithfulness allow-list unchanged; Simulator still ignores the flag.
```

---

# DX-39 — Policy maps on graph + inventory security engines

**Closes:** PP-01 / ID-10 gate `declaration-security-baseline` and `declaration-premise-conflict`. DX-33 stamps `PolicyRuleId` on three-way contradiction. `external-exposure`, `trust-boundary`, `privileged-access`, and `*-inventory-security-baseline` still ignore the tenant pack, so toggling SOC 2 vs CIS Azure does not change the actor/inventory security rows operators argue about.
**Depends on:** PP-01 map shipped
**Branch suggestion:** `cursor/dx-39-policy-graph-inventory-security`

### Design intent

Packaging, not a new engine. Reuse `DeclarationSignalPolicyGate.ShouldEmitTheme` / `TryGetPolicyRuleId`. Fail-open stays for prefixes outside `DeclarationSignalPolicyPrefixFamily`. Empty filtered pack still fails closed. Do **not** gate `open-commitment`, `portfolio-recurrence`, `*-cross-run-diff`, `topology-coverage`, `security-gap`, or `cost-constraint` in this prompt (commitment/history and coverage stay pack-independent).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: honor the tenant filtered compliance pack on existing engines external-exposure, trust-boundary, privileged-access, and azure/aws/gcp-inventory-security-baseline using DeclarationSignalPolicyGate. No new EngineType. No OpenAPI. No UI.

Why: Strategy workstream 3 remainder after PP-01. Declaration engines already pack-gate; graph actor engines and inventory security-baseline still emit every signal.

Read first:
- ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyGate.cs
- ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyKeyMap.cs (themes: data-protection, encryption, transport-security, network-isolation, workload-isolation)
- ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyPrefixFamily.cs
- ArchLucid.Decisioning/Services/DeclarationSecurityBaselineFindingEngine.cs (constructor injects IComplianceRulePackProvider — copy this pattern)
- ArchLucid.Decisioning/Services/ExternalExposureFindingEngine.cs
- ArchLucid.Decisioning/Services/TrustBoundaryFindingEngine.cs
- ArchLucid.Decisioning/Services/PrivilegedAccessFindingEngine.cs
- ArchLucid.Application/Findings/AzureInventorySecurityBaselineFindingEngine.cs (and AWS/GCP siblings)
- ArchLucid.Decisioning.Tests/Services/DeclarationSignalPolicyFindingEngineTests.cs
- GoldenCorpusHarness.CreateEngines() — these three graph engines are constructed with new Engine() today; you will need the same FileComplianceRulePackProvider already used for declaration engines in that method

Work:

1. Add a small map type in its own file (e.g. GraphSecurityEnginePolicyThemeMap) from EngineType → theme token:
   - external-exposure → network-isolation
   - trust-boundary → network-isolation
   - privileged-access → workload-isolation
   Do not invent new theme tokens. XML-comment why exposure/boundary share network-isolation (NSG / perimeter / public actor) and privileged-access shares workload-isolation (privileged principals).

2. Inject IComplianceRulePackProvider into the three graph engines (own-file constructors already exist). At AnalyzeAsync start: load pack, CollectActiveRuleIds, ShouldEmitTheme(theme, ids). If false, return empty. If true, emit as today and set PolicyRuleId via TryGetPolicyRuleId when a mapped id survived (same as declaration engines). Missing pack provider in tests: fail the test setup — do not fail-open by skipping injection.

3. Inventory security-baseline engines (Azure/AWS/GCP): inject IComplianceRulePackProvider. Map each classifier signal to an existing theme before emit (public access → data-protection; encryption-at-rest → encryption; HTTPS/TLS → transport-security; NSG/admin ports → network-isolation; privileged/hostPath → workload-isolation). If a classifier has no honest theme, leave it fail-open and XML-comment why (do not invent a PolicyRuleId). Do not mute open-commitment or cost engines.

4. Tests (prefer concrete types, check nulls, no ConfigureAwait(false)):
   - cost-opt-001 only → external-exposure still emits (fail-open, unmapped prefix).
   - soc2-001 only → external-exposure does NOT emit (vocabulary yes, network-isolation theme not enabled).
   - soc2-018 or cis-az-018 only → external-exposure emits; privileged-access does not.
   - hipaa / workload-isolation mapped id only → privileged-access emits; external-exposure does not.
   - Empty pack → none emit.
   - Keep existing graph-shape tests by passing a fail-open pack (cost-opt-001) or a full CIS Azure pack.
   - One inventory-security-baseline test: soc2-001 suppresses a public-access inventory signal; cis-az-006 (or soc2-018) keeps it.
   - Golden corpus: CreateEngines() must pass the existing FileComplianceRulePackProvider into the three graph engines. If expected-findings.json for case-01..case-46 change because the default harness pack now suppresses actor findings, that is a real pack interaction — update those expected files and note it in each case README. Do not stub the gate to always true to preserve old goldens.

5. Docs:
   - docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md — those EngineTypes honor the declaration theme map; fail-open outside the prefix family.
   - claimBoundary: this still does not make all ~50 engines policy-aware; coverage/cost/commitment remain pack-inert. Do NOT claim SOC 2 Type II attestation.

Do not: add PolicyPackContentDocument fields; filter security-gap / topology-coverage / cost-constraint / open-commitment; push master; regenerate OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~ExternalExposure|FullyQualifiedName~TrustBoundary|FullyQualifiedName~PrivilegedAccess|FullyQualifiedName~DeclarationSignalPolicy|FullyQualifiedName~GoldenCorpus"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~InventorySecurityBaseline"

Done when: soc2-001 suppresses external-exposure; cis-az-018 (or soc2-018) keeps it; cost-opt-001 still fail-opens; empty pack emits nothing; golden corpus still green after any honest expected-file updates.
```

---

# DX-40 — Inventory-shaped golden fixtures for silent registered engines

**Closes:** The harness registers **37** engines; the distribution table lists **21**. Sixteen registered EngineTypes produce zero corpus findings, including `azure-inventory-reconciliation`, `azure-inventory-security-baseline`, `orphaned-azure-resource`, and `secrets-lifecycle`. `case-37` already pins one Azure inventory ZIP for two-way contradiction. Effectful engines that are **disabled** in the factory (`open-commitment`, `portfolio-recurrence`) stay disabled.
**Depends on:** DX-14 shipped; run after DX-36 if you share `case-NN` numbers
**Branch suggestion:** `cursor/dx-40-inventory-golden-fixtures`

### Design intent

Do not enable live extractors. Add **hand-authored** cases with pinned inventory JSON (same mechanism as `case-37`) so already-registered effectful engines emit ≥1 finding. Leave `insight-generator`, `cost-breach`, cross-run diffs, and disabled commitment/recurrence on absent-reasons or disabled options. Do not add coverage engines.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add golden corpus cases (next unused case-NN after DX-36) that fire already-registered effectful engines using pinned inventory fixtures. Do not add a new EngineType. Do not enable open-commitment or portfolio-recurrence. Do not require live Azure.

Why: Sixteen registered engines are silent in docs/quality/insight-density-engine-distribution.md. Measurement cannot improve if inventory recon / inventory security-baseline / secrets-lifecycle never see a ZIP.

Read first:
- tests/golden-corpus/decisioning/case-37 (how inventory is pinned)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs (inventory fixture wiring)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusEffectfulEngineFactory.cs (open-commitment and portfolio-recurrence are disabled — keep them disabled)
- SecretsLifecycleFindingEngine tests (what inventory + declaration shape emits)
- AzureInventorySecurityBaselineFindingEngine / GraphAzureInventoryReconciliationFindingEngine tests
- docs/library/DECISIONING_GOLDEN_CORPUS.md
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (read at start — do not collide with DX-36 cases)

Work:

1. Add at least three new cases:
   - Pinned Azure inventory with a resource id present in inventory and absent from the graph → orphaned-azure-resource (or azure-inventory-reconciliation — pick the engine the unit tests prove will fire; README names it).
   - Pinned Azure inventory with a public-access / HTTPS miss the inventory security-baseline classifier already detects → azure-inventory-security-baseline.
   - Secrets lifecycle: declaration or inventory secret with rotation/expiry properties the engine already reads (copy unit-test shape; vary ids). If the engine requires live Key Vault timestamps you cannot pin, keep secrets-lifecycle silent and add a one-line comment in the case README plus a dedicated Decisioning/Application test fixture instead — do not invent expiry.

2. Do NOT add cases that need Advisor cost telemetry, AWS/GCP ZIPs you cannot pin honestly, or enabling OpenCommitmentFindingOptions. Keep cost-recommendation / aws-* / gcp-* silent unless you also add a similarly honest pinned cloud ZIP (optional fourth/fifth case if cheap and already covered by unit tests).

3. Record distribution markdown. Targeted engines must appear with Findings ≥ 1. Update DECISIONING_GOLDEN_CORPUS.md coverage map and LatestGoldenCorpusCaseNumber.

4. Guard test GoldenCorpusHarnessEngineInventoryTests still: registered + absent = catalog count.

Do not: turn on live extractors; HTTP-fetch; push master; claim inventory engines are now first-review default.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"

Done when: at least two previously silent registered engines appear in the distribution table; case-01..previous-max still pass; open-commitment and portfolio-recurrence remain disabled in the factory.
```

---

# DX-41 — Measurement-copy honesty (ingest docs, ADR 0070, miss clause)

**Closes:** Several density-adjacent docs drifted after DX-01 / DX-14 / DX-27: `CONTEXT_INGESTION.md` says ARM nested deployments are skipped; ADR 0070 still documents the old triple-AND + category-protection predicate; `INSIGHT_DENSITY_MISS_CLAUSE.md` still cites 32 harness engines / 45 catalog / `case-37`; strategy Workstream 2 still describes category veto as current behavior.
**Depends on:** none (docs-only; if DX-37 already fixed CONTEXT_INGESTION.md, skip that file)
**Branch suggestion:** `cursor/dx-41-density-docs-honesty`

### Design intent

Honesty only. Do not change gate code, parsers, or engines. Align copy with production: DX-01 demotion is `score < threshold || generic-without-evidence || falsifiable-without-evidence` **and** `!hasConcreteEvidence`; `InsightDensityAgentCategoryRules.IsDemotionEligibleCategory` always returns true and is unused by the gate; harness counts live in `GoldenCorpusHarnessEngineRegistration` + `AbsentEngineReasons`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: align insight-density measurement and ingest docs with shipped DX-01/DX-14/DX-27 behavior. Do not change production code except XML comments that are factually wrong on the same files you already open.

Why: Stale copy makes the next assessment and the next Composer chat re-litigate problems that are already fixed (nested ARM, category protection) and under-count the harness.

Read first (then the production files they describe):
- docs/library/CONTEXT_INGESTION.md § arm-json
- docs/architecture/adrs/0070-insight-density-controls-typed-engines.md (Decision point 2)
- docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md (Corpus limit)
- docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md (subtractive layer; “Demotion is a triple-AND plus category veto”)
- docs/quality/insight-density-engine-distribution.md (header counts)
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs (current demote expression)
- ArchLucid.Core/Findings/InsightDensityAgentCategoryRules.cs
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (HasConcreteEvidenceCitation)
- ArchLucid.Decisioning/Findings/GoldenCorpusHarnessEngineRegistration.cs
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarnessEngineInventory.cs
- ArchLucid.ContextIngestion/Infrastructure/ArmJsonInfrastructureDeclarationParser.cs (nested deployments)

Work:

1. CONTEXT_INGESTION.md § arm-json: nested inline Microsoft.Resources/deployments ARE expanded; templateLink.uri is not fetched (in-batch resolution is DX-37 — if that PR is not merged, say “skipped unless present in the same declaration batch” only if the code already does that; otherwise “skipped, no HTTP fetch”).

2. ADR 0070: rewrite Decision point 2 to the shipped DX-01 predicate (cite DeterministicInsightDensityGate). Note category protection was removed (IsDemotionEligibleCategory always true; unused by the gate). Keep “rows remain on the package.” Do not pretend the ADR was always this way — add a one-line “Superseded 2026-09-07 by DX-01” note under the old triple-AND sentence.

3. INSIGHT_DENSITY_MISS_CLAUSE.md Corpus limit: replace 32/45/case-37 with current RegisteredEngineCount, catalog count, absent-with-reason count, and latest case-NN from GoldenCorpusHarnessEngineRegistration / inventory (read the constants — do not hardcode from memory). Keep the miss-clause thesis (a filter cannot raise density).

4. INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md: replace the “category veto” / “category-protected Security/Topology” paragraphs with current evidence-based demotion. Keep Workstream 2 as remaining product/config work (judge default-on, PreferHighNoveltyEngines default-on) — do not claim those flags are on.

5. insight-density-engine-distribution.md header: if engine/case counts in the intro disagree with the table and harness constants, fix the intro only (do not regenerate rows unless you ran the recorder).

Do not: change DeterministicInsightDensityGate; add engines; push master; claim G-REAL-06 proof.

Compile: skip (docs-only) unless you touch XML comments on C# files — then
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'

Done when: a reader of ADR 0070, the miss clause, and CONTEXT_INGESTION.md would describe the same nested-ARM and demotion behavior as the code.
```

---

## Held (do not duplicate)

**DX-18** (TB-885 compounding ledger) and **DX-19** (ADR 0062 verification slice 1) stay in [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md). Do not start them until the owner unparks **TB-885** / **TB-2033**.

Live frontier **pilot-pending** captures need owner **G-REAL-06** runs. DX-20 shipped the schema; do not invent named-model transcripts. Graph-RAG buyer claims need ADR 0057 owner override + **TB-883** ablation.

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- DX-01–DX-16: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- DX-17–DX-28: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)
- DX-29–DX-35: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md)
- Next **DX-42–DX-46:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
- Miss clause: [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)

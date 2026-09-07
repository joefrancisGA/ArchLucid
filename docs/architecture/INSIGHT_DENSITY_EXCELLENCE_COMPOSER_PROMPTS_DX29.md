> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-28**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run; **DX-18**/**DX-19** still held).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-29–DX-35)

**Created:** 2026-09-07 · **Status:** **DX-29–DX-35 shipped on `master` (2026-09-07).** Do **not** re-run. **DX-18** / **DX-19** remain held in [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md).

DX-01–DX-28 shipped on `master` (2026-09-07) except **DX-18** (TB-885 hold) and **DX-19** (ADR 0062 / TB-2033 hold). This set grew the **numerator** (ingest + one remaining path engine + three-way contradiction), deepened **measurement** (golden fixtures still 1-finding medians), and tightened **dismiss** without adding coverage-only engines.

**Do not re-run.** Archive only. Feature branches landed as #2042–#2060.

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-16** | Gate, Real judge, actor expansion, contradiction/path engines, InsightGenerator, recurrence, ITSM, novelty signal, harness, measurement floor, starter catalog |
| **DX-17, DX-20–DX-28** | Community summaries, frontier capture schema, judge-cap priority, checklist synthesis, novelty-rate API, dangling refs, SKU/tier, counterfactual, nested ingest, path-engine goldens |
| Louvain detector | Exists — DX-17 already wired summaries into InsightGenerator |
| Coverage-only engines | Still forbidden. **DX-32** (data-flow × trust-boundary **path**) and **DX-33** (three-way **contradiction**) are authorized by this set |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-29** | Golden fixture depth for shipped engines | Yes | DX-24, DX-25, DX-28 shipped | Measurement |
| **DX-30** | Ingestion completeness slice 2 (Helm, Kustomize, `.bicepparam`) | Yes | none | **Generative** (property bag) |
| **DX-31** | Ingestion completeness slice 3 (TF modules, OIDC, Front Door / private DNS) | Yes | none | **Generative** (property bag) |
| **DX-32** | Data-flow vs trust-boundary path engine | Yes | DX-03, DX-06 shipped | **Generative** |
| **DX-33** | Three-way pack × declaration × inventory contradiction | After DX-04 | DX-04 shipped | **Generative** |
| **DX-34** | Preferred-engine list catch-up | Yes | DX-21 shipped | Precision (same cap) |
| **DX-35** | Novelty-rate as optional judge-cap secondary sort | After DX-23 + DX-34 | DX-21, DX-23 shipped | Precision (default **off**) |

**2026-09-07 closure:** DX-29–DX-35 landed on `master`. Do **not** re-run this file.

**Do not start from this document:** **DX-18** / **DX-19** (held in the DX-21 file until the owner unparks **TB-885** / **TB-2033**), Pulumi/CDK parsers, live extractor-as-default (product/GTM), fake named-model frontier transcripts, SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType` enum value.

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
- Do not change `DeterministicInsightDensityGate` demotion predicate (DX-01 already shipped).

---

# DX-29 — Golden fixture depth (1-finding medians are not a measurement)

**Closes:** `docs/quality/insight-density-engine-distribution.md` lists `identity-blast-radius`, `segmentation-semantics`, `dr-rpo-topology`, and `declaration-inventory-contradiction` at **1 finding** each; `dangling-declaration-reference`, `requirement-sku-tier`, and `checklist-cluster-synthesis` are still **absent-with-reason**. One fixture is a smoke test, not a median.
**Depends on:** DX-24, DX-25, DX-28 shipped
**Branch suggestion:** `cursor/dx-29-golden-fixture-depth`

### Design intent

Do not fake distribution rows. Add **hand-authored** golden cases after `case-40` that fire shipped engines more than once. Leave effectful / LLM engines (`secrets-lifecycle`, `insight-generator`, inventory recon, cost-breach, cross-run diffs) on absent-reasons. `checklist-cluster-synthesis` is post-gate — add a harness-visible fixture **only if** the golden merge path already runs the post-gate stage; otherwise keep the absent-reason and add a dedicated orchestrator fixture test instead of a fake graph case.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: deepen the decisioning golden corpus so shipped path/contradiction engines appear with more than one finding in docs/quality/insight-density-engine-distribution.md. Add cases starting at case-41. Do not invent findings the engines would not emit. Do not add a new engine.

Why: DX-28 added case-38..40 (one fixture each for blast-radius, segmentation, DR/RPO). The distribution table still shows Findings=1 and 29 catalog engines absent. Measurement honesty requires more than a smoke row.

Read first:
- docs/library/DECISIONING_GOLDEN_CORPUS.md (no-deletion; case-NN two-digit)
- tests/golden-corpus/decisioning/case-38, case-39, case-40
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarnessEngineInventory.cs (AbsentReasons)
- DanglingDeclarationReferenceFindingEngine tests (graph shape)
- RequirementSkuTierFindingEngine tests (requirement text + datastore sku)
- IdentityBlastRadiusFindingEngine / SegmentationSemanticsFindingEngine / DrRpoTopologyFindingEngine unit-test graphs (copy shapes, vary labels/ids so findings are distinct)
- InsightDensityEngineDistributionMarkdown.cs and the record env switch

Work:

1. Add at least four new cases (case-41+):
   - dangling Key Vault / subnet ref (dangling-declaration-reference)
   - zone-redundant requirement vs Standard_LRS datastore (requirement-sku-tier)
   - a second identity-blast-radius graph (different actor/datastore labels than case-38)
   - a second segmentation-semantics graph (different NSG rule + path than case-39)
   Optional fifth: second dr-rpo-topology (different RPO minutes / datastore) if cheap.

2. Each README states which EngineType must appear in expected-findings.json. Register engines in CreateEngines() if not already; remove AbsentReasons only for engines that now emit ≥1 finding in the harness.

3. Do NOT force: insight-generator, secrets-lifecycle, inventory recon, cost-breach, cross-run diffs, policy-applicability. Keep those absent-reasons.

4. checklist-cluster-synthesis: if GoldenCorpusHarness does not run the post-gate synthesis stage, do not add a graph-only case. Add or extend a FindingsOrchestrator test fixture instead and leave the absent-reason (update the reason text if it is stale).

5. ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1 (or existing record switch) and commit the markdown. Table rows for the targeted engines must show Findings ≥ 2 where you added a second fixture. Update DECISIONING_GOLDEN_CORPUS.md coverage map (case-40 currently described as last hand-authored index — extend it).

Do not: require live Azure; push master; claim the table is a named-model benchmark.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"

Done when: distribution markdown lists dangling-declaration-reference and requirement-sku-tier; blast-radius/segmentation have Findings ≥ 2; old cases still pass.
```

---

# DX-30 — Ingestion completeness slice 2 (Helm, Kustomize, Bicep param files)

**Closes:** DX-27 expanded nested ARM, in-batch Bicep modules, and TF `for_each`. Helm `templates/`, Kustomize overlays, and `.bicepparam` files in the same declaration batch still never become CanonicalObjects.
**Depends on:** none
**Branch suggestion:** `cursor/dx-30-ingestion-helm-kustomize-bicepparam`

### Design intent

Information-source change, not a new engine. Bound this prompt to **three** in-batch parsers. Do **not** HTTP-fetch chart repos or remote bases. Leave Pulumi/CDK and pipeline OIDC / Front Door to DX-31.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: expand infrastructure declaration parsing so (1) Helm chart templates already in the declaration batch, (2) Kustomize kustomization.yaml resources already in the batch, and (3) Bicep .bicepparam files in the batch contribute CanonicalObjects / parameter bags. Do not add a finding engine. Do not fetch remote charts or bases.

Why: Strategy workstream 1G remainder after DX-27. Path and contradiction engines cannot see resources the parser dropped.

Read first:
- ArchLucid.ContextIngestion/Infrastructure/KubernetesYamlInfrastructureDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/KubernetesManifestCanonicalObjectMapper.cs
- ArchLucid.ContextIngestion/Infrastructure/BicepInfrastructureDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/BicepDeclarationBatchIndex.cs (DX-27 in-batch module resolution — reuse)
- How declaration batches are passed to ParseAsync (same-batch file matching)
- ArchLucid.ContextIngestion.Tests parser tests

Work:

1. Helm (in-batch only): when the batch contains a Chart.yaml (or Chart.yml) plus files under templates/, parse each templates/*.yaml/*.yml through the existing Kubernetes YAML mapper. Skip values.yaml rendering of Go templates: if a document contains "{{" after trim, skip that document (R5 — do not invent rendered values). Tests: Deployment yaml without Go templates appears as a CanonicalObject; a template with {{ .Values.image }} is skipped; missing Chart.yaml is a no-op.

2. Kustomize (in-batch only): when the batch contains kustomization.yaml / kustomization.yml, resolve listed resources[] (and optional patchesStrategicMerge file names) against other batch items by relative path / name. Parse those files with the Kubernetes YAML mapper. Do NOT fetch remote bases (bases: with http(s) or github.com). Recurse directory resources one level when the referenced path is another kustomization in the batch; cap depth 3. Tests: overlay + deployment in batch → deployment object present; remote base only → no fetch, no objects invented.

3. Bicep param: when a .bicepparam (or using … param file paired with a .bicep in the same batch) is present, parse param assignments into the existing property bag / parameter map used by BicepInfrastructureDeclarationParser. If the referenced .bicep is not in the batch, skip (do not invent). Tests: param file sets skuName and the paired resource object reflects it when the parser already substitutes params; unresolved params stay unsubstituted (R5).

4. Register parsers in the existing IInfrastructureDeclarationParser composition list. Do not add Helm/Kustomize NuGet packages — reuse YamlDotNet already referenced.

Do not: render Helm with a live Helm SDK; add Pulumi/CDK; raise MaxTfPropertyCount; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
Test:
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter "FullyQualifiedName~Helm|FullyQualifiedName~Kustomize|FullyQualifiedName~BicepParam|FullyQualifiedName~Bicep|FullyQualifiedName~KubernetesYaml"

Done when: in-batch Helm templates without Go syntax parse; Kustomize overlay resources in-batch parse; missing/remote refs are no-ops.
```

---

# DX-31 — Ingestion completeness slice 3 (Terraform modules, pipeline OIDC, Front Door / private DNS)

**Closes:** `TerraformShowJsonInfrastructureDeclarationParser.ModuleTraversal` expands `terraform show` JSON modules; the **HCL** SimpleTerraform path still drops `module "x" { source = "./child" }` when the child is in-batch. Pipeline federated-identity (OIDC) and Front Door / private DNS route properties still never land in `CanonicalInfrastructurePropertyBag`.
**Depends on:** none
**Branch suggestion:** `cursor/dx-31-ingestion-tf-modules-oidc-dns`

### Design intent

Three information-source expansions, no new engine. Do not duplicate the terraform-show JSON module walker. Do not fetch remote module registries.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: (1) SimpleTerraform HCL in-batch module expansion, (2) pipeline OIDC / federated-identity properties on CanonicalInfrastructurePropertyBag, (3) Front Door route / private DNS link properties from existing ARM/Bicep/TF parsers. Do not add a finding engine.

Why: DX-27 handled for_each on SimpleTerraform. Nested modules in HCL and DNS/Front Door bags are still missing, so dangling-ref and path engines stay silent on typical first-review zips.

Read first:
- ArchLucid.ContextIngestion/Infrastructure/SimpleTerraformDeclarationParser.cs
- ArchLucid.ContextIngestion/Infrastructure/SimpleTerraformResourceBlockParser.cs
- ArchLucid.ContextIngestion/Infrastructure/TerraformShowJsonInfrastructureDeclarationParser.ModuleTraversal.cs (do not duplicate; add a test that show-JSON modules already expand)
- ArchLucid.ContextIngestion/Infrastructure/CanonicalInfrastructurePropertyBag.cs
- ArmJsonInfrastructureDeclarationParser / BicepResourceBodyParser (where ARM types are mapped)
- GitHub Actions / Azure DevOps YAML if a parser already exists for pipelines — extend; if none exists, only extract federatedCredential / oidc / workload identity properties from ARM/Bicep/TF resource types already parsed (Microsoft.Graph/applications federatedIdentityCredentials, azurerm_federated_identity_credential, google_iam_workload_identity_pool_provider). Do not invent a full CI YAML engine in this prompt if no parser exists.

Work:

1. Terraform HCL modules: when SimpleTerraform sees module "name" { source = "./path" } (or "../path") and a matching .tf file is in the same declaration batch, parse that file's resource blocks with the existing SimpleTerraform resource parser (cap depth 3). Skip source = "hashicorp/…" / registry.terraform.io / git:: (R5, no fetch). Unresolved source → no extra objects. Tests: parent + ./modules/kv/main.tf in batch → child azurerm_key_vault object present; registry source → no extra objects.

2. OIDC / federated identity property bag: when an already-parsed resource has federated credential / OIDC issuer / subject / audience properties, copy them onto CanonicalInfrastructurePropertyBag with stable keys (issuer, subject, audience, federatedCredentialName). Tests: ARM federatedIdentityCredentials issuer+subject round-trip; missing properties → keys absent (not empty-string findings).

3. Front Door / private DNS: map Microsoft.Network/frontDoors (and CDN/AFD profiles/routes if already typed), Microsoft.Network/privateDnsZones, privateDnsZoneGroups / virtualNetworkLinks into property bag keys used by dangling-ref + path engines (hostname, routeHostName, privateDnsZone, virtualNetworkLink). Fail closed on unknown types. Tests: Front Door route hostName present; private DNS VNet link id present; unknown type unchanged.

4. terraform show JSON: add a test proving ModuleTraversal already expands modules; if a gap exists for local source only, fix that parser in the same pattern — do not rewrite attribute projection.

Do not: add Pulumi/CDK; HTTP-fetch modules; emit findings for “OIDC node missing”; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
Test:
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter "FullyQualifiedName~SimpleTerraform|FullyQualifiedName~TerraformShowJson|FullyQualifiedName~CanonicalInfrastructure|FullyQualifiedName~ArmJson|FullyQualifiedName~Bicep"

Done when: in-batch TF module resources parse; federated-identity issuer/subject bag keys exist when declared; Front Door/private DNS properties round-trip; registry module sources are no-ops.
```

---

# DX-32 — Data-flow vs trust-boundary path engine

**Closes:** Strategy workstream 1C listed five path families; four shipped (DX-06 blast-radius, DX-07 segmentation **rules**, DX-08 DR/RPO, DX-09 secrets lifecycle). “Actor→datastore path never crosses a modeled trust boundary / private endpoint” is the remainder.
**Depends on:** DX-03, DX-06 shipped
**Branch suggestion:** `cursor/dx-32-dataflow-trust-boundary`

### Design intent

This is a **path** engine, not “TrustBoundary node missing” (`trust-boundary` already fires on mixed-origin actors with zero TrustBoundary nodes). Emit only when an **external** actor has a bounded graph path to a datastore **and** that path includes neither a TrustBoundary node nor a hop with private-endpoint / private-link properties. Fail closed when actors, datastores, or edges are missing.

HOLD exception: authorized here. Must not emit “node type X is absent.”

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add DataFlowTrustBoundaryFindingEngine (IFindingEngine) that emits when an external Actor reaches a datastore without crossing a TrustBoundary node or a private-endpoint hop. Category Security. EngineType data-flow-trust-boundary. Cap 20. Reuse IdentityPathAnalyzer adjacency style. Do not emit when the graph has no Actor, no datastore-like node, or no edges.

Why: trust-boundary today only checks mixed internal/external actors with zero TrustBoundary nodes (presence). Frontier chat often models a TrustBoundary somewhere and still misses that SqlDb is reachable from Ingress without crossing it.

Read first:
- ArchLucid.Decisioning/Analysis/IdentityPathAnalyzer.cs (adjacency + hop cap — extract a shared helper only if duplication would be worse than a small copy)
- ArchLucid.Decisioning/Analysis/SegmentationSemanticsPathAnalyzer.cs (sensitive target detection)
- ArchLucid.Decisioning/Services/TrustBoundaryFindingEngine.cs (do not change; different predicate)
- ArchLucid.KnowledgeGraph/WellKnownGraph.cs (GraphNodeTypes.TrustBoundary, GraphEdgeTypes.ConnectsTo / DependsOn / RelatesTo / Exposes)
- DeclarationIdentityActorMaterializer TrustBoundary actorNodeId property
- BuiltInFindingEngineTypeCatalog + GoldenCorpusHarnessEngineInventory
- InsightDensityPreferredEngineTypes — add this EngineType in this prompt (DX-34 may land first; merge-safe add)

Work:

1. Analyzer (pure, own file):
   - External actor: reuse TrustBoundaryFindingEngine / DX-03 external-facing heuristics (anonymous, Ingress, public LoadBalancer, Front Door). If those helpers are private, extract a shared ActorOriginHeuristics (own file) used by both — do not fork a third copy.
   - Datastore target: reuse SegmentationSemanticsPathAnalyzer sensitive-target rules (SQL/storage/KV/data category). If private, extract rather than copy-paste 80 lines.
   - Walk undirected-or-outgoing edges (same as IdentityPathAnalyzer.BuildAdjacency) cap 8 hops.
   - Path “crosses trust boundary” if any hop node is GraphNodeTypes.TrustBoundary OR any hop node property privateEndpoint / privateEndpointEnabled / privateLink / isPrivateEndpoint is true (bool or string "true").
   - Emit when a path exists from external actor to datastore and NO hop crosses. Title names actor label, datastore label, hop count. evidence:graph-node: for actor, datastore, and up to 8 path node ids. Payload: ActorNodeId, DatastoreNodeId, HopCount, PathNodeIds, CrossedTrustBoundary=false.

2. Finding: EngineType data-flow-trust-boundary. Do not emit if TrustBoundaryFindingEngine's “zero TrustBoundary nodes + mixed origins” is the only fact — require an actual path. If there is no path, emit nothing (R5). If every path crosses, emit nothing.

3. Tests: Ingress actor CONNECTSTO App CONNECTSTO SqlDb, no TrustBoundary on path → 1 finding. Same graph with TrustBoundary node on the path (or SqlDb privateEndpointEnabled=true) → 0. No edges → 0. Internal-only actors → 0.

4. Catalog + DI + harness: register engine. Absent-reason until a golden case exists, OR add a minimal case-4x if DX-29 has not taken the next index — prefer unit-test graph in this prompt and let DX-29 (or a follow-up) add the golden case. If you add a golden case, use the next free index and do not collide with DX-29.

5. Add EngineType to InsightDensityPreferredEngineTypes.

Do not: emit “TrustBoundary node type missing”; call LLM; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DataFlowTrustBoundary|FullyQualifiedName~BuiltInFindingEngineTypeCatalog|FullyQualifiedName~InsightDensityPreferredEngineTypes"

Done when: external-to-datastore path without a trust-boundary hop emits one finding; private endpoint or TrustBoundary on the path emits none; missing graph pieces emit none.
```

---

# DX-33 — Three-way policy-pack × declaration × inventory contradiction

**Closes:** DX-04 emits declaration vs inventory mismatches and **attaches** a PolicyRuleId when a theme maps. It still fires when no pack requires the control. Strategy workstream 1D wants a finding **only** when the assigned pack requires the control, the declaration claims it, and live inventory contradicts it.
**Depends on:** DX-04 shipped
**Branch suggestion:** `cursor/dx-33-three-way-pack-contradiction`

### Design intent

New **effectful** engine. Reuse `DeclarationInventoryContradictionAnalyzer` — do not fork mismatch detection. Filter to rows with a **surviving mapped** `PolicyRuleId` from the tenant’s assigned pack. Do not auto-ensure identities. Do not change DX-04 output.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add PolicyDeclarationInventoryContradictionFindingEngine (IEffectfulFindingEngine) that emits only when (1) the assigned policy pack includes a mapped rule for the mismatch theme, (2) the declaration claims the secure/control-present side, and (3) inventory shows the opposite. EngineType policy-declaration-inventory-contradiction. Category Security. Cap 25. Reuse DeclarationInventoryContradictionAnalyzer. Do not change DeclarationInventoryContradictionFindingEngine.

Why: Pairwise declaration×inventory is already DX-04. Three-way is frontier-novel: “pack requires encryption at rest, Bicep sets encryption.enabled=true, Azure inventory shows encryption.enabled=false.”

Read first:
- ArchLucid.Application/Findings/DeclarationInventoryContradictionFindingEngine.cs
- DeclarationInventoryContradictionAnalyzer / Mapper / Mismatch
- DeclarationSignalPolicyKeyMap
- IComplianceRulePackProvider / assigned pack resolution used by DX-04 ResolveActiveRuleIdsAsync
- EffectfulFindingEngineCollectionFreshness (same stale-inventory suppress)
- BuiltInFindingEngineTypeCatalog + ServiceCollectionExtensions.Decisioning.cs (IEffectfulFindingEngine)
- InsightDensityPreferredEngineTypes — add this EngineType

Work:

1. Engine copies DX-04 inventory read path (Azure + AWS + GCP freshness gates). After mismatches are collected, keep a row only when DeclarationSignalPolicyKeyMap.TryGetFirstMappedRuleId(theme, activeRuleIds) is non-null. If activeRuleIds is empty (no assigned pack), emit [].

2. “Declaration claims the control”: reuse the analyzer’s declaration side — the mismatch already means declaration ≠ inventory. Do not emit when the declaration side is the insecure value and inventory is secure (that is a different story; skip unless the mapper already treats it as declaration-claims-secure). Document the predicate in a one-line comment.

3. Finding title names pack rule id, resource label, declaration value, inventory value. evidence: notes for graph-node, inventory resource id, and policy:{ruleId}. Payload: PolicyRuleId, ResourceLabel, DeclarationKey, DeclaredValue, InventoryValue, CloudProvider.

4. Tests: mismatch + mapped rule in activeRuleIds → 1 finding; same mismatch with empty activeRuleIds → 0; DX-04 tests still pass unchanged. Stale inventory → 0 (reuse freshness helper). Cross-tenant: engine uses IScopeContextProvider — existing effectful test pattern.

5. Catalog + DI + harness absent-reason: “Three-way pack contradiction needs assigned pack + inventory JSON — not on static golden graphs.”

Do not: mutate DX-04 findings; fuzzy-merge SystemName; call LLM; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Also compile Decisioning.Tests catalog if you touch BuiltInFindingEngineTypeCatalog.
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~PolicyDeclarationInventory|FullyQualifiedName~DeclarationInventoryContradiction"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: three-way emits only with an assigned mapped rule; DX-04 still emits pairwise without a pack.
```

---

# DX-34 — Preferred-engine list catch-up

**Closes:** `InsightDensityPreferredEngineTypes` still lists only the DX-06–DX-09 + open-commitment / premise-conflict / declaration-inventory set. DX-10/DX-22/DX-24/DX-25 engines (`insight-generator`, `checklist-cluster-synthesis`, `dangling-declaration-reference`, `requirement-sku-tier`) compete with `topology-coverage` under `MaxJudgedFindingsPerSnapshot`.
**Depends on:** DX-21 shipped
**Branch suggestion:** `cursor/dx-34-preferred-engine-catch-up`

### Design intent

One list. Do not raise the cap. Do not change Simulator skip. DX-32 / DX-33 add their own ids in those prompts; this prompt adds **already-shipped** types so either order merges cleanly.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add shipped path/contradiction/synthesis EngineTypes to InsightDensityPreferredEngineTypes so judge-cap and InsightGenerator spend budget on them instead of topology-coverage. Do not change MaxJudgedFindingsPerSnapshot. Do not change EnableLlmJudge defaults.

Why: DX-21 reused one FrozenSet. New engines shipped in DX-10/22/24/25 never joined the set.

Read first:
- ArchLucid.Core/Findings/InsightDensityPreferredEngineTypes.cs
- ArchLucid.AgentRuntime/PremiumInsightDensityLlmJudge.EngineFindings.cs
- ArchLucid.AgentRuntime.Tests covering SelectJudgedCandidates / preferred engines
- BuiltInFindingEngineTypeCatalog (spell EngineType strings exactly)

Work:

1. Add (ordinal ignore-case, keep existing entries):
   - insight-generator
   - checklist-cluster-synthesis
   - dangling-declaration-reference
   - requirement-sku-tier
   If data-flow-trust-boundary or policy-declaration-inventory-contradiction already exist on the branch, include them; if not, do not invent those strings here.

2. Tests: cap 12 with 12 topology-coverage + 1 dangling-declaration-reference → dangling is judged; skipped is topology-coverage. Existing blast-radius test still passes.

3. Do not sort by novelty rate (that is DX-35).

Do not: raise the cap; auto-Promote; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~PremiumInsightDensityLlmJudge|FullyQualifiedName~InsightDensityPreferredEngineTypes"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~InsightDensityPreferredEngineTypes" (if that project has the tests; otherwise keep them next to the judge tests)

Done when: the four shipped EngineTypes are preferred under a tight cap; cap value unchanged.
```

---

# DX-35 — Novelty-rate optional judge-cap secondary sort (default off)

**Closes:** DX-23 shipped `GET /v1/tenants/current/insight-density/novelty-rates` and an internal Working footnote. DX-23 explicitly forbade using the rate as a gate. Generators still cannot prefer engines operators marked “I did not think of that.”
**Depends on:** DX-21, DX-23 shipped; run **after** DX-34
**Branch suggestion:** `cursor/dx-35-novelty-rate-judge-sort`

### Design intent

**Default off.** When `InsightDensityGateOptions.PreferHighNoveltyEngines` is true (Real mode only), `SelectJudgedCandidates` orders: preferred EngineType, then novelty rate descending (unknown engines = 0), then existing severity / score / FindingId. Do **not** auto-Promote from `DidNotThinkOfThat`. Do **not** write rates into the golden distribution markdown. Simulator ignores the flag.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: optional Real-mode sort so MaxJudgedFindingsPerSnapshot prefers EngineTypes with higher tenant novelty rates from IFindingInsightSignalRepository.ListNoveltyRatesAsync. Default the option false. Do not auto-Promote. Do not change classification.

Why: DX-23 closed the read-model loop. This prompt is the owner-gated write-back into judge budget allocation — still not a buyer claim.

Read first:
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs
- ArchLucid.Core/Findings/IFindingInsightSignalRepository.cs (ListNoveltyRatesAsync)
- ArchLucid.AgentRuntime/PremiumInsightDensityLlmJudge.EngineFindings.cs (SelectJudgedCandidates)
- ArchLucid.Core/Findings/InsightDensityPreferredEngineTypes.cs
- EngineInsightNoveltyRateRow (Rate = DidNotThinkOfThatCount / DecisionGradeCount)
- How the judge currently gets options (IOptions) — inject repository only when the flag is true; Simulator / tests without a repo must keep today’s order

Work:

1. Add bool PreferHighNoveltyEngines { get; set; } default false on InsightDensityGateOptions. Bind from existing configuration pattern. Document: Real mode only; ignored when EnableLlmJudge is false.

2. SelectJudgedCandidates (or a wrapper): if flag false or repository null or lookup fails, keep DX-21/DX-34 order. If flag true, load rates for the current tenant + a trailing window (default 90 days, TimeProvider). Map EngineType → Rate. Sort:
   - IsPreferred (existing)
   - Rate descending (missing = 0)
   - Severity descending
   - InsightDensityScore ascending, nulls last
   - FindingId ordinal
   Tenant isolation: repository already tenant-scoped; do not pass another tenant id.

3. Tests: flag false → identical order to today’s preferred+severity+score. Flag true + rates { dangling-declaration-reference: 0.8, topology-coverage: 0.0 } + cap 1 with one of each at equal severity/score → dangling judged. Second tenant rates do not leak. Repository throw → fall back to flag-false order (fail open on measurement, not on findings).

4. Do not surface rates on buyer-polished shell. Working footnote from DX-23 stays as-is. claimBoundary comment on the option: internal ranking, not G-REAL-06 proof.

Do not: default the flag on; use DidNotThinkOfThat as a Promote; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~PremiumInsightDensityLlmJudge"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~InsightDensityGateOptions" (if present)

Done when: default-off preserves current order; flag-on + rates changes which EngineType survives a cap=1 tie; no auto-Promote.
```

---

## Held (do not duplicate)

**DX-18** (TB-885 compounding ledger) and **DX-19** (ADR 0062 verification slice 1) stay in [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md). Do not start them until the owner unparks **TB-885** / **TB-2033**.

Live frontier **pilot-pending** captures need owner **G-REAL-06** runs. DX-20 shipped the schema; do not invent named-model transcripts.

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- DX-01–DX-16: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- DX-17–DX-28: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)
- Next **DX-36–DX-41:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
- Miss clause: [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)

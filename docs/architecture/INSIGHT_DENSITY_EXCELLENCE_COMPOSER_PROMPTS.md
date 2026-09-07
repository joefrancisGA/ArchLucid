> **Scope:** Copy-paste Composer/Cursor prompts that implement [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Pillar:** [`../assessments/ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md)
> **Do not re-run:** [`INSIGHT_DENSITY_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS.md) ID-01–07 · [`INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md`](INSIGHT_DENSITY_COMPOSER_PROMPTS_ID08.md) ID-08–10 · [`POLICY_PACK_MOAT_COMPOSER_PROMPTS.md`](POLICY_PACK_MOAT_COMPOSER_PROMPTS.md) PP-01 (map already in `DeclarationSignalPolicyKeyMap`)

# Insight density — excellence Composer prompt set (DX-01–DX-16)

**Created:** 2026-09-06 · **Status:** **SHIPPED on `master` (2026-09-07).** Do **not** re-run. Next set: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-21–DX-28**).

These prompts turn the excellence strategy into Cursor-shippable batches. They raise **Decision-Changing Insight Density** by growing the **numerator** (new information sources) and making **dismiss** actually demote generic rows. Cost and calendar are not constraints; **false-hard (R5)** and **tenant isolation (ADR 0037)** still are.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4` (or the suffix the current agent requires). Name the branch in any commit/push request (`Git-Commit-Requires-Branch`). **Do not push to `master`.**

## Do not re-run (already in tree)

| Item | Why |
|------|-----|
| ID-01–ID-10 | Shipped (frontier-delta calculator, distribution report, generic patterns, judge cap, open-commitment, portfolio-recurrence, premise-conflict, Bicep/K8s properties, policy-filter golden, CIS declaration map) |
| PP-01 map | `DeclarationSignalPolicyKeyMap` already includes SOC 2 / GDPR / HIPAA / ISO / PCI / ZTA / CIS AWS-GCP / AKS-EKS-GKE. Remaining gap is **file-catalog truncation** (many mapped ids missing from `ga-starter-compliance.rules.json`) — optional **DX-16**, not a re-map |
| WK-08 | `DeclarationIdentityActorMaterializer` exists for four TF types — **DX-03 expands it**, do not recreate |
| ID-11 / WK-15 honesty | ADR 0070 already applies demotion to typed engines. Do not restore `typed-engine-protected` |
| Coverage-only engines | Still forbidden. **Path / contradiction engines in DX-06–DX-09 are authorized** by this set (see [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md) excellence exception) |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-01** | Gate: resolvable evidence, demotion OR, category default-eligible | First | none | Precision (prerequisite) |
| **DX-02** | Real-mode LLM judge on for engine findings; cap 40 | Yes after DX-01 | DX-01 preferred | Precision / packaging |
| **DX-03** | Expand declaration → Actor / TrustBoundary / data-flow materialization | Yes with DX-01 | none | **Generative** (information source) |
| **DX-04** | Per-mismatch declaration vs inventory contradiction engine | After DX-01 | DX-01 | **Generative** |
| **DX-05** | Open-commitment joined to current-run topology | After DX-01 | DX-01 | **Generative** |
| **DX-06** | Identity blast-radius path engine | After DX-03 | DX-03 | **Generative** |
| **DX-07** | Segmentation semantics (NSG / NetworkPolicy **rules**) | After DX-03 | DX-03 | **Generative** |
| **DX-08** | DR / RPO vs replica topology | After DX-01 | DX-01 | **Generative** |
| **DX-09** | Secrets lifecycle vs inventory rotation | After DX-01 | DX-01 | **Generative** |
| **DX-10** | InsightGenerator LLM pass (not a 5th `AgentType`) | After DX-01, DX-02 | DX-01, DX-02 | **Generative** |
| **DX-11** | Portfolio recurrence default on | Yes | none | **Generative** (cross-run) |
| **DX-12** | ITSM / CSV refuse `ChecklistCoverage` | After DX-01 | DX-01 | Operationalize |
| **DX-13** | “I did not think of that” operator signal | Yes | none | Measurement |
| **DX-14** | Golden harness: remaining engines + contradiction fixture | After DX-04 | DX-04 | Measurement |
| **DX-15** | Finalize stamp: measurement floor + skipped actor engines | After DX-03 | DX-03 | Packaging |
| **DX-16** | Starter catalog: add missing mapped P0 rule ids | Yes | none | Package into governance |

**Do not start from this document:** SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, fake named-model frontier transcripts, a 5th `AgentType` enum value (OpenAPI + quad-agent merge — DX-10 uses the judge/orchestrator seam instead).

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). No SQL RLS as the paying-client boundary. Effectful engines use `IScopeContextProvider`.
- **New finding engine checklist** (all four or `BuiltInFindingEngineTypeCatalogTests` fails):
  1. `IFindingEngine` (graph-pure) **or** `IEffectfulFindingEngine` (I/O).
  2. Row in `ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs`.
  3. `services.AddScoped<Di.IFindingEngine, …>()` or `IEffectfulFindingEngine` in `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.Decisioning.cs`.
  4. Catalog guard test still green.
- Payload DTOs live in `ArchLucid.Contracts/Findings/Payloads/`. Register in `FindingPayloadRegistry`. There is **no** `ArchLucid.Decisioning.Findings.Payloads` namespace.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless the prompt says the wire schema changes. If it does, follow [`../library/OPENAPI_CONTRACT_DRIFT.md`](../library/OPENAPI_CONTRACT_DRIFT.md) (snapshot + `npm run generate:api-types` + client).
- SQL: add a numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql` (single unified schema file) plus rollback under `Migrations/Rollback/` when that folder already has a peer.
- Before editing tracked files: `.\scripts\agent\check-working-tree-path.ps1 -Path '…'`.
- Stage only files this prompt changed. **No `git add -A`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- R5: do not emit false-hard findings. Missing inventory / missing properties → no finding (or explicit `NotVerifiable` payload), never invent a resource.
- Do not add engines that only emit “node type X is missing from GraphSnapshot.”

---

# DX-01 — Insight-density gate actually demotes generic engine rows

**Closes:** Triple-AND demotion + category protection + `RelatedNodeIds` treated as concrete evidence keep almost every engine row at Decision-grade (golden distribution medians 100, would-demote 0).
**Depends on:** none
**Branch suggestion:** `cursor/dx-01-density-gate-predicate`

### Design intent

ADR 0070 already scores typed engines. Demotion still almost never fires because:

1. `InsightDensityGateCandidate.ExtractEvidenceRefs` copies `RelatedNodeIds` when Trace notes lack `evidence:` — then `HasConcreteEvidenceCitation` returns **true** for any leftover string (fallback `return true` after skipping `request` / `critic-checklist`).
2. `HasArchitectureSpecificAnchor` is true whenever evidence is “concrete,” so the two predicates are not independent.
3. `InsightDensityAgentCategoryRules` only allows demotion for `Insight` / `General` / `Critic` / empty — Security/Topology/Compliance never demote.
4. `*UnderSpecified` titles get +10 falsifiability and count as anchors without a resolvable package ref.
5. Named-service generic advice (`Enable MFA on CheckoutApi`) is treated as anchored via `ArchitectureAnchorPattern`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make DeterministicInsightDensityGate demote generic typed-engine and agent findings that lack resolvable package evidence, including Security/Topology/Compliance categories. Do not delete rows — Classification becomes ChecklistCoverage (ADR 0070). Do not restore typed-engine-protected.

Why: ExtractEvidenceRefs treats RelatedNodeIds as evidence; HasConcreteEvidenceCitation then returns true for almost any string. Category protection undoes demotion for every engine category that matters. Golden corpus insight-density-engine-distribution.md shows median 100 and Would demote 0. Precision must bite before DX-04–DX-10 add more findings.

Read first:
- ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs
- ArchLucid.Core/Findings/InsightDensityAgentCategoryRules.cs (XML comment is stale — typed engines CAN demote after ADR 0070)
- ArchLucid.Core/Findings/InsightDensityGateCandidate.cs (ExtractEvidenceRefs)
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (HasConcreteEvidenceCitation, HasArchitectureSpecificAnchor, ArchitectureAnchorPattern, UnderSpecifiedFindingPattern)
- ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs
- ArchLucid.AgentRuntime.Tests/CriticFindingObviousnessPrunerTests.cs (Enable MFA on CheckoutApi currently stays PolicyViolation)
- docs/architecture/adrs/0070-insight-density-controls-typed-engines.md (R5: evidence OR architecture-specific control contradiction still Promote)
- docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md workstream 2

Work:

1. HasConcreteEvidenceCitation — resolvable refs only:
   - Keep skip list: request, critic-checklist, architecture-request.
   - Accept: doc:… (optionally #L or #fragment), ARM resource ids containing /subscriptions/ and resourceGroups/, aws:arn:, gcp: resource names with projects/, policy-rule: prefix, graph-node: prefix ONLY when the remainder is non-empty AND looks like a product node id (not a raw Guid dump used as a fig leaf).
   - REJECT bare RelatedNodeIds / random strings. Remove the fallback `return true`.
   - If evidenceRefs is empty after skips → false.

2. InsightDensityGateCandidate.ExtractEvidenceRefs:
   - Do NOT copy RelatedNodeIds as evidence. Engines that have real citations must write Trace.Notes "evidence:doc:…" or EvidenceRefs on the contract.
   - Optionally, if Finding.PolicyRuleId is non-blank, append "policy-rule:{id}" so policy-backed rows can still Promote.

3. HasArchitectureSpecificAnchor:
   - Stop returning true solely because HasConcreteEvidenceCitation is true (callers already combine both).
   - UnderSpecified / Conflict patterns are NOT sufficient without a resolvable evidence ref OR a quoted resource name that also appears in evidenceRefs.
   - ArchitectureAnchorPattern: PascalCase *Api / *Service tokens in generic imperative sentences ("Enable MFA on CheckoutApi") must NOT count as anchors. Keep doc:#L and ARM ids.

4. Falsifiability +10: only when HasFalsifiabilitySignal AND HasConcreteEvidenceCitation. Title shape alone is not +10.

5. Demotion predicate in DeterministicInsightDensityGate.Score:
   bool genericWithoutEvidence = isGenericAdvice && !hasConcreteEvidence;
   bool demote = (score < _options.DemotionThreshold || genericWithoutEvidence) && !hasConcreteEvidence;
   Then category-protected MAY undo demotion ONLY when hasConcreteEvidence OR (PolicyRuleId-shaped evidence is present). Empty PolicyRuleId + generic phrase → do not protect.
   Rename/replace IsDemotionEligibleCategory: default eligible. Protected categories go away unless evidence is resolvable. Update XML comments. Penalty reason category-protected only when protection actually fired AND evidence exists.

6. R5 keep Promote when: resolvable evidence citation exists AND (architecture control contradiction language OR policy-rule evidence). Do not demote a finding that cites cis-az-006 and doc:main.bicep#L40 just because the title is short.

7. Tests (no ConfigureAwait(false)):
   - Generic "Enable MFA for all user accounts" + critic-checklist → DemoteToChecklist even with category Security and isAgentArchitectureFinding false.
   - Same generic + RelatedNodeIds-only (simulate via FromFinding if you add a test helper) → still demote.
   - "Enable MFA on CheckoutApi" + request → demote (named service is not enough).
   - SecretManagementUnderSpecified + no evidence → demote (no +10 rescue).
   - SecretManagementUnderSpecified + doc:manifest.json#services → Promote, score > 50.
   - Category Security + "Use HTTPS for all public endpoints." + request → Demote (today this is category-protected Promote — that test in DeterministicInsightDensityGateTests MUST change).
   - Update CriticFindingObviousnessPrunerTests: CheckoutApi MFA becomes Advisory unless evidence is doc: or ARM.
   - Golden distribution record mode: if WouldDemoteIfUnprotectedCount is generated, it should be able to go above 0 for topology-coverage generic titles. Do not rewrite all 35 golden expected JSON files unless tests fail; if they fail because Classification flipped, update those case expected files in the same PR with a note in the commit body.

8. Docs: INSIGHT_DENSITY_MISS_CLAUSE.md category sentence; InsightDensityAgentCategoryRules remarks; CONFIGURATION_REFERENCE.md DemotionThreshold row; FINDING_ENGINE_OUTPUT_REFERENCE.md gate paragraph. State claimBoundary: demotion is classification, rows remain on snapshot.

Do not:
- Delete findings.
- Change DemotionThreshold default (stay 50) unless tests prove you must.
- Touch UI except if a Vitest asserts the old CheckoutApi behavior.
- Add a finding engine.
- Push to master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'
Test:
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~DeterministicInsightDensityGate|FullyQualifiedName~GenericArchitectureAdvice"
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~CriticFindingObviousnessPruner"

Done when: Security-category generic HTTPS/MFA without resolvable evidence demotes; doc:#L citations still Promote; catalog tests untouched; ADR 0070 rows-remain-on-package unchanged.
```

---

# DX-02 — Real-mode insight-density judge on for engine findings

**Closes:** Judge is the only So What loop and defaults off (`EnableLlmJudge` / `EnableLlmJudgeForEngineFindings` = false, cap 12).
**Depends on:** DX-01 preferred (otherwise the judge enriches rows the gate should have demoted)
**Branch suggestion:** `cursor/dx-02-real-mode-judge-defaults`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: when execution mode is Real (not Simulator / Mixed-as-simulator), default-enable PremiumInsightDensityLlmJudge for agent AND deterministic engine findings, raise MaxJudgedFindingsPerSnapshot to 40, still honor per-tenant LLM dollar budget and skip-by-cap telemetry. Simulator stays judge-off.

Why: ID-04 wired the judge and cap but left both flags false. Excellence strategy: judge cannot invent findings (DX-10 does that) but must run in Real so Decision-grade captions are evidence-bound. Faithfulness validators already exist.

Read first:
- ArchLucid.Core/Findings/InsightDensityGateOptions.cs
- ArchLucid.Application/Configuration/InsightDensityGateOptionsResolver.cs
- ArchLucid.Application/Tenancy/TenantFindingEngineControlsService.cs
- ArchLucid.AgentRuntime/PremiumInsightDensityLlmJudge.cs (and EngineFindings / ArchitectureFindings partials)
- ArchLucid.AgentRuntime/InsightDensityLlmJudgmentFaithfulnessValidator.cs
- docs/library/CONFIGURATION_REFERENCE.md InsightDensityGate rows
- docs/library/FINDING_STREAM_PRODUCT_OF_RECORD.md (sealed snapshot is record)
- How the host distinguishes Real vs Simulator (search ExecutionMode / AgentExecutionMode / PilotStrict)

Work:

1. Keep host appsettings.json EnableLlmJudge default false for local Simulator. Do NOT flip JSON defaults if the API host boots Simulator by default.

2. In the resolver used by the authority pipeline (InsightDensityGateOptionsResolver and/or TenantFindingEngineControlsService): when current run/task execution mode is Real AND tenant did not explicitly override to false, treat EnableLlmJudge and EnableLlmJudgeForEngineFindings as true. Tenant override false still wins. Simulator → both false regardless of host JSON true (safety).

3. MaxJudgedFindingsPerSnapshot default 40 (options class). Existing skip-by-cap metric stays. Prefer lowest InsightDensityScore first (already ThenBy score in EngineFindings).

4. Judge still MUST NOT generate new findings. Do not change InsightDensityJudgeSystemPromptTemplate "not to generate" rule.

5. Tests:
   - Simulator + host EnableLlmJudge true → effective false.
   - Real + no tenant override → effective true for both flags.
   - Real + tenant override false → false.
   - Cap 40 used in options tests.
   - Existing PremiumInsightDensityLlmJudgeTests still pass (they inject options).

6. Docs: CONFIGURATION_REFERENCE.md; tenant admin card copy if it says "default off" without mentioning Real-mode effective on. No buyer claim that judge raises insight density.

Do not: call Azure OpenAI in unit tests; change Simulator default host mode to Real; add AgentType; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~TenantFindingEngineControls|FullyQualifiedName~InsightDensityGateOptions"
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~PremiumInsightDensityLlmJudge"

Done when: Real mode effective-enables both judge flags without tenant override; Simulator cannot enable via host JSON alone; cap is 40; faithfulness validators unchanged.
```

---

# DX-03 — Expand declaration identity → Actor, TrustBoundary, data-flow edges

**Closes:** WK-08 only seeds aws_iam_role / azurerm_role_assignment / azuread_service_principal / kubernetes_service_account. Ingress, Front Door, APIM, managed identities, and data-flow edges are still missing, so actor engines stay quiet on typical Bicep.
**Depends on:** none (parallel with DX-01)
**Branch suggestion:** `cursor/dx-03-declaration-actor-expansion`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: expand DeclarationIdentityActorMaterializer (and add a sibling edge materializer in its own file) so IaC-only graphs get Actor + TrustBoundary + data-flow edges from already-parsed declaration properties — no new finding engine. Fail-open on unknown shapes. Do not mute RequestActorMaterializer when intake JSON exists.

Why: external-exposure / trust-boundary / privileged-access need Actor nodes. WK-08 allow-list is four Terraform types. Azure-native first reviews use azurerm_linux_function_app identity{}, azurerm_user_assigned_identity, azurerm_cdn_frontdoor_*, azurerm_api_management, kubernetes Ingress, aws_lb — those never become actors.

Read first:
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityActorMaterializer.cs
- ArchLucid.KnowledgeGraph/Materialization/GraphMaterializationStages.cs (DeclarationIdentityActorMaterializationStage)
- ArchLucid.KnowledgeGraph.Tests/DeclarationIdentityActorMaterializerTests.cs
- ArchLucid.Decisioning/Services/ExternalExposureFindingEngine.cs
- ArchLucid.Decisioning/Services/TrustBoundaryFindingEngine.cs
- ArchLucid.Decisioning/Services/PrivilegedAccessFindingEngine.cs
- Canonical property keys from ID-08 (k8s.*, tf.*, ARM aliases)
- docs/architecture/WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md WK-08 (do not recreate; expand)

Work:

1. Extend AllowedTerraformTypes / ARM type / k8s.kind allow-list (document each). Include at least:
   - azurerm_user_assigned_identity / Microsoft.ManagedIdentity/userAssignedIdentities → Actor Machine Internal
   - Function App / Web App with identity.systemAssigned or userAssigned (property already in bag if parser wrote it) → Actor Machine Internal linked to the topology node
   - kubernetes Ingress or k8s.kind=Ingress → Actor External (ingress controller) + TrustBoundary
   - Service type LoadBalancer already on bag (k8s.serviceType) → Actor External
   - azurerm_cdn_frontdoor_endpoint / Front Door / APIM / aws_lb / google_compute_global_forwarding_rule when those resource types already appear as topology nodes
   Skip Secret data. Skip interpolation. Fail-open.

2. New DeclarationIdentityEdgeMaterializer (own file): when you create an Actor from a topology node, add GraphEdge Actor→Topology (and TrustBoundary node with actorNodeId property matching ExternalExposureFindingEngine). Reuse existing edge type constants; do not invent a second trust-boundary schema. If TrustBoundaryFindingEngine requires ≥2 actors with mixed origins, ensure at least one Internal (MI/SA) and one External (Ingress/LB) on a fixture that has both.

3. Stage order: after RequestActorMaterializationStage; skip declaration actors that duplicate intake actors by label/sourceId.

4. Tests: existing four types still work. New cases for Function identity, Ingress, LoadBalancer Service. Secret still has no data keys. Object identity of topology nodes unchanged. KnowledgeGraph tests do not reference Decisioning. Add one Decisioning test: graph from declaration actors fires ExternalExposure when Ingress has no TrustBoundary — if your edge materializer ALWAYS adds TrustBoundary for Ingress, then assert PrivilegedAccess or TrustBoundary instead; pick the engine that should fire. Golden case-35 must stay green; add case-36 only if harness already uses next index (see DECISIONING_GOLDEN_CORPUS.md no-deletion).

5. Docs: CONTEXT_INGESTION.md; FINDING_ENGINE_OUTPUT_REFERENCE.md actor engines "now also fire on declaration-seeded actors beyond WK-08 allow-list."

Do not: add IFindingEngine; Helm/Kustomize compiler; guess privileged=true; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'
Test:
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter "FullyQualifiedName~DeclarationIdentity"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~ExternalExposure|FullyQualifiedName~TrustBoundary|FullyQualifiedName~PrivilegedAccess|FullyQualifiedName~case-35"

Done when: a K8s Ingress + Function MI fixture produces Actor nodes without guided-intake JSON; existing WK-08 tests pass; no new engine registered.
```

---

# DX-04 — Declaration vs inventory contradiction engine (per mismatch)

**Closes:** Reconciliation engines emit one blob finding when HasMismatches; operators do not get a Decision-grade row per “declared private, live public” resource.
**Depends on:** DX-01 (so new rows can demote if generic)
**Branch suggestion:** `cursor/dx-04-declaration-inventory-contradiction`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add graph-pure or effectful finding engine EngineType "declaration-inventory-contradiction" that emits ONE finding PER resource where a security-relevant declaration property disagrees with live inventory — not a single rollup. Reuse GraphAzureInventoryReconciliationAnalyzer / AWS / GCP analyzers and DeclarationSecurityPropertyKeyResolver. IEffectfulFindingEngine because it reads extractor packages (same as GraphAzureInventoryReconciliationFindingEngine). R5: no inventory package → empty list, not a coverage finding.

Why: "stpayprod publicNetworkAccess Enabled in Azure, Disabled in Bicep" is the class of miss a frontier chat with only the ZIP cannot reliably operationalize. Existing recon engines are Correctness rollups.

Read first:
- ArchLucid.Application/Findings/GraphAzureInventoryReconciliationFindingEngine.cs
- ArchLucid.Application/Analysis/GraphAzureInventoryReconciliationAnalyzer.cs (and AWS/GCP peers)
- ArchLucid.Core/Findings/DeclarationSecurityPropertyKeyResolver.cs
- ArchLucid.Decisioning/Analysis/DeclarationSecurityBaselineClassifier.cs (themes)
- Engine checklist in this prompt set header
- EffectfulFindingEngineCollectionFreshness

Work:

1. Payload DeclarationInventoryContradictionFindingPayload in Contracts/Findings/Payloads: ResourceLabel, DeclarationKey, DeclarationValue, InventoryValue, Cloud (Azure|Aws|Gcp), GraphNodeId, InventoryResourceId. Register FindingPayloadRegistry + FindingTypes constant.

2. Engine in ArchLucid.Application/Findings/DeclarationInventoryContradictionFindingEngine.cs. Category Security. For each cloud with a non-stale extractor package, join topology declaration bags to inventory JSON on resource id / name. Compare only the resolver logical names already used by declaration-security (PublicNetworkAccess, AllowBlobPublicAccess, HttpsOnly, MinimumTlsVersion, and AWS/GCP equivalents if inventory JSON has them). Emit Warning when values disagree (case-insensitive, treat Enabled/true vs Disabled/false). Title must name the resource and both values. Trace.Notes must include evidence:doc: or evidence: ARM/ARN id for DX-01. PolicyRuleId: first DeclarationSignalPolicyKeyMap id for data-protection or transport-security if pack provider is already injectable; else omit (do not invent ids).

3. Do not emit when values match. Do not emit "inventory missing from graph" (that is existing recon). Cap MaxFindings per snapshot (e.g. 25) with a trace note when truncated.

4. Catalog + DI + tests. Mock IAzureExtractorPackageRepository; do not hit SQL. One fixture: graph node publicNetworkAccess=Disabled, inventory Enabled → exactly one finding. Inverse. Matching values → none. Null package → none.

5. Docs: FINDING_ENGINE_OUTPUT_REFERENCE.md Application table row. claimBoundary: requires customer-run extractor package on the run; IaC-only reviews stay silent (honest).

Do not: replace GraphAzureInventoryReconciliationFindingEngine; add coverage "orphan" duplicates; OpenAPI unless payload is already on FindingsSnapshot (payload is inside Finding — usually no OpenAPI DTO change); push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~DeclarationInventoryContradiction"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: one mismatch → one Decision-grade-shaped finding with resolvable evidence; no package → zero findings; catalog guard green.
```

---

# DX-05 — Open commitments bound to this run’s topology

**Closes:** OpenCommitmentFindingEngine cites governance trail but does not join deferred PE / waiver to a named topology node on the current graph.
**Depends on:** DX-01
**Branch suggestion:** `cursor/dx-05-open-commitment-topology-join`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: when OpenCommitmentFindingEngine emits a finding, attach RelatedNodeIds / evidence refs for matching topology nodes on the CURRENT GraphSnapshot (label, sourceId, or resource name in the commitment text). If a deferred control (private endpoint, MFA, encryption) is still absent on that node’s declaration bag, add a second finding EngineType "open-commitment-still-open" OR a payload flag StillOpenOnCurrentGraph=true — prefer payload flag on the existing engine to avoid a 40th coverage engine. Effectful engine already exists; do not add a new EngineType unless the catalog split is cleaner — if you add one, follow the four-step checklist.

Why: "waiver expires in 6 days" is hygiene until it names stpayprod on this review. Frontier chat has no governance trail.

Read first:
- ArchLucid.Application/Findings/OpenCommitmentFindingEngine.cs (and helpers in the same folder)
- ArchLucid.Contracts/Findings/Payloads/ (open-commitment payload)
- GraphSnapshot GetNodesByType TopologyResource
- DeclarationSecurityPropertyKeyResolver

Work:

1. Join: normalize commitment resource tokens and graph labels/sourceIds. No match → keep today’s finding but set TopologyMatch=false (do not invent a node).

2. If match AND the commitment kind is a declaration theme we can test (public network, HTTPS) AND current bag still unsafe → StillOpenOnCurrentGraph=true, severity at least Warning, evidence:graph-node:{id} plus existing trail refs.

3. Tests with in-memory trail + graph. Null graph nodes → no crash. Do not query extra SQL beyond what the engine already uses.

4. Docs: FINDING_ENGINE_OUTPUT_REFERENCE.md open-commitment row.

Do not: default-on unrelated portfolio recurrence (DX-11); push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~OpenCommitment"

Done when: a deferred public-access commitment on a node that still has publicNetworkAccess Enabled sets StillOpenOnCurrentGraph; unmatched commitments still emit without fake node ids.
```

---

# DX-06 — Identity blast-radius path engine

**Closes:** No engine walks Actor/MI → RBAC/role assignment → datastore. Principal architects dismiss ChatGPT for missing this class.
**Depends on:** DX-03 (actors exist on IaC graphs)
**Branch suggestion:** `cursor/dx-06-identity-blast-radius`
**Hold exception:** path engine (not coverage). Authorized by this set.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add IFindingEngine EngineType "identity-blast-radius" Category Security that emits findings when a Machine Actor (managed identity / service account) has a graph path to a datastore AND a role-assignment/declaration edge implying write/admin on that datastore, while the datastore is in a regulated theme (PCI/sensitive label, or SecurityBaseline private-only). Graph-pure: only GraphSnapshot. R5 bias to false negatives — unknown role names do not fire.

Why: "checkout-func MI can write kv-pay-prod used by SqlDb" is decision-changing. Do not emit "no IAM nodes found" coverage.

Read first:
- ArchLucid.KnowledgeGraph models (edges, node types)
- PrivilegedAccessFindingEngine (how it reads Actor properties)
- DeclarationIdentityActorMaterializer properties (kind, declarationSourceNodeId)
- azurerm_role_assignment / aws_iam_role_policy attachment if already projected as edges or properties
- Engine checklist

Work:

1. Define a small IdentityPathAnalyzer (own file under Decisioning/Analysis): BFS/DFS bounded to 8 hops. Collect paths Actor → RoleAssignment/Policy → Datastore/KeyVault/Secret. Role names: allow-list Contributor, Owner, Key Vault Secrets Officer, AmazonS3FullAccess, roles/secretmanager.admin — XML comment the list. Unknown roles skip.

2. Finding title names actor label, role, datastore label. Evidence: graph-node ids with graph-node: prefix for DX-01. Payload: ActorNodeId, DatastoreNodeId, RoleName, HopCount. Cap 20 findings.

3. Do not fire on read-only roles (Key Vault Secrets User, Storage Blob Data Reader) unless you also detect public network on the datastore (optional second signal — skip if messy).

4. Golden: new decisioning case only if you can do it without rewriting 01–35. Unit tests with a hand-built GraphSnapshot are enough for this prompt.

5. Catalog + DI + FINDING_ENGINE_OUTPUT_REFERENCE.md.

Do not: call ARM APIs; IEffectful unless you must read extractor roleAssignments JSON — if extractor JSON is richer, IEffectful is OK following GraphAzureInventoryReconciliationFindingEngine, and skip when package missing.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~IdentityBlastRadius|FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: one Actor–Contributor–KeyVault fixture emits one finding; missing role edges emit none; no "IAM incomplete" coverage finding.
```

---

# DX-07 — Segmentation semantics (rules, not NSG presence)

**Closes:** Security-coverage / topology engines treat NSG / NetworkPolicy node presence as success; they do not parse allow-Internet-to-22.
**Depends on:** DX-03
**Branch suggestion:** `cursor/dx-07-segmentation-semantics`
**Hold exception:** semantics engine. Authorized.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add IFindingEngine "segmentation-semantics" that fires when declared NSG / security group / NetworkPolicy rules allow inbound 22, 3389, 1433, or 3306 from 0.0.0.0/0, *, Internet, or 0.0.0.0 — AND the nic/subnet/pod is graphed to a datastore or jump-box path (1–3 hops). Do not fire merely because an NSG node exists. Do not fire because an NSG node is absent (coverage).

Read first:
- How NSG / network_security_rule / k8s NetworkPolicy properties land in CanonicalInfrastructurePropertyBag (ID-08 TryAddTfBlockProperty, k8s.networkPolicyIngress)
- ExternalExposureFindingEngine
- Engine checklist

Work:

1. Parser helper SegmentationRuleParser (own file): from property bag blobs (JSON or flattened keys), detect DestinationPort in {22,3389,1433,3306,5432} AND source Any/Internet/*/0.0.0.0/0. Fail-open on unparseable blobs.

2. Engine Category Security. Title names the NSG/NetworkPolicy and port. Evidence graph-node: or doc: if sourceId is a file path. Cap 20.

3. Tests: fixture with allow 22 from Internet → finding; allow 22 from 10.0.0.0/8 only → none; NSG node with no rules blob → none.

4. Catalog + DI + docs.

Do not: implement a full NSG compiler; emit "no NetworkPolicy on namespace" coverage.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~SegmentationSemantics|FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: Internet-to-22 on a parsed rule emits a finding; presence-only NSG does not.
```

---

# DX-08 — DR / RPO vs replica topology

**Closes:** Requirements can declare RPO; topology does not check geo-replica / failover group properties.
**Depends on:** DX-01
**Branch suggestion:** `cursor/dx-08-dr-rpo-topology`
**Hold exception:** contradiction vs requirement, not “DR node missing.”

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add IFindingEngine "dr-rpo-topology" Category Reliability (or Requirement if Reliability is not a used category — match an existing Category string the orchestrator allows). Emit when a Requirement node states RPO/RTO minutes (parse ISO-like or "15 min") AND the linked SQL/storage/cluster topology node has no replica/geo/failover property in the declaration bag. Do not emit "no DR requirement" coverage. Do not emit when no RPO can be parsed.

Read first:
- RequirementFindingEngine / how requirements attach to services
- Canonical bags: zone_redundant, geo_redundant, failover_group, availability_mode, azurerm_mssql_failover_group, aws_rds replica
- FindingAnalysisContext Category constraints (orchestrator throws on mismatch)

Work:

1. Conservative lexical parse of requirement text/properties for RPO/RTO. If both missing → skip.

2. Linked topology via existing graph edges (requirement→service→datastore). If unlinkable → skip (false negative).

3. Replica heuristic: any of a documented property key list is present and not "false"/"disabled" → satisfied. Else Warning finding naming the requirement and datastore. Evidence from both node ids.

4. Tests: RPO 15 min + SQL without replica keys → 1 finding; with failover_group id → 0; no RPO text → 0.

5. Catalog + DI + docs.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DrRpo|FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: parsed RPO without replica properties emits one finding; no parsed RPO emits none.
```

---

# DX-09 — Secrets lifecycle vs inventory rotation

**Closes:** Phrase list penalizes “rotate secrets”; nothing checks last-rotated against inventory.
**Depends on:** DX-01
**Branch suggestion:** `cursor/dx-09-secrets-lifecycle`
**Hold exception:** inventory-backed lifecycle, not “no Key Vault node.”

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: IEffectfulFindingEngine "secrets-lifecycle" that, when an Azure/AWS/GCP extractor package contains Key Vault / Secrets Manager items with created/updated timestamps older than 90 days (or expiry within 14 days), AND the current graph references that vault/secret (name match on topology or declaration), emit a Warning. No package → empty. No graph mention of that secret → skip (do not dump the whole KV as findings).

Read first:
- AzureExtractorPackageInventoryReader / zip entry names
- AdvisorCostRecommendationFindingEngine freshness helpers
- OpenCommitmentFindingEngine (do not duplicate waiver expiry; if a secret is already an open-commitment, skip or join — prefer skip duplicate titles via ADR 0063 merge key)

Work:

1. Payload: SecretName, VaultName, LastRotatedUtc, DaysStale, Cloud. Threshold constants 90 and 14 with XML comments.

2. Cap 15. Evidence: inventory resource id (ARM/ARN) as concrete citation.

3. Tests with a fake zip/resources JSON. Stale + graph mention → finding. Stale + no graph mention → none. Fresh timestamp → none.

4. Catalog + DI + docs. claimBoundary: requires extractor; not a live Key Vault API from ArchLucid cloud.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~SecretsLifecycle"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~BuiltInFindingEngineTypeCatalog"

Done when: stale secret referenced by the graph emits one finding; extractor absent emits none.
```

---

# DX-10 — InsightGenerator LLM pass (no new AgentType enum)

**Closes:** Judge system prompt forbids generating findings; Critic paraphrases. Nothing may create package-novel findings from graph + inventory + commitments.
**Depends on:** DX-01, DX-02
**Branch suggestion:** `cursor/dx-10-insight-generator`

### Design intent

Do **not** add `AgentType = 5`. That explodes OpenAPI, quad-agent merge, simulator scenarios, and RequiredAgentExecutionOutcomes. Follow `PremiumInsightDensityLlmJudge.ApplyToFindingsAsync`: a new `IInsightFindingGenerator` invoked from `FindingsOrchestrator` after typed engines, **Real mode only**, evidence refs must pass `InsightDensityLlmJudgmentFaithfulnessValidator` (or a sibling that only allows existing package refs). Then run `FindingInsightDensityGateApplicator`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add PremiumInsightFindingGenerator (AgentRuntime) implementing IInsightFindingGenerator (Core) that, in Real mode only, asks Premium-tier completion to propose up to N NEW findings from a bounded evidence summary (graph labels, declaration contradictions already in snapshot, open commitments). Parse JSON array. Drop any finding whose evidenceRefs are not in the allowed set. Apply DeterministicInsightDensityGate. Merge into FindingsSnapshot. Simulator and tests without a fake completion client → no-op.

Why: Filters cannot raise the miss clause. A fifth AgentType is too expensive for this prompt. The judge seam already calls AOAI with caps.

Read first:
- ArchLucid.AgentRuntime/PremiumInsightDensityLlmJudge.cs
- ArchLucid.Core/Findings/IInsightDensityLlmJudge.cs
- FindingsOrchestrator (where engines merge)
- InsightDensityJudgeSystemPromptTemplate (do NOT weaken the judge; add a NEW template InsightGeneratorSystemPromptTemplate)
- Agent execution mode on FindingAnalysisContext
- LlmMonthlyTenantDollarBudgetTracker usage

Work:

1. IInsightFindingGenerator.GenerateAsync(FindingsSnapshot snapshot, GraphSnapshot graph, FindingAnalysisContext ctx, ct). Options: EnabledInRealMode default true when DX-02 resolver says Real; MaxGeneratedFindings default 8; skip if Simulator.

2. System prompt: you MAY create findings a typed engine missed. You MUST copy evidenceRefs from the allowed list only. Prefer contradictions and blast-radius. Do not emit generic MFA/HTTPS/monitoring. Return JSON { "findings": [ { "title", "rationale", "severity", "category", "evidenceRefs": [] } ] }.

3. FindingType distinct (e.g. InsightGeneratorFinding) so InsightDensityFindingSourceClassifier can treat them as agent-like for demotion. EngineType "insight-generator". If orchestrator requires catalog registration, register a thin IFindingEngine that returns empty and let the generator attach EngineType — simpler: generator sets EngineType insight-generator and you add a catalog row plus a no-op engine OR document that generator output is merged without a catalog engine. Prefer catalog + no-op IFindingEngine that returns [] so skip-set stays complete, and orchestrator calls generator after parallel engines.

4. Faithfulness: every evidenceRef in allow-list built like InsightDensityEngineFindingEvidenceSummary.CollectAllowedEvidenceRefs plus graph node ids with graph-node: prefix.

5. Tests with a fake IAgentTierCompletionRouter returning JSON. Unlisted evidenceRef dropped. Simulator never calls router. Budget skip if tracker would exceed — match judge skip behavior if one exists.

6. Do not change CriticSystemPromptTemplate. Do not default host to Real.

OpenAPI: FindingsSnapshot already has findings array — no new HTTP route required.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj'
Test:
dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter "FullyQualifiedName~InsightFindingGenerator|FullyQualifiedName~PremiumInsightFinding"

Done when: Real + fake completion injects a finding with allowed refs; illegal refs dropped; Simulator no-op; gate applied.
```

---

# DX-11 — Portfolio recurrence on by default

**Closes:** `PortfolioRecurrenceFindingOptions.Enabled = false` hides the only cross-system finding a single ChatGPT session cannot produce.
**Depends on:** none
**Branch suggestion:** `cursor/dx-11-portfolio-recurrence-default-on`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: default PortfolioRecurrenceFindingOptions.Enabled to true. Tenant override false still wins. MinSystemCountToReport stays 3 so single-system tenants stay quiet. Update tenant admin copy from "opt-in" to "on unless disabled." Tests that assumed default false must flip.

Read first:
- ArchLucid.Application/Findings/PortfolioRecurrenceFindingOptions.cs
- ArchLucid.Application.Tests/Findings/PortfolioRecurrenceFindingEngineTests.cs
- ArchLucid.Application.Tests/Tenancy/TenantFindingEngineControlsServiceTests.cs
- appsettings JSON section ArchLucid:Findings:PortfolioRecurrence
- docs/library/CONFIGURATION_REFERENCE.md

Work: default true in options class AND host appsettings if present. HostDefault in tenant snapshot follows. Docs claimBoundary: scans other systems in the same tenant catalog only (ADR 0037).

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~PortfolioRecurrence|FullyQualifiedName~TenantFindingEngineControls"

Done when: new tenants get recurrence on; override false disables; MinSystemCountToReport still 3.
```

---

# DX-12 — ITSM and findings CSV refuse checklist coverage

**Closes:** ChecklistCoverage rows can still be exported as work items, defeating dismiss.
**Depends on:** DX-01
**Branch suggestion:** `cursor/dx-12-itsm-decision-grade-only`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: CSV / JSON ITSM export and native create-ticket paths include only FindingClassification.DecisionGradeFinding (or null classification treated as Decision-grade for back-compat). ChecklistCoverage is omitted with a count in the export disclosure. UI toolbar copy: "Exporting N decision-grade findings (M checklist coverage omitted)."

Read first:
- archlucid-ui/src/lib/runs/run-findings-itsm-export.ts
- archlucid-ui/src/components/findings/FindingsItsmExportToolbar.tsx
- archlucid-ui/src/components/findings/FindingItsmExportPanel.tsx
- ArchLucid.Application Reporting CSV formatter for run findings
- Native ITSM create command/handler if any (ItsmNativeIntegrationGate)

Work:

1. Shared helper in UI and matching C# filter. Do not drop Advisory enforcement tier if Classification is Decision-grade.

2. Vitest + C# tests for omitted checklist rows. Native create on a checklist id → 422 or disabled CTA with reason.

3. If OpenAPI error body changes, follow OPENAPI_CONTRACT_DRIFT.md; prefer 422 with existing problem-details shape.

Do not: hide checklist on the review desk (they remain on the package). Push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test: dotnet test filter Itsm|FindingsCsv ; cd archlucid-ui && npx vitest run src/lib/runs/run-findings-itsm-export src/components/findings/FindingsItsmExportToolbar

Done when: checklist rows do not appear in CSV/JSON export; desk still lists them in the checklist band.
```

---

# DX-13 — “I did not think of that” operator signal

**Closes:** Time-to-Value / density numerator has no human instrument on the finding desk.
**Depends on:** none
**Branch suggestion:** `cursor/dx-13-did-not-think-of-that`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add an operator signal on a finding: DidNotThinkOfThat | Expected | DismissAsChecklist. Persist append-only (do not mutate sealed FindingRecords classification). New table FindingInsightSignals (migration + ArchLucid.sql). POST /v1/runs/{runId}/findings/{findingId}/insight-signal. Audit event. UI button on finding inspect / review-detail row (Working mode): "I did not think of that." Idempotent per (run, finding, user) for DidNotThinkOfThat — re-click does not double count.

Why: excellence strategy measurement. Not a mute. Mute remains separate.

Read first:
- Finding mute POST (pattern for run-scoped finding mutations)
- AuditEventTypes.Findings
- ADR 0037 scope predicates
- OPENAPI_CONTRACT_DRIFT.md
- UI-Accessibility-Baseline / enterprise design (outline Button, sentence case)
- FindingDetailActions.tsx / review-detail findings table

Work:

1. DDL: SignalId, TenantId, RunId, FindingId, UserId, Kind, CreatedUtc. Indexes tenant+run.

2. API + tests (Api.Tests). Tenant isolation: other tenant 404.

3. UI: outline button, not primary. StatusTag if already signaled. Vitest.

4. Regenerate OpenAPI snapshot and archlucid-ui api-types in this PR.

5. Docs: short row in FINDING_ENGINE_OUTPUT_REFERENCE or OPERATOR shell — internal metric, not buyer proof.

Do not: call this a cohort; do not auto-Promote classification from the signal; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
Follow OpenAPI drift script after the controller exists.

Done when: POST writes a row; UI button works in Vitest; snapshot regenerated; mute unchanged.
```

---

# DX-14 — Golden harness: remaining product engines + contradiction fixture

**Closes:** Distribution table is 16/39 engines; inventory and new DX engines never appear.
**Depends on:** DX-04 (contradiction engine exists)
**Branch suggestion:** `cursor/dx-14-golden-harness-engines`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: expand GoldenCorpusHarness.CreateEngines() to include declaration-inventory-contradiction (with a test ICompliance/extractor stub that returns empty packages so existing cases do not explode) PLUS actor engines already in the 16 if missing, and register no-op-safe effectful engines that return [] without SQL. Add ONE new case (next index) whose graph+fake inventory triggers DX-04. Do not delete cases 01–35.

Read first:
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs
- docs/library/DECISIONING_GOLDEN_CORPUS.md
- InsightDensityEngineDistributionReportTests (record env var)
- WK-06 comments in harness

Work:

1. Effectful engines in harness: use in-memory empty repositories so AnalyzeAsync returns []. Catalog types that need DI get test fakes in the test project.

2. New case: declaration Disabled vs inventory Enabled on one storage account. Expected findings include declaration-inventory-contradiction.

3. Regenerate docs/quality/insight-density-engine-distribution.md via the existing record test when ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1 (or whatever the test uses). Commit the markdown. Would-demote column may rise after DX-01 — that is expected; do not revert DX-01.

4. Docs: DECISIONING_GOLDEN_CORPUS.md harness count; miss-clause corpus limit sentence.

Do not: require live Azure. Push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"

Done when: new case expected-output includes the contradiction engine; old cases still pass; distribution markdown lists more than 16 engine rows OR honestly lists which fakes returned zero (header count updated).
```

---

# DX-15 — Finalize / stamp measurement floor includes skipped actor engines

**Closes:** Measurement floor counts engines succeeded but does not name actor-dependent engines that did not run.
**Depends on:** DX-03
**Branch suggestion:** `cursor/dx-15-measurement-floor-skipped-engines`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: extend InsightDensityMeasurementFloorPresentation with SkippedActorEngineTypes (external-exposure, trust-boundary, privileged-access when GraphSnapshot has zero Actor nodes) and JudgeSkippedByCap count if available on the snapshot. Surface the sentence on Finalize scorecard and run-detail measurement strip (reuse RunDetailInsightDensityMeasurementDenominatorStrip). Do not block Finalize (honesty, not a hard gate) unless a career-export floor already blocks — keep that behavior.

Read first:
- ArchLucid.Decisioning/Findings/InsightDensityMeasurementFloorPresenter.cs
- archlucid-ui/src/lib/quality/insight-density-measurement-floor.ts
- RunDetailInsightDensityMeasurementDenominatorStrip.tsx
- FindingsSnapshot fields — add JSON only if already extensible; AVOID new SQL columns if you can derive from graph+snapshot at read time.

Prefer derive-at-read: API mapper computes skipped engines from graph actor count + engine failure list. No migration.

Tests in Decisioning + Vitest. Docs: measurement floor claimBoundary — not G-REAL-06 proof.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test: presenter tests + ui vitest insight-density-measurement-floor

Done when: IaC-only graph (0 actors) names the three actor engines as skipped in the floor sentence; graphs with actors do not.
```

---

# DX-16 — Starter compliance catalog: mapped P0 ids that currently resolve to nothing

**Closes:** PP-01 maps soc2-018 / cis-az-012 / … but `ga-starter-compliance.rules.json` truncation means those ids never survive the filter, so themes stay silent or fail-open incorrectly.
**Depends on:** none
**Branch suggestion:** `cursor/dx-16-starter-catalog-mapped-p0`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: for every rule id referenced by DeclarationSignalPolicyKeyMap that is ABSENT from the merged file catalog (default-compliance.rules.json + ga-starter-compliance.rules.json), add a real ComplianceRule entry with appliesToCategory / requiredNodeType / requiredEdgeType copied from the nearest existing cis-az-* sibling — do not emit TenantCurated empty node types. Priority must include P0 when the theme needs to survive bundled priorityFloor P0 (see DeclarationSignalPolicyKeyMap remarks). Do NOT embed pack.curatedRules.v1 into packs (WK note: merger would destroy evaluability).

Why: PP-01 map shipped; catalog truncation is the remaining packaging hole. Assessment weakness "SOC 2 vs CIS Azure does not move declaration rows" is often missing ids, not missing map entries.

Read first:
- ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyKeyMap.cs
- BundledPolicyPackDeclarationThemeTests
- docs/quality/policy-filter-golden-delta.md
- docs/architecture/WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md PP-01 follow-up 2026-08-28 (catalog truncation, rejected family-tier)
- docs/samples/policy-packs/*-rules-v1.json for titles to clone into ga-starter

Work:

1. Enumerate mapped ids vs catalog (write a test that fails on missing ids — that is the acceptance test).

2. Add missing rules to ga-starter-compliance.rules.json (or default-compliance if that is the canonical merge input). Each rule needs evaluable appliesToCategory matching GraphComplianceEvaluator, not empty.

3. Re-run BundledPolicyPackDeclarationThemeTests; update policy-filter-golden-delta.md measured table if the test records it.

4. Do not invent ids absent from DeclarationSignalPolicyKeyMap. Do not change ShouldEmitTheme fail-open for cost-opt.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DeclarationSignal|FullyQualifiedName~BundledPolicyPackDeclarationTheme|FullyQualifiedName~PolicyFilteredGolden"

Done when: every DeclarationSignalPolicyKeyMap id exists in the merged catalog; SOC 2 narrowed pack without public-access mapped keys suppresses data-protection declaration findings (existing theme tests).
```

---

## Later chats (DX-17–DX-28)

**DX-01–DX-16 shipped on `master` (2026-09-07).** Do not re-run them.

Copy-paste prompts for the next batches live in [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md):

| Prompt | Intent | Run now? |
|--------|--------|----------|
| **DX-21** | Judge cap prefers path/contradiction engines | Yes |
| **DX-22** | Checklist-cluster synthesis | Yes |
| **DX-23** | Novelty-signal → per-engine rate | Yes |
| **DX-24** | Dangling declaration references | Yes |
| **DX-25** | Requirement × SKU/tier contradiction | Yes |
| **DX-26** | Deterministic path counterfactual line | Yes |
| **DX-27** | Ingestion nested ARM / Bicep modules / TF for_each | Yes |
| **DX-28** | Path-engine golden fixtures | Yes |
| **DX-17** | Community summaries → InsightGenerator | After DX-21–28 if capacity remains |
| **DX-20** | Live frontier capture schema (synthetic labeled) | After DX-21–28 if capacity remains |
| **DX-18** | TB-885 compounding ledger | **Held** until owner unparks TB-885 |
| **DX-19** | ADR 0062 verification slice 1 | **Held** until owner unparks TB-2033 |

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- Follow-on **DX-17–DX-28:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

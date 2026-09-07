> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-41**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run; **DX-18**/**DX-19** still held) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) (**DX-36–DX-41** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-42–DX-46)

**Created:** 2026-09-07 · **Status:** Shipped on `master` (2026-09-07). Do not re-run. Successor [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md) (**DX-47–DX-50**) also shipped.

DX-01–DX-41 shipped on `master` (2026-09-07) except **DX-18** (TB-885 hold) and **DX-19** (ADR 0062 / TB-2033 hold). Latest golden case is **`case-50`**. Harness registers **38** engines; catalog has **50**; **12** absent-with-reason. This set closes the **remaining Cursor-implementable** density holes: Pulumi/CloudFormation/CDK **in-batch** ingest (workstream 1G remainder), three-way contradiction across all five `DeclarationSignalPolicyKeyMap` themes, AWS/GCP inventory goldens, honest `EvidenceRefs` on engines that already know an ARM id / ARN / policy rule, and Advisor/cloud cost-recommendation goldens.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-16** | Gate, Real judge, actor expansion, contradiction/path engines, InsightGenerator, recurrence, ITSM, novelty signal, harness, measurement floor, starter catalog |
| **DX-17, DX-20–DX-28** | Community summaries, frontier capture schema, judge-cap priority, checklist synthesis, novelty-rate API, dangling refs, SKU/tier, counterfactual, nested ingest, path-engine goldens |
| **DX-29–DX-35** | Golden depth, Helm/Kustomize/`.bicepparam`, TF modules/OIDC/DNS, data-flow × trust-boundary, three-way pack contradiction, preferred-engine catch-up, optional novelty-rate judge sort |
| **DX-36–DX-41** | Harness data-flow/three-way, ARM `templateLink`, novelty→InsightGenerator, pack-gated graph/inventory security, Azure inventory goldens (`case-48`–`case-50`), docs honesty |
| Coverage-only engines | Still forbidden. This set adds **no** new `EngineType`. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-42** | Pulumi stack export + CloudFormation / CDK synth ingest (in-batch) | Yes | DX-30/DX-37 shipped | **Generative** (property bag) |
| **DX-43** | Three-way contradiction across all five policy themes | Yes | DX-33 shipped | **Generative** (same engine, more mismatches) |
| **DX-44** | AWS/GCP inventory golden fixtures | Yes | DX-40 shipped | Measurement |
| **DX-45** | Honest `EvidenceRefs` on engines that already have ARM/ARN/policy ids | Yes | none | Precision (dismiss honesty) |
| **DX-46** | Advisor + AWS/GCP cost-recommendation goldens | After DX-44 preferred | DX-40 shipped | Measurement |

**Start DX-42, DX-43, DX-44, and DX-45 now** (independent). Start **DX-46** after DX-44 if you share `case-NN` numbers, or in parallel if you pick unused numbers after checking `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` (currently **50**).

**Do not start from this document:** **DX-18** / **DX-19** (held until the owner unparks **TB-885** / **TB-2033**), a Pulumi or CDK **compiler** / live `pulumi up` / `cdk synth`, live extractor-as-default (product/GTM), fake named-model frontier transcripts, Graph-RAG buyer claims (ADR 0057 / TB-883), SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType` enum value, turning `PreferHighNoveltyEngines` or the LLM judge **on by default**, tightening `HasConcreteEvidenceCitation` so `graph-node:` stops counting (Workstream 2 remainder — owner-gated; DX-45 must not change that helper's prefixes).

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
- Golden cases: start after **`case-50`**. Read `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` at the start of any golden prompt.

---

# DX-42 — Ingestion completeness slice 4 (Pulumi stack export, CloudFormation, CDK synth)

**Closes:** Strategy workstream 1G remainder after DX-27 / DX-30 / DX-31 / DX-37. Nested ARM, Helm/Kustomize/`.bicepparam`, TF modules, OIDC bag keys, and Front Door / private DNS properties already parse. First-review ZIPs that are **Pulumi stack JSON**, **CloudFormation**, or **CDK `cdk.out` templates** still never become `CanonicalObject`s, so path / contradiction / SKU engines stay silent.
**Depends on:** DX-30 / DX-37 shipped (in-batch parser pattern)
**Branch suggestion:** `cursor/dx-42-ingestion-pulumi-cfn-cdk`

### Design intent

Information-source change, not a new engine. Bound this prompt to **already-synthesized artifacts in the same declaration batch**. Do **not** run `pulumi`, `cdk synth`, `node`, or `python`. Skip TypeScript/Python/Go/C# program files (R5 — do not invent rendered resources). Reuse the Helm pattern: if the document is a program rather than a stack/template, no-op.

`InfrastructureDeclarationReference.Format` is a free string (`helm`, `kustomize` already work without an OpenAPI enum). Add `pulumi-stack-json`, `cloudformation`, and `cdk-synth`. Inspect `API_CONTRACTS.md` before regenerating OpenAPI — only regen if Format is actually an enum on the wire.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: expand infrastructure declaration parsing so (1) Pulumi stack-export JSON already in the declaration batch, (2) CloudFormation JSON/YAML already in the batch, and (3) CDK cdk.out/*.template.json already in the batch contribute CanonicalObjects / property bags. Do not add a finding engine. Do not run pulumi, cdk synth, node, or python. Do not HTTP-fetch.

Why: Strategy workstream 1G remainder after DX-27/DX-30/DX-31/DX-37. Path and contradiction engines cannot see resources the parser dropped because the parent was Pulumi/CDK/CloudFormation.

Read first:
- ArchLucid.ContextIngestion/Infrastructure/IInfrastructureDeclarationParser.cs
- ArchLucid.Host.Composition/Startup/Modules/ContextIngestionCompositionRegistrar.cs (parser DI list)
- ArchLucid.ContextIngestion/ConnectorStages/InfrastructureDeclarationsPayloadNormalizer.cs (Helm/Kustomize batch ParseAsync overload — copy that pattern if the new parsers need sibling files)
- ArchLucid.ContextIngestion/Infrastructure/HelmChartInfrastructureDeclarationParser.cs (in-batch, skip "{{")
- ArchLucid.ContextIngestion/Infrastructure/ArmJsonInfrastructureDeclarationParser.cs (type → CanonicalObject mapping to reuse)
- ArchLucid.ContextIngestion/Infrastructure/CanonicalInfrastructurePropertyBag.cs
- docs/library/CONTEXT_INGESTION.md (Format lists still omit helm/kustomize — fix that in this prompt too)
- docs/library/API_CONTRACTS.md / InfrastructureDeclarationReference — confirm Format is a free string before touching OpenAPI

Work:

1. Pulumi stack export (format pulumi-stack-json): parse JSON with deployment.resources[] (Pulumi stack export / `pulumi stack export` shape). Skip type pulumi:pulumi:Stack, pulumi:providers:*, and entries with no type. Map remaining type strings onto existing CanonicalObject ObjectTypes using the same Azure/AWS/GCP topology/security mapping ARM/TF already use (azure-native:storage:StorageAccount → TopologyResource; azure-native:keyvault:Vault → SecurityBaseline; aws:s3/bucket:Bucket / aws:s3:Bucket → TopologyResource). Copy outputs / inputs that already have analogue keys in CanonicalInfrastructurePropertyBag (public network access, https, TLS, encryption). Unmapped types → skip that resource (fail closed, do not invent). Tests: storage account with allowBlobPublicAccess in outputs appears as a CanonicalObject with the bag key the declaration-security classifier already reads; provider-only export → empty; TypeScript index.ts content with format pulumi-stack-json that is not stack JSON → empty (R5).

2. CloudFormation (format cloudformation): parse JSON or YAML with AWSTemplateFormatVersion and Resources map. Each Resources entry Type + Properties → CanonicalObject. Reuse AWS type mapping from step 1 / existing AWS inventory mappers where honest (AWS::S3::Bucket, AWS::EC2::SecurityGroup, AWS::RDS::DBInstance, AWS::IAM::Role). Intrinsic functions (Ref, Fn::GetAtt, !Ref) stay unsubstituted — copy the raw string only when it is a plain scalar (R5). Tests: S3 bucket with PublicAccessBlockConfiguration properties round-trip; template with only Parameters and no Resources → empty; !Ref-only property is not invented as a concrete SKU.

3. CDK synth (format cdk-synth): when the declaration name ends with .template.json (or content is CloudFormation with a cdk.out-style Resources map), parse through the CloudFormation parser from step 2. Do not execute cdk. Tests: cdk.out/Stack.template.json in batch with AWS::S3::Bucket → same object as cloudformation format; a .ts CDK app file → no-op.

4. Register all three parsers in ContextIngestionCompositionRegistrar next to Helm/Kustomize. No new NuGet. Reuse YamlDotNet already referenced. Wire batch-aware ParseAsync through InfrastructureDeclarationsPayloadNormalizer only if sibling-file lookup is required (CDK often is a single template — do not over-build).

5. Docs honesty:
   - docs/library/CONTEXT_INGESTION.md Format lists: add helm, kustomize, pulumi-stack-json, cloudformation, cdk-synth. Helm/Kustomize shipped in DX-30 and are still missing from those lists.
   - claimBoundary: this is in-batch synthesized artifacts only. Do not claim live Pulumi/CDK compile, remote template fetch, or CloudFormation change-set apply.

Do not: add a Pulumi/CDK/CloudFormation SDK; HTTP-fetch; raise MaxTfPropertyCount; add IFindingEngine; push master; regenerate OpenAPI unless Format is actually an enum (it should not be).

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
Test:
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter "FullyQualifiedName~Pulumi|FullyQualifiedName~CloudFormation|FullyQualifiedName~CdkSynth|FullyQualifiedName~Helm|FullyQualifiedName~ArmJson"

Done when: in-batch Pulumi stack export and CloudFormation/CDK template resources parse; program source files are no-ops; CONTEXT_INGESTION.md lists helm/kustomize plus the three new formats.
```

---

# DX-43 — Three-way contradiction theme expansion (all five policy themes)

**Closes:** `policy-declaration-inventory-contradiction` (DX-33) and `DeclarationInventorySecurityPropertyInventoryReader.ResolveSecurityTheme` only distinguish **data-protection** (public access / blob) and **transport-security** (HTTPS/TLS/SSL). Encryption-at-rest, NSG / network-isolation, and privileged / hostPath **workload-isolation** mismatches either collapse to `data-protection` or never compare. `DeclarationSignalPolicyKeyMap` already has five themes; the three-way engine cannot package four of them honestly.
**Depends on:** DX-33 shipped
**Branch suggestion:** `cursor/dx-43-three-way-theme-expansion`

### Design intent

Same engine. No new `EngineType`. Expand **logical property names**, **inventory key maps**, **theme resolution**, and **ThreeWayGate** so a mismatch emits only when (1) declaration asserts the secure posture, (2) inventory reports the weaker posture, and (3) the tenant pack enables that theme (existing `DeclarationSignalPolicyGate`). Do not invent properties the classifier cannot read.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: expand policy-declaration-inventory-contradiction so mismatches can map to all five DeclarationSignalPolicyKeyMap themes (data-protection, encryption, transport-security, network-isolation, workload-isolation). Do not add a new EngineType. Do not change the pack gate.

Why: DX-33 only fires when public-access / HTTPS keys mismatch. A pack that enables encryption or workload-isolation still cannot surface “declared CMK on, inventory encryption off” or “declared privileged false, inventory hostPath true.”

Read first:
- ArchLucid.Core/Findings/DeclarationSecurityPropertyLogicalNames.cs (today: PublicNetworkAccess, AllowBlobPublicAccess, HttpsOnly, MinimumTlsVersion, SslEnforcementEnabled, IngressBlob)
- ArchLucid.Application/Analysis/DeclarationInventorySecurityPropertyInventoryReader.cs (ResolveSecurityTheme defaults unknown names to data-protection — that is the bug)
- ArchLucid.Application/Analysis/DeclarationInventoryContradictionThreeWayGate.cs (public vs transport keys only)
- ArchLucid.Application/Analysis/DeclarationInventoryContradictionAnalyzer.cs
- ArchLucid.Decisioning/Governance/PolicyPacks/DeclarationSignalPolicyKeyMap.cs (do not add theme tokens)
- ArchLucid.Application/Findings/PolicyDeclarationInventoryContradictionFindingEngine.cs
- DeclarationSecurityPropertyKeyResolver (TF / ARM / Bicep keys for existing logical names — extend, do not fork)
- ArchLucid.Application.Tests/Analysis/DeclarationInventoryContradictionAnalyzerTests.cs
- ArchLucid.Application.Tests/Findings/PolicyDeclarationInventoryContradictionFindingEngineTests.cs
- ArchLucid.Decisioning.Tests/GoldenCorpus/PolicyDeclarationInventoryContradictionGoldenCorpusTests.cs

Work:

1. Add logical names (own constants on DeclarationSecurityPropertyLogicalNames) only when you can name the declaration key AND the inventory key the extractors already emit:
   - encryption: encryption-at-rest / TDE / disk encryption / storageEncrypted (map to theme encryption)
   - network-isolation: NSG default-deny vs 0.0.0.0/0 admin port, or equivalent Azure networkAcl defaultAction Deny vs Allow (theme network-isolation)
   - workload-isolation: privileged / hostPath / hostNetwork on Kubernetes or equivalent inventory row (theme workload-isolation)
   If an extractor does not persist a property today, skip that logical name (R5). XML-comment skipped candidates.

2. ResolveSecurityTheme: exhaustive switch over the logical names. Never default an unknown name to data-protection — unknown → skip the mismatch (do not emit). Keep public/blob → data-protection and https/tls/ssl → transport-security.

3. ThreeWayGate: declaration asserts the secure side:
   - encryption: declared true/enabled vs inventory false/disabled/empty
   - network-isolation: declared Deny/false/restricted vs inventory Allow/true/0.0.0.0/0
   - workload-isolation: declared privileged/hostPath false vs inventory true
   Reuse NormalizeSecurityToken. Missing declaration value → false (do not emit).

4. Tests (concrete types, null checks, no ConfigureAwait(false)):
   - Existing public-access case still emits data-protection with cis-az-006 / sec-base-006.
   - Encryption mismatch emits only when an encryption-mapped pack id survives (e.g. cis-aws-007 / soc2-003); soc2-001 only (vocabulary yes, encryption theme off) → empty.
   - Network-isolation mismatch emits with cis-az-018 / soc2-018; encryption-only pack → empty.
   - Workload-isolation mismatch emits with aks-009 / aks-021; data-protection-only pack → empty.
   - Transport-security HTTPS mismatch still emits.
   - Unknown logical name / missing inventory property → no finding.
   - Update the DX-36 sibling golden only if the fixture should now emit an extra theme; do not weaken case-37 two-way tests.

5. Docs: FINDING_ENGINE_OUTPUT_REFERENCE.md — three-way engine covers the five map themes when properties exist. claimBoundary: still not identity/IAM blast-radius packaging; still not SOC 2 Type II.

Do not: add EngineType; map identity/data-labeling controls (DeclarationSignalPolicyKeyMap remarks forbid it); push master; regenerate OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~DeclarationInventoryContradiction|FullyQualifiedName~PolicyDeclarationInventoryContradiction"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~PolicyDeclarationInventoryContradictionGoldenCorpus"

Done when: each of the five themes has at least one unit test that emits when the pack enables that theme and stays silent when it does not; unknown properties never default to data-protection.
```

---

# DX-44 — AWS/GCP inventory golden fixtures

**Closes:** DX-40 added Azure-only `case-48`–`case-50` (`orphaned-azure-resource`, `azure-inventory-security-baseline`, `secrets-lifecycle`). Registered engines `orphaned-aws-resource`, `orphaned-gcp-resource`, `aws-inventory-security-baseline`, `gcp-inventory-security-baseline`, `aws-inventory-reconciliation`, and `gcp-inventory-reconciliation` stay silent because `GoldenCorpusInventoryFixtureDocument` and `GoldenCorpusEffectfulInventorySupport` pin **Azure only**.
**Depends on:** DX-40 shipped
**Branch suggestion:** `cursor/dx-44-aws-gcp-inventory-goldens`

### Design intent

Do not enable live extractors. Extend the golden harness to pin **AWS/GCP** cloud-inventory ZIPs the same way `EffectfulFindingEngineTestSupport.CreateCloudPinnedContext` already works in unit tests. Add hand-authored cases starting at **`case-51`**. Leave `open-commitment` and `portfolio-recurrence` disabled. Leave Advisor/cost JSON to **DX-46**.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add golden corpus cases starting at case-51 that fire already-registered AWS/GCP inventory engines using pinned cloud-inventory fixtures. Extend the harness so inventory is not Azure-only. Do not add a new EngineType. Do not enable open-commitment or portfolio-recurrence. Do not require live AWS/GCP.

Why: DX-40 proved the Azure pin path. aws-* / gcp-* engines have unit tests and ZIP shapes but never appear in docs/quality/insight-density-engine-distribution.md.

Read first:
- tests/golden-corpus/decisioning/case-48 (orphaned-azure pin)
- tests/golden-corpus/decisioning/case-49 (azure-inventory-security-baseline)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusInputDocument.cs (GoldenCorpusInventoryFixtureDocument is AzurePackageId + ResourcesJson only)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusEffectfulInventorySupport.cs (Azure-only)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs (CreateOrchestrator wires IAzureExtractorPackageRepository only)
- ArchLucid.Application.Tests/Findings/EffectfulFindingEngineTestSupport.cs (CreateCloudPinnedContext / SetupCloudPinnedDownload)
- ArchLucid.Application.Tests/Findings/OrphanedAwsResourceFindingEngineTests.cs
- ArchLucid.Application.Tests/Findings/AwsInventorySecurityBaselineFindingEngineTests.cs (sg-admin-open 0.0.0.0/0:3389)
- Gcp siblings of those tests
- GraphAwsInventoryReconciliationFindingEngine / GraphGcpInventoryReconciliationFindingEngine tests (optional if the same ZIP also fires recon)
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (50)
- docs/library/DECISIONING_GOLDEN_CORPUS.md

Work:

1. Extend GoldenCorpusInventoryFixtureDocument with optional cloud pin fields (own file if the class would exceed one concern — keep Azure fields working). Minimum: CloudProvider (Aws/Gcp), CloudPackageId, ResourcesJson already reused or a CloudResourcesJson. Do not break case-37 / case-48..50 Azure pins.

2. GoldenCorpusEffectfulInventorySupport: add CreateCloudPackage / CreateSeededCloudRepository / CreateCloudPinnedContext mirroring Azure helpers, using ICloudInventoryExtractorPackageRepository and RunEvidencePackagePinService.AwsProvider / GcpProvider. Each class/helper stays in its own file if you split.

3. GoldenCorpusHarness.CreateOrchestrator: when the fixture names Aws or Gcp, seed the cloud repository and put a cloud EvidencePin on FindingAnalysisContext. Azure fixtures stay on the Azure repository. Missing provider on a cloud fixture → fail the case (do not silently no-op).

4. Add at least four cases (vary ids/ARNs from unit tests; do not copy production account numbers):
   - case-51: unattached AWS volume (copy OrphanedAwsResourceFindingEngineTests resources.json shape) → orphaned-aws-resource. README names the engine.
   - case-52: equivalent GCP orphan the Gcp orphan engine already detects.
   - case-53: AWS security group 0.0.0.0/0 admin port from AwsInventorySecurityBaselineFindingEngineTests → aws-inventory-security-baseline.
   - case-54: GCP inventory security-baseline signal from that engine's unit test.
   If the same ZIP also emits aws-inventory-reconciliation / gcp-inventory-reconciliation, that is welcome — do not force a fifth case. If recon needs a graph node the orphan case cannot supply, leave recon silent rather than inventing a fake topology id.

5. Record distribution markdown. Targeted engines must appear with Findings ≥ 1. Update DECISIONING_GOLDEN_CORPUS.md and LatestGoldenCorpusCaseNumber. GoldenCorpusHarnessEngineInventoryTests: registered + absent = catalog count.

Do not: turn on live extractors; pin Advisor cost JSON (DX-46); enable OpenCommitmentFindingOptions; push master; claim AWS/GCP inventory is first-review default.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"

Done when: at least orphaned-aws-resource and aws-inventory-security-baseline appear in the distribution table; case-01..case-50 still pass; Azure pins still work.
```

---

# DX-45 — Honest EvidenceRefs on engines that already have ARM / ARN / policy ids

**Closes:** `DeterministicInsightDensityGate` treats empty `EvidenceRefs` as −25 and demotes when the predicate fires. Many engines already know a package-resolvable id (ARM resource id, AWS ARN, surviving `PolicyRuleId`) but leave `Finding.EvidenceRefs` empty and only set `RelatedNodeIds`. Bare related node ids do **not** count (ADR 0070 / DX-01). Coverage engines (`topology-coverage` median 60 across all 50 cases) must **not** get synthetic `graph-node:` copies of `RelatedNodeIds` just to survive dismiss — that would stamp checklist-shaped coverage as Decision-grade.
**Depends on:** none
**Branch suggestion:** `cursor/dx-45-honest-evidence-refs`

### Design intent

Dismiss honesty, not a new engine and not a gate rewrite. Copy **genuine** resolvable refs the engine already computed into `EvidenceRefs` using prefixes `HasConcreteEvidenceCitation` already accepts (`doc:`, `policy-rule:`, ARM `/subscriptions/…/resourceGroups/…`, `aws:arn:`, `projects/` for GCP). Do **not** change `GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation` prefixes. Do **not** attach evidence to empty-graph coverage warnings.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: populate Finding.EvidenceRefs from identifiers the engine already has (ARM id, AWS ARN, GCP resource name, surviving PolicyRuleId) on inventory, orphan, contradiction, and declaration-security engines. Do not change DeterministicInsightDensityGate. Do not change HasConcreteEvidenceCitation. Do not add EngineType.

Why: Median-60 rows are often real inventory/declaration findings with empty EvidenceRefs. Copying a genuine ARM/ARN into EvidenceRefs makes dismiss scoring honest. Copying RelatedNodeIds as graph-node: on topology-coverage would hide the coverage-engine warning in the distribution table.

Read first:
- ArchLucid.Contracts/Findings/Finding.cs (EvidenceRefs)
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs (HasConcreteEvidenceCitation, IsResolvableEvidenceRef — prefixes: doc:, policy-rule:, graph-node: with product-shaped id, finding:, aws:arn:, /subscriptions/+/resourceGroups/, projects/)
- ArchLucid.Decisioning/Services/TopologyCoverageFindingEngine.cs (RelatedNodeIds only — do not auto-copy)
- ArchLucid.Decisioning/Services/SecurityCoverageFindingEngine.cs
- ArchLucid.Decisioning/Services/RequirementExpectationFindingEngine.cs
- ArchLucid.Application/Findings/OrphanedAzureResourceFindingEngine.cs (and AWS/GCP siblings)
- ArchLucid.Application/Findings/AzureInventorySecurityBaselineFindingEngine.cs (and AWS/GCP)
- ArchLucid.Application/Findings/DeclarationInventoryContradictionFindingMapper.cs
- ArchLucid.Application/Findings/PolicyDeclarationInventoryContradictionFindingMapper.cs
- ArchLucid.Decisioning/Services/DeclarationSecurityBaselineFindingEngine.cs
- A finding that already sets EvidenceRefs well (dangling-declaration-reference or data-flow-trust-boundary) as the pattern

Work:

1. Shared helper (own file), e.g. FindingEvidenceRefs: static methods that append distinct trimmed refs, skip null/whitespace, skip IsGenericEvidenceRef tokens. Do not new up a second citation policy.

2. Inventory / orphan / recon / contradiction / declaration-security / secrets-lifecycle mappers: when the payload or mismatch already has an ARM id, ARN, GCP resource name, or PolicyRuleId, add the matching resolvable EvidenceRefs entry (policy-rule:{id}, the ARM path, aws:arn:…, or projects/…). If the engine already set PolicyRuleId, still add policy-rule:{id} on EvidenceRefs (gate reads EvidenceRefs, not PolicyRuleId).

3. Coverage engines (topology-coverage, security-coverage, requirement-coverage, requirement-expectation, security-baseline-completeness):
   - Empty-graph / “no topology resources” / “themes missing with TopologyNodeCount == 0” → EvidenceRefs stay empty.
   - Incomplete coverage when present nodes have an azureResourceId / arn / resourceId property on the GraphSnapshot node → cite those ids only.
   - Do NOT copy RelatedNodeIds to graph-node:{id} unless the node id is already an ARM path or ARN (product-shaped ids that are just labels do not help operators and inflate scores).

4. Tests:
   - Orphaned Azure finding EvidenceRefs contains the inventory resource id in ARM form when the unit-test JSON has one.
   - Three-way contradiction EvidenceRefs contains policy-rule:{mapped id} when the pack stamps PolicyRuleId.
   - TopologyCoverageFindingEngine empty-graph fixture still has empty EvidenceRefs.
   - TopologyCoverageFindingEngine missing-category fixture with a node that has no ARM/ARN property still has empty EvidenceRefs (RelatedNodeIds unchanged).
   - Golden corpus: if inventory case-48..50 scores rise because EvidenceRefs now resolve, re-record those cases and the distribution markdown. Do not edit HasConcreteEvidenceCitation to force the old 60.

5. claimBoundary in FINDING_ENGINE_OUTPUT_REFERENCE.md: EvidenceRefs are package citations, not a new information source. This does not tighten the citation helper (Workstream 2 remainder). Do not claim SOC 2 Type II.

Do not: change DX-01 demotion predicate; default PreferHighNoveltyEngines on; attach synthetic graph-node refs on coverage engines; push master.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~Orphaned|FullyQualifiedName~InventorySecurity|FullyQualifiedName~DeclarationInventoryContradiction"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~TopologyCoverage|FullyQualifiedName~SecurityCoverage|FullyQualifiedName~RequirementExpectation|FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"

Done when: inventory/contradiction unit tests assert a resolvable EvidenceRefs prefix; empty-graph coverage stays evidence-less; golden corpus green after any honest expected-file updates.
```

---

# DX-46 — Advisor + AWS/GCP cost-recommendation golden fixtures

**Closes:** Registered engines `advisor-cost-recommendation`, `aws-cost-recommendation`, and `gcp-cost-recommendation` stay silent. DX-40 explicitly skipped Advisor telemetry. Unit tests already pin `advisor-cost.json` / `cost-recommendations.json` inside a ZIP (`AwsCostRecommendationFindingEngineTests`).
**Depends on:** DX-40 shipped; run after DX-44 if you share `case-NN` numbers
**Branch suggestion:** `cursor/dx-46-cost-recommendation-goldens`

### Design intent

Measurement only. Extend the golden inventory ZIP builder so a fixture can include **named JSON entries** besides `resources.json`. Do not enable live Advisor. Do not add a cost-coverage engine.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add golden corpus cases (next unused case-NN after DX-44; currently plan case-55+ if DX-44 took 51–54) that fire advisor-cost-recommendation, aws-cost-recommendation, and gcp-cost-recommendation from pinned ZIP JSON. Do not add EngineType. Do not enable live Advisor or extractors.

Why: Cost-recommendation engines are registered and unit-tested but absent from insight-density-engine-distribution.md because the golden ZIP helper only writes resources.json.

Read first:
- ArchLucid.Application.Tests/Findings/AwsCostRecommendationFindingEngineTests.cs (advisor-cost.json shape: recommendations[].id/finding/estimatedMonthlySavings)
- AdvisorCostRecommendationFindingEngine tests (Azure advisor JSON filename + shape)
- GcpCostRecommendationFindingEngine tests
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusEffectfulInventorySupport.cs (BuildZip currently resources.json only)
- GoldenCorpusInventoryFixtureDocument (after DX-44 may already have cloud fields — extend, do not break)
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (read at start)
- docs/library/DECISIONING_GOLDEN_CORPUS.md

Work:

1. Extend the fixture document + ZIP builder with optional extra entries (filename + JSON body), e.g. advisor-cost.json. Azure cost cases still use IAzureExtractorPackageRepository; AWS/GCP cost cases use the cloud pin path from DX-44. If DX-44 has not merged, implement the minimal cloud pin needed for one AWS cost case and XML-comment that orphans/security-baseline goldens belong in DX-44.

2. Add at least three cases, copying unit-test JSON with varied ids:
   - Azure Advisor cost recommendation → advisor-cost-recommendation
   - AWS cost JSON → aws-cost-recommendation
   - GCP cost JSON → gcp-cost-recommendation
   Missing cost JSON → engine returns empty (already unit-tested; do not add a golden that expects a finding).

3. Record distribution markdown. Those three EngineTypes must show Findings ≥ 1. Update LatestGoldenCorpusCaseNumber and DECISIONING_GOLDEN_CORPUS.md. Keep open-commitment / portfolio-recurrence disabled.

Do not: call live Advisor APIs; invent savings amounts not in the JSON; push master; claim cost engines are first-review default.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~GoldenCorpus|FullyQualifiedName~InsightDensityEngineDistribution"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~CostRecommendation|FullyQualifiedName~AdvisorCost"

Done when: the three cost EngineTypes appear in the distribution table; earlier inventory goldens still pass.
```

---

## Held (do not duplicate)

**DX-18** (TB-885 compounding ledger) and **DX-19** (ADR 0062 verification slice 1) stay in [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md). Do not start them until the owner unparks **TB-885** / **TB-2033**.

Live frontier **pilot-pending** captures need owner **G-REAL-06** runs. DX-20 shipped the schema; do not invent named-model transcripts. Graph-RAG buyer claims need ADR 0057 owner override + **TB-883** ablation.

Workstream 2 remainder (**tighten `HasConcreteEvidenceCitation` so generic `graph-node:` stops counting**, Real-mode judge default-on, `PreferHighNoveltyEngines` default-on) stays owner-gated. **DX-45** must not do that tightening.

---

## Related

- Strategy: [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md)
- DX-01–DX-16: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md)
- DX-17–DX-28: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md)
- DX-29–DX-35: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md)
- DX-36–DX-41: [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md)
- Cursor index: [`.cursor/prompts/insight-density-excellence-00-index.md`](../../.cursor/prompts/insight-density-excellence-00-index.md)
- Hold exception: [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
- Miss clause: [`../quality/INSIGHT_DENSITY_MISS_CLAUSE.md`](../quality/INSIGHT_DENSITY_MISS_CLAUSE.md)

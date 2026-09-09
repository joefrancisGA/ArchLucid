> **Scope:** Copy-paste Composer/Cursor prompts that continue [`INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md`](INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md) after **DX-01–DX-72**. Internal engineering only — not buyer-facing copy.
> **Predecessor:** [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS.md) (**DX-01–DX-16** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX21.md) (**DX-17–DX-28** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX29.md) (**DX-29–DX-35** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX36.md) (**DX-36–DX-41** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX42.md) (**DX-42–DX-46** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX47.md) (**DX-47–DX-50** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX51.md) (**DX-51–DX-56** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX58.md) (**DX-58–DX-62** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX63.md) (**DX-63–DX-68** — do not re-run) · [`INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md`](INSIGHT_DENSITY_EXCELLENCE_COMPOSER_PROMPTS_DX69.md) (**DX-69–DX-72 shipped** — do not re-run).
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Gate:** [`adrs/0070-insight-density-controls-typed-engines.md`](adrs/0070-insight-density-controls-typed-engines.md) · **Hold:** [`../quality/HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)

# Insight density — excellence Composer prompt set (DX-73–DX-76)

**Created:** 2026-09-09 · **Status:** Ready to run. **DX-01–DX-72 shipped / implemented — do not re-run.**

DX-69 materialized Azure IAM + data-flow path edges from declared principal/scope/backend. DX-70 stopped unanchored `doc:` / `finding:` refs from vetoing demotion. DX-71 demotes fused constituents. DX-72 graded concrete citations. Latest golden case is **`case-65`** (`GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber`). Harness registers **42** engines. **`case-65`** proves Azure Terraform UAMI + Contributor on data-bearing SQL through `DefaultGraphBuilder` with **no** hand overlay.

What remains Cursor-implementable is still **not** another subtractive flag and **not** a new `EngineType`. The checked-in distribution table (`docs/quality/insight-density-engine-distribution.md`) still describes a **pre–DX-69** slice (`case-01`…`case-63`, 41 engines). Whether DX-72 actually broke the 60 / 65 / 75 / 80 / 85 ladder is **unmeasured**. Path engines that score 80–85 still almost never fire on **non-Azure** IaC: AWS/GCP IAM declarations do not promote into the same path edges, **case-60** (`data-flow-trust-boundary`) is still a **hand overlay**, and **case-39** / **case-44** (`segmentation-semantics`) still overlay NSG rule blobs + `APPLIES_TO` hops.

**This set adds zero `EngineType`.** Do not add a 5th `AgentType`. Do not add a coverage engine.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/dx-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Do not re-run

| Item | Why |
|------|-----|
| ID-01–ID-10, PP-01 map | Shipped |
| **DX-01–DX-68** | Gate, path/contradiction engines, InsightGenerator, ingest, goldens, fusion, held-checks, threshold 65, corroboration, topology-security-drift |
| **DX-69–DX-72** | Azure declaration IAM/`CONNECTS_TO` edges, evidence-ref vetoes, fuse-then-demote, graduated scores, **case-65** |
| Coverage-only engines | Still forbidden. This set adds **no** new `EngineType`. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Density effect |
|--------|-------|-----------|------------|----------------|
| **DX-73** | Re-record engine distribution after DX-69–DX-72 | First (measurement) | DX-69–DX-72 shipped | Honesty (whether the score ladder actually spread) |
| **DX-74** | AWS/GCP declaration IAM path edges | After DX-73 starts | DX-69 shipped | **Generative** (blast-radius on AWS/GCP IaC-only reviews) |
| **DX-75** | Data-flow `CONNECTS_TO` golden without overlay | Yes with DX-74 | DX-69 shipped | **Generative** (data-flow-trust-boundary on parsed ingress/backend) |
| **DX-76** | NSG/SG/firewall rule promotion + association edges | Yes with DX-74 | DX-07, DX-69 shipped | **Generative** (segmentation-semantics on parsed rules, not overlays) |

**Start DX-73 now.** It only records and documents; it does not compete with mapper edits. **Start DX-74, DX-75, and DX-76 after DX-73 has recorded** (or in parallel if DX-73 is already merged) — they add goldens and must re-record the distribution markdown at the end of **each** golden prompt. Read `LatestGoldenCorpusCaseNumber` at the start of every golden prompt; do not assume 66.

**Do not start from this document:** live extractor-as-default (product/GTM), `EnableProseAssumptionExtraction` default-on, fake named-model frontier transcripts, Graph-RAG buyer claims (ADR 0057 / **TB-883**), raising `MaxJudgedFindingsPerSnapshot` above 40, `portfolio-shared-topology` default-on, SOC 2 CPA (**G-REAL-05**), third-party pen test (**G-ASSURANCE-02**), GTM cohorts **M-90 / M-44 / M-91 / M-92**, a 5th `AgentType`, coverage engines parked on **G-REAL-06**, a second fusion engine, a new path/contradiction `EngineType` (DX-06 / DX-07 / DX-32 already exist — this set only **feeds** them).

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037). Effectful engines use `IScopeContextProvider`.
- **No new finding engine.** Catalog map, DI, and `FINDING_ENGINE_OUTPUT_REFERENCE.md` stay unchanged except comments that existing path engines now consume declaration-derived AWS/GCP IAM, data-flow, or segmentation edges.
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
- Golden cases: start after **`case-65`**. Read `GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber` at the start of any golden prompt.
- Do not turn `EnableProseAssumptionExtraction` **on by default**. DX-57 already made ranking priors and the insight generator effective-on in Real mode — do not undo that.
- Keep **case-59 / case-60 / case-39 / case-44 / case-65** as historical fixtures. **Do not delete** golden directories (corpus only grows).
- When recording goldens or the distribution table, pass **`input.PriorGraphFixture`** into `GoldenCorpusHarness.RunAsync` / `GenerateFindingsSnapshotAsync` so **case-64** (`topology-security-drift`) is not silently dropped.

---

# DX-73 — Re-record insight-density engine distribution after DX-69–DX-72

**Closes:** Measurement honesty after DX-69–DX-72. `docs/quality/insight-density-engine-distribution.md` is still a **case-63 / 41-engine** snapshot. `InsightDensityEngineDistributionMarkdown.Build` already interpolates `LatestGoldenCorpusCaseNumber` (**65**). The table numbers were not regenerated, so nobody can tell whether DX-72 spread scores off the five-rung ladder or whether **case-65** added `identity-blast-radius` volume. `InsightDensityEngineDistributionReportTests.Record_distribution_markdown_when_env_flag_set` currently calls `GenerateFindingsSnapshotAsync` **without** `priorGraphFixture`, so a fresh record would omit **case-64** drift findings.
**Depends on:** DX-69–DX-72 shipped (`#2447`)
**Branch suggestion:** `cursor/dx-73-distribution-rerecord`

### Design intent

Record-only plus a harness bugfix. **Zero new `EngineType`.** Do **not** invent `EvidenceRefs` on coverage engines to “fix” medians. Do **not** hand-edit table numbers. If the ladder did not spread, say so in the case/README or a short claimBoundary note in the markdown header — that is a valid DX-73 outcome and is why DX-74–DX-76 exist.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: re-record docs/quality/insight-density-engine-distribution.md from the current golden corpus (case-01..LatestGoldenCorpusCaseNumber) after DX-69–DX-72, and pass priorGraphFixture through the distribution recorder so case-64 topology-security-drift is included. Do not add EngineType. Do not invent EvidenceRefs. Do not change DemotionThreshold or InsightDensityDemotionPredicate. Do not hand-edit score numbers.

Why: The checked-in distribution table still says case-01..case-63 and 41 harness engines. DX-72 claimed to break the 60/65/75/80/85 ladder; that is unmeasured. Sort-by-density and PreferHighHumanAcceptResidual cannot be tuned on stale medians.

Read first:
- ArchLucid.Decisioning.Tests/GoldenCorpus/InsightDensityEngineDistributionReportTests.cs (Record_distribution_markdown_when_env_flag_set)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs (GenerateFindingsSnapshotAsync already accepts priorGraphFixture)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusRegressionTests.cs (already passes PriorGraphFixture — copy that call shape)
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs
- ArchLucid.Decisioning.Tests/Findings/InsightDensityEngineDistributionMarkdownTests.cs (header snapshots must stay in lockstep with LatestGoldenCorpusCaseNumber)
- docs/quality/insight-density-engine-distribution.md
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (expect 65 unless a later prompt landed)

Work:

1. InsightDensityEngineDistributionReportTests: pass input.PriorGraphFixture (and inventoryFixture) into GenerateFindingsSnapshotAsync in BOTH Calculator_runs_for_every_case_and_covers_all_engine_types AND Record_distribution_markdown_when_env_flag_set. Null fixture stays null.

2. Record (local only):
   ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1
   dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~Record_distribution_markdown_when_env_flag_set"
   Commit the rewritten docs/quality/insight-density-engine-distribution.md. Do not hand-edit cells. Do not add novelty rates. Do not add columns unless you also update InsightDensityEngineDistributionRow + header tests (skip new columns).

3. After recording, write a short honest note in the markdown header or in docs/architecture/INSIGHT_DENSITY_EXCELLENCE_STRATEGY.md executive-summary clause (one sentence): whether identity-blast-radius finding count rose vs the pre-DX-69 table, and whether medians are still a 60/65/75/80/85 ladder. If the ladder did not spread, do not “fix” it in this prompt.

4. Update InsightDensityEngineDistributionMarkdownTests verbatim headers if LatestGoldenCorpusCaseNumber interpolation changed the case-range string (already case-65 after #2450 — re-check). GoldenCorpusHarnessEngineInventoryTests: registered count stays 42 unless you added an engine (you must not).

5. claimBoundary: measurement honesty after DX-69–DX-72, not a named-model beat, not SOC 2 Type II, not permission to raise coverage-engine scores.

Do not: add EngineType; invent EvidenceRefs; raise DemotionThreshold; delete golden cases; push master; regenerate OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
Test:
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~InsightDensityEngineDistribution|FullyQualifiedName~GoldenCorpusRegressionTests|FullyQualifiedName~GoldenCorpusCase64"
```

**Done when:** The committed distribution markdown is generated from the current corpus (including case-64 via `priorGraphFixture` and case-65). Header tests match. No new engine. Numbers were not typed by hand.

---

# DX-74 — AWS and GCP declaration-derived IAM path edges

**Closes:** Strategy Workstream 1B remainder after DX-69. `DeclarationIdentityPathEdgeMaterializer` already treats `terraformType` containing `iam_role_policy` / `iam_policy` / `project_iam` as role-assignment-shaped, and `IdentityPathAnalyzer` uses the same predicates. `DeclarationIdentityActorMaterializer` already seeds Machine actors from `aws_iam_role` (not `google_service_account`). `InfrastructureDeclarationSpecialPropertyMapper.MapIamAndDataFlowPathProperties` promotes Azure-shaped keys (`principal_id`, `role_definition_name`, `scope`) — **not** AWS `role` / `policy_arn` / `member` or GCP `role` / `member` / `members`. `IdentityBlastRadiusRoleNames` already allow-lists `AmazonS3FullAccess` and `roles/secretmanager.admin`. There is no golden that parses AWS/GCP IAM through `DefaultGraphBuilder` without a hand overlay (**case-59** is Pulumi + overlay; **case-65** is Azure only).
**Depends on:** DX-69 shipped
**Branch suggestion:** `cursor/dx-74-aws-gcp-iam-path-edges`

### Design intent

Information-source change. **Zero new `EngineType`.** Reuse DX-69 materializer + mapper; extend promotion keys and actor-type allow-lists. Do not invent edges when principal, role, or target is missing. Prefer existing write/admin tokens (`AmazonS3FullAccess`, `roles/secretmanager.admin`) in goldens before expanding `IdentityBlastRadiusRoleNames`. Unknown roles stay skipped (R5).

Target shape is the same walk DX-69 already feeds:

- Machine `Actor` —`RELATES_TO`→ IAM attachment / `google_project_iam_member` —`APPLIES_TO`→ data-bearing datastore
- `roleName` on the assignment node must match `IdentityBlastRadiusRoleNames.IsWriteAdminRole`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: promote AWS and GCP IAM declaration properties into the same DX-69 path-edge pipeline so identity-blast-radius fires on IaC-only AWS/GCP graphs without hand-authored overlays. Do not add EngineType. Do not invent edges. Do not change DeterministicInsightDensityGate or DemotionThreshold.

Why: DX-69 proved Azure azurerm_role_assignment → blast-radius via DefaultGraphBuilder (case-65). AWS aws_iam_role_policy_attachment / GCP google_project_iam_member still never become Actor → assignment → datastore adjacency on a chat ZIP.

Read first:
- ArchLucid.ContextIngestion/Infrastructure/InfrastructureDeclarationSpecialPropertyMapper.cs (MapIamAndDataFlowPathProperties)
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityActorMaterializer.cs (AllowedTerraformIdentityTypes — aws_iam_role is present; google_service_account is not)
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityPathEdgeMaterializer.cs (IsRoleAssignmentTerraformType already includes iam_role_policy / iam_policy / project_iam)
- ArchLucid.Decisioning/Analysis/IdentityPathAnalyzer.cs
- ArchLucid.Decisioning/Analysis/IdentityBlastRadiusRoleNames.cs (AmazonS3FullAccess, roles/secretmanager.admin already write/admin)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusIngestDeclarationGraphFactory.cs (case-65 Azure path — copy parse-through-DefaultGraphBuilder, not case-59 overlay)
- docs/library/CONTEXT_INGESTION.md § Declaration identity path edges
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber (next cases are Latest+1 / Latest+2)

Work:

1. Mapper (extend MapIamAndDataFlowPathProperties or a sibling MapAwsGcpIamProperties in the same class — do not fork a second mapper type unless a two-year developer would lose the Azure path). When the declaration body has them, write the same stable keys DX-69 already uses:
   - principalId ← principal_id / identity.principalId / role_arn / arn / member (IAM principal ARN or GCP member stripped of user:/serviceAccount: prefix when that exact id already exists on a topology node)
   - roleName ← role / policy_arn last segment / role_definition_name / roleName
   - declarationTargetResourceId ← scope / targetResourceId / bucket / db_instance_identifier / secret_id / resource / project (only the declared value; never invent a datastore id)
   Missing property → omit the key. Never guess a principal. Do not overwrite a non-empty Azure mapping.

2. DeclarationIdentityActorMaterializer: add google_service_account (and google_project_iam_member only if it already carries a principal the actor stage can bind — prefer seeding from the identity resource, not the binding). Keep fail-open on unknown types.

3. Path materializer: if AWS/GCP assignment nodes are not matching IsRoleAssignmentTerraformType, extend the predicate to aws_iam_role_policy_attachment, aws_iam_policy_attachment, aws_iam_role_policy, google_project_iam_member, google_project_iam_binding — keep IdentityPathAnalyzer predicates in sync (extract a shared KnowledgeGraph helper OR duplicate the small predicate; do not add a Decisioning → new reverse dependency). Still skip when principalId or target is missing from the snapshot.

4. IdentityBlastRadiusRoleNames: only add a token if a realistic AWS/GCP golden cannot use AmazonS3FullAccess or roles/secretmanager.admin. Prefer those two. Do not add AdministratorAccess unless a test proves Contains() is too narrow.

5. Tests (concrete types, null checks, no ConfigureAwait(false)):
   - Mapper: aws_iam_role_policy_attachment with role + policy_arn AmazonS3FullAccess + bucket name → principalId/roleName/declarationTargetResourceId set
   - Mapper: google_project_iam_member with member + role roles/secretmanager.admin + secret id → same stable keys
   - Missing role/member → keys omitted, zero IAM edges
   - Target id not on snapshot → zero IAM edges
   - IdentityPathAnalyzer.Analyze on DefaultGraphBuilder output returns HopCount >= 2 for both AWS and GCP fixtures
   - Azure case-65 factory test still passes (do not regress azurerm_role_assignment)

6. Goldens: two hand-authored cases (Latest+1 AWS, Latest+2 GCP) parsed through DefaultGraphBuilder with no Actor/path overlay. Each must include (a) identity resource, (b) write/admin attachment using an allow-listed role token, (c) data-bearing datastore whose declared name/id matches the assignment target. Expected findings must include identity-blast-radius. Update ExpectedCaseCount, LatestGoldenCorpusCaseNumber, DECISIONING_GOLDEN_CORPUS.md, materializer recorder. Keep case-59/65. Re-record insight-density-engine-distribution.md at the end (ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1) with priorGraphFixture passed.

7. Docs: CONTEXT_INGESTION.md — DX-69 Azure keys; DX-74 AWS/GCP keys into the same path materializer. claimBoundary: not a live customer-directory IAM graph, not a named-model beat, not SOC 2 Type II.

Do not: add EngineType; invent edges; change demotion predicate; delete overlay goldens; push master; OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'
Test:
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj --filter "FullyQualifiedName~InfrastructureDeclarationSpecialPropertyMapper"
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter "FullyQualifiedName~DeclarationIdentity"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~IdentityPathAnalyzer|FullyQualifiedName~GoldenCorpusIngestDeclarationGraphFactory|FullyQualifiedName~GoldenCorpusRegressionTests"
```

**Done when:** Two new goldens parsed from AWS and GCP IaC (no hand overlay) each emit `identity-blast-radius`. Missing principal/target emits nothing. Azure **case-65** still passes. No new `EngineType`.

---

# DX-75 — Data-flow `CONNECTS_TO` golden without hand overlay

**Closes:** DX-69 data-flow half that shipped in `DeclarationIdentityPathEdgeMaterializer.MaterializeDataFlowPath` but was never proven on a parse-through golden. **case-60** still hand-authors an external Actor + `CONNECTS_TO` hops after parsing a single CDK Lambda. `InfrastructureDeclarationSpecialPropertyMapper` already copies `backend` / `backend_service` into `declarationBackendNodeId` and `connectedToNodeIds`. `DeclarationIdentityActorMaterializer.ExternalEdgeTerraformTypes` includes `aws_lb` / `aws_alb` / `azurerm_api_management` / `google_compute_global_forwarding_rule` but **not** Front Door types the path materializer already treats as external edge sources. A chat ZIP with declared ingress + backend + datastore still cannot emit `data-flow-trust-boundary` the way **case-65** emits blast-radius.
**Depends on:** DX-69 shipped
**Branch suggestion:** `cursor/dx-75-data-flow-connects-to-golden`

### Design intent

Prove the existing data-flow materializer on a real in-batch parse. Extend property promotion and actor-type allow-lists only where the parse does not already emit `declarationBackendNodeId` / `connectedToNodeIds`. Do **not** overlay Actor or edges in the new golden. Keep **case-60** as the historical overlay. **Zero new `EngineType`.** R5: no backend declared → no `CONNECTS_TO`. A TrustBoundary hop on the path must still suppress the finding (existing analyzer).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add a golden case that parses declared ingress/load-balancer + backend compute + data-bearing datastore through DefaultGraphBuilder (no hand-authored Actor or path overlay) and emits data-flow-trust-boundary. Align actor-type allow-lists with DeclarationIdentityPathEdgeMaterializer.IsExternalEdgeSource. Do not add EngineType. Do not invent edges. Do not change DemotionThreshold.

Why: DX-69 wrote MaterializeDataFlowPath. case-60 still overlays the hops, so Workstream 1B is only half-proven. identity-blast-radius has case-65; data-flow-trust-boundary does not.

Read first:
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityPathEdgeMaterializer.cs (MaterializeDataFlowPath, IsExternalEdgeSource, CollectDeclaredTargetIds)
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityActorMaterializer.cs (ExternalEdgeTerraformTypes vs Front Door / k8s Ingress)
- ArchLucid.ContextIngestion/Infrastructure/InfrastructureDeclarationSpecialPropertyMapper.cs (declarationBackendNodeId / connectedToNodeIds)
- ArchLucid.Decisioning/Analysis/DataFlowTrustBoundaryPathAnalyzer.cs
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusIngestDeclarationGraphFactory.cs (CreateCase60CdkDataFlowTrustBoundaryGraphAsync — overlay to replace for the NEW case only)
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber

Work:

1. Align external-edge detection: any terraformType / resourceType / k8s.kind that IsExternalEdgeSource accepts must also be able to seed an External/PublicAnonymous Actor in DeclarationIdentityActorMaterializer (add Front Door / Ingress / LoadBalancer Service types that the path materializer already knows). Do not seed external actors from ordinary compute.

2. Mapper: if simple-terraform / CDK / CFN backend pool, target_group, function, or depends_on values exist, promote them to declarationBackendNodeId and connectedToNodeIds (comma-separated when several). Missing backend → omit. Never invent a SQL id.

3. Tests:
   - Ingress/ALB actor + declared backend compute + compute connectedTo data-bearing SQL → DataFlowTrustBoundaryPathAnalyzer returns a path; no TrustBoundary on that path
   - Same graph plus a TrustBoundary hop → analyzer suppresses (existing behavior)
   - Missing backend property → zero data-flow CONNECTS_TO from the actor
   - case-60 factory overlay test still passes

4. Golden Latest+1 (read the constant): in-batch Terraform or CDK snippet with (a) aws_lb / aws_alb / k8s Ingress / Front Door, (b) backend compute, (c) data-bearing datastore named as the compute's declared depends-on / connectedTo target. Run the same parse path as case-65 (DefaultGraphBuilder, strip ContextSnapshot node if the factory already does). Expected findings must include data-flow-trust-boundary. No hand overlay. Update ExpectedCaseCount, LatestGoldenCorpusCaseNumber, DECISIONING_GOLDEN_CORPUS.md, recorder. Keep case-47 (hand graph) and case-60 (CDK overlay). Re-record distribution markdown with priorGraphFixture.

5. Docs: CONTEXT_INGESTION.md — DX-69 data-flow hops; DX-75 proves them on a parse-through golden. claimBoundary: not a named-model beat, not live packet capture.

Do not: add EngineType; overlay Actor/edges on the new case; delete case-60; change analyzer hop semantics except shared allow-list alignment; push master; OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'
Test:
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter "FullyQualifiedName~DeclarationIdentity"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~DataFlowTrustBoundary|FullyQualifiedName~GoldenCorpusIngestDeclarationGraphFactory|FullyQualifiedName~GoldenCorpusRegressionTests"
```

**Done when:** A new golden parsed from IaC (no overlay) emits `data-flow-trust-boundary`. Missing backend emits nothing. **case-60** remains. No new `EngineType`.

---

# DX-76 — NSG / security-group / firewall rule promotion and association edges

**Closes:** Strategy Workstream 1C remainder for `segmentation-semantics` after DX-07. `SegmentationRuleParser` already parses property **values** for internet source (`*` / `0.0.0.0/0`) plus admin ports (22, 3389, 1433, 3306, 5432). `SegmentationSemanticsPathAnalyzer` walks undirected adjacency from an NSG/SG/firewall node to a datastore or jump box (max 3 hops). Golden **case-39** / **case-44** still **hand-author** `tf.security_rule` blobs and `APPLIES_TO` / `CONNECTS_TO` edges. Parsers do not promote `source_address_prefix` + `destination_port_range` (Azure), `ingress` cidr/port (AWS), or `source_ranges` + `allow.ports` (GCP) into a parseable blob, and no materializer writes NSG → subnet → datastore when those associations are declared. A chat ZIP cannot emit `segmentation-semantics`.
**Depends on:** DX-07, DX-69 shipped (reuse path-edge discipline, not IAM keys)
**Branch suggestion:** `cursor/dx-76-segmentation-rule-edges`

### Design intent

Information-source change. **Zero new `EngineType`.** Do not invent a 9th coverage engine. Only emit association edges when a **declared** property names both ends (NSG-subnet association, SG-subnet, firewall-network, subnet-datastore `connectedTo` / depends-on). Compose a rule blob the existing parser already understands — do not rewrite `TryParseRiskyRule` unless a realistic Terraform snippet cannot be represented as `source … destination_port_range = 22` style text. Fail-open on unparseable blobs (existing parser).

Target shape `SegmentationSemanticsPathAnalyzer` already walks:

- Segmentation node (`terraformType` contains `network_security_group` / `aws_security_group` / `google_compute_firewall` / `network_security_rule`, or `resourceType` NSG/SG/firewall) with a risky inbound rule property
- —`APPLIES_TO`→ subnet or NIC —`CONNECTS_TO`→ data-bearing datastore or jump box, hop count ≤ 3

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: promote declared NSG/SG/firewall rule fields into a blob SegmentationRuleParser already parses, and materialize association + subnet-to-datastore edges when both ends exist, so segmentation-semantics fires on IaC-only graphs without hand overlays. Do not add EngineType. Do not invent edges or ports. Do not change DemotionThreshold.

Why: DX-07 shipped the analyzer. case-39/44 still overlay tf.security_rule and APPLIES_TO. That is the unfinished half of Workstream 1C for segmentation.

Read first:
- ArchLucid.Decisioning/Analysis/SegmentationRuleParser.cs (TryParseRiskyRule, RiskyDestinationPorts, HasInternetSource)
- ArchLucid.Decisioning/Analysis/SegmentationSemanticsPathAnalyzer.cs (IsSegmentationTerraformType, MaxHopCount 3)
- ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusPathEngineGraphFactory.cs (CreateSegmentationSemanticsGraph — the overlay to stop copying)
- ArchLucid.ContextIngestion/Infrastructure/InfrastructureDeclarationSpecialPropertyMapper.cs
- ArchLucid.KnowledgeGraph/Materialization/DeclarationIdentityPathEdgeMaterializer.cs (dedupe + FindExistingTopologyNode — reuse helpers, do not fork Jaccard)
- ArchLucid.KnowledgeGraph/Materialization/GraphMaterializationStages.cs
- GoldenCorpusHarnessEngineRegistration.LatestGoldenCorpusCaseNumber

Work:

1. Mapper: for azurerm_network_security_rule / azurerm_network_security_group nested rules, aws_security_group / aws_security_group_rule ingress, google_compute_firewall: when source and destination port are present, write a stable property (reuse tf.security_rule if that is what the golden overlay used) whose VALUE is parseable by SegmentationRuleParser — e.g. "access = allow direction = inbound source_address_prefix = * destination_port_range = 22". Also promote association targets: network_security_group_id / subnet_id / security_group_id / vpc_id / network → declarationTargetResourceId or a dedicated declarationAssociationTargetId if mixing with IAM scope would collide (prefer a dedicated key if role assignments already use declarationTargetResourceId on the same node — NSG nodes should not). Missing source or port → omit the rule blob (R5). Never invent 0.0.0.0/0.

2. New DeclarationSegmentationPathEdgeMaterializer (own file next to DeclarationIdentityPathEdgeMaterializer):
   - For each segmentation-shaped TopologyResource/SecurityBaseline (same predicates as SegmentationSemanticsPathAnalyzer): if declarationAssociationTargetId / subnet / nic id matches an existing topology node, emit APPLIES_TO (InferenceSource: new GraphEdgeInferenceSources.DeclarationSegmentationPath).
   - For the associated subnet/NIC, if declared connectedTo / depends-on / datastore target exists, emit CONNECTS_TO.
   - Deduplicate From+To+EdgeType. Skip if either end is missing. No edges when association/target is blank.
   - Do not emit edges merely because an NSG node exists.

3. Wire into GraphMaterializationStages after declaration-identity-path-edges (IAM/data-flow first; segmentation second). DefaultStageOrder + GraphMaterializationStageTests. Skip the new stage when there are zero segmentation-shaped nodes.

4. Tests:
   - NSG + security_rule SSH from * + subnet association + subnet connectedTo SQL → SegmentationSemanticsPathAnalyzer.HasPathToSensitiveTarget true; SegmentationFindingEngine (or golden) emits segmentation-semantics
   - Port 22 but source is 10.0.0.0/8 only → parser returns no risky rule (existing HasInternetSource) → no finding
   - Association target not on snapshot → zero APPLIES_TO
   - GraphMaterializationStageTests includes the new stage name
   - Integration: CanonicalObjects mimicking parsed TF (not a hand-built NSG node) through DefaultGraphBuilder produce the rule blob + association edge

5. Golden Latest+1: simple-terraform (or ARM) with azurerm_network_security_group + azurerm_network_security_rule (destination_port_range = 22, source_address_prefix = *) + subnet + data-bearing SQL connected via declared association/depends-on. Parse through DefaultGraphBuilder, no overlay. Expected findings must include segmentation-semantics. Update ExpectedCaseCount, LatestGoldenCorpusCaseNumber, DECISIONING_GOLDEN_CORPUS.md, recorder. Keep case-39/44. Re-record distribution markdown with priorGraphFixture.

6. Docs: CONTEXT_INGESTION.md — DX-76 promotes declared NSG/SG/firewall rules and association edges only. claimBoundary: not live NSG evaluation in Azure, not a named-model beat.

Do not: add EngineType; invent internet sources or ports; change RiskyDestinationPorts unless a golden cannot express 22/3389 with the existing parser; delete overlay goldens; push master; OpenAPI.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'
Test:
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter "FullyQualifiedName~DeclarationSegmentation|FullyQualifiedName~DeclarationIdentity"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~SegmentationSemantics|FullyQualifiedName~SegmentationRuleParser|FullyQualifiedName~GoldenCorpusRegressionTests"
```

**Done when:** A golden parsed from IaC (no overlay) emits `segmentation-semantics`. Private-only sources and missing associations emit nothing. **case-39** / **case-44** remain. No new `EngineType`.

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

Do **not** follow this set with another coverage engine or another fusion `EngineType`. If DX-73 shows the score ladder still collapsed after DX-72, the next Cursor-safe lever is more **declared path evidence** (this set), not another penalty flag.

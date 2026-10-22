> **Scope:** Copy-paste prompts **IE-01–IE-08**. Index: [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). Contract: [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).

# IE-01–IE-08 — The only Azure collector, snapshot, Terraform, diff

**This wave is the observation spine.** ARC-AMPE, remediation, Mermaid, and lineage **consume** these snapshots. Do not add another ARM client later.

---

# IE-01 — Azure inventory snapshot domain and persistence

**Depends on:** plane doc · **Branch:** `cursor/azure-inventory-snapshot-domain-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: add AzureInventorySnapshot domain types, SQL, repositories, and DTOs as a normalized projection of an existing Azure extractor package. This snapshot is the shared observation record for architecture graph, Terraform reconstruction, temporal diff, operational findings, AND ARC-AMPE audit selectors. Do not implement a new collector, Terraform, diffs, audit evaluators, or UI.

Why: dbo.AzureExtractorPackages stores ZIP bytes. AzureExtractorInventoryResourceLine only keeps name/type/location/SKU. Downstream features must not each parse the ZIP differently.

Do not:
- Add a second upload API. Snapshots are created from PackageId.
- Store the whole subscription as one NVARCHAR(MAX) JSON document.
- Call ARM or aztfexport.
- Add OperationalSecurityFinding or AuditControl tables (later prompts).
- Add an IFindingEngine.
- Request write roles or terraform apply.

Read: docs/library/INFRA_EVIDENCE_PLANE.md; AzureExtractorPackageRecord; AzureExtractorInventoryResourceLine; SqlAzureExtractorPackageRepository; migration 146; SQL_SCRIPTS.md; SqlAzureExtractorPackageRepositoryScopeIsolationSqlIntegrationTests.

Work:
1. Contracts under ArchLucid.Contracts (each type its own file): AzureInventorySnapshotRecord (SnapshotId, TenantId, WorkspaceId, ProjectId, PackageId, SubscriptionId, SubscriptionName, CapturedUtc, CaptureStatus, CaptureVersion, ResourceCount, RelationshipCount, CaptureMethod, CollectorVersion, RequestedBy, Duration, CompletenessScore, warning/error counts, ContentHash). ProvenanceKind enum: ObservedFact, DerivedFact, DeterministicInference, AiInference, HumanAssertion.
2. Resource row: SnapshotId, CloudResourceId nullable until IE-04, AzureResourceId, ResourceType, Region, ResourceGroup, SubscriptionId, ParentResourceId, SourceEvidenceReference.
3. Child tables: properties (key/value/redacted, truncate + blob pointer), relationships (from/to, type, ProvenanceKind, confidence, inference source), identity, role assignment, tag, diagnostic configuration, unknown resource (never drop unknown ARM types).
4. SQL: next DbUp number + ArchLucid.sql + Rollback. TenantId everywhere. Indexes (TenantId, SnapshotId), (TenantId, AzureResourceId). FK to AzureExtractorPackages.
5. IAzureInventorySnapshotRepository + Sql + NoOp. Service: given PackageId + scope, insert header CaptureStatus=Pending. Do not parse resources.json yet. Idempotent: one snapshot per package unless recapture flag.
6. Audit events AzureInventorySnapshot.Created / Failed.
7. Tests: tenant isolation; duplicate package does not create two snapshots.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: a package can own a snapshot header; schema is normalized; no ARM calls.
```

---

# IE-02 — The only Azure collector (PowerShell + hosted ARM)

**Depends on:** IE-01 · **Branch:** `cursor/azure-shared-collector-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: enrich the EXISTING Azure extractor ZIP and hosted Reader client so ONE collection can feed architecture, drift, security, and audit evidence. This is the only Azure collector family. ARC-AMPE must not grow a parallel ZIP.

Why: INFRA_EVIDENCE_PLANE.md §1. Get-ArchLucidAzurePackage.ps1 and HostedAzureExtractorClient are thin today. Audit selectors (AE-02) will read snapshot rows, not call ARM.

Do not:
- Create scripts/azure/Get-ArchLucidArcAmpePackage.ps1 or a second hosted client.
- Request roles beyond Reader + Cost Management Reader for the hosted path. Script stays customer-run.
- Collect Key Vault secret values, certificate private keys, or connection strings (redact using existing sensitive-key lists).
- Enable Entra directory Global Reader. If you add optional Graph GETs, they must be explicit, least-privilege, default off, and fail soft to warnings.
- Implement graph materialize (IE-03), Terraform, or audit evaluation.
- terraform apply.

Read: plane §1–5; scripts/azure/Get-ArchLucidAzurePackage.ps1; HostedAzureExtractorClient; IHostedAzureArmReadClient; AzureExtractorPackageZipValidator; AzureExtractorManifestSchemaUpgrader; V1_SCOPE.md §2.16; AZURE_EXTRACTOR_INGEST.md.

Work:
1. Schema version bump + upgrader + validator. Keep resources.json. Add optional sibling files (empty array if skipped): role-assignments.json, diagnostic-settings.json, network-associations.json, policy-assignments.json, defender-summary.json (metadata only, no vuln payloads with secrets). manifest.json: completenessScore, warnings[], errors[], resourceCount, captureMethod (CustomerScript | HostedReader), collectorVersion.
2. PowerShell: read-only. Resource groups, VNets, subnets, NSGs/rules, route tables, public IPs, private endpoints, NICs, VMs, VMSS, AKS, App Services, Functions, Storage, SQL, Cosmos, Key Vault metadata (not secrets), managed identities, diagnostic settings, Azure Policy assignments/compliance state when ARM GET allows, resource locks, tags. Unknown types: ARM id + type + RG + capped properties. Fail soft per type.
3. Hosted: extend IHostedAzureArmReadClient with additional GET/list (Resource Graph GET if already used). Skip Cost Management merge (deferred). No write URLs.
4. Parsers: inventory reader (or sibling used by materialize) surfaces id, type, location, rg, tags, sku, bounded properties. Keep costing line type working.
5. Tests: unknown type not dropped; schema upgrader; secret-like keys redacted; grep/architecture test that Integrations.AzureExtractor remains the only management.azure.com inventory client (allow existing non-extractor ARM usages). Document in AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md that ARC-AMPE must not add a collector.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'
Done when: one ZIP schema can populate snapshot tables needed by later audit selectors; no second collector.
```

---

# IE-03 — Materialize snapshot into CanonicalObject + GraphSnapshot

**Depends on:** IE-02, IE-04 · **Branch:** `cursor/azure-snapshot-graph-materialize-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: parse an ingested extractor package into AzureInventorySnapshot child rows AND CanonicalObject + GraphSnapshot. Inferred edges must not look like observed facts.

Do not: generate Mermaid or Terraform; add IFindingEngine; treat inferred edges as ObservedFact; truncate silently without a snapshot warning.

Read: KNOWLEDGE_GRAPH.md; WellKnownGraph.cs; GraphEdgeInferenceSources.cs; GraphEdge.cs; CanonicalObject.cs; DefaultGraphEdgeInferer.cs; IE-01 types.

Work:
1. Materializer: PackageId → fill snapshot resources/properties/tags/identities/role assignments/diagnostics/policy/unknowns from IE-02 files. Set ContentHash over canonical normalized payload.
2. Relationships: Observed from ARM ids (contains, PE connections, NIC subnet, diagnostics workspace). DeterministicInference for routesTo/connectedTo/fronts/protectedBy/logsTo/identityUsedBy with GraphEdgeInferenceSources + Weight < 1. Extend GraphEdgeTypes only when CONTAINS/DEPENDS_ON/CONNECTS_TO/EXPOSES do not fit.
3. CanonicalObject: TopologyResource (Actor for identities). Properties arm.id, arm.type, arm.resourceGroup, arm.region, arm.parentId. SourceType=azure-inventory-snapshot. If package.RunId set, include in IKnowledgeGraphService.BuildSnapshotAsync; else snapshot tables only.
4. CompletenessScore; CaptureStatus=Succeeded|Partial|Failed.
5. Tests: PE → ObservedFact relationship; heuristic edge not ObservedFact; unknown type kept; MaxNodes warning.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'
Done when: observed vs inferred is labeled; unknown types kept.
```

---

# IE-04 — Stable CloudResourceId directory

**Depends on:** IE-01 · **Branch:** `cursor/cloud-resource-identity-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: CloudResourceIdentity so the same ARM id in snapshot N and N+1 shares one CloudResourceId. This id is the join for diffs, findings, Terraform mapping, diagram match, audit lineage, and the evidence hub.

Do not: use Azure AD tenant id as ArchLucid tenant boundary; change CanonicalObject.ObjectId globally; call ARM.

Read: plane § identity; CloudProvider enum.

Work:
1. Record: CloudResourceId, TenantId, WorkspaceId, ProjectId, Provider, ExternalResourceIdNormalized, ResourceType, SubscriptionOrAccountId, ResourceGroupOrProject, Region, DisplayName, FirstSeenSnapshotId, LastSeenSnapshotId, timestamps.
2. Normalize ARM id: lowercase, strip trailing slash.
3. ICloudResourceIdentityDirectory.UpsertOnSnapshotAsync. Unique (TenantId, Provider, ExternalResourceIdNormalized).
4. Backfill CloudResourceId on AzureInventoryResources.
5. Tests: two snapshots same ARM id → same GUID; different ArchLucid tenants → different GUIDs; trailing slash ignored.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: identity is stable and isolated.
```

---

# IE-05 — Advisory Terraform representation

**Depends on:** IE-03 · **Branch:** `cursor/advisory-tf-from-snapshot-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: AdvisoryTerraformRepresentation for an AzureInventorySnapshot: mapping + files. Primary HCL remains Microsoft aztfexport when the CLI wrap can run. Reconstruction from normalized rows is labeled reconstruction, never original Terraform.

Do not: terraform apply/destroy; claim original TF; generate Mermaid from .tf; fabricate azurerm arguments — annotate uncertainty.

Read: V1_SCOPE.md §2.17; AzureTerraformExportCommand.cs; TerraformExportZipWriter.cs; TerraformAdvisorySnippetTemplates.cs; plane § Terraform honesty.

Work:
1. Mapping: SnapshotId, CloudResourceId, AzureResourceId, TerraformAddress, GenerationMethod, UncertaintyNotes.
2. Artifact: providers.tf, versions.tf, folders network/compute/data/identity/security/monitoring/integration/other/, ADVISORY.md (existing CLI header). Deterministic addresses (sort by ARM id). Hash test: identical snapshot rows → identical bytes.
3. If aztfexport missing, reconstruction-only still succeeds with higher uncertainty.
4. Architecture/grep test: no new ProcessStartInfo terraform apply/destroy.
5. Note on AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md that reconstruction is additive to C2 snippets.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Cli.Tests/ArchLucid.Cli.Tests.csproj'
Done when: mapping exists; ADVISORY.md present; no apply path.
```

---

# IE-06 — Semantic snapshot diff (feeds audit invalidation)

**Depends on:** IE-03 · **Branch:** `cursor/azure-inventory-semantic-diff-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: AzureInventoryDiff between two snapshots of the same tenant + Azure subscription. Compare normalized state, not terraform text. Publish a consumer hook so ARC-AMPE (AE-09) can invalidate evidence hashes without a second differ.

Why: IComparisonService compares golden manifests. Wrong input. Plane §1: A vs B must later answer architecture, security, and which audit evidence is stale.

Do not: primary-diff .tf files; reuse ComparisonResult types; let AI write change rows; cross-subscription compare (validation error).

Read: plane §1; ComparisonService (pattern only); HOWTO_ADD_COMPARISON_TYPE.md (pattern only).

Work:
1. ChangeType: ResourceAdded/Removed/Modified, RelationshipAdded/Removed, IdentityChanged, PermissionChanged, NetworkExposureChanged, SecurityControlChanged, LoggingChanged, EncryptionChanged, TagChanged, RegionChanged, SkuChanged, DependencyChanged, PolicyAssignmentChanged, Unknown.
2. AzureInventoryChangeRecord: ChangeId, SnapshotA/B, CloudResourceId, AzureResourceId, ChangeType, Property, Old/New, RiskClassification, ArchitectureSignificance, SecuritySignificance, Confidence, EvidenceReference, ProvenanceKind DerivedFact or DeterministicInference.
3. Heuristics unit-tested: public IP / enablePublicNetworkAccess → NetworkExposureChanged; RBAC → PermissionChanged; diagnostics removed → LoggingChanged; Key Vault purge/soft-delete → SecurityControlChanged; policy assignment delta → PolicyAssignmentChanged.
4. Summary DTO with counts + rollups (public exposure, RBAC, logging regressions, new PEs, relationships removed).
5. Persist; idempotent (TenantId, SnapshotAId, SnapshotBId).
6. IAzureInventoryDiffConsumer (or in-process event) with ChangeId list so AE-09 can subscribe later. Empty adapter OK now; do not call ARM.
7. Tests: add/remove/SKU/tag; identical snapshots → zero changes.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: structured diff is deterministic; consumer hook exists; terraform text is not required.
```

---

# IE-07 — Infrastructure baselines and drift approval

**Depends on:** IE-06 · **Branch:** `cursor/azure-inventory-baselines-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: designate an AzureInventorySnapshot as Approved/Architecture/Security/Release baseline and classify later diffs (Expected, Approved, Unapproved, SecurityRelevant, ArchitectureRelevant, PotentiallyDangerous, Unknown). Drift approval with expiration.

Do not: reuse dbo.ArchitectureVersions; auto-approve via LLM; conflate with AuditEvidenceSnapshot baseline (AE-04) — different entity, optional FK later.

Read: migration 339 (do not reuse); GovernanceApprovalRequests; RiskException expiration; IE-06 types.

Work:
1. AzureInventoryBaseline + DriftApproval (Approver, Reason, TicketReference, ExpirationUtc).
2. PotentiallyDangerous: public exposure added, RBAC elevation (Owner/Contributor/UAA), encryption/logging regression.
3. Expired approvals read as Unapproved (read-side or MarkExpiredAsync-style job).
4. API: designate/list/get drift (Execute to designate, Read to read). OpenAPI + route registry. UI optional; no new review tabs.
5. Tests: expiry; security-relevant public IP remains SecurityRelevant if architecture-approved.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'
Done when: baselines and expiring drift approvals work and stay distinct from architecture versions and audit snapshots.
```

---

# IE-08 — Diff narrative (AI cites rows only)

**Depends on:** IE-06 · **Branch:** `cursor/azure-inventory-diff-narrative-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: optional LLM narrative over a persisted AzureInventoryDiff that cites ChangeIds. AI must not create or rewrite change rows. Invariant: AI explains evidence; AI is not the evidence.

Do not: put AI text into OldValue/NewValue; call LLM on empty diffs; skip IPromptRedactor.

Read: AskUserPromptComposer; AI_LEVERAGE_ROADMAP comparison narrative; IPromptRedactor; IE-06 DTOs.

Work:
1. Narrative kinds: Material, Security, Architecture, Accidental, Investigate. Persist as AiInference with citations ⊂ ChangeIds. Simulator: deterministic template + SIMULATOR label (WK-10 honesty).
2. Executive summary DTO from counts (no LLM).
3. Trend queries: resources changed over time, security-classified rate, RBAC, network, unapproved drift if IE-07 exists else null.
4. HTTP optional (OpenAPI if added). Full Ask templates are IE-22.
5. Tests: citations subset; empty skips LLM; redaction invoked.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: structured diff remains authoritative; narrative cites it.
```

> **Scope:** Roll-up of **Accepted** and **Completed** Architecture Decision Records. Individual ADR files remain the authoritative long-form record; this file is the single completed-decisions index.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# Completed ADRs

**Last reviewed:** 2026-08-02

**Proposed ADRs excluded:** [0035](0035-architecture-invariant-catalog.md), [0036](0036-graph-rag-embedding-strategy.md), [0058](0058-bounded-generative-question-tier.md), [0059](0059-spa-bff-http-only-session-plan.md).

**Removed completed ADRs** (deleted 2026-08-02) are summarized in [Archived completed ADRs](#archived-completed-adrs-removed-2026-08-02); see [`redirects.md`](../../redirects.md#historical-adrs-removed-2026-08-02).

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-hosting-roles-api-worker-combined.md) | Hosting roles (Api, Worker, Combined) | Accepted |
| [0004](0004-transactional-outbox-retrieval-indexing.md) | Transactional outbox for retrieval indexing | Accepted |
| [0005](0005-llm-completion-pipeline.md) | LLM completion pipeline (cache, circuit breaker, quota, metrics) | Accepted |
| [0006](0006-url-path-api-versioning.md) | URL-path API versioning (`/v1`) | Accepted |
| [0007](0007-effective-governance-merge.md) | Effective governance merge | Accepted (v1) |
| [0008](0008-alert-dedupe-scopes.md) | Alert deduplication scopes | Accepted (v1) |
| [0009](0009-digest-delivery-failure-semantics.md) | Digest delivery failure semantics | Accepted (v1) |
| [0011](0011-inmemory-vs-sql-storage-provider.md) | `ArchLucid:StorageProvider` — InMemory vs Sql | Accepted |
| [0013](0013-api-versioning-and-json-schema-versioning.md) | — API versioning and JSON schemaVersion on persisted aggregates | Accepted |
| [0014](0014-trial-enforcement-boundary.md) | — Trial enforcement boundary (server-side, UoW run counter, idempotent seats) | Accepted |
| [0015](0015-trial-tier-authentication-model.md) | — Trial-tier authentication model (External ID + local identity) | Accepted |
| [0016](0016-billing-provider-abstraction.md) | Billing provider abstraction (Stripe + Marketplace) | Accepted (2026-04-17) |
| [0017](0017-azure-app-configuration-deferred.md) | — Azure App Configuration: deferred for v1 on cost grounds | Accepted (deferred adoption) |
| [0018](0018-background-workloads-container-apps-jobs.md) | Background workloads: Container Apps Jobs | Accepted (2026-04-19) |
| [0019](0019-logic-apps-standard-edge-orchestration.md) | Logic Apps Standard for edge orchestration | Accepted (2026-04-19) |
| [0020](0020-azure-primary-platform-permanent.md) | Azure as the primary and permanent platform | Accepted |
| [0024](0024-azure-devops-pipeline-task-parity-with-github-action.md) | — Azure DevOps pipeline task parity with GitHub Action (manifest delta) | Accepted |
| [0027](0027-demo-preview-cached-anonymous-commit-page.md) | Cached anonymous demo preview page | Accepted (2026-04-21) |
| [0030](0030-coordinator-authority-pipeline-unification.md) | Coordinator → Authority pipeline unification — sequenced multi-PR plan | Accepted |
| [0031](0031-cross-tenant-pattern-library.md) | Cross-tenant pattern library (anonymised vertical guidance) | Accepted (owner sign-off **2026-05-03** — implementation PRs may merge when t... |
| [0032](0032-scim-v2-service-provider.md) | SCIM 2.0 inbound service provider (RFC 7644) | Accepted (implementation shipped in repo) |
| [0033](0033-first-real-value-single-env-var-flip.md) |  |  |
| [0034](0034-segregation-of-duties-entra-oid-actor-keys.md) |  |  |
| [0037](0037-tenant-isolation-without-rls-defense-in-depth.md) | Tenant isolation without SQL RLS — defense-in-depth model | Accepted |
| [0038](0038-run-durability-multi-store-outbox-production-secrets.md) | Run execution durability, Cosmos graph outbox, and production-like secrets | Accepted |
| [0039](0039-commit-sealed-evidence-immutability.md) | Commit-sealed evidence immutability | Accepted |
| [0040](0040-tamper-evident-lineage-without-worm-storage.md) | Tamper-evident proof lineage without WORM storage | Accepted |
| [0041](0041-fail-closed-scope-derivation.md) | Fail-closed scope derivation on production-like hosts | Accepted |
| [0042](0042-canonical-run-write-surface.md) | Canonical run-lifecycle write surface (alias deprecation) | Accepted |
| [0043](0043-durable-run-export-blob-push-outbox.md) | Durable run-export blob push outbox | Accepted |
| [0044](0044-durable-post-commit-projection-outbox.md) | Durable post-commit projection outbox | Accepted |
| [0045](0045-committed-run-header-immutability.md) | Committed run header evidence-anchor immutability | Accepted |
| [0046](0046-committed-run-header-fk-repoint-detection.md) | Committed run header FK repoint detection | Accepted |
| [0047](0047-tenant-scoped-query-roslyn-guard.md) | Tenant-scoped persistence SQL Roslyn guard (ARCH006) | Accepted |
| [0048](0048-socratic-intake-mutable-draft-lifecycle.md) | Socratic intake — mutable draft-request lifecycle in front of the single-shot run create | Accepted |
| [0049](0049-actor-descriptor-model.md) | Actor descriptor model — inferred-then-confirmed set of `(kind Ã— trust-origin Ã— contract)` triples | Accepted |
| [0050](0050-feasibility-classification-transparency-trail.md) | Feasibility classification + mandatory transparency trail | Accepted |
| [0051](0051-question-selection-engine.md) | Question selection engine — deterministic-first, LLM as a bounded selector, packs own questions | Accepted — amended by [ADR 0058](0058-bounded-generative-question-tier.md) ... |
| [0052](0052-monetization-posture-decision-as-product.md) | Monetization posture — decision-as-product, seat license for the expert operator | Accepted |
| [0053](0053-enterprise-diagnostic-logging-observability-posture.md) | Enterprise diagnostic logging and observability posture | Accepted |
| [0054](0054-warm-standby-pool-sizing-sufficient.md) | Warm Standby Pool Sizing is Sufficient | Accepted |
| [0055](0055-pre-run-socratic-intake-loop.md) | Pre-Run Socratic Intake Loop and Mutable Draft Lifecycle | Accepted |
| [0056](0056-manifest-online-fine-tuning-governance.md) | Manifest online fine-tuning governance | Accepted |
| [0057](0057-graph-rag-community-summarization-scope-decision.md) | Graph-RAG community summarization scope decision | Accepted (options record); **recommendation superseded by owner-override adde... |
| [0060](0060-ai-model-chooser-provider-scope.md) | AI model chooser — provider scope, customer-provided connections, and activation gates | Accepted |
| [0061](0061-ddos-protection-posture-v1.md) | DDoS protection posture for V1 hosted pilots | Accepted (owner ratified 2026-07-21; TB-908) |

---

## ADR 0001

**Full record:** [0001-hosting-roles-api-worker-combined.md](0001-hosting-roles-api-worker-combined.md)

**Date:** 2026-04-04
**Status:** Accepted

### Decision

Use configuration **`Hosting:Role`**: **`Api`**, **`Worker`**, or **`Combined`** (default for local dev). Split processes in production for blast-radius and scaling.

---

## ADR 0004

**Full record:** [0004-transactional-outbox-retrieval-indexing.md](0004-transactional-outbox-retrieval-indexing.md)

**Date:** 2026-04-04
**Status:** Accepted

### Decision

Enqueue retrieval indexing work **inside the same SQL transaction** as authority commit where the storage provider supports it.

---

## ADR 0005

**Full record:** [0005-llm-completion-pipeline.md](0005-llm-completion-pipeline.md)

**Date:** 2026-04-04
**Status:** Accepted

### Decision

Pipeline order from the wire: **`CircuitBreaking( Caching( LlmCompletionAccounting( AzureOpenAi ) ) )`**.
- **Accounting** (scoped): pre-check quota, post-record usage, emit OTel counters (optional per-tenant labels).
- **Caching** sits inside the breaker so hits do not trip failure counting.
- **TB-940:** schema-gated agent completions defer cache **writes** until `ParseAndValidate` succeeds; empty/non-JSON bodies are never admitted; cache-served schema failures **bust** the key (`archlucid_llm_cache_poison_busts_total`). Keys include prompt + schema version segments (`al:llmcomp:v2:…`).
- **Azure** client records usage into `AsyncLocal` consumed by accounting after each call.

---

## ADR 0006

**Full record:** [0006-url-path-api-versioning.md](0006-url-path-api-versioning.md)

**Date:** 2026-04-04
**Status:** Accepted

### Decision

Major version in the URL path: **`/v1/...`**, with Asp.Versioning reporting supported/deprecated headers where configured.

---

## ADR 0007

**Full record:** [0007-effective-governance-merge.md](0007-effective-governance-merge.md)

**Date:** 2026-04-04
**Status:** Accepted (v1)

### Decision

- **Resolution** is implemented by **`IEffectiveGovernanceResolver`** (assignments → versions → merge with deterministic precedence). **`IEffectiveGovernanceLoader`** exposes only **`EffectiveContent`** for call sites that do not need decisions/conflicts.
- **Merge rules** for list fields (e.g. compliance / alert rule id lists) and dictionary fields (**`advisoryDefaults`**, **`metadata`**) are implemented in **`EffectiveGovernanceResolver`** and reflected in API responses `GET .../effective-content` and `GET /v1/governance-resolution`.

---

## ADR 0008

**Full record:** [0008-alert-dedupe-scopes.md](0008-alert-dedupe-scopes.md)

**Date:** 2026-04-04
**Status:** Accepted (v1)

### Decision

- **Simple alerts** use **`IAlertRecordRepository.GetOpenByDeduplicationKeyAsync`** with keys produced by evaluation (`AlertRecord.DeduplicationKey`), scoped by tenant / workspace / project.
- **Composite alerts** use **`IAlertSuppressionPolicy`** to decide **`ShouldCreateAlert`**, **`DeduplicationKey`**, and suppression reasons; composite rules carry **`DedupeScope`** (**`CompositeDedupeScope`**) influencing how keys are built (e.g. rule-only vs rule-and-run).

---

## ADR 0009

**Full record:** [0009-digest-delivery-failure-semantics.md](0009-digest-delivery-failure-semantics.md)

**Date:** 2026-04-04
**Status:** Accepted (v1)

### Decision

- Each subscription delivery creates a **`DigestDeliveryAttempt`** row (**`Started`** → **`Succeeded`** or **`Failed`**).
- **Success** updates the subscription's **`LastDeliveredUtc`** and audits **`DigestDeliverySucceeded`**.
- **Non-cancellation failures** set **`Failed`**, **`ErrorMessage`**, audit **`DigestDeliveryFailed`**, and increment OTel counter **`digest_delivery_failed`** with tag **`channel`** (same pattern for success counter).
- **`OperationCanceledException`** propagates to honor host shutdown / cancellation.

---

## ADR 0011

**Full record:** [0011-inmemory-vs-sql-storage-provider.md](0011-inmemory-vs-sql-storage-provider.md)

**Date:** 2026-04-04
**Status:** Accepted

### Decision

Use **`ArchLucid:StorageProvider`** with supported values:
- **`InMemory`** — singleton in-memory repositories for components bound to this option (see **`AddArchLucidStorage`**, **`RegisterCoordinatorDecisionEngineAndRepositories`**, **`RegisterComparisonReplayAndDrift`**, **`RegisterRunExportAndArchitectureAnalysis`**, **`RegisterGovernance`**). Suitable for development and automated tests; data is not durable and is shared per process for singleton stores.
- **`Sql`** (default) — Dapper repositories with scoped lifetimes where appropriate, `IDbConnectionFactory` / SQL connection stack from **`AddArchLucidStorage`** and API data infrastructure.
Governance repositories (**`IGovernanceApprovalRequestRepository`**, **`IGovernancePromotionRecordRepository`**, **`IGovernanceEnvironmentActivationRepository`**) follow the **same** `ArchLucid:StorageProvider` flag: InMemory registrations are **singleton**; Sql registrations remain **scoped** alongside **`IGovernanceWorkflowService`**.

---

## ADR 0013

**Full record:** [0013-api-versioning-and-json-schema-versioning.md](0013-api-versioning-and-json-schema-versioning.md)

**Date:** 2026-04-14
**Status:** Accepted

### Decision

1. **HTTP:** Use **Asp.Versioning.Mvc** with default **1.0**, URL segment `v{version:apiVersion}`, **`ReportApiVersions`**, and **`[ApiVersion("1.0")]`** on versioned controllers (see `ArchLucid.Api/Startup/MvcExtensions.cs`). **`VersionController`** remains **`[ApiVersionNeutral]`**.
2. **JSON:** Add **`schemaVersion`** (CLR: **`SchemaVersion`**, default **1**) on **`ArchLucid.Decisioning.Models.GoldenManifest`** and **`ArchLucid.KnowledgeGraph.Models.GraphSnapshot`**. Consumers should ignore unknown properties and branch on **`schemaVersion`** when breaking changes are introduced.

---

## ADR 0014

**Full record:** [0014-trial-enforcement-boundary.md](0014-trial-enforcement-boundary.md)

**Date:** 2026-04-17
**Status:** Accepted

### Decision

1. **Write gate:** Introduce **`TrialLimitGate`** in the Application layer (pure dependency on `ITenantRepository` + `TimeProvider`; no HTTP types). It throws **`TrialLimitExceededException`** with **`TrialLimitReason`** (`Expired`, `RunsExceeded`, `SeatsExceeded`).
2. **HTTP mapping:** Compose a **`TrialActive`** authorization requirement onto **ExecuteAuthority** and **AdminAuthority**. Failure yields **402** with **`application/problem+json`** and type **`https://archlucid.dev/problem/trial-expired`**, including **`traceCompleteness`**, **`correlationId`**, **`trialReason`**, **`daysRemaining`**.
3. **Run counter:** Increment **`TrialRunsUsed`** only inside the **same database transaction** as authority run **`INSERT`** when `TrialStatus = Active` (`SqlRunRepository` + shared `TryIncrementActiveTrialRunAsync`; in-memory path delegates to the same repository abstraction).
4. **Seat counter:** Persist idempotent occupant rows (**074** / `TenantTrialSeatOccupants`) and increment **`TrialSeatsUsed`** only on first claim per `(TenantId, UserId)` via **`TrialSeatAccountant`** / `TryClaimTrialSeatAsync`.
5. **Reads:** **ReadAuthority** policies do **not** include **`TrialActive`** so expired trials remain **read-only** operable.

---

## ADR 0015

**Full record:** [0015-trial-tier-authentication-model.md](0015-trial-tier-authentication-model.md)

**Date:** 2026-04-17
**Status:** Accepted

### Decision

Introduce **`Auth:Trial:Modes`** with two optional lanes:
1. **`MsaExternalId`** — Microsoft Entra **External ID (CIAM)** for consumer IdPs (MSA, Google, hosted local accounts in CIAM). **Production** configuration validation **fails** if this mode is enabled without **`Auth:Trial:ExternalIdTenantId`**.
2. **`LocalIdentity`** — ArchLucid-hosted **email/password** in SQL (**`dbo.IdentityUsers`**, migration **077**) using **PBKDF2**, **lockout**, **NIST-style length policy**, optional **HIBP k-anonymity** checks, and **mandatory email verification** before **`TrialProvisioned`**.
Minted local trial JWTs reuse the existing **JwtBearer** public-key path so **`ArchLucidPolicies`** and role transformations stay consistent.

---

## ADR 0016

**Full record:** [0016-billing-provider-abstraction.md](0016-billing-provider-abstraction.md)

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0017

**Full record:** [0017-azure-app-configuration-deferred.md](0017-azure-app-configuration-deferred.md)

**Date:** 2026-04-18
**Status:** Accepted (deferred adoption)

### Decision

**Do not adopt Azure App Configuration in v1.** Continue with:
- `appsettings.{Env}.json` + environment variables (`ARCHLUCID_*`) + `dotnet user-secrets` for local.
- `Microsoft.FeatureManagement` flags sourced from JSON / env (today's path).
- **Azure Key Vault** as the only managed secret store, accessed directly by host identities (no App Configuration intermediation).
- Resilience knobs reloaded through `IOptionsMonitor<T>` over the existing JSON + env providers.

---

## ADR 0018

**Full record:** [0018-background-workloads-container-apps-jobs.md](0018-background-workloads-container-apps-jobs.md)

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0019

**Full record:** [0019-logic-apps-standard-edge-orchestration.md](0019-logic-apps-standard-edge-orchestration.md)

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0020

**Full record:** [0020-azure-primary-platform-permanent.md](0020-azure-primary-platform-permanent.md)

**Date:** 2026-04-20
**Status:** Accepted

### Decision

**Azure is the primary, planned-permanent hosting and identity surface for ArchLucid.** Outward docs, Terraform, and operational runbooks should describe Azure-first deployment without implying equal first-class support for other public clouds unless a future ADR explicitly adds that scope.
Portability at the **application** layer (containers, standard protocols) remains valuable for **internal** engineering, **CI/CD**, security scanning, and **optional local evaluation** (for example `docker compose` in this repository). **Shipping production container images, Helm charts, or customer-operable “install from Docker” bundles as the licensed product is not a committed V1 path** — ArchLucid is **vendor-operated SaaS**; customer-facing artifacts are **CLI**, **API client libraries**, and **docs** (2026-04-21 product boundary; see **`docs/PENDING_QUESTIONS.md`** Resolved). This ADR does **not** require abstracting Azure service names in code paths that are already Azure-specific.

---

## ADR 0024

**Full record:** [0024-azure-devops-pipeline-task-parity-with-github-action.md](0024-azure-devops-pipeline-task-parity-with-github-action.md)

**Date:** 2026-04-21
**Status:** Accepted

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0027

**Full record:** [0027-demo-preview-cached-anonymous-commit-page.md](0027-demo-preview-cached-anonymous-commit-page.md)

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0030

**Full record:** [0030-coordinator-authority-pipeline-unification.md](0030-coordinator-authority-pipeline-unification.md)

**Date:** 2026-04-21 (amended 2026-04-22 — owner Q&A on `PENDING_QUESTIONS.md` items **35a** + **35b** + **35d**; see Â§ Owner sub-decisions, **PR A0.5** in Â§ Component breakdown, and **PR A4** hard-drop update per item **35d**) (amended 2026-04-24 — **PR A3 shipped**: coordinator interfaces + concretes deleted, legacy commit orchestrator deleted, `TopologySection.Relationships` added so the Authority FK chain round-trips contract relationships, `Demo:SeedDepth = quickstart | vertical` integration test landed, OpenAPI snapshot regenerated; ADR 0022 superseded by this ADR) (amended 2026-04-29 — **PR A4 shipped**: migration **`111_DropGoldenManifestVersions_Legacy.sql`** removes **`dbo.GoldenManifestVersions`**; master DDL **`ArchLucid.sql`** documents removal with rollback **`Rollback/R111_DropGoldenManifestVersions_Legacy.sql`**; no-rollback sign-off per owner decision **35d**) (amended 2026-04-29 — **PR A final cleanup shipped**: `CoordinatorPipelineDeprecationFilter`, `CoordinatorPipelineDeprecatedAttribute`, `CoordinatorPipelineDeprecationFilterTests`, and `CoordinatorRoutesDeprecationHeaderTests` deleted; `[CoordinatorPipelineDeprecated]` removed from `RunsController`; coordinator strangler initiative fully retired — no coordinator pipeline artifacts remain in production code) (amended 2026-05-05 — **PR B merged**: ADR 0029 Â§ Lifecycle Â§ PR B checklist closed; `docs/architecture/PHASE_3_PR_B_TODO.md` + `scripts/ci/assert_pr_b_tracker_in_sync.py` retired; [ADR 0010](0010-dual-manifest-trace-repository-contracts.md) superseded by this ADR; ADR 0021 superseded by this ADR; `.github/workflows/coordinator-parity-daily.yml` retired)
**Status:** Accepted

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0031

**Full record:** [0031-cross-tenant-pattern-library.md](0031-cross-tenant-pattern-library.md)

**Date:** 2026-04-22
**Status:** Accepted (owner sign-off **2026-05-03** — implementation PRs may merge when they conform to this ADR)

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0032

**Full record:** [0032-scim-v2-service-provider.md](0032-scim-v2-service-provider.md)

**Date:** 2026-04-24
**Status:** Accepted (implementation shipped in repo)

### Decision

ArchLucid implements a **SCIM 2.0 Service Provider** surface under dedicated routes (`/scim/v2/...`), authenticated only via a custom **`ScimBearer`** scheme backed by **per-tenant bearer tokens** (hashed at rest with **Argon2id**, salt derived from `tenantId`). **JWT and API-key sessions never satisfy SCIM routes** — IdPs configure a long-lived bearer secret independent of interactive operator auth.
**Tenant context** for mutating SCIM operations is taken exclusively from **`IScopeContextProvider`** after token validation maps the bearer credential to a tenant; clients cannot assert an arbitrary tenant id in the SCIM payload path.
**Group → role** mapping defaults to well-known `archlucid:*` keys with optional **`Scim:GroupRoleMappingOverrides`** (`Dictionary<string,string>` in configuration).
**Enterprise seat accounting** uses `dbo.Tenants.EnterpriseSeatsLimit` / `EnterpriseSeatsUsed`; only **`Active = true`** SCIM users consume a seat; deprovisioning frees capacity.
**Out of scope (explicit):** SCIM Bulk, outbound provisioning, hosted Entra gallery listing (owner-only), complex PATCH selectors (`members[value eq …]`).

---

## ADR 0033

**Full record:** [0033-first-real-value-single-env-var-flip.md](0033-first-real-value-single-env-var-flip.md)

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0034

**Full record:** [0034-segregation-of-duties-entra-oid-actor-keys.md](0034-segregation-of-duties-entra-oid-actor-keys.md)

### Decision

*(No `## Decision` section - see full ADR.)*

---

## ADR 0037

**Full record:** [0037-tenant-isolation-without-rls-defense-in-depth.md](0037-tenant-isolation-without-rls-defense-in-depth.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

1. **Production tenant isolation does not use SQL Row-Level Security.** Do not propose RLS reinstatement in architecture assessments unless this ADR is explicitly reopened via a superseding ADR.
2. **Primary control (Layer A):** **`SystemWithPerTenantCatalogs`** — runtime product SQL connections for `TenantId != Empty` resolve to that tenant’s catalog only (`ScopedRoutingSqlConnectionFactory`).
3. **Defense-in-depth layers (no RLS):**
   | Layer | Control | Enforcement |
   |-------|---------|-------------|
   | **A — Catalog boundary** | Database-per-tenant routing | Startup fail-fast on `SingleCatalog` in prod-like hosts; `ITenantDatabaseResolver` |
   | **B — Identity & scope** | JWT/API key → typed `ScopeContext` once at host boundary | `TenantIdentityBoundaryAnalyzer` (ARCH001); scope headers / route binding |
   | **C — HTTP ingress** | Route `{tenantId}` binding + IDOR guards | `RouteTenantScopeBindingFilter`, `assert_route_tenant_scope_guard.py`, integration tests |
   | **D — Persistence** | Repositories accept scope; parameterized SQL with tenant predicates | Architecture/integration tests (`TenantIsolationSmokeTests`, `*ScopeIsolationSqlIntegrationTests`); code review |
   | **E — Blob / auxiliary stores** | Tenant-prefixed object keys | `ArtifactBlobTenantPaths`; container isolation per deployment |
   | **F — Platform cross-tenant reads** | Separate RBAC (`PlatformCrossTenantReadAuthority` / `PlatformOperator`) | Explicit admin analytics only; never default product path |
4. **Canonical engineering reference:** [`docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md).

*(truncated - see full ADR)*

---

## ADR 0038

**Full record:** [0038-run-durability-multi-store-outbox-production-secrets.md](0038-run-durability-multi-store-outbox-production-secrets.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

### 1. Authority pipeline async default (SQL)
- When `StorageProvider=Sql` and `FeatureManagement:FeatureFlags:AsyncAuthorityPipeline` is **unset**, **`FeatureManagementAuthorityPipelineModeResolver` defaults to queue mode** (`true`).
- **InMemory** storage never queues (unchanged).
- **`appsettings.Production.json`** sets `AsyncAuthorityPipeline: true` explicitly; **`appsettings.Advanced.json`** may set `false` for local opt-out.
### 2. Transactional authority pipeline outbox
- **`IAuthorityPipelineWorkRepository.EnqueueAsync`** accepts optional **`IDbConnection` / `IDbTransaction`** so outbox rows enlist in the caller's SQL transaction.
- **`AuthorityRunOrchestrator`** enlists pipeline work in the same unit of work as run header persistence before commit (queue mode).
- **`ArchitectureRunCreateOrchestrator`** opens a **single** create-run unit of work, passes it through coordination → orchestrator, persists related rows, and commits once. Enlisted UoW is supported for **queue mode only** (inline + enlisted throws).
### 3. Cosmos graph snapshot outbox (SQL-first)
When `CosmosDb:GraphSnapshotsEnabled` is true on SQL storage:
1. Graph snapshot JSON is written to **SQL inside the authority transaction** via **`IGraphSnapshotSqlAuthorityWriter`**.
2. A row is inserted into **`dbo.CosmosGraphSnapshotOutbox`** (migration **246**) in the **same transaction**.

*(truncated - see full ADR)*

---

## ADR 0039

**Full record:** [0039-commit-sealed-evidence-immutability.md](0039-commit-sealed-evidence-immutability.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

1. **Commit point:** A run is *committed* when `AuthorityRunOrchestrator.FinalizeCommittedPipelineAsync` completes successfully inside the authority unit of work. Rows written in that transaction (and child evidence linked by `RunId`) are **commit-sealed**.
2. **V1 sealed tables:** All tables listed in `SealedEvidenceTableRegistry` (migration 247 / `ArchLucid.sql`) — audit, agent results, evidence packages, decision traces, context/graph/findings snapshots, golden manifests, artifact bundles and child tables, `DecisioningTraces`.
3. **Enforcement:** `DENY UPDATE` and `DENY DELETE` on each sealed table **to `[ArchLucidApp]`** when the role exists (same pattern as migration 051). `dbo` / `db_owner` retain break-glass correction.
4. **Post-commit agent-result enrichments:** Calibration, IaC stubs, and evidence-proposal promotion write to **`dbo.AgentResultEnrichments`** (not sealed). Base `dbo.AgentResults` is insert-only; reads merge overlay via `AgentResultEnrichmentMerger`.
5. **Retry semantics:** `CreateManyAsync` on agent results no longer delete-then-insert; duplicate `(RunId, TaskId)` throws `AgentResultDuplicateConflictException` (UoW rollback handles retries). `AgentEvidencePackageRepository` is insert-only with unique `RunId`.
6. **Startup guard:** `SqlSealedEvidenceImmutabilityRules` extends shared `SqlDatabaseImmutabilityProbeHelpers`; production-like SQL hosts fail closed if DENY permissions are missing or the connected principal can UPDATE/DELETE sealed tables.
7. **Canonical inventory:** [`docs/library/EVIDENCE_IMMUTABILITY.md`](../../library/EVIDENCE_IMMUTABILITY.md).

---

## ADR 0040

**Full record:** [0040-tamper-evident-lineage-without-worm-storage.md](0040-tamper-evident-lineage-without-worm-storage.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

1. **WORM and immutable Azure Blob / S3 tiers are out of scope** for ArchLucid platform engineering in V1 and V1.1. Do not propose platform-provisioned WORM containers, legal-hold automation, or “immutable proof tier” Terraform as a product requirement in architecture assessments unless this ADR is explicitly reopened.
2. **Customer-controlled immutability remains valid.** Export runbooks may recommend that customers apply versioning, retention, or WORM policies on **their** audit/export prefix after download ([`AUDIT_RETENTION_POLICY.md`](../../library/AUDIT_RETENTION_POLICY.md) — customer ops, not platform SLA).
3. **In-scope item #6 work** is **application-layer tamper-evident lineage**:
   - Content-addressed hashes on commit-sealed artifacts (manifest, bundle members, key snapshots where feasible).
   - Audit events that anchor committed hashes (extend existing `ManifestGenerated` pattern).
   - First-class **export manifest** (checksum list + hash anchors) on sponsor/proof ZIP paths — not only PowerShell/CLI scripts.
   - A **verify** surface (API or CLI) that recomputes hashes and reports match/mismatch against committed anchors.
4. **Explicitly out of scope for #6:** cryptographic hash chains that require HSM signing, blockchain anchoring, third-party timestamp authorities, and platform-operated WORM storage.
5. **FK repoint detection** on `dbo.Runs` (child evidence rows repointed to another run) is a **separate** integrity concern; may share tooling with lineage verification but is not solved by WORM and is not deferred to storage tier work.

---

## ADR 0041

**Full record:** [0041-fail-closed-scope-derivation.md](0041-fail-closed-scope-derivation.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

1. **Source tracking:** `IScopeContextProvider.ResolveCurrentScope()` returns per-dimension `ScopeSource` (`Ambient`, `Claim`, `Header`, `Default`).
2. **Request gate:** `ScopeResolutionGuardMiddleware` runs after authentication on **production-like** hosts (`HostEnvironmentClassification.IsProductionOrStagingLike`). Non-allow-listed routes return **403** when any dimension source is `Header` or `Default`, or when an ambient override carries development-default GUIDs.
3. **Allow-list:** `[AllowUnscopedRoute]` (plus existing `/internal/` and health path skips) marks legitimately scope-free surfaces (marketing, webhooks, registration).
4. **Startup guard:** `ProductionSafetyRules.CollectScopeDerivationUnsafeInProductionLike` rejects `ArchLucidAuth:Mode=DevelopmentBypass` and `ArchLucidAuth:AllowTestActorHeaders=true` on production-like hosts (carve-out: ASP.NET Development + `ARCHLUCID_ENVIRONMENT=Staging` for integration tests).
5. **Development unchanged:** Non-production-like hosts keep default-scope convenience for local dev and CI.

---

## ADR 0042

**Full record:** [0042-canonical-run-write-surface.md](0042-canonical-run-write-surface.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

1. **Canonical family = `v1/architecture/*`.** The `v1/requests`, `v1/runs/{runId}/submit`, and `v1/runs/{runId}/manifest/finalize` aliases are **deprecated** but stay routable. `RunAliasDeprecationMiddleware` emits RFC 8594 `Deprecation: true` + a `Link; rel="successor-version"` header pointing at the canonical route. Routes are **not** deleted here (sunset is a later TB).
2. **Unified idempotency + audit by construction.** Each canonical route and its alias are declared as multiple `[HttpPost]` attributes on a **single MVC action**, so the idempotency key space and audit event are identical regardless of which verb a caller uses. `RunWriteLifecycleRoutes` is the single source of truth for the mapping; `CanonicalRunWriteSurfaceArchitectureTests` pins the shared-action contract.
3. **`/result` is append-only-to-in-progress.** `SubmitAgentResult` accepts a result only while the run is `TasksGenerated` or `WaitingForResults` (`RunStateTransitionService.ValidateResultSubmissionAllowed`); it cannot finalize/commit a run or mutate a committed one, so it can never bypass the commit orchestrator. Retained as a documented custom-agent extension point (removal would be a public-contract change requiring owner sign-off).
4. **Decision primitives are authority components.** They are consumed by `AuthorityDrivenArchitectureRunCommitOrchestrator`; the misleading registration method was renamed `RegisterCoordinatorDecisionEngineAndRepositories` → `RegisterAuthorityDecisionEngineAndRepositories` (no behaviour change).
5. **Self-enforcing end-state.** `CanonicalRunWriteSurfaceArchitectureTests` fails the build when a new multi-verb run-lifecycle write route appears on `RunsController` without a corresponding `RunWriteLifecycleRoutes` entry (which itself requires an ADR). ADR 0021 Phase 3 gate (iv) (14-day zero-coordinator-write soak) is **not** force-closed — it remains owner/customer-traffic gated per ADR 0029.

---

## ADR 0043

**Full record:** [0043-durable-run-export-blob-push-outbox.md](0043-durable-run-export-blob-push-outbox.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

1. **Add `dbo.RunExportBlobPushOutbox`** mirroring retrieval/Cosmos outbox lease, backoff, and dead-letter semantics.
2. **Enqueue at accept** — the push endpoint validates the destination SAS, confirms the run has a committed golden manifest, writes one outbox row (scope triple + destination URL), emits `RunExportBlobPushQueued`, and returns `202`. No ZIP build at enqueue time.
3. **Worker rebuilds payload** — `RunExportBlobPushOutboxProcessor` dequeues, re-validates the SAS URL, rebuilds the ZIP via `IRunExportPackageBuilder` (no Mermaid PNG render in the worker), uploads via existing `IRunExportBlobPushService`, and marks processed or retries/dead-letters.
4. **SAS URL at rest** — the customer-provided write SAS is persisted in the tenant-scoped outbox row, re-validated at processing time, never logged in full, and never written to audit `DataJson`. No new encryption-at-rest mechanism (SAS is short-lived and customer-owned).
5. **Shared builder with guardrails** — `IRunExportPackageBuilder` encapsulates ZIP construction for both GET download and the worker; callers own diagram PNG rendering and audit events (`RunExported` vs `RunExportBlobPushQueued`).
6. **New audit** — `RunExportBlobPushDeadLettered` when retries exhaust or destination re-validation fails at processing time.

---

## ADR 0044

**Full record:** [0044-durable-post-commit-projection-outbox.md](0044-durable-post-commit-projection-outbox.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

1. **Add `dbo.PostCommitProjectionOutbox`** with `WorkType` discriminator, scope triple, optional `RunId`, optional `PayloadJson`, and the same lease/backoff/dead-letter semantics as other SQL outboxes.
2. **Enqueue after successful commit** via `PostCommitProjectionEnqueuer` — replaces all five `Task.Run` call sites. Feature gates (`RerankFindingsOptions.Enabled`, `GenerateIacStubsOptions.Enabled`, sample-run purge eligibility) apply at enqueue time.
3. **Leader-elected drainer** — `PostCommitProjectionOutboxProcessor` dispatches by `WorkType`, pushes ambient scope, and invokes the same application services previously called from `Task.Run`.
4. **Benign skip** — provenance materialization marks processed when `GetRunDetailAsync` returns null (run deleted or scope mismatch after commit).
5. **Dead-letter audit** — `PostCommitProjectionDeadLettered` when retries exhaust.

---

## ADR 0045

**Full record:** [0045-committed-run-header-immutability.md](0045-committed-run-header-immutability.md)

**Date:** 2026-06-06
**Status:** Accepted

### Decision

1. **Commit marker:** A run is *committed* for header sealing when `GoldenManifestId IS NOT NULL` (aligned with TB-303 commit definition and `CK_Runs_CommittedHasManifest`).
2. **Frozen anchor columns** (see `CommittedRunHeaderAnchorRegistry`): `RunId`, `ProjectId`, scope triple (`TenantId`, `WorkspaceId`, `ScopeProjectId`), `CreatedUtc`, snapshot/manifest FKs (`ContextSnapshotId`, `GraphSnapshotId`, `FindingsSnapshotId`, `GoldenManifestId`, `DecisionTraceId`, `ArtifactBundleId`), `CurrentManifestVersion`, `StructuralExecutionMode`, `OtelTraceId`.
3. **Mutable lifecycle columns:** `Description`, `ArchivedUtc`, `LegacyRunStatus`, `CompletedUtc`, showcase/demo/pin/sample flags, retry counters, operator governance disposition, `ArchitectureRequestId` (future candidate for sealing).
4. **Enforcement:**
   - SQL: `TR_Runs_SealCommittedHeader` (`AFTER UPDATE`) raises **50310** when `DELETED.GoldenManifestId IS NOT NULL` and any anchor column value changes (migration 250 / `ArchLucid.sql`).
   - App: `CommittedRunHeaderAnchorGuard` in `SqlRunRepository.UpdateAsync` (and in-memory parity) fail-fast before SQL.
   - Startup: `SqlCommittedRunHeaderImmutabilityRules` — production-like SQL hosts fail closed if trigger is missing.
5. **No-op rewrites:** Existing `UpdateAsync` rewrites all columns; when anchor values are unchanged the trigger permits the update (compares `INSERTED` vs `DELETED`, not SET list).

---

## ADR 0046

**Full record:** [0046-committed-run-header-fk-repoint-detection.md](0046-committed-run-header-fk-repoint-detection.md)

**Date:** 2026-06-07
**Status:** Accepted

### Decision

1. **Scope:** Committed runs only (`GoldenManifestId IS NOT NULL`). Each non-NULL evidence pointer on `dbo.Runs` is probed:
   | Pointer column | Child table | Child PK | Child RunId |
   |----------------|-------------|----------|-------------|
   | `ContextSnapshotId` | `ContextSnapshots` | `SnapshotId` | `RunId` |
   | `GraphSnapshotId` | `GraphSnapshots` | `GraphSnapshotId` | `RunId` |
   | `FindingsSnapshotId` | `FindingsSnapshots` | `FindingsSnapshotId` | `RunId` |
   | `GoldenManifestId` | `GoldenManifests` | `ManifestId` | `RunId` |
   | `DecisionTraceId` | `DecisioningTraces` | `DecisionTraceId` | `RunId` |
   | `ArtifactBundleId` | `ArtifactBundles` | `BundleId` | `RunId` |
2. **Violation definition:** For a committed run, a pointer is violated when `NOT EXISTS (child WHERE child.PK = header.pointer AND child.RunId = header.RunId)`.
3. **Enforcement:** Detection-only — no auto-delete, no quarantine insert, no write-path block.
4. **Implementation:**

*(truncated - see full ADR)*

---

## ADR 0047

**Full record:** [0047-tenant-scoped-query-roslyn-guard.md](0047-tenant-scoped-query-roslyn-guard.md)

**Date:** 2026-06-07
**Status:** Accepted

### Decision

1. Add **`TenantScopedQueryScopeBindingAnalyzer` (`ARCH006`)** in `ArchLucid.Analyzers`, enabled on **`ArchLucid.Persistence`** only.
2. Source of truth for tenant-scoped tables is **`scripts/ci/data/tenant_scoped_tables.v1.json`**, generated from the **`scope-triple-on-row`** and **`tenant-id-on-row`** buckets in `docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md`. A parity architecture test prevents drift.
3. **Fail-closed** on unanalyzable SQL against scoped tables unless a recognized scope helper (`PersistenceTenantScope`, `RunChildRunScopeSql`, `RepositoryScopePredicate`) or **`[TenantScopeExempt]`** is present.
4. **`[TenantScopeExempt]`** (`ArchLucid.Core.Tenancy`) documents finite exemptions aligned to classification buckets (`AcceptedResidual`, `SystemPlaneOnly`, `Operational`).
5. v1 analyzer accepts, within a tenant catalog:
   - explicit triple/`TenantId` predicates,
   - INSERT rows carrying `TenantId`,
   - MERGE `ON` tenant keys,
   - surrogate-key reads/writes (`Id = @Id`, optional `IS NULL` guards),
   - tenant-id + additional `AND` predicates on triple-scoped tables.

---

## ADR 0048

**Full record:** [0048-socratic-intake-mutable-draft-lifecycle.md](0048-socratic-intake-mutable-draft-lifecycle.md)

**Date:** 2026-06-07 (Accepted 2026-06-08)
**Status:** Accepted

### Decision

1. **Introduce a `DraftRequest` aggregate** distinct from `ArchitectureRequest`. A draft is the mutable workspace where intent is elicited, labeled (asserted vs inferred, per [ADR 0050](0050-feasibility-classification-transparency-trail.md)), and refined. It is **scoped** (tenant/workspace/project) like every other aggregate and carries a `schemaVersion` per ADR 0013.
2. **Lifecycle states:** `Drafting → Admitted → Submitted → RunSpawned` (plus terminal `Redirected` and `Abandoned`). Only `Drafting` is mutable. `Admitted` requires the **semantic admission gate** to have identified â‰¥1 actor (ADR 0049) and â‰¥1 functional outcome; failure routes to `Redirected` (**redirect, not refuse** — R6), never a hard 4xx for real-but-inarticulate intent.
3. **`Submitted` requires the MUST-set answered.** A draft may only transition to `Submitted` when every `MUST` question for the active pillars/packs is answered (ADR 0051). This is the deterministic admission-to-trust gate; `SHOULD` questions refine confidence but do not block.
4. **`RunSpawned` reuses the existing canonical write surface unchanged.** On submit, the draft is projected into an `ArchitectureRequest` and handed to the **existing** `POST /v1/architecture/request` path (ADR 0042). The draft lifecycle adds **no** second run-creation pipeline; it is strictly a pre-stage that produces the same `ArchitectureRequest` the system already consumes.
5. **New endpoints are draft-scoped only:** create/patch/get a draft, answer a question, request admission, and submit. They live under a new route group (e.g. `v1/architecture/draft/*`) and never touch committed run state.
6. **Branching (ADR-future / R12) clones a draft snapshot.** A what-if branch is a draft cloned with a minimal invariant override, then submitted as its own run; comparison reuses the existing Compare engine. This ADR only reserves the snapshot/clone capability on the aggregate; branch orchestration is a later ADR.

---

## ADR 0049

**Full record:** [0049-actor-descriptor-model.md](0049-actor-descriptor-model.md)

**Date:** 2026-06-07 (Accepted 2026-06-08)
**Status:** Accepted

### Decision

1. **Define the actor descriptor as a triple over three enums:**
   - `ActorKind`: `Human | Machine | Both`
   - `TrustOrigin`: `Internal | External | PublicAnonymous`
   - `InteractionContract`: `Sync | AsyncBatch | Event | Streaming`
2. **A system carries an `ActorSet`** — a set of actor descriptors, not a single triple. The set's **cardinality is inferred first**; refining any single actor's axes is secondary.
3. **Each actor carries provenance:** an `Origin` of `Asserted | Inferred` and a `Confidence` (1–100), aligning with [ADR 0050](0050-feasibility-classification-transparency-trail.md). A confirmed actor is `Asserted`; an unconfirmed-but-proceeded actor is `Inferred` and lowers downstream scoring confidence.
4. **Inferred-then-confirmed, never a blank form.** ArchLucid infers the `ActorSet` from free-text intent and presents it as a pre-filled, labeled guess for confirmation/correction; the confirmation *is* the question. The single highest-value confirmation is **"are there other kinds of users I'm missing?"** before refining axes.
5. **Machine-actor scope discipline:** when an actor is a `Machine`, ArchLucid reviews **only up to the interaction contract** and treats the external system as a black box with a trust label — preventing "review my system" from recursing into "review everything it touches."
6. **Contract types only in this ADR.** No persistence, no endpoint, no `ArchitectureRequest` wiring here — those land in the draft (ADR 0048). Each type in its own file; concrete types; null checks.

---

## ADR 0050

**Full record:** [0050-feasibility-classification-transparency-trail.md](0050-feasibility-classification-transparency-trail.md)

**Date:** 2026-06-07 (Accepted 2026-06-08)
**Status:** Accepted

### Decision

1. **Feasibility verdict is a typed, three-value result:** `Feasible | SoftInfeasible | HardInfeasible`.
   - `HardInfeasible` **requires a citation** — a named theorem, law, or a demonstrably contradictory invariant pair (the "unsat core"). Without a citation, a verdict may **not** be `HardInfeasible`. Confidence is fixed at 100 and the citation is mandatory.
   - `SoftInfeasible` carries a **confidence band + an envelope** (e.g. "holds below scale T, breaks above it") and the assumption that makes it soft, plus the cost of being wrong.
   - The default under uncertainty is `SoftInfeasible` (the asymmetry rule), never `HardInfeasible`.
2. **Over-constrained designs emit the minimal conflicting invariant set** (the unsat core), reusing the `INV-*` catalog from ADR 0035, not a vague "relax something."
3. **ArchLucid proposes relaxations; the human disposes.** The engine surfaces the trade-off and never silently relaxes a residency/availability/cost target.
4. **A `TransparencyTrail` is a mandatory output on every verdict.** It has three sections: `Asserted[]` (what the user stated), `Inferred[]` (what ArchLucid filled, each with a 1–100 confidence), and `Skipped[]` (every MUST/SHOULD question not answered, with its tier). A verdict produced without a complete trail is a defect, not a degraded-but-acceptable result.
5. **The trail composes with existing surfaces.** It serializes into the manifest/provenance output (TB-034) and its claim labels align with SAQ-011 so that any externally-quoted claim carries its evidentiary basis.
6. **Contract + classification rules in this ADR; pipeline wiring is downstream.** Types and the classification decision table are defined here; attaching them to the authority pipeline output is a later implementation step gated on ADR 0048.

---

## ADR 0051

**Full record:** [0051-question-selection-engine.md](0051-question-selection-engine.md)

**Date:** 2026-06-07 (Accepted 2026-06-08; L0/L1 implemented, L2/VoI remain OPEN per O1-remainder)
**Status:** Accepted — amended by [ADR 0058](0058-bounded-generative-question-tier.md) (bounded generative tier L2g + retrospective question mining; 2026-07-12)

### Decision

1. **Layered selection model:**
   - **L0 — deterministic, universal:** the five Well-Architected pillars + the actor set (ADR 0049) generate the universal `MUST` questions. No LLM.
   - **L1 — deterministic, pack-driven:** active/inferred policy packs contribute their question sets (each derivable from a pack rule key); ordering by value-of-information ranking. No LLM.
   - **L2 — LLM bounded fallback:** only when L0–L1 are exhausted but the objective is still under-determined; the LLM **selects/phrases from the bounded corpus** (platform packs + k-anon aggregates via RAG). It does **not** free-generate questions.
   - **L3 — learning flywheel:** useful L2 questions are logged → reviewed (human, out of runtime — R9) → promoted into packs (SemVer, no silent mutation) → become L1. Nondeterminism decreases monotonically.
2. **Packs own questions (R8).** Extend `PolicyPackContentDocument` with an additive `ElicitationQuestions` collection: `{ QuestionKey, Prompt, Tier (MUST|SHOULD), AnswerKind, RuleKeys[] }`. A validator asserts every `RuleKeys` entry resolves within the same pack version. Existing question-less packs must deserialize unchanged.
3. **Termination is deterministic.** "Done" = all `MUST` questions for the active pillars/packs are answered. The LLM never decides when to stop. This is the same gate ADR 0048 uses to allow `Submitted`.
4. **Cold-start is seeded, not empty.** L0/L1 are seeded from the five pillars' canonical questions and the existing bundled policy packs' rule keys (each evaluation rule implies an elicitation question).
5. **The value-of-information ranking function is OUT OF SCOPE and OPEN (O1-remainder).** This ADR fixes the *layering, ownership, and termination*; the precise VoI ordering and the exact condition under which L2 may break ties are deferred until golden-cohort data exists to calibrate them. Building L2/VoI before that data is explicitly disallowed by this ADR.

---

## ADR 0052

**Full record:** [0052-monetization-posture-decision-as-product.md](0052-monetization-posture-decision-as-product.md)

**Date:** 2026-06-07 (Accepted 2026-06-08)
**Status:** Accepted

### Decision

1. **Position the reasoned "no" as a first-class, billable deliverable**, not an error state. A run that ends in `SoftInfeasible`/`HardInfeasible` (ADR 0050) produces a dignified, exportable, **cost-quantified** artifact — the receipt quantifies *avoided* cost ("ten minutes, ~$1, vs ~$25k over weeks") — never a dead-end page.
2. **Primary commercial model = per-seat license for the expert operator** (hub-and-spoke). License the **hub** (expert operators who drive the tool), not the **spokes** (downstream requesters who route problems through them) — the same economics as licensing DBAs, not everyone who asks a DBA for a data model.
3. **Reconciliation with R6 (recorded to prevent a false contradiction):** R6's "90% bounce is a win" is **per-*idea/session*, not per-*person***. The seatholder is retained by the tool's value to their job; individual ideas freely bounce — the high rejection rate is *why* the seat is worth holding. There is no conflict between "ideas bounce" and "seats renew."
4. **Reuse the existing billing abstraction (ADR 0016) and trial boundary (ADR 0014).** This ADR sets *posture*, not mechanism; seat enforcement rides the existing billing provider abstraction and usage-metering surfaces rather than a new billing system.
5. **Branch/what-if runs remain individually metered** (each is a billable full-pipeline run per the branching design), but metering is a *cost-attribution* concern under the seat, not a separate pay-per-use product.

---

## ADR 0053

**Full record:** [0053-enterprise-diagnostic-logging-observability-posture.md](0053-enterprise-diagnostic-logging-observability-posture.md)

**Date:** 2026-06-14
**Status:** Accepted

### Decision

1. **Near-perfect diagnostic logging is a first-class architectural requirement for V1 GA.** Production-like hosts must emit enough structured, correlated telemetry that on-call and customer support can reconstruct a review run end-to-end from Application Insights (or configured OTLP sink) plus durable audit, without reading raw customer evidence or prompts.
2. **Three-layer observability model (normative):**
   | Layer | Purpose | Canonical store / sink |
   | --- | --- | --- |
   | **Durable audit** | Compliance, governance, buyer-facing evidence trail | `dbo.AuditEvents` via `IAuditService` (`AuditEventTypes`) |
   | **Distributed traces + metrics** | Latency, dependency failure, AI cost, pipeline stage timing | OpenTelemetry → Azure Monitor / OTLP / Prometheus |
   | **Structured logs** | Human-readable triage, Serilog request logging, failure detail | Serilog console + App Insights log ingestion when configured |
   These layers are **complementary**. Audit answers "what was recorded for compliance"; traces answer "what was slow or failed"; logs answer "what did the process say at the moment of failure."
3. **Mandatory correlation dimensions** on every request-scoped Activity and log scope where the value is known:
   | Dimension | Activity tag | Serilog `LogContext` | Notes |
   | --- | --- | --- | --- |
   | Correlation | `correlation.id` | `CorrelationId` | Already shipped (`CorrelationIdMiddleware`) |

*(truncated - see full ADR)*

---

## ADR 0054

**Full record:** [0054-warm-standby-pool-sizing-sufficient.md](0054-warm-standby-pool-sizing-sufficient.md)

**Date:** Date: 2026-06-15
**Status:** Accepted

### Decision

The owner has explicitly decided that the current warm standby pool sizing is sufficient. We will not implement dynamic scaling or increase the pool size for V1.

---

## ADR 0055

**Full record:** [0055-pre-run-socratic-intake-loop.md](0055-pre-run-socratic-intake-loop.md)

**Date:** Date: 2026-06-15
**Status:** Accepted

### Decision

The owner has decided that the Socratic intake loop is an **absolute requirement for V1** and must be built robustly, even if it delays the release of the product.
We will implement the pre-run reasoning surface, the mutable draft lifecycle, and the LLM semantic admission gate.

---

## ADR 0056

**Full record:** [0056-manifest-online-fine-tuning-governance.md](0056-manifest-online-fine-tuning-governance.md)

**Date:** 2026-07-03
**Status:** Accepted

### Decision

1. **Governance (Phase 0):** This ADR plus [`MANIFEST_FINE_TUNING_ADDENDUM.md`](../../go-to-market/MANIFEST_FINE_TUNING_ADDENDUM.md) satisfy the stated DPA/ADR prerequisite for engineering work. Production enablement still requires contractual countersignature where applicable.
2. **Consent (Phase 1):** Per-tenant manifest fine-tuning consent is stored in `dbo.TenantSettings` under key `FineTuning.ManifestConsent`. Default is **Disabled**. Export and job submission **fail closed** when consent is not **Enabled**.
3. **Training-data export (Phase 1):** `AcceptedManifestTrainingDataExporter` builds JSONL-style `FineTuningTrainingRecord` rows from committed manifests in caller scope only. All free-text passes through `IPromptRedactor.RedactAlways` plus manifest-specific GUID tokenization. No cross-tenant manifest mixing in a single export batch.
4. **Orchestration (Phase 2):** Azure OpenAI fine-tuning jobs are submitted via `AzureOpenAiFineTuningJobOrchestrator` when `Retrieval:FineTuning:Enabled` is true and Azure OpenAI is configured; otherwise `DisabledFineTuningJobOrchestrator` is registered. Job metadata and deployment names are persisted in `dbo.FineTunedModelRegistryEntries`.
5. **Promotion gate (Phase 3):** `GoldenCohortFineTuningPromotionGate` compares fine-tuned vs. base golden-cohort faithfulness support ratios. Promotion requires fine-tuned â‰¥ base and fine-tuned â‰¥ configured floor (`Retrieval:FineTuning:MinEvalSupportRatio`, default **0.80**). Failed promotion leaves the prior active model unchanged; rollback marks the registry entry `RolledBack`.
6. **Tenant isolation:** All export and registry rows are tenant-scoped (`TenantId` on row). Workspace/project scope is preserved on export audit rows. No fine-tuned model is promoted across tenants.

---

## ADR 0057

**Full record:** [0057-graph-rag-community-summarization-scope-decision.md](0057-graph-rag-community-summarization-scope-decision.md)

**Date:** 2026-07-05
**Status:** Accepted (options record); **recommendation superseded by owner-override addendum below, 2026-07-05**

### Decision

This ADR does **not** authorize implementation. It records three options, evaluated against the same cost/risk/impact axes ADR 0056 and TB-597 used, with an explicit recommendation for **today** that is revisitable the moment G-REAL-06 (first real-mode pilots) produces buyer signal.
### Option (a) — Implement community detection + hierarchical summarization now, pull into V1
Add a community-detection pass (Leiden or Louvain) over the existing `GraphSnapshot` provenance graph, then one hierarchical LLM summarization call per detected community, cached and re-embedded on the same ADR 0004 outbox refresh cadence as node embeddings.
- **Cost:** New indexing sub-pipeline (community detection + summarization job) touching `GraphSnapshotCanonicalFingerprint` invalidation rules; incremental Azure OpenAI summarization spend **per community per graph refresh**, scaling with tenant run volume, not just node count; new cache-invalidation surface when the graph changes between runs (a stale community summary is a *silent* correctness risk — it would look confident and be wrong).
- **Risk:** Inherits `GraphRagProductionLikeConfigurationLint`'s "unproven without a production vector index" advisory immediately (same underlying posture gap as bounded multi-hop), *plus* a second, harder-to-ablate quality question — TB-595's methodology ablates a retrieval flag that is either on or off for an *existing* query; community summarization changes *what is indexed*, so isolating its quality contribution requires a live-model ablation (re-embedding, re-summarizing, then re-querying), not a fixture-level toggle.
- **Expected impact:** Best case, materially deepens Graph-RAG's differentiability claim (Â§13 of `docs/assessments/LATEST_GPT55.md`) by surfacing cross-node thematic context bounded multi-hop cannot reach in 1–2 hops. Worst case, ships a second unproven-quality retrieval layer before the first (bounded multi-hop) has any live-buyer signal, compounding the exact risk Â§16's Stop Doing List already flags: "community-summarization Graph-RAG *implementation* before pilot feedback."
### Option (b) — Keep deferred to V1.1/V2, unchanged (status quo)
No engineering change. `V1_DEFERRED.md` Â§6q and `V1_SCOPE.md` Â§2.20 continue to state community summarization as out of V1 scope, with the "unproven without a production vector index" caveat carried on the shipped bounded-multi-hop feature only.
- **Cost:** Zero engineering cost. Opportunity cost only: if a technical evaluator in a live pilot specifically probes for community-level (not just 1–2-hop) Graph-RAG context and treats its absence as a dismissal trigger, ArchLucid has no counter beyond "bounded multi-hop ships today, community summarization is roadmapped."
- **Risk:** Lowest risk of the three — no new unproven-quality surface, no new recurring Azure OpenAI spend, no new cache-invalidation correctness surface.
- **Expected impact:** No change to any Â§2/Â§7 score in the current assessment. Preserves engineering capacity for G-REAL-06-blocking work (Â§17 Tier 1).
### Option (c) — Ablation-only spike before full implementation

*(truncated - see full ADR)*

---

## ADR 0060

**Full record:** [0060-ai-model-chooser-provider-scope.md](0060-ai-model-chooser-provider-scope.md)

**Date:** 2026-07-18
**Status:** Accepted

### Decision

1. **D1 — Provider scope.** Azure OpenAI remains the **sole ArchLucid-managed provider** for V1.x. The `LlmProviderType` vendor SDK scaffolds (Anthropic, Gemini, Ollama) stay dormant; no third-party vendor SDK adapter is built under this ADR.
2. **D2 — Alias-based selection.** Customer-facing model selection is expressed through a **model alias and capability registry** (**TB-869**) and governed **execution profiles** (Economy / Balanced / High assurance) layered on the existing tier router — never through literal deployment names in prompts, policies, or UI.
3. **D3 — First BYO path: customer-provided Azure OpenAI connection** (**TB-872**). Per-tenant endpoint + deployment + credential stored via the existing `ISecretProvider` / Key Vault boundary, reusing the existing Azure OpenAI adapter with per-tenant client resolution. ADR-acceptance gate **cleared** (this ADR Accepted 2026-07-18); remaining dependency is **TB-869**–**TB-871**.
4. **D4 — Second BYO path: generic OpenAI-compatible endpoints** (**TB-873**). One adapter for OpenAI-compatible APIs (customer-hosted gateways, open-weight servers). ADR-acceptance gate **cleared**; remaining gates: **(b)** a capability probe confirming JSON-schema structured output or an approved degraded-parsing profile, and **(c)** a per-alias faithfulness-harness pass artifact before any task is approvable on that alias. Hosted third-party endpoints receiving regulated customer evidence additionally require an explicit workspace-administrator acknowledgment recorded in the audit trail.
5. **D5 — Embeddings stay ArchLucid-managed.** Retrieval embeddings remain on the ArchLucid-managed Azure OpenAI embedding deployment in **all** modes for V1.x; BYO embeddings and re-embedding migration are out of scope (index/vector binding).
6. **D6 — Metering and billing.** Token usage, cost estimation, and provenance are recorded for **every** execution regardless of who pays. Wallet settlement and dollar-budget **enforcement** apply only to ArchLucid-managed connections; customer-provided connections get usage visibility and optional workspace quotas, not ArchLucid wallet charges.
7. **D7 — Deterministic authority unchanged.** Content-safety enforcement and all deterministic platform behaviors (authorization, tenant isolation, evidence identifiers, citation linkage, finalization/approval state, audit history, policy-gate calculations, scoring, retention/deletion, export completeness, billing enforcement) remain ordinary ArchLucid code on every provider path. Model or profile selection can never alter authoritative records or governance outcomes.

---

## ADR 0061

**Full record:** [0061-ddos-protection-posture-v1.md](0061-ddos-protection-posture-v1.md)

**Date:** 2026-07-21
**Status:** Accepted (owner ratified 2026-07-21; TB-908)

### Decision

**For V1 controlled pilots and early production:**
1. **Rely on Azure Front Door platform DDoS** at the public edge (Microsoft absorbs L3/L4 volumetric attacks against Front Door endpoints as part of the global edge; no separate DDoS plan purchase required for traffic terminated at Front Door).
2. **Do not deploy Azure DDoS Network Protection** in IaC for the current scale.
3. **Complement edge absorption** with:
   - **WAF Prevention** on Front Door (custom rules — rate limits / geo blocks are follow-on engineering, not managed rule sets).
   - **Private endpoints + deny public data-plane access** on SQL, storage, Key Vault, Cosmos, and Redis in production posture (**TB-903**).
   - **Application-layer limits** already in product (API rate limiting, LLM quotas/circuit breakers, outbox/DLQ patterns — see threat model).
4. **Do not claim** “Azure DDoS Protection Standard” or “DDoS Network Protection” in buyer-facing copy unless the corresponding Azure resource is deployed (not required at V1 per this ADR).
**Owner ratification:** Accepted 2026-07-21.

---

## Archived completed ADRs (removed 2026-08-02) {#archived-completed-adrs-removed-2026-08-02}

### ADR 0002 - Dual persistence (ArchitectureRuns vs dbo.Runs)

- **Status:** Completed (superseded)
- **Canonical:** [DATA_CONSISTENCY_MATRIX.md](../../library/DATA_CONSISTENCY_MATRIX.md#runs-authority-convergence-complete)
- **Summary:** Legacy dbo.ArchitectureRuns retired; dbo.Runs is sole run header.

### ADR 0012 - Runs authority convergence

- **Status:** Completed (2026-04-12)
- **Canonical:** [DATA_CONSISTENCY_MATRIX.md](../../library/DATA_CONSISTENCY_MATRIX.md#runs-authority-convergence-complete)
- **Summary:** IArchitectureRunRepository and dbo.ArchitectureRuns removed.

### ADR 0003 - SQL RLS and SESSION_CONTEXT

- **Status:** Completed (superseded by 0037)
- **Canonical:** [0037-tenant-isolation-without-rls-defense-in-depth.md](0037-tenant-isolation-without-rls-defense-in-depth.md)
- **Summary:** RLS removed; per-tenant catalog + defense-in-depth is production posture.

### ADR 0010 - Dual manifest and decision-trace repository contracts

- **Status:** Completed (superseded by 0030)
- **Canonical:** [0030-coordinator-authority-pipeline-unification.md](0030-coordinator-authority-pipeline-unification.md)
- **Summary:** Coordinator repository family retired; Authority path canonical.

### ADR 0021 - Coordinator pipeline strangler plan

- **Status:** Completed (superseded by 0030)
- **Canonical:** [0030-coordinator-authority-pipeline-unification.md](0030-coordinator-authority-pipeline-unification.md)
- **Summary:** Phased coordinator retirement shipped PR A0-A4 + PR B.

### ADR 0022 - Coordinator Phase 3 deferred

- **Status:** Completed (superseded by 0030)
- **Canonical:** [0030-coordinator-authority-pipeline-unification.md](0030-coordinator-authority-pipeline-unification.md)
- **Summary:** Gate-evidence record; superseded on PR A3 merge.

### ADR 0028 - Coordinator strangler completion (scaffold)

- **Status:** Completed (superseded by 0030)
- **Canonical:** [0030-coordinator-authority-pipeline-unification.md](0030-coordinator-authority-pipeline-unification.md)
- **Summary:** Draft scaffold; calendar/gates resolved in 0029 then 0030.

### ADR 0029 - Coordinator strangler acceleration (2026-05-15)

- **Status:** Completed (superseded by 0030)
- **Canonical:** [0030-coordinator-authority-pipeline-unification.md](0030-coordinator-authority-pipeline-unification.md)
- **Summary:** Accelerated cut-over; PR B checklist closed 2026-05-05.


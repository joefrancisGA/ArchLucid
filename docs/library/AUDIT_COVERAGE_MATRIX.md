> **Scope:** Contributor-reference — Audit coverage matrix - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Audit coverage matrix

For **what counts as an audit event**, row-level fields, immutability guarantees, and how audit differs from application logs, read **[`AUDIT_EVENT_MODEL.md`](AUDIT_EVENT_MODEL.md)** first.

This document maps **state-changing** workflows to the audit signals they emit. ArchLucid has **three** durable or structured **channels** that share one **string catalog** in `ArchLucid.Core.Audit.AuditEventTypes`:

1. **Durable SQL audit** — `IAuditService.LogAsync` → `IAuditRepository.AppendAsync` → `dbo.AuditEvents` (`ArchLucid.Core.Audit.AuditEvent`). Event types use **top-level** `AuditEventTypes.*` constants (e.g. `RunStarted`, `GovernanceApprovalSubmitted`).
2. **Baseline mutation log** — `IBaselineMutationAuditService.RecordAsync` → structured **ILogger** lines only (`ArchLucid.Application.Common.BaselineMutationAuditService`). Event types use **`AuditEventTypes.Baseline.Architecture.*`** and **`AuditEventTypes.Baseline.Governance.*`** (namespaced string values). These **do not** populate `dbo.AuditEvents`.
3. **Platform SQL audit** — `IPlatformAuditRepository.AppendAsync` → `dbo.PlatformAuditEvents` (`ArchLucid.Core.Audit.PlatformAuditEvent`). Used for cross-tenant operator events (for example `TenantDataDeleted`); not filtered by tenant session scope.

`ArchLucid.Application.Governance.GovernanceAuditEventTypes` mirrors **`AuditEventTypes.Baseline.Governance`** values for documentation and some workflow code paths. **`GovernanceWorkflowService`** dual-writes: baseline channel with **`Baseline.Governance.*`** **and** `IAuditService` with top-level `GovernanceApprovalSubmitted` / `GovernanceApprovalApproved` / `GovernanceApprovalRejected` / `GovernanceManifestPromoted` / `GovernanceEnvironmentActivated` (durable `EventType` strings differ from baseline — see XML remarks on `AuditEventTypes.Baseline`).

<!-- audit-core-const-count:232 -->

The HTML comment above is a **CI anchor**: `.github/workflows/ci.yml` runs `scripts/ci/assert_audit_const_count.py`, which parses every `public const string` in `ArchLucid.Core/Audit/AuditEventTypes.cs` (top-level, `Run`, and `Baseline.*`), cross-checks names against the three appendix tables in this file, and compares the count to this comment. Update the comment whenever constants change, and extend the appendix rows below.

The same workflow runs `scripts/ci/assert_openapi_mutations_in_audit_matrix.py` against `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`: every **POST** / **PUT** / **DELETE** path must appear here as an explicit route (`POST /v1/…`, `PUT …/suffix`, etc.) or be listed only in `scripts/ci/openapi_audit_matrix_allowlist.txt` when grandfathered — **new** routes should update this matrix, not the allowlist.

---

## Design notes (ADR-style)

| Decision | Rationale |
|----------|-----------|
| **Circuit breaker → audit is fire-and-forget** | `CircuitBreakerGate` sits on the hot path; awaiting SQL or disk I/O would add tail latency and failure modes. The bridge schedules `LogAsync` on the thread pool and swallows exceptions so telemetry and breaker semantics stay reliable. |
| **Callback on `CircuitBreakerGate` instead of `IAuditService` in Core** | `ArchLucid.Core` must not reference persistence or host services. An optional `Action<CircuitBreakerAuditEntry>?` keeps tier boundaries; composition roots wire `CircuitBreakerAuditBridge.CreateCallback()`. |
| **`GetFilteredAsync` instead of overloading `GetByScopeAsync`** | Eight or more call sites and test doubles already depend on the original signature. A new method adds filtering without breaking consumers. |
| **Static matrix + CI guard** | Cheaper than runtime introspection of all call sites. The matrix can drift; `assert_audit_const_count.py` fails merge with a per-name diff when rows or the count marker disagree with `AuditEventTypes.cs`. |
| **Single Core catalog for baseline + durable** | Application references `ArchLucid.Core.Audit.AuditEventTypes.Baseline` so operators and developers have one file for all event-type strings; nested `Baseline` preserves namespaced baseline values without colliding with authority `RunStarted` / `RunCompleted`. |
| **Coordinator orchestration durable echo** | The coordinator orchestrators (`Create`, `Execute`, `Commit`) call `IBaselineMutationAuditService.RecordAsync` for baseline `Architecture.*` events; `BaselineMutationAuditService` appends one durable `dbo.AuditEvents` row per signal using **`AuditEventTypes.Run.*`** via `BaselineMutationAuditArchitectureDurableWriter` (legacy `CoordinatorRun*` constants were removed). Pre-commit governance warnings/blocks on commit still call `IAuditService.LogAsync` directly from `ArchitectureRunCommitOrchestrator`. Failures on the durable echo path are swallowed — audit must not break orchestration. |
| **Critical-path durable audit retry** | `Run.Created`, `Run.ExecuteStarted`, `Run.ExecuteSucceeded`, and `Run.CommitCompleted` echoes use `ArchLucid.Core.Audit.DurableAuditLogRetry` (short exponential backoff, default 3 attempts). `Run.Failed` uses a single attempt with inner `try/catch` in the writer. After exhaustion, failures are logged only — orchestration still completes. |
| **Non-coordinator provisioning audit** | SCIM, token admin, and other non-run flows call `IAuditService.LogAsync` without `DurableAuditLogRetry` — a failed append does not strand pipeline state; exhaustion on retried coordinator paths surfaces via **`archlucid_audit_write_failures_total`**. |
| **Database-level append-only on `dbo.AuditEvents`** | Migration **`051_AuditEvents_DenyUpdateDelete.sql`** (and the same idempotent **`DENY`** block in **`ArchLucid.Persistence/Scripts/ArchLucid.sql`** after the table DDL) issues **`DENY UPDATE`** and **`DENY DELETE`** on **`dbo.AuditEvents`** to the database role **`ArchLucidApp`** when that role exists. This closes the gap where code only `INSERT`s but ad-hoc SQL or bugs could mutate rows. **`dbo` / `db_owner`** are unaffected for break-glass. Local dev often has no **`ArchLucidApp`** role (app runs as **`dbo`** / SQL auth admin) — the migration **skips** until operators create the role and add the managed identity or SQL user (see **`docs/security/MANAGED_IDENTITY_SQL_BLOB.md`**). Deployments that only use **`db_datawriter`** without **`ArchLucidApp`** should create the role and move the app principal into it, or apply an environment-specific **`DENY`** to **`[db_datawriter]`** for this table. |

### Indexes on `dbo.AuditEvents`

| Index | Columns (notes) | Purpose |
|-------|-----------------|---------|
| **`IX_AuditEvents_Scope_OccurredUtc`** | `(TenantId, WorkspaceId, ProjectId, OccurredUtc DESC)` | Default newest-first listing within scope. |
| **`IX_AuditEvents_CorrelationId`** | `(CorrelationId)` **filtered** `WHERE CorrelationId IS NOT NULL` | Fast `GET /v1/audit/search?correlationId=…` and cross-request forensics. Added in migration **`055_AuditEvents_CorrelationId_RunId_Indexes.sql`**. |
| **`IX_AuditEvents_RunId_OccurredUtc`** | `(RunId, OccurredUtc DESC)` **filtered** `WHERE RunId IS NOT NULL` | Per-run audit timeline by `RunId`. Same migration. |
| **`IX_AuditEvents_OccurredUtc_EventId`** | `(OccurredUtc DESC, EventId DESC)` **INCLUDE** tenant/workspace/project + `EventType` + `ActorUserId` + `RunId` | Stable keyset pagination for `GET /v1/audit/search` when many events share the same `OccurredUtc`. Migration **`109_AuditEvents_OccurredUtc_EventId_KeysetIndex.sql`**. |

---

## Audit retrieval and export (read paths; no new `IAuditService` row)

Retention tiering (hot / warm / cold) and operational guidance: **`docs/AUDIT_RETENTION_POLICY.md`**.

| Capability | HTTP | Notes |
|------------|------|--------|
| Paginated audit (UI / API, newest first) | `GET /v1/audit` | Cap **500** rows per request. **Hot** tier (see retention doc). |
| Filtered audit search | `GET /v1/audit/search` | Cap **500**; keyset and filters. **Hot** tier. |
| Bulk export (compliance / archival) | `GET /v1/audit/export` | **`Accept: application/json`** or **`Accept: text/csv`**; UTC range **`fromUtc` / `toUtc`** (half-open); max **90 days** per request; **`maxRows`** clamped **1–10 000**; CSV sets **`Content-Disposition: attachment`**. **Warm** tier extraction to blob is **operator-scheduled** (see **`docs/AUDIT_RETENTION_POLICY.md`**). |
| CSV export (usability / offline analysis) | `GET /v1/audit/export/csv` | Always responds `text/csv` with `Content-Disposition: attachment`; same optional filter params as `GET /v1/audit/search` (`eventType`, `fromUtc`, `toUtc`, `correlationId`, `actorUserId`, `runId`) plus `maxRows` clamped **1-10 000** (default 10 000); no mandatory date range; requires `RequireAuditor` role. |

---

## Operations → durable audit (`IAuditService` → `dbo.AuditEvents`)

| Operation | Controller / service | Event type constant | Scope fields (RunId / ManifestId / ArtifactId) | DataJson (representative) |
|-----------|----------------------|---------------------|--------------------------------------------------|---------------------------|
| Authority pipeline manifest persisted | `AuthorityPipelineStagesExecutor` | `AuditEventTypes.ManifestGenerated` | RunId, ManifestId | `{ manifestHash, ruleSetId }` |
| Authority pipeline artifacts synthesized | `AuthorityPipelineStagesExecutor` | `AuditEventTypes.ArtifactsGenerated` | RunId, ManifestId | `{ bundleId, artifactCount }` |
| Authority run started (sync path, queued deferral, or queue resume) | `AuthorityRunOrchestrator` | `AuditEventTypes.RunStarted` | RunId | `{ projectId, queued, resumedFromQueue? }` |
| Authority run completed | `AuthorityRunOrchestrator` | `AuditEventTypes.RunCompleted` | RunId, ManifestId | `{ goldenManifestId, artifactBundleId, decisionTraceId }` |
| Authority replay executed | `AuthorityReplayController` | `AuditEventTypes.ReplayExecuted` | RunId | `{ mode, rebuilt manifest id? }` |
| Architecture run pin / unpin | `RunsController` (`PATCH /v1/architecture/run/{runId}/pin`) | `AuditEventTypes.RunPinStateChanged` | RunId | `{ isPinned }` |
| Architecture request soft-delete (DELETE alias of archive) | `RunsController` (`DELETE /v1/architecture/request/{requestId}`) | `ArchitectureRequestDeleted` | Tenant/Workspace/Project from ambient scope | `{ requestId }` |
| Architecture request restore (un-archive) | `RunsController` (`POST /v1/architecture/request/{requestId}/restore`) | `ArchitectureRequestRestored` | Tenant/Workspace/Project from ambient scope | `{ requestId }` |
| Architecture request draft (LLM field suggest, no persistence) | `RunsController` (`POST /v1/architecture/request/draft`); `ArchitectureRequestDraftService` | — | — | Read-auth + execute-auth gated LLM assist; returns suggested wizard chips only — **no** durable audit row (same class as `POST /v1/architecture/request/{requestId}/clone`) |
| Finding-scoped Ask (conversation persist only) | `ArchitectureFindingAskController` (`POST /v1/architecture/finding/{findingId}/ask`); `IAskService.AskAboutFindingAsync` | — | — | Persists `ConversationThread` / messages via `IConversationService`; **no** durable `IAuditService` row (authority-domain state unchanged; `[MutatingAuditExcluded]` on controller) |
| Per-finding thumbs feedback (operator instrumentation) | `RunsController` (`POST /v1/architecture/finding/{findingId}/feedback`); legacy alias `FindingFeedbackController` (`POST /v1/explain/runs/{runId}/findings/{findingId}/feedback`) | — | RunId from request/route | Append-only `dbo.FindingFeedback` row (`{ runId, findingId, score }`); optional comment on architecture route — **no** durable `IAuditService` row (value-report / pilot metrics only; allowlisted in `controller_action_audit_allowlist.txt`) |
| Grounded Ask SSE stream (conversation persist only) | `AskController` (`POST /v1/ask/stream`); `IAskService.AskStreamAsync` | — | — | Same persistence semantics as `POST /v1/ask` (conversation thread/messages via `IConversationService`); streams `text/event-stream` token/`done` events — **no** durable `IAuditService` row |
| Advisory scan lifecycle | `AdvisoryScanRunner` | `AdvisoryScanScheduled`, `AdvisoryScanExecuted`, `ArchitectureDigestGenerated`, … | varies by path | scan / digest payloads (JSON) |
| Advisory scheduling API | `AdvisorySchedulingController` | `AdvisoryScanScheduled` (and related) | per request | schedule metadata |
| Advisory API mutations | `AdvisoryController` | digest / scan event types; `RecommendationGenerated` + accept/reject/defer/implement | per action | per action |
| Digest delivery | `DigestDeliveryDispatcher` | `DigestDeliverySucceeded`, `DigestDeliveryFailed` | — | delivery metadata |
| Digest subscriptions API | `DigestSubscriptionsController` | `DigestSubscriptionCreated`, `DigestSubscriptionToggled` | — | subscription fields |
| Alert lifecycle | `AlertService` | `AlertTriggered`, `AlertAcknowledged`, `AlertResolved`, `AlertSuppressed` | — | alert ids / comments |
| Alert archive API | `AlertsController` (`PATCH /v1/alerts/{alertId}/archive`) | `AlertArchived` | RunId when present on alert | `{ alertId }` |
| Alert delivery | `AlertDeliveryDispatcher` | `AlertDeliverySucceeded`, `AlertDeliveryFailed` | — | routing metadata |
| Composite alerts | `CompositeAlertService` | `CompositeAlertTriggered`, `AlertSuppressedByPolicy` | — | rule / policy metadata |
| Alert rules API | `AlertRulesController` | `AlertRuleCreated` | — | rule summary |
| Composite rules API | `CompositeAlertRulesController` | `CompositeAlertRuleCreated` | — | rule summary |
| Alert routing API | `AlertRoutingSubscriptionsController` | `AlertRoutingSubscriptionCreated`, `AlertRoutingSubscriptionToggled` | — | channel metadata |
| Alert simulation API | `AlertSimulationController` | `AlertRuleSimulationExecuted`, `AlertRuleCandidateComparisonExecuted` | — | simulation parameters |
| Alert tuning API | `AlertTuningController` | `AlertThresholdRecommendationExecuted` | — | tuning context |
| Policy packs (host) | `PolicyPacksAppService` (`DELETE /v1/policy-packs/{policyPackId}`; `POST /v1/policy-packs/{policyPackId}/duplicate`) | `PolicyPackCreated`, `PolicyPackVersionPublished`, `PolicyPackAssigned`, `PolicyPackAssignmentCreated`, `PolicyPackAssignmentArchived`, `PolicyPackDuplicated` | — | pack / version ids; duplicate: `{ sourcePolicyPackId, duplicate.PolicyPackId }` |
| Policy pack content structural validation (no persistence) | `PolicyPacksController` (`POST /v1/policy-packs/validate`) | — | — | FluentValidation-only; **no** durable audit row (same class of read-path validation as dry-run probes that do not mutate tenant state) |
| Policy pack bulk dry-run (many runs, no persistence) | `PolicyPacksController` (`POST /v1/policy-packs/{policyPackId}/simulate-bulk`) | — | — | Read-auth gated what-if per run id; **no** durable audit row (same class as single-run dry-run probes) |
| Policy pack catalog hub (platform snapshots) | `PolicyPacksController` (`POST /v1/policy-packs/catalog/promote`, `POST /v1/policy-packs/catalog/demote`) | `PolicyPackCatalogPromoted`, `PolicyPackCatalogDemoted` | Tenant/Workspace/Project from ambient scope | promote: `policyPackCatalogEntryId`, `sourcePolicyPackId`, `snapshotVersion`; demote: `policyPackCatalogEntryId` |
| Governance resolution API | `GovernanceResolutionController` | `GovernanceResolutionExecuted`, `GovernanceConflictDetected` | — | resolution payload summary |
| Governance workflow (approval / promote / activate) | `GovernanceWorkflowService` | `GovernanceApprovalSubmitted`, `GovernanceApprovalApproved`, `GovernanceApprovalRejected`, `GovernanceSelfApprovalBlocked` (segregation-of-duties block), `GovernanceManifestPromoted`, `GovernanceEnvironmentActivated` | RunId when parseable | ids, environments, manifest version (JSON); self-approval block includes `approvalRequestId`, `requestedBy`, `requestedByActorKey`, `attemptedReviewerBy`, `attemptedReviewerActorKey` |
| Governance approval SLA breach | `ApprovalSlaMonitor` | `GovernanceApprovalSlaBreached` | — | `approvalRequestId`, `runId`, `requestedBy`, `slaDeadlineUtc`, `breachedByMinutes` |
| Governance policy-pack rule draft (LLM assist, no persistence) | `GovernanceController` (`POST /v1/governance/policy-pack/draft`); `PolicyPackDraftService` | — | — | Execute-auth gated LLM assist; returns suggested rule only — **no** durable audit row |
| Governance policy-pack dry-run (what-if) | `PolicyPackDryRunService` (`POST /v1/governance/policy-packs/{id}/dry-run`); `GovernanceController` (`POST /v1/governance/simulate`) | `GovernanceDryRunRequested` | Tenant/Workspace/Project from ambient scope | `{ policyPackId, proposedThresholdsRedacted (string — proposedThresholds JSON after `LlmPromptRedaction`), evaluatedRunIds[], deltaCounts: { evaluated, wouldBlock, wouldAllow, runMissing } }` — payload **must** flow through the redaction pipeline (PENDING_QUESTIONS Q37); read-auth gated, no real commit. |
| Pre-commit synthetic simulation (what-if) | `GovernancePreCommitSimulationController` (`POST /v1/governance/pre-commit/simulate`) | `GovernancePreCommitSimulationEvaluated` | RunId when parseable | `runId`, synthetic parameters, gate outcome summary (`blocked`, `warnOnly`, counts, sample blocking finding ids — no manifest commit) |
| Outbound webhook URL probe (no persistence) | `OutboundWebhookDryRunController` (`POST /v1/webhooks/dry-run`); `BillingCheckoutController` (`POST /v1/tenant/billing/marketplace/webhook-test`) | `OutboundWebhookDryRunProbeExecuted` | — | Target authority/path and scheme only (no query string), `hasSharedSecret` flag, transport/status — **no** shared secret or response body in payload |
| Synthetic `AuthorityRunCompleted` webhook simulation (no persistence) | `WebhookSimulationController` (`POST /v1/integrations/webhooks/simulate`) | `WebhookAuthorityRunCompletedSimulationExecuted` | — | Target authority/path and scheme only (no query string), `hasSharedSecret` flag, transport/status — **no** shared secret or response body in payload |
| Alert-routing webhook subscription connectivity test | `WebhooksController` (`POST /v1/webhooks/subscriptions/{subscriptionId}/test`); legacy alias `WebhookConnectionsController` (`POST /v1/integrations/webhooks/{routingSubscriptionId}/test`) | `AlertRoutingWebhookPingExecuted` | — | Subscription id, transport outcome, HTTP status code — **no** destination URL or response body in payload |
| Pre-commit governance warn | `ArchitectureRunCommitOrchestrator` | `GovernancePreCommitWarned` | RunId when parseable | `reason`, `warnings`, `blockingFindingIds`, `policyPackId`, `minimumBlockingSeverity` |
| Recommendation learning rebuild | `RecommendationLearningController` | `RecommendationLearningProfileRebuilt` | — | profile id |
| Product learning pilot signal captured | `ProductLearningController` (`POST /v1/product-learning/signals`) | `ProductLearningPilotSignalRecorded` | Tenant/Workspace/Project from ambient scope | `{ subjectType, disposition, patternKey? }` — `ArtifactHint`, `CommentShort`, and `DetailJson` are **not** included to avoid logging free-form user text |
| 59R planning drafts materialized (ranked pilot feedback) | `LearningController` (`POST /v1/learning/planning/materialize`) | `ProductLearningPlanningMaterialized` | Tenant/Workspace/Project from ambient scope | `{ sinceUtc, maxPlansToMaterialize, themesInserted, plansInserted, skippedExistingThemeKeys, signalLinksInserted }` — mirrors JSON response counters |
| Artifact / bundle / run / Terraform advisory export download | `ArtifactExportController` | `ArtifactDownloaded`, `BundleDownloaded`, `RunExported`, `TerraformAdvisoryExportDownloaded` | RunId (+ artifact when applicable) | format, byte counts, etc. |
| Run export ZIP push to customer Azure Blob (SAS) | `RunExportBlobPushService` (queued from `ArtifactExportController`) | `RunExportBlobPushSucceeded`, `RunExportBlobPushFailed` | RunId | `statusCode`, `bytes` on HTTP outcome; `{ error }` on thrown exception |
| Architecture analysis report (primary JSON build) | `AnalysisReportsController` | `ArchitectureAnalysisReportGenerated` | RunId when parseable | section flags, `manifestVersion`, `warningCount` |
| Bulk findings CSV export | `RunQueryController` (`GET …/architecture/run/{runId}/findings/export/csv`) | `FindingsListAccessed` | RunId when route id parses as GUID | `{ format: csv, findingCount }` |
| Architecture DOCX exports (package download; consulting analysis metadata row; async DOCX jobs) | `DocxExportController`; `RunExportAuditService` (sync consulting path; not export-replay persist); `BackgroundJobWorkUnitExecutor` | `ArchitectureDocxExportGenerated` | RunId, ManifestId when known | `runId`, `compareWithRunId` / `exportRecordId` / `exportChannel`, `byteCount` |
| Architecture request file import (TOML/JSON draft) | `ImportRequestFileService` (`POST …/architecture/request/import`, `ImportRequestFileController`) | `RequestFileImported` | Tenant/Workspace/Project from ambient scope | `importId`, `requestId`, `format`, `sourceFileName` (JSON payload); correlation id when HTTP trace present |
| Azure extractor ZIP ingest | `AzureExtractorIngestService` (`POST …/azure-extractor/upload`, `AzureExtractorUploadController`) | `AzureExtractorPackageUploaded`, `AzureExtractorPackageParseFailed`, `AzureExtractorPackageSchemaRejected`, `AzureExtractorPackageIngestSucceeded` | Tenant/Workspace/Project; optional `RunId` on success event | `originalFileName`, `sizeBytes` on upload; `reason` on failures; `packageId` plus citation summary on success |
| Azure extractor ZIP download | `AzureExtractorUploadController` (`GET …/azure-extractor/packages/{packageId}`) | `AzureExtractorPackageDownloaded` | Tenant/Workspace/Project; optional `RunId` | `packageId`, `runId`, `originalFileName`, `sizeBytes` |
| Chunked Azure extractor ingest session started | `AzureExtractorUploadController` (`POST …/azure-extractor/upload-sessions`; `AzureExtractorChunkedUploadService`) | `AzureExtractorPackageChunkSessionStarted` | Tenant/Workspace/Project | `sessionId`, `fileName`, `totalChunks`, `totalBytes`, `maxChunkBytes` |
| Tier 2 hosted Azure extractor configured (customer SP + subscription scope via WIF) | `HostedAzureExtractorAdminController` (`POST /v1/admin/azure-extractor/hosted/configure`); `Tier2ConnectionController` (`POST /v1/azure-extractor/connections`) | `IntegrationHostedAzureExtractorConfigured` | Tenant/Workspace/Project from ambient scope | `{ subscriptionId, customerTenantId, customerAppId, includeCost }` — **no** customer secrets stored |
| Tier 2 hosted Azure extractor collection run | `HostedAzureExtractorRunController` (`POST /v1/admin/azure-extractor/hosted/run`); `AzureExtractorIngestService` | `AzureExtractorPackageUploaded`, `AzureExtractorPackageParseFailed`, `AzureExtractorPackageSchemaRejected`, `AzureExtractorPackageIngestSucceeded` | Tenant/Workspace/Project; optional `RunId` on success event | Hosted collect → same ingest audit pipeline as ZIP upload (`[MutatingAuditExcluded]` on controller) |
| Internal cross-tenant analytics rollup refresh (operator) | `InternalCrossTenantAnalyticsController` (`POST /v1/internal/analytics/cross-tenant/daily/refresh`) | `InternalCrossTenantRollupRefreshed` | Operator RBAC; non-tenant aggregate surface | `{ rollupDate }` (UTC calendar day string) |
| Tenant value report DOCX (sync or async completion) | `ValueReportController` | `ValueReportGenerated` | Tenant/Workspace/Project from ambient scope | `tenantId`, `from`, `to`, `byteCount`, `asyncJob` (JSON); async jobs also include `jobId` |
| Replay export persisted as new row | `ExportsController` (replay POST + metadata POST when `RecordReplayExport`) | `ReplayExportRecorded` | RunId when parseable | `sourceExportRecordId`, `recordedReplayExportRecordId`, `runId` |
| Comparison summary persisted (export diff) | `ExportsController` (`POST .../run/exports/compare/summary`, `persist: true`) | `ComparisonSummaryPersisted` | RunId when parseable | `comparisonId`, `sourceExportRecordId`, `leftExportRecordId`, `rightExportRecordId` |
| End-to-end comparison persisted | `ComparisonAuditService` (`RunComparisonController` `POST .../run/compare/end-to-end/summary`, `persist: true`) | `EndToEndComparisonPersisted` | RunId when left/right parseable | `comparisonRecordId`, `leftRunId`, `rightRunId`, `comparisonType` |
| Comparison replay persisted (new immutable row) | `ComparisonAuditService` (`ComparisonReplayService` when `PersistReplay`) | `ComparisonReplayPersisted` | RunId when left/right parseable | `comparisonRecordId`, `sourceComparisonRecordId`, `leftRunId`, `rightRunId`, `comparisonType` |
| Golden manifest superseded (finalize orphan Active cleanup) | `ManifestFinalizationService` (after successful finalize SQL includes transition in outer txn; legacy path runs supersede after `dbo.Runs` commit) | `ManifestSuperseded` | RunId + superseded `ManifestId` on each row | `{ supersedingManifestId, runId, reason }` — emitted once per superseded manifest (`reason`: `unreferenced_after_finalize`) |
| Data archival host failure | `DataArchivalHostIteration` | `DataArchivalHostLoopFailed` | — | exception summary |
| OpenAI circuit breaker | `CircuitBreakerAuditBridge` (wired from `CircuitBreakerGate`) | `CircuitBreakerStateTransition`, `CircuitBreakerRejection`, `CircuitBreakerProbeOutcome` | Tenant/Workspace/Project from ambient scope | `{ gate, fromState, toState, probeOutcome? }` |
| Azure AI Content Safety circuit degraded (local deny-list fallback) | `CircuitBreakingContentSafetyGuard` | `ContentSafetyCircuitDegradedFallback` | Empty GUID tenant/workspace/project; explicit system actor | `{ kind, denialCountsByCategory }` — emitted when the content-safety breaker allows via local redaction after the remote circuit is open/unhealthy; audit failures swallowed so the LLM path is not blocked. |
| Security assessment published (trust center / procurement) | `SecurityTrustPublicationController` | `SecurityAssessmentPublished` | Tenant/Workspace/Project from ambient scope | `{ assessmentCode, summaryReference, assessorDisplayName? }` |
| Agent result JSON failed schema validation (enforced parse) | `TopologyAgentHandler`, `ComplianceAgentHandler`, `CriticAgentHandler` → `AgentResultSchemaViolationAudit` | `AuditEventTypes.AgentResultSchemaViolation` | RunId / task context when parseable | schema errors, truncated JSON, agent type |
| Coordinator run created (baseline → durable) | `BaselineMutationAuditService` (triggered by `ArchitectureRunCreateOrchestrator` baseline `Architecture.RunCreated`) | `AuditEventTypes.Run.Created` | RunId | `{ requestId, systemName }` |
| Coordinator run execution started (baseline → durable) | `BaselineMutationAuditService` (`ArchitectureRunExecuteOrchestrator` → `Architecture.RunStarted`) | `AuditEventTypes.Run.ExecuteStarted` | RunId | `{ runId }` |
| Coordinator run execution succeeded (baseline → durable) | `BaselineMutationAuditService` (`ArchitectureRunExecuteOrchestrator` → `Architecture.RunExecuteSucceeded`) | `AuditEventTypes.Run.ExecuteSucceeded` | RunId | `{ runId, resultCount }` |
| Coordinator run commit completed (baseline → durable) | `BaselineMutationAuditService` (`ArchitectureRunCommitOrchestrator` / `AuthorityDrivenArchitectureRunCommitOrchestrator` → `Architecture.RunCompleted`) | `AuditEventTypes.Run.CommitCompleted` | RunId | Coordinator path: `{ runId, manifestVersion, systemName }`; authority path adds `warningCount`, `commitPath` |
| Coordinator run failed (baseline → durable) | `BaselineMutationAuditService` (orchestrators → `Architecture.RunFailed`) via `BaselineMutationAuditArchitectureDurableWriter` | `AuditEventTypes.Run.Failed` | RunId when parseable | `{ runId, reason }` (after baseline `Architecture.RunFailed`) |
| Coordinator run quality gate rejected (baseline → durable) | `BaselineMutationAuditService` (`ArchitectureRunExecuteOrchestrator` → `Architecture.RunQualityGateRejected`) via `BaselineMutationAuditArchitectureDurableWriter` | `AuditEventTypes.Run.QualityGateRejected` | RunId when parseable | `{ runId, traceId, agentLabel }` (after baseline `Architecture.RunQualityGateRejected`; agent-output quality gate) |
| Coordinator run execute retry (`LegacyRunStatus` / contract status **Failed**) | `ArchitectureRunExecuteOrchestrator` | `AuditEventTypes.Run.RetryRequested` | RunId when `runId` parses as GUID | `{ runId, previousStatus: "Failed" }` — direct `IAuditService` before baseline `Architecture.RunStarted`; clarifies durable trail when operators re-invoke execute after a failed run |
| Agent trace blob persistence failed or timed out | `AgentExecutionTraceRecorder` | `AuditEventTypes.AgentTraceBlobPersistenceFailed` | RunId / task context when parseable | `{ traceId, runId, agentType, reason, failedBlobTypes? }` — emitted when inline blob writes after trace insert exhaust retries, time out, or throw unexpectedly; execute outcome elsewhere is unchanged. |
| Agent trace mandatory inline fallback failed or forensic verification failed | `AgentExecutionTraceRecorder` | `AuditEventTypes.AgentTraceInlineFallbackFailed` | RunId / task context when parseable | `{ traceId, runId, agentType, reason, exceptionDetail? }` — SQL inline patch threw, trace row missing on read, or blob+inline still missing non-empty prompt/response after patch; **`dbo.AgentExecutionTraces.InlineFallbackFailed`** set; execute outcome elsewhere is unchanged. |
| Orphan comparison-record remediation (execute) | `AdminDiagnosticsService` | `ComparisonRecordOrphansRemediated` | — | `{ dryRun: false, deletedCount, comparisonRecordIds[] }` — `POST .../admin/diagnostics/data-consistency/orphan-comparison-records?dryRun=false`; dry-run calls emit no audit row. |
| Orphan golden-manifest remediation (execute) | `AdminDiagnosticsService` | `GoldenManifestOrphansRemediated` | — | `{ dryRun: false, deletedCount, manifestIds[] }` — `POST .../orphan-golden-manifests?dryRun=false`; deletes `ArtifactBundles` first. |
| Orphan findings-snapshot remediation (execute) | `AdminDiagnosticsService` | `FindingsSnapshotOrphansRemediated` | — | `{ dryRun: false, deletedCount, findingsSnapshotIds[] }` — `POST .../orphan-findings-snapshots?dryRun=false`. |
| Integration outbox dead-letter retry (single) | `AdminDiagnosticsService` | `IntegrationOutboxDeadLetterRetried` | — | `{ outboxId, single: true }` — `POST .../admin/integration-outbox/dead-letters/{outboxId}/retry`. |
| Integration outbox dead-letter retry (bulk) | `AdminDiagnosticsService` | `IntegrationOutboxDeadLetterRetried` | — | `{ tenantId?, eventType?, retriedCount, outboxIds[] }` — `POST .../admin/integrations/outbox/retry-dead-letter` when `retriedCount > 0`. |
| Integration outbox dead-letter suppress | `AdminDiagnosticsService` | `IntegrationOutboxDeadLetterSuppressed` | — | `{ outboxId, comment? }` — `POST .../admin/integration-outbox/dead-letters/{outboxId}/suppress`. |
| Self-service trial bootstrap (demo seed path) | `TrialTenantBootstrapService` | `TrialProvisioned` | Tenant when parseable | trial window / demo metadata (after tenant + workspace provisioning) |
| Trial signup channel opened (`POST /v1/register`, trial local register) | `RegistrationController`, `TrialLocalIdentityAuthController` | `TrialSignupAttempted` | Empty GUID scope before tenant exists | `{ channel }` / local identity context |
| Public registration API failed (`POST /v1/register` — validation, duplicate org, or internal) | `RegistrationController` | `TrialRegistrationFailed` | Empty tenant scope (or after attempt) | `{ reason, code, message? }` — `reason` is `validation` / `conflict` / `internal` |
| Trial signup rejected (local identity, email policy, bootstrap; not `POST /v1/register` body path) | `TrialLocalIdentityAuthController`, `TrialTenantBootstrapService` | `TrialSignupFailed` | Tenant scope when known | `{ stage, reason, message? }` |
| Trial first golden manifest committed (signup → first-run funnel) | `SqlTrialFunnelCommitHook` | `TrialFirstRunCompleted` | Tenant + default workspace/project | `{ signupToCommitSeconds, trialRunUsageRatio }` |
| Trial upgrade nudge shown (operator shell) | `ClientErrorTelemetryController` (`POST /v1/diagnostics/trial-upgrade-nudge/shown`) | `TrialUpgradeNudgeShown` | Tenant + workspace/project from ambient scope | `{ trigger }` — `seats` / `expiry` / `usage` |
| Trial upgrade nudge CTA clicked | `ClientErrorTelemetryController` (`POST /v1/diagnostics/trial-upgrade-nudge/clicked`) | `TrialUpgradeNudgeClicked` | Tenant + workspace/project from ambient scope | `{ trigger }` |
| Team expansion nudge shown (paid Team operator shell) | `ClientErrorTelemetryController` (`POST /v1/diagnostics/team-expansion-nudge/shown`) | `TeamExpansionNudgeShown` | Tenant + workspace/project from ambient scope | `{ trigger }` — `seats` / `workspaces` |
| Team expansion nudge CTA clicked | `ClientErrorTelemetryController` (`POST /v1/diagnostics/team-expansion-nudge/clicked`) | `TeamExpansionNudgeClicked` | Tenant + workspace/project from ambient scope | `{ trigger }` |
| Synthetic operator demo-pack markers (dev/demo UI validation) | `SyntheticOperatorDemoPackWriter` (`SyntheticOperatorDemoPackController`) | `SyntheticOperatorDemoPack.Marker` | Tenant/Workspace/Project from ambient scope | `POST /v1/diagnostics/synthetic-operator-demo-pack` (Development host or `Demo:Enabled`, Admin policy); filter durable audit by this event type or `DataJson.syntheticDemoPack=true`. |
| Authority committed manifest FK chain (demo trusted-baseline seed) | `DemoSeedService` | `AuthorityCommittedChainPersisted` | RunId, ManifestId | `{ source: "demo-seed", projectSlug, richFindingsAndGraph, contextSnapshotId, graphSnapshotId, findingsSnapshotId, decisionTraceId, manifestId }` |
| Authority committed manifest FK chain (replay commit) | `ReplayRunService` | `AuthorityCommittedChainPersisted` | RunId, ManifestId | `{ source: "replay-commit", projectSlug, richFindingsAndGraph: true, … }` — emitted only after `CommitAsync` succeeds. |
| Billing checkout session (Noop / Stripe / Marketplace) | `BillingCheckoutController` | `BillingCheckoutInitiated`, `BillingCheckoutCompleted` | Tenant from ambient scope | `{ provider, tier, providerSessionId? }` |
| Customer notification channel preferences upsert | `CustomerNotificationChannelPreferencesController` (`PUT …/customer-channel-preferences`) | `TenantNotificationChannelPreferencesUpdated` | Tenant + default workspace/project from scope | `{ email, teams, outboundWebhook }` booleans |
| Tenant agent-output quality gate mode override | `SettingsController` (`PUT /v1/admin/settings/agent-output-quality-gate-mode`) | `TenantAgentOutputQualityGateModeUpdated` | Tenant + default workspace/project from scope | `{ effectiveMode }` (`WarnOnly` / `PilotStrict`) |
| Tenant agent-output quality gate mode override cleared | `SettingsController` (`DELETE /v1/admin/settings/agent-output-quality-gate-mode`) | `TenantAgentOutputQualityGateModeOverrideCleared` | Tenant + default workspace/project from scope | `{ effectiveMode }` after revert to host default |
| Host API key rotation material issued | `AdminApiKeySettingsController` (`POST /v1/admin/settings/api-keys/rotate`) | `AdminApiKeyRotationMaterialIssued` | Tenant + default workspace/project from scope | `{ slot, deploymentAction, configPath }` — **no** key material |
| Tenant architecture review board cover logo upload | `AdminController` (`POST /v1/admin/tenant/logo`) | `TenantReviewBoardCoverLogoUploaded` | Tenant + default workspace/project from scope | `{ logoByteLength }` — PNG/JPEG validated via `ArchitectureReviewBoardCoverLogoValidator`; image bytes are **not** stored in audit payload |
| Microsoft Teams incoming-webhook connection upsert | `TeamsIncomingWebhookConnectionsController` (`POST /v1/integrations/teams/connections`) | `TenantTeamsIncomingWebhookConnectionUpserted` | Tenant + default workspace/project from scope | Key Vault reference metadata (no secret material) |
| Microsoft Teams incoming-webhook connection remove | `TeamsIncomingWebhookConnectionsController` (`DELETE /v1/integrations/teams/connections`) | `TenantTeamsIncomingWebhookConnectionRemoved` | Tenant + default workspace/project from scope | connection id / scope fields |
| ITSM outbound issue/incident create (Jira / ServiceNow) | `ItsmOutboundIssuesController` (`POST /v1/integrations/itsm/outbound/issues`) | `IntegrationJiraIssueCreateSucceeded`, `IntegrationJiraIssueCreateFailed`, `IntegrationJiraIssueCreateSkipped`, `IntegrationServiceNowIncidentCreateSucceeded`, `IntegrationServiceNowIncidentCreateFailed`, `IntegrationServiceNowIncidentCreateSkipped` | RunId / finding id when parseable | finding id, provider label, external key / skip reason — **no** secrets, tokens, or full external URLs with query strings |
| Weekly executive digest preferences upsert | `TenantExecDigestPreferencesController` (`POST …/tenant/exec-digest-preferences`) | `ExecDigestPreferencesUpdated` | Tenant + default workspace/project from scope | digest cadence / channel booleans (JSON) |
| Core Pilot team checklist step upsert | `CorePilotTeamChecklistController` (`PUT …/tenant/core-pilot-checklist`) | `CorePilotTeamChecklistUpdated` | Tenant + default workspace/project from scope | `{ stepIndex, isCompleted }` JSON (indexes 0–3) |
| Entra directory bound to tenant (commercial `tid` after paid conversion) | `TenantTrialController` (`POST …/tenant/link-entra`) | `TenantEntraDirectoryBound` | Tenant from ambient scope | `{ entraTenantId }` |
| Trial local identity linked to Entra `oid` (optional; same request as directory bind when `LocalEmail` + `EntraOid` set) | `TenantTrialController` (`POST …/tenant/link-entra`) | `TrialLocalIdentityLinkedToEntra` | Tenant from ambient scope | `{ normalizedEmail }` |
| Trial converted (billing integration stub) | `TenantTrialController` (`POST …/convert`) | `TenantTrialConverted` | Tenant from ambient scope | `{ targetTier }` from request body when present |
| Trial lifecycle automation (expiry → read-only → export-only → purge) | `TrialLifecycleTransitionEngine` (Worker) | `TrialLifecycleTransition` | Tenant + default workspace when known | `{ fromStatus, toStatus, reason }` JSON |
| LLM tenant daily budget warn (fire-and-forget) | `LlmDailyTenantBudgetTracker` | `AuditEventTypes.LlmTenantDailyBudgetApproaching` | Tenant/Workspace/Project from ambient scope | `{ utcDay, usedTotal, warnAt, maxTotal }` — emitted at most **once per tenant per UTC day**; scheduled on the thread pool with exception swallowing so the LLM completion path is never blocked. |
| LLM tenant monthly dollar budget warn (fire-and-forget) | `LlmMonthlyTenantDollarBudgetTracker` | `AuditEventTypes.LlmTenantMonthlyDollarBudgetApproaching` | Tenant/Workspace/Project from ambient scope | `{ utcMonth, spentUsd, warnAtUsd, includedUsd, hardCutoffUsd }` — emitted at most **once per tenant per UTC month** when estimated spend crosses `IncludedUsdPerUtcMonth * WarnFraction`; same non-blocking audit scheduling as daily budget. |
| LLM prompt truncated (context length guard) | `ContextLengthGuardAgentCompletionClient` | `LlmContextTruncated` | Tenant/Workspace/Project from ambient scope | `{ estimatedTokens, thresholdTokens, maxContextTokens }` — fire-and-forget when estimated prompt tokens exceed the configured threshold before completion. |
| SCIM bearer token minted (Enterprise) | `ScimTokensAdminController` (`POST /v1/admin/scim/tokens`) | `ScimTokenIssued` | Tenant from ambient scope | `{ tokenId, publicLookupKey }` — plaintext token returned once in response body only. |
| SCIM bearer token revoked | `ScimTokensAdminController` (`DELETE /v1/admin/scim/tokens/{id}`) | `ScimTokenRevoked` | Tenant from ambient scope | `{ tokenId }` |
| SCIM user provisioned | `ScimUserService` (`POST /scim/v2/Users`) | `ScimUserProvisioned` | Tenant from `IScopeContextProvider` | SCIM user id / externalId summary (JSON) |
| SCIM user updated (replace / patch) | `ScimUserService` | `ScimUserUpdated` | Tenant from scope | user id + changed fields summary |
| SCIM user deactivated | `ScimUserService` (deprovision / `Active=false`) | `ScimUserDeactivated` | Tenant from scope | user id |
| SCIM group provisioned | `ScimGroupService` | `ScimGroupProvisioned` | Tenant from scope | group id / displayName |
| SCIM group membership changed | `ScimGroupService` (`members` replace / patch) | `ScimGroupMembershipChanged` | Tenant from scope | `{ groupId }` and membership delta summary |
| SCIM resolved role overridden by group mapping | `ScimUserService` (flat PATCH `manualResolvedRole` loses to group-derived role) | `RoleOverriddenByScim` | Tenant from scope | prior vs resolved role + **`ScimResolvedRoleOrigin`** (manual vs group) |
| SAML 2.0 SP session cookie issued (ITfoxtec assertion validated; minimal payload — name id prefix + tenant claim hint) | `ArchLucidSaml2SignInAudit` (`CookieSignedInContext` / SAML2 cookie scheme) | `Saml2ServiceProviderSignInSucceeded` | Tenant from `tenant_id` claim when parseable | `{ scheme, nameIdPrefix, hasTenantIdClaim, tenantIdClaim }` — **no** raw assertion XML |
| SAML 2.0 SP sign-in failed (`/Auth/*`, ITfoxtec protocol exception on global error path) | `ArchLucidSaml2SignInAudit.TryAppendProtocolFailureAudit` | `Saml2ServiceProviderSignInFailed` | Tenant scope when resolvable (often empty on fault path) | `{ scheme, exceptionType, path }` — best-effort; never masks underlying error |
| Admin SSO wizard identity provider metadata discovery (read-only) | `IdentityProviderConfigurationController` (`POST /v1/admin/identity/discover`) | — | — | Fetches IdP metadata for wizard UI only — **no** durable audit row (`[MutatingAuditExcluded]` on controller) |
| Admin SSO wizard sandbox test login (JWT preview) | `IdentityProviderConfigurationController` (`POST /v1/admin/identity/test-login`) | — | — | Sandbox JWT preview only; **no** tenant configuration persisted (`[MutatingAuditExcluded]` on controller) |
| Admin SSO wizard activated tenant identity provider configuration | `IdentityProviderConfigurationController` (`POST /v1/admin/identity/activate`) | `IdentitySsoConfigurationActivated` | Tenant/Workspace/Project from ambient scope | `{ protocol, issuerUri, keyVaultSecretName }` — **no** certificate or client secret material |
| Pilot `try --real` execute started (Development; real AOAI path) | `RunsController` (`POST .../execute`) when pilot real headers present | `FirstRealValueRunStarted` | RunId | pilot / real-mode context (JSON) |
| Pilot `try --real` execute completed without fallback | `RunsController` | `FirstRealValueRunCompleted` | RunId | completion summary (JSON) |
| Pilot `try --real` seed after AOAI fallback | `ArchitectureApplicationService` (`SeedFakeResultsAsync` with `PilotSeedFakeResultsOptions.MarkRealModeFellBackToSimulator`) | `FirstRealValueRunFellBackToSimulator` | RunId | marks run row + deployment snapshot; see [`docs/library/FIRST_REAL_VALUE.md`](FIRST_REAL_VALUE.md) |
| Legacy run header promoted post-execute (`dbo.Runs.LegacyRunStatus` → `ReadyForCommit` when Topology/Cost/Compliance/Critic each yielded one result — ADR-0012) | `ArchitectureRunExecuteOrchestrator.TryPromoteRunLegacyStatusIfAllResultsPresentAsync` | `RunLegacyReadyForCommitPromoted` | RunId | `{ runId, previousLegacyRunStatus, newLegacyRunStatus }` — direct `IAuditService` (distinct from coordinator `Run.*` durable echo baseline path; applies when promotion mutates SQL) |

---

## Baseline mutation logging only (`IBaselineMutationAuditService` — not `dbo.AuditEvents`)

| Operation | Orchestrator / service | Event type constant | Notes |
|-----------|------------------------|---------------------|-------|
| Architecture run create / fail | `ArchitectureRunCreateOrchestrator` | `AuditEventTypes.Baseline.Architecture.*` | Entity id in `RecordAsync` is run id or request id; details string only. **Durable echo:** `BaselineMutationAuditService` appends `AuditEventTypes.Run.*` rows (see durable table). |
| Architecture run execute / commit | `ArchitectureRunExecuteOrchestrator`, `ArchitectureRunCommitOrchestrator`, `AuthorityDrivenArchitectureRunCommitOrchestrator` | `AuditEventTypes.Baseline.Architecture.*` (`Architecture.RunStarted`, `Architecture.RunCompleted`, `Architecture.RunFailed`, …) | Same baseline channel. **Durable echo:** `Run.*` rows from `BaselineMutationAuditService` (see durable table). |
| Governance workflow | `GovernanceWorkflowService` | `AuditEventTypes.Baseline.Governance.*` (mirrors `GovernanceAuditEventTypes`) | **Dual-write:** same service also calls `IAuditService` with top-level Core governance event types via `DurableAuditLogRetry` (see durable table above). |

**Implication:** operators searching **Audit log** in the UI see `IAuditService` rows, including governance transitions from `GovernanceWorkflowService`. Baseline mutation logs remain for grep-friendly structured logging.

---

## Known gaps (mutating behavior without durable `IAuditService` event)

**Last reviewed:** 2026-05-25.

### Mutating / lifecycle — verified

**No core gaps.** (UI state endpoints `POST /v1/operator/saved-views` and `DELETE /v1/operator/saved-views/{viewId}` modify user presets without emitting system audit trails.) `ManifestSuperseded` durable emission shipped **2026-05-15**: after manifest finalization wires the committing run to the new golden manifest, `IGoldenManifestRepository.SupersedeUnreferencedActiveGoldenManifestsAsync` transitions **Active** rows in scope that are **not referenced** by any non-archived run (`dbo.Runs.GoldenManifestId`), and `ManifestFinalizationService` emits one **`IAuditService`** row per superseded manifest id (**repository mutation only** — audit semantics stay in the application service per matrix policy).

### Read-path / reserved observability (not an append-only weakness)

**None** (as of **2026-05-25**). `FindingsListAccessed` is emitted when operators call **`GET /v1/architecture/run/{runId}/findings/export/csv`** (see durable table; `DataJson` carries `format` and `findingCount`). The `POST /v1/architecture/request/{requestId}/clone` endpoint reads a request and returns a transient stripped template without persisting state. **`POST /v1/architecture/request/draft`** returns LLM-suggested wizard chips without persisting an architecture request. **`POST /v1/architecture/finding/{findingId}/ask`** and **`POST /v1/ask/stream`** persist conversation messages only (no `IAuditService` row). **`POST /v1/architecture/finding/{findingId}/feedback`** (and legacy **`POST /v1/explain/runs/{runId}/findings/{findingId}/feedback`**) append operator thumbs votes to `dbo.FindingFeedback` only (no `IAuditService` row). **`POST /v1/policy-packs/validate`** validates pack content JSON in-process only (no pack row, no audit row). **`POST /v1/policy-packs/{policyPackId}/simulate-bulk`** evaluates dry-run gates for up to 50 run ids without persisting pack or run state (no audit row). **`POST /v1/governance/policy-pack/draft`** returns LLM-suggested policy rules without persisting a policy pack (no audit row). **`POST /v1/admin/identity/discover`** fetches IdP metadata for the SSO wizard without persisting tenant configuration (no audit row). **`POST /v1/admin/identity/test-login`** returns a sandbox JWT preview only (no audit row).

**Open catalogued-only items: 0**

Neither weakens **DENY UPDATE/DELETE** on `dbo.AuditEvents` ([`051_AuditEvents_DenyUpdateDelete.sql`](../../ArchLucid.Persistence/Migrations/051_AuditEvents_DenyUpdateDelete.sql) / consolidated DDL).

**Layered enforcement shipped 2026-04-29**

| Layer | Mechanism |
|-------|-----------|
| Pairing (#2) | `ArchLucid.Application.Tests/Audit/BaselineMutationAuditDualWritePairingTests.cs` — every `RecordAsync(` usage in `ArchLucid.Application` must pair with durable `LogAsync`/`TryLogAsync` unless file allowlisted |
| Wiring echo CI (#3) | `scripts/ci/assert_layered_audit_wiring_echo.py` — asserts critical `AuditEventTypes.*` substrings survive refactors (`Request.*`, retry, finding-review façade, artifact synthesis, admin archival) |
| Controllers (#existing) | `scripts/ci/assert_controller_mutations_have_audit.py` unchanged |

| Surface previously flagged | Resolution | Verification |
|---------------------------|-----------|--------------|
| `FindingReviewApproved` / `FindingReviewRejected` / `FindingReviewOverridden` | `FindingReviewTrailAppendService` delegates `IFindingReviewTrailRepository.AppendAsync` and emits durable audits | Pairing passes for orchestrators touching `FindingReview`/trail only via façade when API lands |
| `ManifestArchived` cascades (`dbo.GoldenManifests.ArchivedUtc` via bulk run archival) | `AdminDiagnosticsService` logs `AuditEventTypes.ManifestArchived` after successful `ArchiveRuns*` calls | Wiring echo CI + orchestration review |
| `RequestCreated` / `RequestLocked` / `RequestReleased` | `ArchitectureRunCreateOrchestrator`, `AuthorityDrivenArchitectureRunCommitOrchestrator` + `IRunRepository.CountActiveRunsForArchitectureRequestAsync` | Wiring echo CI |
| Pipeline synthesis / findings sealing | `AuthorityPipelineStagesExecutor` | Wiring echo CI |
| Run retry durability | `ArchitectureRunExecuteOrchestrator` emits `AuditEventTypes.Run.RetryRequested` | Wiring echo CI + unit `ArchitectureRunExecuteOrchestratorRetryRequestedAuditTests` (`ArchLucid.Application.Tests`) |

**Future-drift signal.** Governance repository writes should continue to funnel through audited application services wherever possible; pairing + layering scripts are regression tripwires, not substitutes for semantic tests.

---

## Coverage statistics (manual; refresh when adding call sites)

| Metric | Approximate value |
|--------|-------------------|
| **Core `AuditEventTypes` `public const string` rows** | 155 (see CI marker above; includes nested `Baseline` and nested `Run`) |
| **`await *auditService.LogAsync` production call sites** | ~47 (excluding tests; includes bridge) |
| **`IBaselineMutationAuditService.RecordAsync` call sites** | Orchestrators + `GovernanceWorkflowService` (log-only) |
| **Known-gap catalogued-only items** | **0** — none open (see **Known gaps**) |

---

## Appendix — Core `AuditEventTypes` registry (one row per constant)

| Constant | Value | Durable audit producer(s) |
|----------|-------|---------------------------|
| `RunStarted` | `RunStarted` | `AuthorityRunOrchestrator` |
| `RunCompleted` | `RunCompleted` | `AuthorityRunOrchestrator` |
| `ManifestGenerated` | `ManifestGenerated` | `AuthorityPipelineStagesExecutor` |
| `ManifestFinalized` | `ManifestFinalized` | `ManifestFinalizationService` (`sp_FinalizeManifest` transactional path — see `MANIFEST_FINALIZATION_TRANSACTION.md`) |
| `RunSubmitted` | `RunSubmitted` | `RunsController` (`POST /v1/architecture/run/{runId}/execute`, `POST /v1/runs/{runId}/submit`) |
| `ManifestViewed` | `ManifestViewed` | `AuthorityQueryController` (`GET …/manifest` / `GET /v1/runs/{runId}/manifest`) |
| `ReviewTrailAccessed` | `ReviewTrailAccessed` | `AuthorityQueryController` (`GET …/pipeline-timeline`, `GET /v1/runs/{runId}/review-trail`) |
| `ProvenanceAccessed` | `ProvenanceAccessed` | `AuthorityQueryController` (`GET …/provenance`, `GET /v1/runs/{runId}/review-trail/provenance`) |
| `FindingsListAccessed` | `FindingsListAccessed` | `RunQueryController` (`GET …/architecture/run/{runId}/findings/export/csv`; `{ format, findingCount }` in `DataJson`) |
| `GovernanceApprovalRequested` | `GovernanceApprovalRequested` | `GovernanceController` (`POST /v1/governance/approval-requests`) |
| `GovernanceSlackInteractivityDispatched` | `GovernanceSlackInteractivityDispatched` | `SlackInteractivityController` (`POST …/integrations/webhooks/slack/interactivity`; signature-verified dispatch) |
| `ArtifactsGenerated` | `ArtifactsGenerated` | `AuthorityPipelineStagesExecutor` |
| `ArtifactSynthesisFailed` | `ArtifactSynthesisFailed` | `AuthorityPipelineStagesExecutor` (artifact stage `catch` before rethrow) |
| `ArtifactSynthesisPartial` | `ArtifactSynthesisPartial` | `AuthorityPipelineStagesExecutor` (partial bundle branch) |
| `RequestCreated` | `Request.Created` | `ArchitectureRunCreateOrchestrator` |
| `ArchitectureRunBatchAccepted` | `Architecture.RunBatchAccepted` | `RunsController` (`POST …/architecture/request/batch`, 202; per-item persist emits `RequestCreated`) |
| `RequestLocked` | `Request.Locked` | `ArchitectureRunCreateOrchestrator` |
| `RequestReleased` | `Request.Released` | `AuthorityDrivenArchitectureRunCommitOrchestrator` |
| `ManifestSuperseded` | `ManifestSuperseded` | `ManifestFinalizationService` (post-finalize orphan Active cleanup + durable audit per superseded `ManifestId`; SQL transition via `IGoldenManifestRepository.SupersedeUnreferencedActiveGoldenManifestsAsync`) |
| `ManifestArchived` | `ManifestArchived` | `AdminDiagnosticsService` (`ArchiveRuns*` / cascade — batch `ManifestArchived`) |
| `FindingsSnapshotSealed` | `FindingsSnapshotSealed` | `AuthorityPipelineStagesExecutor` |
| `FindingReviewApproved` | `FindingReviewApproved` | `FindingReviewTrailAppendService` |
| `FindingReviewRejected` | `FindingReviewRejected` | `FindingReviewTrailAppendService` |
| `FindingReviewOverridden` | `FindingReviewOverridden` | `FindingReviewTrailAppendService` |
| `FindingMuted` | `FindingMuted` | `FindingMuteController` (`POST /v1/findings/{findingId}/mute`) |
| `ReplayExecuted` | `ReplayExecuted` | `AuthorityReplayController` |
| `RunPinStateChanged` | `RunPinStateChanged` | `RunsController` (`PATCH /v1/architecture/run/{runId}/pin`) |
| `InternalArchitectureDeterminismCheckExecuted` | `InternalArchitectureDeterminismCheckExecuted` | `InternalArchitectureDiagnosticsController` (`POST …/internal/architecture/runs/{runId}/determinism-check`) |
| `InternalArchitectureFakeResultsSeeded` | `InternalArchitectureFakeResultsSeeded` | `InternalArchitectureDiagnosticsController` (`POST …/internal/architecture/runs/{runId}/seed-fake-results`) |
| `InternalCrossTenantRollupRefreshed` | `InternalCrossTenantRollupRefreshed` | `InternalCrossTenantAnalyticsController` (`POST /v1/internal/analytics/cross-tenant/daily/refresh`) |
| `AuthorityCommittedChainPersisted` | `AuthorityCommittedChainPersisted` | `DemoSeedService`, `ReplayRunService` |
| `ArtifactDownloaded` | `ArtifactDownloaded` | `ArtifactExportController` |
| `BundleDownloaded` | `BundleDownloaded` | `ArtifactExportController` |
| `SupportBundleDownloaded` | `SupportBundleDownloaded` | `SupportBundleController` (`POST /v1/admin/support-bundle`) |
| `SyntheticOperatorDemoPackMarker` | `SyntheticOperatorDemoPack.Marker` | `SyntheticOperatorDemoPackWriter` (`POST /v1/diagnostics/synthetic-operator-demo-pack`) |
| `SyntheticOperatorDemoPackInvoked` | `SyntheticOperatorDemoPack.Invoked` | `SyntheticOperatorDemoPackController` (`POST /v1/diagnostics/synthetic-operator-demo-pack`) |
| `RunExported` | `RunExported` | `ArtifactExportController` |
| `ExportDownloadSucceeded` | `Export.DownloadSucceeded` | `RunsExportController` (`GET /v1/runs/{runId}/export/{format}`), `RunQueryController` (`GET …/traceability-bundle.zip`, `GET /v1/runs/{runId}/review-trail/export`), `RunComparisonController` (`GET …/run/compare/end-to-end/export/file`, `GET …/run/compare/end-to-end/export/docx`) |
| `ExecutiveRoiBoardPackExported` | `ExecutiveRoiBoardPackExported` | `RoiController` (`GET /v1/roi/executive-summary/board-pack`) |
| `RunExportFailed` | `Export.Failed` | `ArtifactExportController` |
| `RunExportBlobPushQueued` | `RunExportBlobPushQueued` | `ArtifactExportController` (HTTP 202 accepts enqueue; background `RunExportBlobPushService` emits succeeded/failed) |
| `RunExportBlobPushSucceeded` | `RunExportBlobPushSucceeded` | `RunExportBlobPushService` (`ArtifactExportController` queues background PUT to customer SAS) |
| `RunExportBlobPushFailed` | `RunExportBlobPushFailed` | `RunExportBlobPushService` (non-success HTTP or exception; same enqueue path as succeeded) |
| `TerraformAdvisoryExportDownloaded` | `TerraformAdvisoryExportDownloaded` | `ArtifactExportController` |
| `ArchitectureAnalysisReportGenerated` | `ArchitectureAnalysisReportGenerated` | `AnalysisReportsController` |
| `ArchitectureDefinitionCsvImportDryRunExecuted` | `ArchitectureDefinitionCsvImportDryRunExecuted` | `ArchitectureDefinitionImportController` (`POST /v1/architecture/import` dry-run) |
| `ArchitectureQuickScanExecuted` | `ArchitectureQuickScanExecuted` | `ArchitectureQuickScanController` (`POST /v1/architecture/quick-scan`) |
| `ArchitectureDocxExportGenerated` | `ArchitectureDocxExportGenerated` | `DocxExportController`, `RunExportAuditService`, `BackgroundJobWorkUnitExecutor` |
| `ComparisonReplayPersisted` | `ComparisonReplayPersisted` | `ComparisonAuditService` |
| `EndToEndComparisonPersisted` | `EndToEndComparisonPersisted` | `ComparisonAuditService` |
| `RequestFileImported` | `RequestFileImported` | `ImportRequestFileService` (`ImportRequestFileController`) |
| `AzureExtractorPackageUploaded` | `AzureExtractorPackage.Uploaded` | `AzureExtractorIngestService` (`AzureExtractorUploadController`) |
| `AzureExtractorPackageParseFailed` | `AzureExtractorPackage.ParseFailed` | `AzureExtractorIngestService` (`AzureExtractorUploadController`) |
| `AzureExtractorPackageSchemaRejected` | `AzureExtractorPackage.SchemaRejected` | `AzureExtractorIngestService` (`AzureExtractorUploadController`) |
| `AzureExtractorPackageIngestSucceeded` | `AzureExtractorPackage.IngestSucceeded` | `AzureExtractorIngestService` (`AzureExtractorUploadController`) |
| `AzureExtractorPackageDownloaded` | `Export.AzureExtractorPackageDownloaded` | `AzureExtractorUploadController` (`GET …/azure-extractor/packages/{packageId}`) |
| `AzureExtractorPackageChunkSessionStarted` | `AzureExtractorPackage.ChunkSessionStarted` | `AzureExtractorUploadController` (`POST …/azure-extractor/upload-sessions`) |
| `ValueReportGenerated` | `ValueReportGenerated` | `ValueReportController`, `InMemoryValueReportJobQueue` |
| `ReplayExportRecorded` | `ReplayExportRecorded` | `ExportsController` |
| `ComparisonSummaryPersisted` | `ComparisonSummaryPersisted` | `ExportsController` |
| `GovernancePreCommitBlocked` | `GovernancePreCommitBlocked` | `ArchitectureRunCommitOrchestrator` (optional pre-commit gate) |
| `GovernanceBypassInvoked` | `GovernanceBypassInvoked` | `AuthorityDrivenArchitectureRunCommitOrchestrator` (pre-commit governance break-glass via commit justification) |
| `GovernancePreCommitWarned` | `GovernancePreCommitWarned` | `ArchitectureRunCommitOrchestrator` (warn-only severity in pre-commit gate) |
| `GovernancePreCommitSimulationEvaluated` | `GovernancePreCommitSimulationEvaluated` | `GovernancePreCommitSimulationController` (`POST /v1/governance/pre-commit/simulate`) |
| `GovernanceApprovalSlaBreached` | `GovernanceApprovalSlaBreached` | `ApprovalSlaMonitor` (pending approval request past SLA deadline) |
| `RecommendationGenerated` | `RecommendationGenerated` | `AdvisoryController` |
| `RecommendationAccepted` | `RecommendationAccepted` | `AdvisoryController` |
| `RecommendationRejected` | `RecommendationRejected` | `AdvisoryController` |
| `RecommendationDeferred` | `RecommendationDeferred` | `AdvisoryController` |
| `RecommendationImplemented` | `RecommendationImplemented` | `AdvisoryController` |
| `RecommendationLearningProfileRebuilt` | `RecommendationLearningProfileRebuilt` | `RecommendationLearningController` |
| `ProductLearningPilotSignalRecorded` | `ProductLearningPilotSignalRecorded` | `ProductLearningController` (`POST /v1/product-learning/signals`) |
| `ProductLearningPlanningMaterialized` | `ProductLearningPlanningMaterialized` | `LearningController` (`POST /v1/learning/planning/materialize`) |
| `AdvisoryScanScheduled` | `AdvisoryScanScheduled` | `AdvisoryScanRunner`, `AdvisorySchedulingController`, `AdvisoryController` |
| `AdvisoryScanExecuted` | `AdvisoryScanExecuted` | `AdvisoryScanRunner`, `AdvisoryController` |
| `ArchitectureDigestGenerated` | `ArchitectureDigestGenerated` | `AdvisoryScanRunner`, `AdvisoryController` |
| `DigestSubscriptionCreated` | `DigestSubscriptionCreated` | `DigestSubscriptionsController` |
| `DigestSubscriptionToggled` | `DigestSubscriptionToggled` | `DigestSubscriptionsController` |
| `DigestDeliverySucceeded` | `DigestDeliverySucceeded` | `DigestDeliveryDispatcher` |
| `DigestDeliveryFailed` | `DigestDeliveryFailed` | `DigestDeliveryDispatcher` |
| `AlertRuleCreated` | `AlertRuleCreated` | `AlertRulesController` |
| `AlertTriggered` | `AlertTriggered` | `AlertService` |
| `AlertAcknowledged` | `AlertAcknowledged` | `AlertService` |
| `AlertResolved` | `AlertResolved` | `AlertService` |
| `AlertSuppressed` | `AlertSuppressed` | `AlertService` |
| `AlertArchived` | `AlertArchived` | `AlertsController` (`PATCH /v1/alerts/{alertId}/archive`) |
| `AlertRoutingSubscriptionCreated` | `AlertRoutingSubscriptionCreated` | `AlertRoutingSubscriptionsController` |
| `AlertRoutingSubscriptionToggled` | `AlertRoutingSubscriptionToggled` | `AlertRoutingSubscriptionsController` |
| `AlertRoutingWebhookPingExecuted` | `AlertRoutingWebhookPingExecuted` | `WebhooksController` (`POST /v1/webhooks/subscriptions/{subscriptionId}/test`); legacy `WebhookConnectionsController` (`POST /v1/integrations/webhooks/{routingSubscriptionId}/test`) |
| `AlertDeliverySucceeded` | `AlertDeliverySucceeded` | `AlertDeliveryDispatcher` |
| `AlertDeliveryFailed` | `AlertDeliveryFailed` | `AlertDeliveryDispatcher` |
| `CompositeAlertRuleCreated` | `CompositeAlertRuleCreated` | `CompositeAlertRulesController` |
| `CompositeAlertTriggered` | `CompositeAlertTriggered` | `CompositeAlertService` |
| `AlertSuppressedByPolicy` | `AlertSuppressedByPolicy` | `CompositeAlertService` |
| `AlertRuleSimulationExecuted` | `AlertRuleSimulationExecuted` | `AlertSimulationController` |
| `AlertRuleCandidateComparisonExecuted` | `AlertRuleCandidateComparisonExecuted` | `AlertSimulationController` |
| `AlertThresholdRecommendationExecuted` | `AlertThresholdRecommendationExecuted` | `AlertTuningController` |
| `OutboundWebhookDryRunProbeExecuted` | `OutboundWebhookDryRunProbeExecuted` | `OutboundWebhookDryRunController` (`POST /v1/webhooks/dry-run`) |
| `WebhookAuthorityRunCompletedSimulationExecuted` | `WebhookAuthorityRunCompletedSimulationExecuted` | `WebhookSimulationController` (`POST /v1/integrations/webhooks/simulate`) |
| `EvidenceBulkAttached` | `EvidenceBulkAttached` | `EvidenceBulkUploadController` (`POST /v1/architecture/run/{runId}/evidence/bulk`) |
| `EvidenceProposalPromoted` | `EvidenceProposalPromoted` | `EvidenceProposalsController` (`POST /v1/admin/evidence/proposals/{resultId}/promote`) |
| `PolicyPackCreated` | `PolicyPackCreated` | `PolicyPacksAppService` |
| `PolicyPackVersionPublished` | `PolicyPackVersionPublished` | `PolicyPacksAppService` |
| `PolicyPackAssigned` | `PolicyPackAssigned` | `PolicyPacksAppService` |
| `PolicyPackAssignmentCreated` | `PolicyPackAssignmentCreated` | `PolicyPacksAppService` |
| `PolicyPackAssignmentArchived` | `PolicyPackAssignmentArchived` | `PolicyPacksAppService` |
| `PolicyPackDuplicated` | `PolicyPackDuplicated` | `PolicyPacksAppService` (`POST /v1/policy-packs/{policyPackId}/duplicate`) |
| `PolicyPackCatalogPromoted` | `PolicyPackCatalogPromoted` | `PolicyPacksController` (`POST /v1/policy-packs/catalog/promote`) |
| `PolicyPackCatalogDemoted` | `PolicyPackCatalogDemoted` | `PolicyPacksController` (`POST /v1/policy-packs/catalog/demote`) |
| `GovernanceResolutionExecuted` | `GovernanceResolutionExecuted` | `GovernanceResolutionController` |
| `GovernanceConflictDetected` | `GovernanceConflictDetected` | `GovernanceResolutionController` |
| `GovernanceApprovalSubmitted` | `GovernanceApprovalSubmitted` | `GovernanceWorkflowService` |
| `GovernanceApprovalApproved` | `GovernanceApprovalApproved` | `GovernanceWorkflowService` |
| `PilotScorecardBaselinesUpdated` | `PilotScorecardBaselinesUpdated` | `PilotInProductScorecardService` (`PUT /v1/pilots/scorecard/baselines`) |
| `PilotCloseoutRecorded` | `PilotCloseoutRecorded` | `PilotsController` (`POST /v1/pilots/closeout`) |
| `CorePilotTeamChecklistUpdated` | `CorePilotTeamChecklistUpdated` | `CorePilotTeamChecklistController` (`PUT …/tenant/core-pilot-checklist`) |
| `GovernanceApprovalRejected` | `GovernanceApprovalRejected` | `GovernanceWorkflowService` |
| `GovernanceSelfApprovalBlocked` | `GovernanceSelfApprovalBlocked` | `GovernanceWorkflowService` |
| `GovernanceManifestPromoted` | `GovernanceManifestPromoted` | `GovernanceWorkflowService` |
| `GovernanceEnvironmentActivated` | `GovernanceEnvironmentActivated` | `GovernanceWorkflowService` |
| `GovernanceDryRunRequested` | `GovernanceDryRunRequested` | `PolicyPackDryRunService` (POST `/v1/governance/policy-packs/{id}/dry-run`; redaction-pipeline mandatory per Q37) |
| `GovernanceDryRunValidationAttempted` | `GovernanceDryRunValidationAttempted` | `GovernanceWorkflowService` (approval / promotion path with `dryRun=true`; validates write path without committing row/outbox/integration publish) |
| `DataArchivalHostLoopFailed` | `DataArchivalHostLoopFailed` | `DataArchivalHostIteration` |
| `CircuitBreakerStateTransition` | `CircuitBreakerStateTransition` | `CircuitBreakerAuditBridge` |
| `CircuitBreakerRejection` | `CircuitBreakerRejection` | `CircuitBreakerAuditBridge` |
| `CircuitBreakerProbeOutcome` | `CircuitBreakerProbeOutcome` | `CircuitBreakerAuditBridge` |
| `ContentSafetyCircuitDegradedFallback` | `ContentSafetyCircuitDegradedFallback` | `CircuitBreakingContentSafetyGuard` (degraded allow path; local deny-list after Azure Content Safety circuit unhealthy) |
| `SecurityAssessmentPublished` | `SecurityAssessmentPublished` | `SecurityTrustPublicationController` |
| `TenantProvisioned` | `TenantProvisioned` | `TenantProvisioningService` |
| `TenantSelfRegistered` | `TenantSelfRegistered` | `RegistrationController` |
| `TenantDataDeleted` | `TenantDataDeleted` | `TenantDeletionService` → `IPlatformAuditRepository` (`dbo.PlatformAuditEvents`; offboarding background job) |
| `TenantErasureOffboarded` | `TenantErasureOffboarded` | `TenantErasureCommandService` → `IPlatformAuditRepository` (`dbo.PlatformAuditEvents`; `AdminTenantsController` `POST …/admin/tenants/{id}/delete`) |
| `TenantErasureApproved` | `TenantErasureApproved` | `TenantErasureCommandService` → `IPlatformAuditRepository` (`dbo.PlatformAuditEvents`; `TenantErasureLegalHoldController` `POST …/tenant/erasure/approve`) |
| `TenantErasureQuarantineRestored` | `TenantErasureQuarantineRestored` | `TenantErasureCommandService` → `IPlatformAuditRepository` (`dbo.PlatformAuditEvents`; `AdminTenantsController` `POST …/admin/tenants/{id}/erasure/restore`) |
| `TenantErasureLegalHoldSet` | `TenantErasureLegalHoldSet` | `TenantErasureCommandService` → `IPlatformAuditRepository` (`dbo.PlatformAuditEvents`; `AdminTenantsController` `POST …/admin/tenants/{id}/erasure/legal-hold`; `TenantErasureLegalHoldController` `POST …/tenant/erasure/legal-hold`) |
| `TenantErasureLegalHoldCleared` | `TenantErasureLegalHoldCleared` | `TenantErasureCommandService` → `IPlatformAuditRepository` (`dbo.PlatformAuditEvents`; `AdminTenantsController` `DELETE …/admin/tenants/{id}/erasure/legal-hold`) |
| `ArchitectureProjectSoftDeleted` | `ArchitectureProjectSoftDeleted` | `TenantWorkspacesController` (`DELETE /v1/tenant/workspaces/{workspaceId}/projects/{projectId}`) |
| `ArchitectureProjectRestored` | `ArchitectureProjectRestored` | `TenantWorkspacesController` (`POST /v1/tenant/workspaces/{workspaceId}/projects/{projectId}/restore`) |
| `ArchitectureProjectHardPurgedRetention` | `ArchitectureProjectHardPurgedRetention` | `ArchitectureProjectRetentionPurgeBackgroundWork` (`ArchitectureProjectRetentionPurgeHostedService`; API retention purge worker) |
| `SampleRunsPurged` | `SampleRunsPurged` | `SampleRunPurgeService` → `IPlatformAuditRepository` (`dbo.PlatformAuditEvents`; `AuthorityDrivenArchitectureRunCommitOrchestrator` first real commit; `SampleRunTtlHostedService` / `SampleRunTtlPurgeWorker` TTL) |
| `TrialProvisioned` | `TrialProvisioned` | `TrialTenantBootstrapService` |
| `TrialSignupAttempted` | `TrialSignupAttempted` | `RegistrationController`, `TrialLocalIdentityAuthController` |
| `TrialRegistrationFailed` | `TrialRegistrationFailed` | `RegistrationController` (failed `POST /v1/register` responses) |
| `TrialBaselineReviewCycleCaptured` | `TrialBaselineReviewCycleCaptured` | `RegistrationController` (only when prospect supplied a baseline) |
| `TrialBaselineReviewCycleUpdated` | `TrialBaselineReviewCycleUpdated` | `TenantBaselineController` (operator updated review-cycle baseline hours after an earlier capture) |
| `TrialBaselineManualPrepCaptured` | `TrialBaselineManualPrepCaptured` | `TenantBaselineController` (first save of `BaselineManualPrep*` on `dbo.Tenants`) |
| `TrialBaselineManualPrepUpdated` | `TrialBaselineManualPrepUpdated` | `TenantBaselineController` (subsequent edits after first capture) |
| `TenantCostSettingsUpdated` | `TenantCostSettingsUpdated` | `TenantCostSettingsController` (`PUT /v1/tenant/cost-settings`; per-tenant ROI cost assumptions on `dbo.TenantCostSettings`) |
| `TrialSignupFailed` | `TrialSignupFailed` | `TrialLocalIdentityAuthController`, `TrialTenantBootstrapService` |
| `TrialFirstRunCompleted` | `TrialFirstRunCompleted` | `SqlTrialFunnelCommitHook` |
| `BillingCheckoutInitiated` | `BillingCheckoutInitiated` | `BillingCheckoutController` |
| `BillingCheckoutCompleted` | `BillingCheckoutCompleted` | `BillingCheckoutController` |
| `TenantNotificationChannelPreferencesUpdated` | `TenantNotificationChannelPreferencesUpdated` | `CustomerNotificationChannelPreferencesController` |
| `TenantAgentOutputQualityGateModeUpdated` | `Tenant.AgentOutputQualityGateModeUpdated` | `SettingsController` (`PUT …/admin/settings/agent-output-quality-gate-mode`) |
| `TenantAgentOutputQualityGateModeOverrideCleared` | `Tenant.AgentOutputQualityGateModeOverrideCleared` | `SettingsController` (`DELETE …/admin/settings/agent-output-quality-gate-mode`) |
| `AdminApiKeyRotationMaterialIssued` | `Admin.ApiKeyRotationMaterialIssued` | `AdminApiKeySettingsController` (`POST …/admin/settings/api-keys/rotate`) |
| `TenantReviewBoardCoverLogoUploaded` | `Tenant.ReviewBoardCoverLogoUploaded` | `AdminController` (`POST /v1/admin/tenant/logo`) |
| `TenantTeamsIncomingWebhookConnectionUpserted` | `TenantTeamsIncomingWebhookConnectionUpserted` | `TeamsIncomingWebhookConnectionsController` |
| `TenantTeamsIncomingWebhookConnectionRemoved` | `TenantTeamsIncomingWebhookConnectionRemoved` | `TeamsIncomingWebhookConnectionsController` |
| `ExecDigestPreferencesUpdated` | `ExecDigestPreferencesUpdated` | `TenantExecDigestPreferencesController` |
| `TenantEntraDirectoryBound` | `TenantEntraDirectoryBound` | `TenantTrialController` (`POST …/tenant/link-entra`) |
| `TenantTrialConverted` | `TenantTrialConverted` | `TenantTrialController` |
| `TrialLifecycleTransition` | `TrialLifecycleTransition` | `TrialLifecycleTransitionEngine` |
| `TrialLimitExceeded` | `TrialLimitExceeded` | `TrialLimitExceededAuditFilter`, `TrialLimitProblemResponse.TryLogAuditAsync` (on `TrialLimitExceededException`) |
| `TrialLocalIdentityLinkedToEntra` | `TrialLocalIdentityLinkedToEntra` | `TenantTrialController` (`POST …/tenant/link-entra`; when local link succeeds) |
| `ComparisonRecordOrphansRemediated` | `ComparisonRecordOrphansRemediated` | `AdminDiagnosticsService` (orphan comparison-record remediation execute) |
| `GoldenManifestOrphansRemediated` | `GoldenManifestOrphansRemediated` | `AdminDiagnosticsService` (orphan golden-manifest remediation execute) |
| `FindingsSnapshotOrphansRemediated` | `FindingsSnapshotOrphansRemediated` | `AdminDiagnosticsService` (orphan findings-snapshot remediation execute) |
| `AgentResultSchemaViolation` | `AgentResultSchemaViolation` | `AgentResultSchemaViolationAudit` (topology / compliance / critic handlers on `AgentResultSchemaViolationException`) |
| `AgentTraceBlobPersistenceFailed` | `AgentTraceBlobPersistenceFailed` | `AgentExecutionTraceRecorder` |
| `AgentTraceInlineFallbackFailed` | `AgentTraceInlineFallbackFailed` | `AgentExecutionTraceRecorder` |
| `LlmContextTruncated` | `LlmContextTruncated` | `ContextLengthGuardAgentCompletionClient` (fire-and-forget; prompt truncated when estimated tokens exceed threshold) |
| `TrialUpgradeNudgeShown` | `TrialUpgradeNudgeShown` | `ClientErrorTelemetryController` (`POST /v1/diagnostics/trial-upgrade-nudge/shown`) |
| `TrialUpgradeNudgeClicked` | `TrialUpgradeNudgeClicked` | `ClientErrorTelemetryController` (`POST /v1/diagnostics/trial-upgrade-nudge/clicked`) |
| `TeamExpansionNudgeShown` | `TeamExpansionNudgeShown` | `ClientErrorTelemetryController` (`POST /v1/diagnostics/team-expansion-nudge/shown`) |
| `TeamExpansionNudgeClicked` | `TeamExpansionNudgeClicked` | `ClientErrorTelemetryController` (`POST /v1/diagnostics/team-expansion-nudge/clicked`) |
| `LlmTenantDailyBudgetApproaching` | `LlmTenantDailyBudgetApproaching` | `LlmDailyTenantBudgetTracker` (fire-and-forget; one row per tenant per UTC day) |
| `LlmTenantMonthlyDollarBudgetApproaching` | `LlmTenantMonthlyDollarBudgetApproaching` | `LlmMonthlyTenantDollarBudgetTracker` (fire-and-forget; one row per tenant per UTC month) |
| `LlmCostTuningUpdated` | `LlmCostTuningUpdated` | `AdminLlmCostTuningController` (persisted USD-per-token rates for cost estimation) |
| `ScimTokenIssued` | `ScimTokenIssued` | `ScimTokensAdminController` |
| `ScimTokenRevoked` | `ScimTokenRevoked` | `ScimTokensAdminController` |
| `ScimUserProvisioned` | `ScimUserProvisioned` | `ScimUserService` |
| `ScimUserUpdated` | `ScimUserUpdated` | `ScimUserService` |
| `ScimUserDeactivated` | `ScimUserDeactivated` | `ScimUserService` |
| `ScimGroupProvisioned` | `ScimGroupProvisioned` | `ScimGroupService` |
| `ScimGroupMembershipChanged` | `ScimGroupMembershipChanged` | `ScimGroupService` |
| `RoleOverriddenByScim` | `RoleOverriddenByScim` | `ScimUserService` (group-derived role replaces manual PATCH resolution; provenance payload) |
| `Saml2ServiceProviderSignInSucceeded` | `Saml2ServiceProviderSignInSucceeded` | `ArchLucidSaml2SignInAudit` (SAML2 `CookieSignedInContext`; minimal name-id / tenant payload) |
| `Saml2ServiceProviderSignInFailed` | `Saml2ServiceProviderSignInFailed` | `ArchLucidSaml2SignInAudit.TryAppendProtocolFailureAudit` (`/Auth/*` ITfoxtec protocol faults; best-effort) |
| `IdentitySsoConfigurationActivated` | `Identity.SsoConfigurationActivated` | `IdentityProviderConfigurationController` (`POST /v1/admin/identity/activate`) |
| `IntegrationHostedAzureExtractorConfigured` | `Integration.HostedAzureExtractorConfigured` | `HostedAzureExtractorAdminController` (`POST /v1/admin/azure-extractor/hosted/configure`) |
| `IdentityCustomRoleCreated` | `Identity.CustomRoleCreated` | `CustomRolesAdminController` (`POST /v1/admin/roles`) |
| `IdentityCustomRoleUpdated` | `Identity.CustomRoleUpdated` | `CustomRolesAdminController` (`PUT /v1/admin/roles/{roleId}`) |
| `IdentityCustomRoleAssigned` | `Identity.CustomRoleAssigned` | `CustomRolesAdminController` (`POST /v1/admin/roles/{roleId}/assign`) |
| `FirstRealValueRunStarted` | `FirstRealValueRunStarted` | `RunsController` (pilot real execute) |
| `FirstRealValueRunCompleted` | `FirstRealValueRunCompleted` | `RunsController` (pilot real execute success) |
| `FirstRealValueRunFellBackToSimulator` | `FirstRealValueRunFellBackToSimulator` | `ArchitectureApplicationService` (pilot seed after real-mode fallback) |
| `RunLegacyReadyForCommitPromoted` | `RunLegacyReadyForCommitPromoted` | `ArchitectureRunExecuteOrchestrator` (post-execute LegacyRunStatus promotion — ADR-0012) |
| `IntegrationJiraIssueStatusSynced` | `Integration.JiraIssueStatusSynced` | `ItsmInboundWebhookSyncService` (Jira inbound webhook) |
| `IntegrationServiceNowIncidentStatusSynced` | `Integration.ServiceNowIncidentStatusSynced` | `ItsmInboundWebhookSyncService` (ServiceNow inbound webhook) |
| `IntegrationJiraInboundWebhookRejected` | `Integration.JiraInboundWebhookRejected` | `ItsmInboundWebhookSyncService` (Jira inbound validation / rejection) |
| `IntegrationServiceNowInboundWebhookRejected` | `Integration.ServiceNowInboundWebhookRejected` | `ItsmInboundWebhookSyncService` (ServiceNow inbound validation / rejection) |
| `IntegrationItsmInboundWebhookPayloadRejected` | `Integration.ItsmInboundWebhookPayloadRejected` | `ItsmInboundWebhookSyncService` / `ItsmInboundWebhooksController` (oversized webhook body) |
| `IntegrationItsmFindingCorrelationRegistered` | `Integration.ItsmFindingCorrelationRegistered` | `ItsmCorrelationController` (`POST …/integrations/itsm/correlations`) |
| `IntegrationJiraIssueCreateSucceeded` | `Integration.JiraIssueCreateSucceeded` | `ItsmOutboundIssuesController` (`POST …/integrations/itsm/outbound/issues`); `ItsmOutboundIssueCreationService` |
| `IntegrationJiraIssueCreateFailed` | `Integration.JiraIssueCreateFailed` | same |
| `IntegrationJiraIssueCreateSkipped` | `Integration.JiraIssueCreateSkipped` | same |
| `IntegrationServiceNowIncidentCreateSucceeded` | `Integration.ServiceNowIncidentCreateSucceeded` | same |
| `IntegrationServiceNowIncidentCreateFailed` | `Integration.ServiceNowIncidentCreateFailed` | same |
| `IntegrationServiceNowIncidentCreateSkipped` | `Integration.ServiceNowIncidentCreateSkipped` | same |
| `IntegrationOutboxDeadLetterRetried` | `Integration.OutboxDeadLetterRetried` | `AdminDiagnosticsService` (single `POST …/admin/integration-outbox/dead-letters/{outboxId}/retry`; bulk `POST …/admin/integrations/outbox/retry-dead-letter` when `retriedCount > 0`) |
| `IntegrationOutboxDeadLetterSuppressed` | `Integration.OutboxDeadLetterSuppressed` | `AdminDiagnosticsService` (`POST …/admin/integration-outbox/dead-letters/{outboxId}/suppress`) |
| `IntegrationConfluenceFirstValueReportPublished` | `Integration.ConfluenceFirstValueReportPublished` | `ConfluencePublishingAdminController` (`POST …/admin/integrations/confluence/first-value-report`) |
| `PilotScorecardValueMetricsSubmitted` | `PilotScorecardValueMetricsSubmitted` | `PilotsController` |

When adding a Core constant, add a row here and bump `audit-core-const-count`.

---

## Appendix — `AuditEventTypes.Run` registry (canonical coordinator durable rows)

| Constant | Value | Durable audit producer(s) |
|----------|-------|---------------------------|
| `Run.Created` | `Run.Created` | `BaselineMutationAuditService` / `BaselineMutationAuditArchitectureDurableWriter` (baseline `Architecture.RunCreated`) |
| `Run.ExecuteStarted` | `Run.ExecuteStarted` | `BaselineMutationAuditService` / `BaselineMutationAuditArchitectureDurableWriter` (baseline `Architecture.RunStarted`) |
| `Run.ExecuteSucceeded` | `Run.ExecuteSucceeded` | `BaselineMutationAuditService` / `BaselineMutationAuditArchitectureDurableWriter` (baseline `Architecture.RunExecuteSucceeded`) |
| `Run.CommitCompleted` | `Run.CommitCompleted` | `BaselineMutationAuditService` / `BaselineMutationAuditArchitectureDurableWriter` (baseline `Architecture.RunCompleted`) |
| `Run.Failed` | `Run.Failed` | `BaselineMutationAuditService` / `BaselineMutationAuditArchitectureDurableWriter` (baseline `Architecture.RunFailed`) |
| `Run.QualityGateRejected` | `Run.QualityGateRejected` | `BaselineMutationAuditService` / `BaselineMutationAuditArchitectureDurableWriter` (baseline `Architecture.RunQualityGateRejected`) |
| `Run.RetryRequested` | `Run.RetryRequested` | `ArchitectureRunExecuteOrchestrator` (`ExecuteRunAsync` when load maps to `ArchitectureRunStatus.Failed`; scoped tenant/workspace/project + `RunId`) |

When adding a `Run` constant, add a row here and bump `audit-core-const-count`.

---

## Appendix — `AuditEventTypes.Baseline` registry (structured baseline log only)

| Constant path | Value | Baseline producer(s) |
|---------------|-------|----------------------|
| `Baseline.Architecture.RunCreated` | `Architecture.RunCreated` | `ArchitectureRunCreateOrchestrator` |
| `Baseline.Architecture.RunStarted` | `Architecture.RunStarted` | `ArchitectureRunExecuteOrchestrator` |
| `Baseline.Architecture.RunExecuteSucceeded` | `Architecture.RunExecuteSucceeded` | `ArchitectureRunExecuteOrchestrator` |
| `Baseline.Architecture.RunCompleted` | `Architecture.RunCompleted` | `ArchitectureRunCommitOrchestrator` |
| `Baseline.Architecture.RunFailed` | `Architecture.RunFailed` | Architecture run orchestrators, `ArchitectureRunService` |
| `Baseline.Architecture.RunQualityGateRejected` | `Architecture.RunQualityGateRejected` | `ArchitectureRunExecuteOrchestrator` (agent-output quality gate blocks execute completion) |
| `Baseline.Governance.ApprovalRequestSubmitted` | `Governance.ApprovalRequestSubmitted` | `GovernanceWorkflowService` |
| `Baseline.Governance.ApprovalRequestApproved` | `Governance.ApprovalRequestApproved` | `GovernanceWorkflowService` |
| `Baseline.Governance.ApprovalRequestRejected` | `Governance.ApprovalRequestRejected` | `GovernanceWorkflowService` |
| `Baseline.Governance.ManifestPromoted` | `Governance.ManifestPromoted` | `GovernanceWorkflowService` |
| `Baseline.Governance.EnvironmentActivated` | `Governance.EnvironmentActivated` | `GovernanceWorkflowService` |

When adding a `Baseline` constant, add a row here and bump `audit-core-const-count`.

---

## Quality assessment verification (2026-04-28)

Independent quality readiness review (weighted score **66.25%**) re-traced this matrix against orchestrator call sites. **No net-new durable audit gaps** were opened beyond the intentional baseline-vs-durable dual-channel split documented above — coordinator durable echoes remain on the critical path (`BaselineMutationAuditArchitectureDurableWriter`), and **explicit** `dbo.AuditEvents` rows for **silent** coordinator SQL mutations (`RunLegacyReadyForCommitPromoted` on `dbo.Runs.LegacyRunStatus` promotion) are layered per ADR-0012 traceability.

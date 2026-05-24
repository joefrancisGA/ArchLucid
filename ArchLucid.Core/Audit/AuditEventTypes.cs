namespace ArchLucid.Core.Audit;

public static class AuditEventTypes
{
    public const string RunStarted = "RunStarted";
    public const string RunCompleted = "RunCompleted";

    public const string ManifestGenerated = "ManifestGenerated";

    /// <summary>Durable audit when a run's golden manifest is finalized (committed) in one atomic transaction with outbox.</summary>
    public const string ManifestFinalized = "ManifestFinalized";

    /// <summary>Product-facing run submission (<c>POST /v1/runs/{runId}/submit</c>, formerly execute).</summary>
    public const string RunSubmitted = "RunSubmitted";

    /// <summary>Operator viewed committed manifest JSON (<c>GET /v1/runs/{runId}/manifest</c>).</summary>
    public const string ManifestViewed = "ManifestViewed";

    /// <summary>Operator retrieved review trail / pipeline timeline (<c>GET /v1/runs/{runId}/review-trail</c>).</summary>
    public const string ReviewTrailAccessed = "ReviewTrailAccessed";

    /// <summary>Operator retrieved decision provenance graph (<c>GET …/review-trail/provenance</c>).</summary>
    public const string ProvenanceAccessed = "ProvenanceAccessed";

    /// <summary>Bulk findings list read (<c>GET /v1/runs/{runId}/findings</c>).</summary>
    public const string FindingsListAccessed = "FindingsListAccessed";

    /// <summary>Governance approval request created (<c>POST /v1/governance/approval-requests</c>).</summary>
    public const string GovernanceApprovalRequested = "GovernanceApprovalRequested";

    /// <summary>
    ///     Slack Block Kit approve/reject interactivity dispatched after signature verification (
    ///     <c>POST …/integrations/webhooks/slack/interactivity</c>); workflow outcome audits emit per approval request.
    /// </summary>
    public const string GovernanceSlackInteractivityDispatched = "GovernanceSlackInteractivityDispatched";

    public const string ArtifactsGenerated = "ArtifactsGenerated";

    /// <summary>Artifact synthesis ended in hard failure (no usable bundle).</summary>
    public const string ArtifactSynthesisFailed = "ArtifactSynthesisFailed";

    /// <summary>Artifact synthesis produced a degraded bundle (see payload for missing artifact kinds).</summary>
    public const string ArtifactSynthesisPartial = "ArtifactSynthesisPartial";

    /// <summary>Architecture request draft or import persisted (namespaced <c>Request.*</c> durable type).</summary>
    public const string RequestCreated = "Request.Created";

    /// <summary>Request locked because a non-terminal run references it.</summary>
    public const string RequestLocked = "Request.Locked";

    /// <summary>
    ///     Bulk create accepted (<c>POST …/architecture/request/batch</c>, 202). Item persists emit durable
    ///     <see cref="RequestCreated" /> via <c>CreateRunAsync</c>.
    /// </summary>
    public const string ArchitectureRunBatchAccepted = "Architecture.RunBatchAccepted";

    /// <summary>Request released after all referencing runs reached a terminal state.</summary>
    public const string RequestReleased = "Request.Released";

    /// <summary>Golden manifest superseded by a newer authority row in the same scope (policy- or admin-driven).</summary>
    public const string ManifestSuperseded = "ManifestSuperseded";

    /// <summary>Golden manifest soft-archived (<c>ArchivedUtc</c> set).</summary>
    public const string ManifestArchived = "ManifestArchived";

    /// <summary>Findings snapshot generation reached a sealed terminal generation status.</summary>
    public const string FindingsSnapshotSealed = "FindingsSnapshotSealed";

    /// <summary>Human reviewer approved a finding.</summary>
    public const string FindingReviewApproved = "FindingReviewApproved";

    /// <summary>Human reviewer rejected a finding.</summary>
    public const string FindingReviewRejected = "FindingReviewRejected";

    /// <summary>Privileged override applied after rejection.</summary>
    public const string FindingReviewOverridden = "FindingReviewOverridden";

    /// <summary>Operator muted a finding for the active review (durable <c>dbo.FindingRecords</c> row).</summary>
    public const string FindingMuted = "FindingMuted";

    public const string ReplayExecuted = "ReplayExecuted";

    /// <summary>Workspace curation: <c>PATCH /v1/architecture/run/{{runId}}/pin</c> set or toggled <c>dbo.Runs.IsPinned</c>.</summary>
    public const string RunPinStateChanged = "RunPinStateChanged";

    /// <summary>Internal QA: POST <c>…/internal/architecture/runs/{{runId}}/determinism-check</c> completed.</summary>
    public const string InternalArchitectureDeterminismCheckExecuted = "InternalArchitectureDeterminismCheckExecuted";

    /// <summary>Internal dev: POST <c>…/internal/architecture/runs/{{runId}}/seed-fake-results</c> succeeded.</summary>
    public const string InternalArchitectureFakeResultsSeeded = "InternalArchitectureFakeResultsSeeded";

    /// <summary>Operator refresh of pseudonymized <c>dbo.InternalCrossTenantRollupDaily</c> for a UTC day.</summary>
    public const string InternalCrossTenantRollupRefreshed = "InternalCrossTenantRollupRefreshed";

    /// <summary>
    ///     Operator diagnostics: synthetic markers from <c>POST /v1/diagnostics/synthetic-operator-demo-pack</c> (
    ///     <c>archlucid seed-demo-data</c>) for empty-tenant UI validation only.
    /// </summary>
    public const string SyntheticOperatorDemoPackMarker = "SyntheticOperatorDemoPack.Marker";

    /// <summary>
    ///     Admin invoked <c>POST /v1/diagnostics/synthetic-operator-demo-pack</c> (markers follow as
    ///     <see cref="SyntheticOperatorDemoPackMarker" /> rows).
    /// </summary>
    public const string SyntheticOperatorDemoPackInvoked = "SyntheticOperatorDemoPack.Invoked";

    /// <summary>
    ///     Demo seed or replay commit persisted the authority SQL FK chain (context / graph / findings / decision trace +
    ///     golden manifest) outside the main pipeline executor.
    /// </summary>
    public const string AuthorityCommittedChainPersisted = "AuthorityCommittedChainPersisted";

    public const string ArtifactDownloaded = "ArtifactDownloaded";
    public const string BundleDownloaded = "BundleDownloaded";

    /// <summary>
    ///     In-product support bundle ZIP from <c>POST …/admin/support-bundle</c>. Payload is JSON with file name and
    ///     size bytes only (no raw bundle contents).
    /// </summary>
    public const string SupportBundleDownloaded = "SupportBundleDownloaded";

    public const string RunExported = "RunExported";

    /// <summary>Generic export download succeeded (DOCX/PDF/comparison file).</summary>
    public const string ExportDownloadSucceeded = "Export.DownloadSucceeded";
    public const string RunExportFailed = "Export.Failed";

    /// <summary>Run export ZIP was successfully pushed to a customer-provided Azure Blob SAS URL.</summary>
    public const string RunExportBlobPushSucceeded = "RunExportBlobPushSucceeded";

    /// <summary>Run export ZIP push to a customer-provided Azure Blob SAS URL failed.</summary>
    public const string RunExportBlobPushFailed = "RunExportBlobPushFailed";

    /// <summary>
    ///     Run export ZIP blob push queued (HTTP 202): background upload emits <see cref="RunExportBlobPushSucceeded" />
    ///     or <see cref="RunExportBlobPushFailed" />.
    /// </summary>
    public const string RunExportBlobPushQueued = "RunExportBlobPushQueued";

    /// <summary>
    ///     Operator downloaded the advisory Terraform placeholder ZIP (
    ///     <c>GET /v1/artifacts/runs/{{runId}}/terraform-advisory-export</c>).
    /// </summary>
    public const string TerraformAdvisoryExportDownloaded = "TerraformAdvisoryExportDownloaded";

    /// <summary>
    ///     Emitted when a structured architecture analysis report is built via the primary analysis-report API (
    ///     <c>POST .../analysis-report</c>).
    /// </summary>
    public const string ArchitectureAnalysisReportGenerated = "ArchitectureAnalysisReportGenerated";

    /// <summary>
    ///     Emitted when <c>POST /v1/architecture/quick-scan</c> completes successfully (single-pass LLM; ephemeral result).
    /// </summary>
    public const string ArchitectureQuickScanExecuted = "ArchitectureQuickScanExecuted";

    /// <summary>
    ///     Emitted when <c>POST /v1/architecture/import</c> CSV dry-run completes (mapped golden manifest JSON or validation
    ///     failure; no persistence).
    /// </summary>
    public const string ArchitectureDefinitionCsvImportDryRunExecuted = "ArchitectureDefinitionCsvImportDryRunExecuted";

    /// <summary>
    ///     Emitted when the architecture-package DOCX export completes successfully (
    ///     <c>GET .../docx/runs/{{runId}}/architecture-package</c>).
    /// </summary>
    public const string ArchitectureDocxExportGenerated = "ArchitectureDocxExportGenerated";

    /// <summary>
    ///     Multipart ZIP accepted for Azure extractor ingest (
    ///     <c>POST /v1/azure-extractor/upload</c>) — payload lists file name and size only.
    /// </summary>
    public const string AzureExtractorPackageUploaded = "AzureExtractorPackage.Uploaded";

    /// <summary>
    ///     Azure extractor ZIP failed manifest or archive parsing after upload (
    ///     <c>POST /v1/azure-extractor/upload</c>).
    /// </summary>
    public const string AzureExtractorPackageParseFailed = "AzureExtractorPackage.ParseFailed";

    /// <summary>
    ///     Azure extractor <c>manifest.json</c> schema version is not supported (
    ///     <c>POST /v1/azure-extractor/upload</c>).
    /// </summary>
    public const string AzureExtractorPackageSchemaRejected = "AzureExtractorPackage.SchemaRejected";

    /// <summary>
    ///     Azure extractor ZIP persisted after successful schema validation (
    ///     <c>POST /v1/azure-extractor/upload</c>).
    /// </summary>
    public const string AzureExtractorPackageIngestSucceeded = "AzureExtractorPackage.IngestSucceeded";

    /// <summary>
    ///     Chunked Azure extractor ingest session created (
    ///     <c>POST /v1/azure-extractor/upload-sessions</c>); payload lists <c>sessionId</c>, declared chunk counts, and caps
    ///     only.
    /// </summary>
    public const string AzureExtractorPackageChunkSessionStarted = "AzureExtractorPackage.ChunkSessionStarted";

    /// <summary>
    ///     Operator downloaded a persisted Azure extractor ZIP (
    ///     <c>GET /v1/azure-extractor/packages/{packageId}</c>).
    /// </summary>
    public const string AzureExtractorPackageDownloaded = "Export.AzureExtractorPackageDownloaded";

    /// <summary>
    ///     Architecture request draft imported from an uploaded TOML/JSON file (
    ///     <c>POST .../architecture/request/import</c>).
    /// </summary>
    public const string RequestFileImported = "RequestFileImported";

    /// <summary>
    ///     Stakeholder DOCX value report generated for the current scope (
    ///     <c>POST /v1/value-report/{{tenantId}}/generate</c>).
    /// </summary>
    public const string ValueReportGenerated = "ValueReportGenerated";

    /// <summary>Emitted when a replay export persists a new run export row (<c>RecordReplayExport</c> on replay POST).</summary>
    public const string ReplayExportRecorded = "ReplayExportRecorded";

    /// <summary>Emitted when <c>POST .../run/exports/compare/summary</c> persists an export-record diff comparison row.</summary>
    public const string ComparisonSummaryPersisted = "ComparisonSummaryPersisted";

    /// <summary>
    ///     Emitted when <c>POST .../run/compare/end-to-end/summary</c> persists an end-to-end comparison record (
    ///     application <c>ComparisonAuditService.RecordEndToEndAsync</c>).
    /// </summary>
    public const string EndToEndComparisonPersisted = "EndToEndComparisonPersisted";

    /// <summary>
    ///     Emitted when a comparison replay persists a new immutable comparison record (
    ///     application <c>ComparisonAuditService.RecordReplayOfAsync</c>).
    /// </summary>
    public const string ComparisonReplayPersisted = "ComparisonReplayPersisted";

    public const string RecommendationGenerated = "RecommendationGenerated";
    public const string RecommendationAccepted = "RecommendationAccepted";
    public const string RecommendationRejected = "RecommendationRejected";
    public const string RecommendationDeferred = "RecommendationDeferred";
    public const string RecommendationImplemented = "RecommendationImplemented";

    public const string RecommendationLearningProfileRebuilt = "RecommendationLearningProfileRebuilt";

    /// <summary>
    ///     Pilot feedback signal captured via <c>POST /v1/product-learning/signals</c>.
    ///     Payload: <c>subjectType</c>, <c>disposition</c>, <c>patternKey</c> (when supplied).
    /// </summary>
    public const string ProductLearningPilotSignalRecorded = "ProductLearningPilotSignalRecorded";

    /// <summary>
    ///     59R planning drafts materialized via <c>POST /v1/learning/planning/materialize</c>.
    ///     Payload: <c>sinceUtc</c>, <c>maxPlansToMaterialize</c>, and themes/plans/signal-link insert counts (same fields as
    ///     the JSON response body).
    /// </summary>
    public const string ProductLearningPlanningMaterialized = "ProductLearningPlanningMaterialized";

    public const string AdvisoryScanScheduled = "AdvisoryScanScheduled";
    public const string AdvisoryScanExecuted = "AdvisoryScanExecuted";
    public const string ArchitectureDigestGenerated = "ArchitectureDigestGenerated";

    public const string DigestSubscriptionCreated = "DigestSubscriptionCreated";
    public const string DigestSubscriptionToggled = "DigestSubscriptionToggled";
    public const string DigestDeliverySucceeded = "DigestDeliverySucceeded";
    public const string DigestDeliveryFailed = "DigestDeliveryFailed";

    public const string AlertRuleCreated = "AlertRuleCreated";
    public const string AlertTriggered = "AlertTriggered";
    public const string AlertAcknowledged = "AlertAcknowledged";
    public const string AlertResolved = "AlertResolved";
    public const string AlertSuppressed = "AlertSuppressed";
    public const string AlertArchived = "AlertArchived";

    public const string AlertRoutingSubscriptionCreated = "AlertRoutingSubscriptionCreated";
    public const string AlertRoutingSubscriptionToggled = "AlertRoutingSubscriptionToggled";
    public const string AlertDeliverySucceeded = "AlertDeliverySucceeded";
    public const string AlertDeliveryFailed = "AlertDeliveryFailed";

    public const string CompositeAlertRuleCreated = "CompositeAlertRuleCreated";
    public const string CompositeAlertTriggered = "CompositeAlertTriggered";
    public const string AlertSuppressedByPolicy = "AlertSuppressedByPolicy";

    public const string AlertRuleSimulationExecuted = "AlertRuleSimulationExecuted";
    public const string AlertRuleCandidateComparisonExecuted = "AlertRuleCandidateComparisonExecuted";

    public const string AlertThresholdRecommendationExecuted = "AlertThresholdRecommendationExecuted";

    public const string PolicyPackCreated = "PolicyPackCreated";
    public const string PolicyPackVersionPublished = "PolicyPackVersionPublished";
    public const string PolicyPackAssigned = "PolicyPackAssigned";
    public const string PolicyPackAssignmentCreated = "PolicyPackAssignmentCreated";
    public const string PolicyPackAssignmentArchived = "PolicyPackAssignmentArchived";

    public const string PolicyPackDuplicated = "PolicyPackDuplicated";

    /// <summary>Admin promoted a policy pack snapshot into the global catalog.</summary>
    public const string PolicyPackCatalogPromoted = "PolicyPackCatalogPromoted";

    /// <summary>Admin demoted a catalog entry from the buyer-visible catalog.</summary>
    public const string PolicyPackCatalogDemoted = "PolicyPackCatalogDemoted";

    public const string GovernanceResolutionExecuted = "GovernanceResolutionExecuted";
    public const string GovernanceConflictDetected = "GovernanceConflictDetected";

    public const string GovernanceApprovalSubmitted = "GovernanceApprovalSubmitted";
    public const string GovernanceApprovalApproved = "GovernanceApprovalApproved";

    /// <summary>Operator set pilot scorecard ROI baselines (<c>PUT /v1/pilots/scorecard/baselines</c>).</summary>
    public const string PilotScorecardBaselinesUpdated = "PilotScorecardBaselinesUpdated";

    /// <summary>Operator submitted pilot value metrics via <c>POST /v1/pilots/scorecard</c>.</summary>
    public const string PilotScorecardValueMetricsSubmitted = "PilotScorecardValueMetricsSubmitted";

    /// <summary>Optional structured pilot closeout (<c>POST /v1/pilots/closeout</c>).</summary>
    public const string PilotCloseoutRecorded = "PilotCloseoutRecorded";

    /// <summary>Core Pilot team checklist step upsert (<c>PUT …/tenant/core-pilot-checklist</c>).</summary>
    public const string CorePilotTeamChecklistUpdated = "CorePilotTeamChecklistUpdated";

    public const string GovernanceApprovalRejected = "GovernanceApprovalRejected";

    /// <summary>
    ///     Durable audit when a reviewer is blocked from approving or rejecting their own governance request (segregation
    ///     of duties).
    /// </summary>
    public const string GovernanceSelfApprovalBlocked = "GovernanceSelfApprovalBlocked";

    /// <summary>Emitted when optional pre-commit governance blocks manifest commit due to critical findings.</summary>
    public const string GovernancePreCommitBlocked = "GovernancePreCommitBlocked";

    /// <summary>Emitted when pre-commit governance enforcement is overridden via commit-body break-glass justification.</summary>
    public const string GovernanceBypassInvoked = "GovernanceBypassInvoked";

    /// <summary>Emitted when pre-commit governance warns but allows commit due to WarnOnly severity configuration.</summary>
    public const string GovernancePreCommitWarned = "GovernancePreCommitWarned";

    /// <summary>
    ///     Operator ran pre-commit gate what-if with synthetic findings (
    ///     <c>POST /v1/governance/pre-commit/simulate</c>). Payload summarizes request parameters and gate outcome; no
    ///     manifest commit.
    /// </summary>
    public const string GovernancePreCommitSimulationEvaluated = "GovernancePreCommitSimulationEvaluated";

    /// <summary>Emitted when a governance approval request breaches its SLA deadline.</summary>
    public const string GovernanceApprovalSlaBreached = "GovernanceApprovalSlaBreached";

    /// <summary>
    ///     Agent LLM output failed <c>AgentResult</c> JSON schema validation at parse time (payload lists errors and
    ///     model metadata when known).
    /// </summary>
    public const string AgentResultSchemaViolation = "AgentResultSchemaViolation";

    /// <summary>Full agent trace prompt/response blob persistence failed or timed out after agent trace row insert.</summary>
    public const string AgentTraceBlobPersistenceFailed = "AgentTraceBlobPersistenceFailed";

    /// <summary>
    ///     Mandatory SQL inline fallback for full agent trace text failed or forensic coverage verification failed after
    ///     blob issues.
    /// </summary>
    public const string AgentTraceInlineFallbackFailed = "AgentTraceInlineFallbackFailed";

    public const string GovernanceManifestPromoted = "GovernanceManifestPromoted";
    public const string GovernanceEnvironmentActivated = "GovernanceEnvironmentActivated";

    /// <summary>
    ///     Emitted when an operator runs a governance policy-pack dry-run / what-if evaluation
    ///     (<c>POST /v1/governance/policy-packs/{id}/dry-run</c>). No real commit happens — the
    ///     payload captures the proposed thresholds (always passed through the LLM-prompt redaction
    ///     pipeline before serialisation, per PENDING_QUESTIONS Q37), the evaluated run ids, and
    ///     would-be delta counts so reviewers can audit what was simulated and by whom.
    /// </summary>
    public const string GovernanceDryRunRequested = "GovernanceDryRunRequested";

    /// <summary>
    ///     Durable audit when an operator validates a governance write path with <c>dryRun=true</c> (
    ///     approval request or promotion): same validation as a real commit runs, but no row/outbox/ integration
    ///     publish. Payload names the workflow (approval vs promotion) and the non-sensitive request fields so SIEM
    ///     can detect probing without relying on skipped <see cref="GovernanceApprovalSubmitted" /> rows.
    /// </summary>
    public const string GovernanceDryRunValidationAttempted = "GovernanceDryRunValidationAttempted";

    /// <summary>
    ///     Background <c>DataArchivalHostedService</c> iteration failed after logging (see payload for exception
    ///     details).
    /// </summary>
    public const string DataArchivalHostLoopFailed = "DataArchivalHostLoopFailed";

    /// <summary>
    ///     Admin remediation removed orphan <c>dbo.ComparisonRecords</c> rows whose run ids do not exist on <c>dbo.Runs</c>
    ///     (see <c>DataConsistencyOrphanRemediationSql</c>). Payload includes dry-run flag, count, and ids.
    /// </summary>
    public const string ComparisonRecordOrphansRemediated = "ComparisonRecordOrphansRemediated";

    /// <summary>
    ///     Admin remediation removed orphan <c>dbo.GoldenManifests</c> rows (no matching <c>dbo.Runs.RunId</c>), after
    ///     deleting dependent <c>dbo.ArtifactBundles</c>.
    /// </summary>
    public const string GoldenManifestOrphansRemediated = "GoldenManifestOrphansRemediated";

    /// <summary>
    ///     Admin remediation removed orphan <c>dbo.FindingsSnapshots</c> rows (no matching run, not referenced by any golden
    ///     manifest).
    /// </summary>
    public const string FindingsSnapshotOrphansRemediated = "FindingsSnapshotOrphansRemediated";

    public const string CircuitBreakerStateTransition = "CircuitBreakerStateTransition";

    public const string CircuitBreakerRejection = "CircuitBreakerRejection";

    public const string CircuitBreakerProbeOutcome = "CircuitBreakerProbeOutcome";

    /// <summary>
    ///     Trust center: a third-party or owner-approved security assessment summary was published for procurement / customer
    ///     review
    ///     (payload: assessment code, summary reference, optional assessor display name).
    /// </summary>
    public const string SecurityAssessmentPublished = "SecurityAssessmentPublished";

    /// <summary>SaaS tenant registry: new tenant + default workspace identifiers created (or idempotent replay).</summary>
    public const string TenantProvisioned = "TenantProvisioned";

    /// <summary>
    ///     Public self-service registration completed (audit complements <see cref="TenantProvisioned" /> on the same
    ///     flow).
    /// </summary>
    public const string TenantSelfRegistered = "TenantSelfRegistered";

    /// <summary>
    ///     Platform audit (<c>dbo.PlatformAuditEvents</c>): tenant offboarding removed tenant-scoped SQL + blobs; not
    ///     written to <c>dbo.AuditEvents</c>.
    /// </summary>
    public const string TenantDataDeleted = "TenantDataDeleted";

    /// <summary>Platform audit: tenant entered scheduled erasure quarantine (<c>dbo.Tenants.OffboardedUtc</c> set).</summary>
    public const string TenantErasureOffboarded = "TenantErasureOffboarded";

    public const string TenantErasureApproved = "TenantErasureApproved";

    /// <summary>Platform audit: quarantine cleared before hard purge (break-glass restore).</summary>
    public const string TenantErasureQuarantineRestored = "TenantErasureQuarantineRestored";

    /// <summary>Platform audit: legal/regulatory hold placed or extended on a tenant.</summary>
    public const string TenantErasureLegalHoldSet = "TenantErasureLegalHoldSet";

    /// <summary>Platform audit: legal hold cleared by a platform operator.</summary>
    public const string TenantErasureLegalHoldCleared = "TenantErasureLegalHoldCleared";

    /// <summary>Architecture project soft-deleted (<c>dbo.Projects.IsDeleted = 1</c>) via tenant API.</summary>
    public const string ArchitectureProjectSoftDeleted = "ArchitectureProjectSoftDeleted";

    /// <summary>Architecture project restored from recycle bin (<c>dbo.Projects.IsDeleted</c> 1→0) via tenant API.</summary>
    public const string ArchitectureProjectRestored = "ArchitectureProjectRestored";

    /// <summary>Retention job hard-deleted a soft-deleted <c>dbo.Projects</c> row (payload: project id).</summary>
    public const string ArchitectureProjectHardPurgedRetention = "ArchitectureProjectHardPurgedRetention";

    /// <summary>
    ///     Platform audit: sample-marked runs purged after first real commit or TTL (payload: row counts only — no tenant id).
    /// </summary>
    public const string SampleRunsPurged = "SampleRunsPurged";

    /// <summary>Self-service trial activated with sample data (demo seed + trial window metadata).</summary>
    public const string TrialProvisioned = "TrialProvisioned";

    /// <summary>Trial marked converted (billing integration stub).</summary>
    public const string TenantTrialConverted = "TenantTrialConverted";

    /// <summary>
    ///     Commercial Entra directory (<c>tid</c>) bound to an ArchLucid tenant after paid conversion
    ///     (<c>POST /v1/tenant/link-entra</c>).
    /// </summary>
    public const string TenantEntraDirectoryBound = "TenantEntraDirectoryBound";

    /// <summary>Optional: trial local <c>dbo.IdentityUsers</c> row linked to an Entra <c>oid</c> during handoff.</summary>
    public const string TrialLocalIdentityLinkedToEntra = "TrialLocalIdentityLinkedToEntra";

    /// <summary>
    ///     Automated trial lifecycle state transition (Worker scheduler; SQL row in <c>dbo.TenantLifecycleTransitions</c>
    ///     ).
    /// </summary>
    public const string TrialLifecycleTransition = "TrialLifecycleTransition";

    /// <summary>Emitted when a mutating request is blocked because the tenant trial expired or exceeded runs/seats (HTTP 402).</summary>
    public const string TrialLimitExceeded = "TrialLimitExceeded";

    /// <summary>Self-service signup or local trial identity registration attempt observed at HTTP entry (funnel top).</summary>
    public const string TrialSignupAttempted = "TrialSignupAttempted";

    /// <summary>Signup or trial bootstrap failed after <see cref="TrialSignupAttempted" /> (payload includes stage/reason).</summary>
    public const string TrialSignupFailed = "TrialSignupFailed";

    /// <summary>
    ///     Durable failure on <c>POST /v1/register</c> (validation, duplicate org, or unexpected server error). Payload
    ///     includes <c>reason</c> and optional <c>message</c>.
    /// </summary>
    public const string TrialRegistrationFailed = "TrialRegistrationFailed";

    /// <summary>Prospect supplied optional review-cycle baseline hours at trial signup (persisted on <c>dbo.Tenants</c>).</summary>
    public const string TrialBaselineReviewCycleCaptured = "TrialBaselineReviewCycleCaptured";

    /// <summary>Operator updated review-cycle baseline hours after an earlier capture (settings / wizard).</summary>
    public const string TrialBaselineReviewCycleUpdated = "TrialBaselineReviewCycleUpdated";

    /// <summary>First save of <c>BaselineManualPrep*</c> on <c>dbo.Tenants</c> (settings or migration from prior null).</summary>
    public const string TrialBaselineManualPrepCaptured = "TrialBaselineManualPrepCaptured";

    /// <summary>Subsequent edits to <c>BaselineManualPrep*</c> after the first capture.</summary>
    public const string TrialBaselineManualPrepUpdated = "TrialBaselineManualPrepUpdated";

    /// <summary>Operator saved per-tenant ROI cost assumptions on <c>dbo.TenantCostSettings</c>.</summary>
    public const string TenantCostSettingsUpdated = "TenantCostSettingsUpdated";

    /// <summary>LLM prompt truncated because estimated tokens exceeded the configured context threshold.</summary>
    public const string LlmContextTruncated = "LlmContextTruncated";

    /// <summary>First golden manifest commit recorded for a self-service trial tenant (funnel depth).</summary>
    public const string TrialFirstRunCompleted = "TrialFirstRunCompleted";

    /// <summary>Admin initiated hosted billing checkout for trial conversion.</summary>
    public const string BillingCheckoutInitiated = "BillingCheckoutInitiated";

    /// <summary>Hosted billing checkout session created successfully (payload may include provider session id).</summary>
    public const string BillingCheckoutCompleted = "BillingCheckoutCompleted";

    /// <summary>
    ///     Tenant-level customer notification channel toggles updated (
    ///     <c>PUT /v1/notifications/customer-channel-preferences</c>).
    /// </summary>
    public const string TenantNotificationChannelPreferencesUpdated = "TenantNotificationChannelPreferencesUpdated";

    public const string TenantAgentOutputQualityGateModeUpdated = "Tenant.AgentOutputQualityGateModeUpdated";

    public const string TenantAgentOutputQualityGateModeOverrideCleared = "Tenant.AgentOutputQualityGateModeOverrideCleared";

    /// <summary>
    ///     Tenant architecture review board cover logo replaced (
    ///     <c>POST /v1/admin/tenant/logo</c>). Payload excludes image bytes.
    /// </summary>
    public const string TenantReviewBoardCoverLogoUploaded = "Tenant.ReviewBoardCoverLogoUploaded";

    /// <summary>Admin issued new host API key rotation material (payload excludes key material).</summary>
    public const string AdminApiKeyRotationMaterialIssued = "Admin.ApiKeyRotationMaterialIssued";

    /// <summary>
    ///     Outbound subscriber URL probe without persistence (<c>POST /v1/webhooks/dry-run</c>). Payload excludes shared
    ///     secrets and response bodies.
    /// </summary>
    public const string OutboundWebhookDryRunProbeExecuted = "OutboundWebhookDryRunProbeExecuted";

    /// <summary>Synthetic <c>AuthorityRunCompleted</c> webhook simulation executed via integrations API.</summary>
    public const string WebhookAuthorityRunCompletedSimulationExecuted = "WebhookAuthorityRunCompletedSimulationExecuted";

    /// <summary>Bulk evidence files were attached to a run.</summary>
    public const string EvidenceBulkAttached = "EvidenceBulkAttached";

    /// <summary>
    ///     Admin promoted an agent-curated evidence proposal into the tenant catalog (
    ///     <c>POST /v1/admin/evidence/proposals/{{resultId}}/promote</c>).
    /// </summary>
    public const string EvidenceProposalPromoted = "EvidenceProposalPromoted";

    /// <summary>
    ///     Operator pinged a persisted alert-routing webhook subscription to verify connectivity
    ///     (<c>POST /v1/integrations/webhooks/{id}/test</c>). Payload includes subscription ID, transport outcome, and
    ///     status code; never the destination URL or response body.
    /// </summary>
    public const string AlertRoutingWebhookPingExecuted = "AlertRoutingWebhookPingExecuted";

    /// <summary>
    ///     Tenant Microsoft Teams incoming-webhook Key Vault reference upserted (
    ///     <c>POST /v1/integrations/teams/connections</c>).
    /// </summary>
    public const string TenantTeamsIncomingWebhookConnectionUpserted = "TenantTeamsIncomingWebhookConnectionUpserted";

    /// <summary>
    ///     Tenant Microsoft Teams incoming-webhook Key Vault reference removed (
    ///     <c>DELETE /v1/integrations/teams/connections</c>).
    /// </summary>
    public const string TenantTeamsIncomingWebhookConnectionRemoved = "TenantTeamsIncomingWebhookConnectionRemoved";

    /// <summary>Tenant weekly executive digest preferences updated (<c>POST /v1/tenant/exec-digest-preferences</c>).</summary>
    public const string ExecDigestPreferencesUpdated = "ExecDigestPreferencesUpdated";

    /// <summary>Azure AI Content Safety circuit is open/unhealthy; analyzer fell back to local deny-list redaction.</summary>
    public const string ContentSafetyCircuitDegradedFallback = "ContentSafetyCircuitDegradedFallback";

    /// <summary>
    ///     Tenant crossed the configured warn threshold for the UTC-day combined LLM token budget (emitted at most once
    ///     per tenant per UTC day).
    /// </summary>
    public const string LlmTenantDailyBudgetApproaching = "LlmTenantDailyBudgetApproaching";

    /// <summary>
    ///     Tenant crossed the configured warn threshold for the UTC-month estimated LLM dollar budget (emitted at most once
    ///     per tenant per UTC month).
    /// </summary>
    public const string LlmTenantMonthlyDollarBudgetApproaching = "LlmTenantMonthlyDollarBudgetApproaching";

    /// <summary>Admin updated persisted LLM USD-per-token rates used for cost estimation (input/output).</summary>
    public const string LlmCostTuningUpdated = "LlmCostTuningUpdated";

    public const string ScimTokenIssued = "ScimTokenIssued";

    public const string ScimTokenRevoked = "ScimTokenRevoked";

    public const string ScimUserProvisioned = "ScimUserProvisioned";

    public const string ScimUserUpdated = "ScimUserUpdated";

    /// <summary>SCIM IdP group-derived role superseded an operator-managed SCIM <c>manualResolvedRole</c> assignment.</summary>
    public const string RoleOverriddenByScim = "RoleOverriddenByScim";

    public const string ScimUserDeactivated = "ScimUserDeactivated";

    public const string ScimGroupProvisioned = "ScimGroupProvisioned";

    public const string ScimGroupMembershipChanged = "ScimGroupMembershipChanged";

    /// <summary>
    ///     SAML 2.0 SP session cookie issued after a successful assertion (ITfoxtec <c>saml2</c> cookie scheme). Payload
    ///     stays minimal (name id prefix, tenant claim hint — never raw assertion XML or full subject).
    /// </summary>
    public const string Saml2ServiceProviderSignInSucceeded = "Saml2ServiceProviderSignInSucceeded";

    /// <summary>
    ///     SAML 2.0 SP sign-in failed on an <c>/Auth/*</c> route (assertion validation, replay, clock skew, malformed
    ///     protocol, etc.). Payload records exception type and request path only — not vendor exception text.
    /// </summary>
    public const string Saml2ServiceProviderSignInFailed = "Saml2ServiceProviderSignInFailed";

    /// <summary>Admin SSO wizard activated a tenant-scoped identity provider configuration row.</summary>
    public const string IdentitySsoConfigurationActivated = "Identity.SsoConfigurationActivated";

    /// <summary>Admin configured Tier 2 hosted Azure extractor (customer SP + subscription scope via WIF).</summary>
    public const string IntegrationHostedAzureExtractorConfigured = "Integration.HostedAzureExtractorConfigured";

    /// <summary>Admin created a tenant custom role.</summary>
    public const string IdentityCustomRoleCreated = "Identity.CustomRoleCreated";

    /// <summary>Admin updated a tenant custom role.</summary>
    public const string IdentityCustomRoleUpdated = "Identity.CustomRoleUpdated";

    /// <summary>Admin assigned a custom role to a directory user.</summary>
    public const string IdentityCustomRoleAssigned = "Identity.CustomRoleAssigned";

    /// <summary>Pilot <c>archlucid try --real</c>: POST execute received with pilot try header (real AOAI attempt).</summary>
    public const string FirstRealValueRunStarted = "FirstRealValueRunStarted";

    /// <summary>Pilot <c>archlucid try --real</c>: pilot-marked execute completed without throwing.</summary>
    public const string FirstRealValueRunCompleted = "FirstRealValueRunCompleted";

    /// <summary>Pilot <c>archlucid try --real</c>: development seed path recorded simulator substitution after AOAI failure.</summary>
    public const string FirstRealValueRunFellBackToSimulator = "FirstRealValueRunFellBackToSimulator";

    /// <summary>
    ///     After execute, coordinator promoted <c>dbo.Runs.LegacyRunStatus</c> to <c>ReadyForCommit</c> when Topology,
    ///     Cost, Compliance, and Critic each contributed exactly one persisted agent result (ADR-0012; distinct from golden
    ///     manifest finalize at commit).
    /// </summary>
    public const string RunLegacyReadyForCommitPromoted = "RunLegacyReadyForCommitPromoted";

    /// <summary>Inbound Jira webhook mapped an issue status to finding <c>HumanReviewStatus</c>.</summary>
    public const string IntegrationJiraIssueStatusSynced = "Integration.JiraIssueStatusSynced";

    /// <summary>Inbound ServiceNow webhook mapped an incident state to finding <c>HumanReviewStatus</c>.</summary>
    public const string IntegrationServiceNowIncidentStatusSynced = "Integration.ServiceNowIncidentStatusSynced";

    /// <summary>Inbound Jira webhook rejected — invalid payload, unknown status, missing finding, or other validation guard.</summary>
    public const string IntegrationJiraInboundWebhookRejected = "Integration.JiraInboundWebhookRejected";

    /// <summary>Inbound ServiceNow webhook rejected — invalid payload, unknown status, missing finding, or other validation guard.</summary>
    public const string IntegrationServiceNowInboundWebhookRejected = "Integration.ServiceNowInboundWebhookRejected";

    /// <summary>Inbound ITSM webhook body exceeded the configured UTF-8 size limit (vendor-agnostic).</summary>
    public const string IntegrationItsmInboundWebhookPayloadRejected = "Integration.ItsmInboundWebhookPayloadRejected";

    /// <summary>Operator registered a finding ↔ ITSM external key correlation for inbound webhooks.</summary>
    public const string IntegrationItsmFindingCorrelationRegistered = "Integration.ItsmFindingCorrelationRegistered";

    /// <summary>Outbound Jira issue create succeeded (payload: finding id, issue key; never secrets or full external URLs).</summary>
    public const string IntegrationJiraIssueCreateSucceeded = "Integration.JiraIssueCreateSucceeded";

    /// <summary>Outbound Jira issue create failed after vendor call or correlation persistence (payload: reason, status code when known).</summary>
    public const string IntegrationJiraIssueCreateFailed = "Integration.JiraIssueCreateFailed";

    /// <summary>Outbound Jira issue create skipped — unconfigured connector, missing project key, or informational severity dropped.</summary>
    public const string IntegrationJiraIssueCreateSkipped = "Integration.JiraIssueCreateSkipped";

    /// <summary>Outbound ServiceNow incident create succeeded.</summary>
    public const string IntegrationServiceNowIncidentCreateSucceeded = "Integration.ServiceNowIncidentCreateSucceeded";

    /// <summary>Outbound ServiceNow incident create failed after vendor call or correlation persistence.</summary>
    public const string IntegrationServiceNowIncidentCreateFailed = "Integration.ServiceNowIncidentCreateFailed";

    /// <summary>Outbound ServiceNow incident create skipped — unconfigured connector or prerequisite not met.</summary>
    public const string IntegrationServiceNowIncidentCreateSkipped = "Integration.ServiceNowIncidentCreateSkipped";

    /// <summary>Admin or CLI re-queued one or more integration outbox dead-letter rows for publish retry.</summary>
    public const string IntegrationOutboxDeadLetterRetried = "Integration.OutboxDeadLetterRetried";

    /// <summary>
    ///     Admin published the canonical first-value Markdown for a run as a new Confluence Cloud page (
    ///     <c>POST /v1/admin/integrations/confluence/first-value-report</c>). Payload: <c>runId</c>, <c>externalPageId</c>.
    /// </summary>
    public const string IntegrationConfluenceFirstValueReportPublished =
        "Integration.ConfluenceFirstValueReportPublished";

    /// <summary>
    ///     Canonical durable <c>dbo.AuditEvents</c> event types for architecture run-stage semantics (create, execute,
    ///     commit, failure).
    /// </summary>
    public static class Run
    {
        public const string Created = "Run.Created";

        public const string ExecuteStarted = "Run.ExecuteStarted";

        public const string ExecuteSucceeded = "Run.ExecuteSucceeded";

        public const string CommitCompleted = "Run.CommitCompleted";

        public const string Failed = "Run.Failed";

        /// <summary>Post-execute agent output quality gate blocked run completion for the workspace.</summary>
        public const string QualityGateRejected = "Run.QualityGateRejected";

        /// <summary>Operator or API requested retry of a failed run (same <c>RunId</c>).</summary>
        public const string RetryRequested = "Run.RetryRequested";
    }

    /// <summary>
    ///     Stable namespaced strings for trusted-baseline mutation audit (<c>IBaselineMutationAuditService</c> → structured
    ///     <c>ILogger</c> only).
    ///     They are <b>not</b> written to <c>dbo.AuditEvents</c>.
    /// </summary>
    /// <remarks>
    ///     <para>
    ///         Dual-written governance flows also call <c>IAuditService</c> with the top-level <c>GovernanceApproval*</c> /
    ///         <c>GovernanceManifestPromoted</c> / <c>GovernanceEnvironmentActivated</c> constants above.
    ///         Those durable <c>EventType</c> values (e.g. <c>GovernanceApprovalSubmitted</c>) differ from nested
    ///         <c>Governance.*</c> string values (e.g. <c>Governance.ApprovalRequestSubmitted</c>) by design — do not unify
    ///         without a migration plan for existing rows and log parsers.
    ///     </para>
    /// </remarks>
    public static class Baseline
    {
        /// <summary>Architecture run / string <c>RunId</c> workflow (authority <c>dbo.Runs</c>).</summary>
        public static class Architecture
        {
            public const string RunCreated = "Architecture.RunCreated";

            public const string RunStarted = "Architecture.RunStarted";

            public const string RunExecuteSucceeded = "Architecture.RunExecuteSucceeded";

            public const string RunCompleted = "Architecture.RunCompleted";

            public const string RunFailed = "Architecture.RunFailed";

            public const string RunQualityGateRejected = "Architecture.RunQualityGateRejected";
        }

        /// <summary>Governance workflow mutations when integrated with the trusted baseline (baseline log channel).</summary>
        public static class Governance
        {
            public const string ApprovalRequestSubmitted = "Governance.ApprovalRequestSubmitted";

            public const string ApprovalRequestApproved = "Governance.ApprovalRequestApproved";

            public const string ApprovalRequestRejected = "Governance.ApprovalRequestRejected";

            public const string ManifestPromoted = "Governance.ManifestPromoted";

            public const string EnvironmentActivated = "Governance.EnvironmentActivated";
        }
    }
}

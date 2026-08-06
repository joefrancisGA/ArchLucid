# Database table primary and foreign keys

Generated from canonical DDL: `ArchLucid.Persistence/Scripts/ArchLucid.sql`, supplemental migrations, and `ArchLucid.System.sql`.

**Notes**
- Many authority-chain FKs are added via `ALTER TABLE ... WITH NOCHECK` batches in `ArchLucid.sql` (DbUp 134/147 parity).
- `SchemaVersions` (DbUp journal) is omitted; it is infrastructure, not application data.
- Only declared SQL `PRIMARY KEY` and `FOREIGN KEY` constraints are listed.

**Tenant catalog tables:** 166
**System catalog tables:** 4

# Tenant / product catalog

## dbo.AdminNotifications

- **Primary key:** `(Id)`
- **Foreign keys:** none declared

## dbo.AdvisoryScanExecutions

- **Primary key:** `(ExecutionId)`
- **Foreign key:** `ScheduleId -> dbo.AdvisoryScanSchedules(ScheduleId)`

## dbo.AdvisoryScanSchedules

- **Primary key:** `(ScheduleId)`
- **Foreign keys:** none declared

## dbo.AgentEvaluations

- **Primary key:** `(EvaluationId)`
- **Foreign key:** `TargetAgentTaskId -> dbo.AgentTasks(TaskId)`

## dbo.AgentEvidencePackages

- **Primary key:** `(EvidencePackageId)`
- **Foreign key:** `RequestId -> dbo.ArchitectureRequests(RequestId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.AgentExecutionTraces

- **Primary key:** `(TraceId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`
- **Foreign key:** `TaskId -> dbo.AgentTasks(TaskId)`

## dbo.AgentOutputCalibrationSamples

- **Primary key:** `(SampleId)`
- **Foreign keys:** none declared

## dbo.AgentOutputEvaluationResults

- **Primary key:** `(EvaluationId)`
- **Foreign keys:** none declared

## dbo.AgentOutputEvaluations

- **Primary key:** `(EvaluationId)`
- **Foreign keys:** none declared

## dbo.AgentResultEnrichments

- **Primary key:** `(ResultId)`
- **Foreign key:** `ResultId -> dbo.AgentResults(ResultId)`

## dbo.AgentResults

- **Primary key:** `(ResultId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`
- **Foreign key:** `TaskId -> dbo.AgentTasks(TaskId)`

## dbo.AgentTasks

- **Primary key:** `(TaskId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.AgentToolInvocationRecords

- **Primary key:** `(InvocationRecordId)`
- **Foreign keys:** none declared

## dbo.AlertDeliveryAttempts

- **Primary key:** `(AlertDeliveryAttemptId)`
- **Foreign key:** `AlertId -> dbo.AlertRecords(AlertId)`
- **Foreign key:** `RoutingSubscriptionId -> dbo.AlertRoutingSubscriptions(RoutingSubscriptionId)`

## dbo.AlertRecords

- **Primary key:** `(AlertId)`
- **Foreign key:** `ComparedToRunId -> dbo.Runs(RunId)`
- **Foreign key:** `RecommendationId -> dbo.RecommendationRecords(RecommendationId)`
- **Foreign key:** `RuleId -> dbo.AlertRules(RuleId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.AlertRoutingSubscriptions

- **Primary key:** `(RoutingSubscriptionId)`
- **Foreign keys:** none declared

## dbo.AlertRules

- **Primary key:** `(RuleId)`
- **Foreign keys:** none declared

## dbo.ArchitectureDigests

- **Primary key:** `(DigestId)`
- **Foreign keys:** none declared

## dbo.ArchitectureRequests

- **Primary key:** `(RequestId)`
- **Foreign keys:** none declared

## dbo.ArchitectureReviewRecurrenceSchedules

- **Primary key:** `(ScheduleId)`
- **Foreign keys:** none declared

## dbo.ArchitectureRunIdempotency

- **Primary key:** `(TenantId, WorkspaceId, ProjectId, IdempotencyKeyHash)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.ArtifactBundleArtifactDecisionLinks

- **Primary key:** `(BundleId, ArtifactSortOrder, LinkSortOrder)`
- **Foreign key:** `BundleId, ArtifactSortOrder -> dbo.ArtifactBundleArtifacts(BundleId, SortOrder)`

## dbo.ArtifactBundleArtifactMetadata

- **Primary key:** `(BundleId, ArtifactSortOrder, MetaSortOrder)`
- **Foreign key:** `BundleId, ArtifactSortOrder -> dbo.ArtifactBundleArtifacts(BundleId, SortOrder)`

## dbo.ArtifactBundleArtifacts

- **Primary key:** `(BundleId, SortOrder)`
- **Foreign key:** `BundleId -> dbo.ArtifactBundles(BundleId)`

## dbo.ArtifactBundles

- **Primary key:** `(BundleId)`
- **Foreign key:** `ManifestId -> dbo.GoldenManifests(ManifestId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.ArtifactBundleTraceDecisionLinks

- **Primary key:** `(BundleId, SortOrder)`
- **Foreign key:** `BundleId -> dbo.ArtifactBundles(BundleId)`

## dbo.ArtifactBundleTraceGenerators

- **Primary key:** `(BundleId, SortOrder)`
- **Foreign key:** `BundleId -> dbo.ArtifactBundles(BundleId)`

## dbo.ArtifactBundleTraceNotes

- **Primary key:** `(BundleId, SortOrder)`
- **Foreign key:** `BundleId -> dbo.ArtifactBundles(BundleId)`

## dbo.AuditEvents

- **Primary key:** `(EventId)`
- **Foreign key:** `ManifestId -> dbo.GoldenManifests(ManifestId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.AuthorityPipelineTenantExecutionLease

- **Primary key:** `(RunId)`
- **Foreign keys:** none declared

## dbo.AuthorityPipelineWorkOutbox

- **Primary key:** `(OutboxId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.AzureExtractorPackages

- **Primary key:** `(PackageId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.BackfillCheckpoints

- **Primary key:** `(Stage)`
- **Foreign keys:** none declared

## dbo.BackfillFailures

- **Primary key:** `(Stage, EntityKey)`
- **Foreign keys:** none declared

## dbo.BackgroundJobs

- **Primary key:** `(JobId)`
- **Foreign keys:** none declared

## dbo.BillingSubscriptions

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.BillingSubscriptionStateHistory

- **Primary key:** `(HistoryId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.BillingWebhookEvents

- **Primary key:** `(EventId)`
- **Foreign keys:** none declared

## dbo.CommitRunIdempotency

- **Primary key:** `(TenantId, WorkspaceId, ProjectId, RunId, IdempotencyKeyHash)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.ComparisonRecords

- **Primary key:** `(ComparisonRecordId)`
- **Foreign key:** `LeftRunId -> dbo.Runs(RunId)`
- **Foreign key:** `RightRunId -> dbo.Runs(RunId)`

## dbo.CompositeAlertRuleConditions

- **Primary key:** `(ConditionId)`
- **Foreign key:** `CompositeRuleId -> dbo.CompositeAlertRules(CompositeRuleId)`

## dbo.CompositeAlertRules

- **Primary key:** `(CompositeRuleId)`
- **Foreign keys:** none declared

## dbo.ContextSnapshotCanonicalObjectProperties

- **Primary key:** `(CanonicalObjectRowId, PropertySortOrder)`
- **Foreign key:** `CanonicalObjectRowId -> dbo.ContextSnapshotCanonicalObjects(CanonicalObjectRowId)`

## dbo.ContextSnapshotCanonicalObjects

- **Primary key:** `(CanonicalObjectRowId)`
- **Foreign key:** `SnapshotId -> dbo.ContextSnapshots(SnapshotId)`

## dbo.ContextSnapshotErrors

- **Primary key:** `(SnapshotId, SortOrder)`
- **Foreign key:** `SnapshotId -> dbo.ContextSnapshots(SnapshotId)`

## dbo.ContextSnapshots

- **Primary key:** `(SnapshotId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.ContextSnapshotSourceHashes

- **Primary key:** `(SnapshotId, SortOrder)`
- **Foreign key:** `SnapshotId -> dbo.ContextSnapshots(SnapshotId)`

## dbo.ContextSnapshotWarnings

- **Primary key:** `(SnapshotId, SortOrder)`
- **Foreign key:** `SnapshotId -> dbo.ContextSnapshots(SnapshotId)`

## dbo.ConversationMessages

- **Primary key:** `(MessageId)`
- **Foreign key:** `ThreadId -> dbo.ConversationThreads(ThreadId)`

## dbo.ConversationThreads

- **Primary key:** `(ThreadId)`
- **Foreign keys:** none declared

## dbo.CorePilotTeamChecklist

- **Primary key:** `(TenantId, WorkspaceId, ProjectId, StepIndex)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.CosmosGraphSnapshotOutbox

- **Primary key:** `(OutboxId)`
- **Foreign keys:** none declared

## dbo.CustomRoles

- **Primary key:** `(Id)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.DataConsistencyQuarantine

- **Primary key:** `(QuarantineId)`
- **Foreign keys:** none declared

## dbo.DecisioningTraces

- **Primary key:** `(DecisionTraceId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.DecisionNodes

- **Primary key:** `(DecisionId)`
- **Foreign keys:** none declared

## dbo.DigestDeliveryAttempts

- **Primary key:** `(AttemptId)`
- **Foreign key:** `DigestId -> dbo.ArchitectureDigests(DigestId)`
- **Foreign key:** `SubscriptionId -> dbo.DigestSubscriptions(SubscriptionId)`

## dbo.DigestSubscriptions

- **Primary key:** `(SubscriptionId)`
- **Foreign keys:** none declared

## dbo.DraftRequests

- **Primary key:** `(DraftId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.EvidenceBundles

- **Primary key:** `(EvidenceBundleId)`
- **Foreign keys:** none declared

## dbo.EvolutionCandidateChangeSets

- **Primary key:** `(CandidateChangeSetId)`
- **Foreign key:** `SourcePlanId -> dbo.ProductLearningImprovementPlans(PlanId)`

## dbo.EvolutionSimulationRuns

- **Primary key:** `(SimulationRunId)`
- **Foreign key:** `CandidateChangeSetId -> dbo.EvolutionCandidateChangeSets(CandidateChangeSetId)`

## dbo.FindingFeedback

- **Primary key:** `(FeedbackId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.FindingProperties

- **Primary key:** `(FindingRecordId, PropertySortOrder)`
- **Foreign key:** `FindingRecordId -> dbo.FindingRecords(FindingRecordId)`

## dbo.FindingRecommendedActions

- **Primary key:** `(FindingRecordId, SortOrder)`
- **Foreign key:** `FindingRecordId -> dbo.FindingRecords(FindingRecordId)`

## dbo.FindingRecords

- **Primary key:** `(FindingRecordId)`
- **Foreign key:** `FindingsSnapshotId -> dbo.FindingsSnapshots(FindingsSnapshotId)`

## dbo.FindingRelatedNodes

- **Primary key:** `(FindingRecordId, SortOrder)`
- **Foreign key:** `FindingRecordId -> dbo.FindingRecords(FindingRecordId)`

## dbo.FindingReviewEvents

- **Primary key:** `(EventId)`
- **Foreign keys:** none declared

## dbo.FindingsSnapshots

- **Primary key:** `(FindingsSnapshotId)`
- **Foreign key:** `ContextSnapshotId -> dbo.ContextSnapshots(SnapshotId)`
- **Foreign key:** `GraphSnapshotId -> dbo.GraphSnapshots(GraphSnapshotId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.FindingTraceAlternativePaths

- **Primary key:** `(FindingRecordId, SortOrder)`
- **Foreign key:** `FindingRecordId -> dbo.FindingRecords(FindingRecordId)`

## dbo.FindingTraceDecisionsTaken

- **Primary key:** `(FindingRecordId, SortOrder)`
- **Foreign key:** `FindingRecordId -> dbo.FindingRecords(FindingRecordId)`

## dbo.FindingTraceGraphNodesExamined

- **Primary key:** `(FindingRecordId, SortOrder)`
- **Foreign key:** `FindingRecordId -> dbo.FindingRecords(FindingRecordId)`

## dbo.FindingTraceNotes

- **Primary key:** `(FindingRecordId, SortOrder)`
- **Foreign key:** `FindingRecordId -> dbo.FindingRecords(FindingRecordId)`

## dbo.FindingTraceRulesApplied

- **Primary key:** `(FindingRecordId, SortOrder)`
- **Foreign key:** `FindingRecordId -> dbo.FindingRecords(FindingRecordId)`

## dbo.FirstTenantFunnelEvents

- **Primary key:** `(EventId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.GoldenManifestAssumptions

- **Primary key:** `(ManifestId, SortOrder)`
- **Foreign key:** `ManifestId -> dbo.GoldenManifests(ManifestId)`

## dbo.GoldenManifestDecisionEvidenceLinks

- **Primary key:** `(ManifestId, DecisionId, SortOrder)`
- **Foreign key:** `ManifestId, DecisionId -> dbo.GoldenManifestDecisions(ManifestId, DecisionId)`

## dbo.GoldenManifestDecisionNodeLinks

- **Primary key:** `(ManifestId, DecisionId, SortOrder)`
- **Foreign key:** `ManifestId, DecisionId -> dbo.GoldenManifestDecisions(ManifestId, DecisionId)`

## dbo.GoldenManifestDecisions

- **Primary key:** `(ManifestId, SortOrder)`
- **Foreign key:** `ManifestId -> dbo.GoldenManifests(ManifestId)`

## dbo.GoldenManifestProvenanceAppliedRules

- **Primary key:** `(ManifestId, SortOrder)`
- **Foreign key:** `ManifestId -> dbo.GoldenManifests(ManifestId)`

## dbo.GoldenManifestProvenanceSourceFindings

- **Primary key:** `(ManifestId, SortOrder)`
- **Foreign key:** `ManifestId -> dbo.GoldenManifests(ManifestId)`

## dbo.GoldenManifestProvenanceSourceGraphNodes

- **Primary key:** `(ManifestId, SortOrder)`
- **Foreign key:** `ManifestId -> dbo.GoldenManifests(ManifestId)`

## dbo.GoldenManifests

- **Primary key:** `(ManifestId)`
- **Foreign key:** `ContextSnapshotId -> dbo.ContextSnapshots(SnapshotId)`
- **Foreign key:** `DecisionTraceId -> dbo.DecisioningTraces(DecisionTraceId)`
- **Foreign key:** `FindingsSnapshotId -> dbo.FindingsSnapshots(FindingsSnapshotId)`
- **Foreign key:** `GraphSnapshotId -> dbo.GraphSnapshots(GraphSnapshotId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.GoldenManifestWarnings

- **Primary key:** `(ManifestId, SortOrder)`
- **Foreign key:** `ManifestId -> dbo.GoldenManifests(ManifestId)`

## dbo.GovernanceApprovalRequests

- **Primary key:** `(ApprovalRequestId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.GovernanceEnvironmentActivations

- **Primary key:** `(ActivationId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.GovernancePromotionRecords

- **Primary key:** `(PromotionRecordId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.GraphSnapshotEdgeProperties

- **Primary key:** `(GraphSnapshotId, EdgeId, PropertySortOrder)`
- **Foreign key:** `GraphSnapshotId, EdgeId -> dbo.GraphSnapshotEdges(GraphSnapshotId, EdgeId)`

## dbo.GraphSnapshotEdges

- **Primary key:** `(GraphSnapshotId, EdgeId)`
- **Foreign key:** `GraphSnapshotId -> dbo.GraphSnapshots(GraphSnapshotId)`

## dbo.GraphSnapshotNodeProperties

- **Primary key:** `(GraphNodeRowId, PropertySortOrder)`
- **Foreign key:** `GraphNodeRowId -> dbo.GraphSnapshotNodes(GraphNodeRowId)`

## dbo.GraphSnapshotNodes

- **Primary key:** `(GraphNodeRowId)`
- **Foreign key:** `GraphSnapshotId -> dbo.GraphSnapshots(GraphSnapshotId)`

## dbo.GraphSnapshots

- **Primary key:** `(GraphSnapshotId)`
- **Foreign key:** `ContextSnapshotId -> dbo.ContextSnapshots(SnapshotId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.GraphSnapshotWarnings

- **Primary key:** `(GraphSnapshotId, SortOrder)`
- **Foreign key:** `GraphSnapshotId -> dbo.GraphSnapshots(GraphSnapshotId)`

## dbo.HostLeaderLeases

- **Primary key:** `(LeaseName)`
- **Foreign keys:** none declared

## dbo.HostLlmCostEstimationUsdRates

- **Primary key:** `(SingletonKey)`
- **Foreign keys:** none declared

## dbo.IdempotencyRecords

- **Primary key:** `(TenantId, IdempotencyKey)`
- **Foreign keys:** none declared

## dbo.IdentityUsers

- **Primary key:** `(Id)`
- **Foreign keys:** none declared

## dbo.ImportedArchitectureRequests

- **Primary key:** `(ImportId)`
- **Foreign keys:** none declared

## dbo.IntegrationEventOutbox

- **Primary key:** `(OutboxId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.InternalCrossTenantRollupDaily

- **Primary key:** `(RollupDate, AnalyticsTenantKey)`
- **Foreign keys:** none declared

## dbo.ItsmFindingCorrelations

- **Primary key:** `(CorrelationId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.LlmDailyTenantTokenWindowState

- **Primary key:** `(TenantId, UtcDay)`
- **Foreign keys:** none declared

## dbo.LlmJudgeDailyTenantTokenWindowState

- **Primary key:** `(TenantId, UtcDay)`
- **Foreign keys:** none declared

## dbo.LlmMonthlyTenantBudgetState

- **Primary key:** `(TenantId, UtcYear, UtcMonth)`
- **Foreign keys:** none declared

## dbo.LlmTenantWalletLedger

- **Primary key:** `(LedgerId)`
- **Foreign key:** `TenantId -> dbo.LlmTenantWalletState(TenantId)`

## dbo.LlmTenantWalletState

- **Primary key:** `(TenantId)`
- **Foreign keys:** none declared

## dbo.MarketingEarlyAccessRequests

- **Primary key:** `(Id)`
- **Foreign keys:** none declared

## dbo.MarketingPricingQuoteRequests

- **Primary key:** `(Id)`
- **Foreign keys:** none declared

## dbo.OperatorSavedViews

- **Primary key:** `(Id)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.PilotBaselines

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.PilotCloseouts

- **Primary key:** `(CloseoutId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.PlatformAuditEvents

- **Primary key:** `(EventId)`
- **Foreign keys:** none declared

## dbo.PolicyPackAssignments

- **Primary key:** `(AssignmentId)`
- **Foreign key:** `PolicyPackId -> dbo.PolicyPacks(PolicyPackId)`

## dbo.PolicyPackCatalogEntry

- **Primary key:** `(PolicyPackCatalogEntryId)`
- **Foreign keys:** none declared

## dbo.PolicyPackChangeLog

- **Primary key:** `(ChangeLogId)`
- **Foreign key:** `PolicyPackId -> dbo.PolicyPacks(PolicyPackId)`

## dbo.PolicyPacks

- **Primary key:** `(PolicyPackId)`
- **Foreign keys:** none declared

## dbo.PolicyPackVersions

- **Primary key:** `(PolicyPackVersionId)`
- **Foreign key:** `PolicyPackId -> dbo.PolicyPacks(PolicyPackId)`

## dbo.PostCommitProjectionOutbox

- **Primary key:** `(OutboxId)`
- **Foreign keys:** none declared

## dbo.ProductFeedback

- **Primary key:** `(FeedbackId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.ProductLearningImprovementPlanArchitectureRuns

- **Primary key:** `(PlanId, ArchitectureRunId)`
- **Foreign key:** `PlanId -> dbo.ProductLearningImprovementPlans(PlanId)`

## dbo.ProductLearningImprovementPlanArtifactLinks

- **Primary key:** `(LinkId)`
- **Foreign key:** `AuthorityBundleId, AuthorityArtifactSortOrder -> dbo.ArtifactBundleArtifacts(BundleId, SortOrder)`
- **Foreign key:** `PlanId -> dbo.ProductLearningImprovementPlans(PlanId)`

## dbo.ProductLearningImprovementPlans

- **Primary key:** `(PlanId)`
- **Foreign key:** `ThemeId -> dbo.ProductLearningImprovementThemes(ThemeId)`

## dbo.ProductLearningImprovementPlanSignalLinks

- **Primary key:** `(PlanId, SignalId)`
- **Foreign key:** `PlanId -> dbo.ProductLearningImprovementPlans(PlanId)`
- **Foreign key:** `SignalId -> dbo.ProductLearningPilotSignals(SignalId)`

## dbo.ProductLearningImprovementThemes

- **Primary key:** `(ThemeId)`
- **Foreign keys:** none declared

## dbo.ProductLearningPilotSignals

- **Primary key:** `(SignalId)`
- **Foreign keys:** none declared

## dbo.ProjectRoleAssignments

- **Primary key:** `(TenantId, ProjectId, UserId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`
- **Foreign key:** `UserId -> dbo.ScimUsers(Id)`

## dbo.Projects

- **Primary key:** `(Id)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`
- **Foreign key:** `WorkspaceId -> dbo.TenantWorkspaces(Id)`

## dbo.PromptVariants

- **Primary key:** `(VariantId)`
- **Foreign keys:** none declared

## dbo.ProvenanceSnapshots

- **Primary key:** `(Id)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.RecommendationLearningProfiles

- **Primary key:** `(ProfileId)`
- **Foreign keys:** none declared

## dbo.RecommendationRecords

- **Primary key:** `(RecommendationId)`
- **Foreign key:** `ComparedToRunId -> dbo.Runs(RunId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.RetrievalGroundingTrace

- **Primary key:** `(TraceId)`
- **Foreign keys:** none declared

## dbo.RetrievalIndexingOutbox

- **Primary key:** `(OutboxId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.RiskExceptions

- **Primary key:** `(RiskExceptionId)`
- **Foreign keys:** none declared

## dbo.RunExportBlobPushOutbox

- **Primary key:** `(OutboxId)`
- **Foreign keys:** none declared

## dbo.RunExportRecords

- **Primary key:** `(ExportRecordId)`
- **Foreign keys:** none declared

## dbo.Runs

- **Primary key:** `(RunId)`
- **Foreign keys:** none declared

## dbo.RunStageOutcomes

- **Primary key:** `(RunId, StageName)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.RunTelemetry

- **Primary key:** `(RunId)`
- **Foreign key:** `RunId -> dbo.Runs(RunId)`

## dbo.ScimGroupMembers

- **Primary key:** `(GroupId, UserId)`
- **Foreign key:** `GroupId -> dbo.ScimGroups(Id)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`
- **Foreign key:** `UserId -> dbo.ScimUsers(Id)`

## dbo.ScimGroups

- **Primary key:** `(Id)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.ScimTenantTokens

- **Primary key:** `(Id)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.ScimUsers

- **Primary key:** `(Id)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.SentEmails

- **Primary key:** `(IdempotencyKey)`
- **Foreign keys:** none declared

## dbo.StripeWebhookIdempotency

- **Primary key:** `(StripeEventId)`
- **Foreign keys:** none declared

## dbo.TenantCostSettings

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantCuratedEvidenceEntries

- **Primary key:** `(EntryId)`
- **Foreign keys:** none declared

## dbo.TenantExecDigestPreferences

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantHealthScores

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantHostedExtractorConfigurations

- **Primary key:** `(TenantId, SubscriptionId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantIdentityProviderConfigurations

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantItsmOutboundSettings

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantLifecycleTransitions

- **Primary key:** `(TransitionId)`
- **Foreign keys:** none declared

## dbo.TenantMarketingAttribution

- **Primary key:** `(TenantId)`
- **Foreign keys:** none declared

## dbo.TenantNotificationChannelPreferences

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantOnboardingState

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantSettings

- **Primary key:** `(TenantId, SettingKey)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantTeamsIncomingWebhookConnections

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantTrialSeatOccupants

- **Primary key:** `(TenantId, PrincipalKey)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantWorkspaces

- **Primary key:** `(Id)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.UsageEvents

- **Primary key:** `(Id)`
- **Foreign keys:** none declared

## dbo.UserCustomRoleAssignments

- **Primary key:** `(UserId, CustomRoleId)`
- **Foreign key:** `CustomRoleId -> dbo.CustomRoles(Id)`

## dbo.UserSettings

- **Primary key:** `(UserId, PreferenceKey)`
- **Foreign keys:** none declared

# System catalog

## dbo.Tenants

- **Primary key:** `(Id)`
- **Foreign keys:** none declared

## dbo.TenantDatabaseBindings

- **Primary key:** `(TenantId)`
- **Foreign key:** `TenantId -> dbo.Tenants(Id)`

## dbo.TenantDatabaseProvisioningJobs

- **Primary key:** `(JobId)`
- **Foreign key:** `TenantId -> dbo.TenantDatabaseBindings(TenantId)`

## dbo.WarmTenantCatalogStandby

- **Primary key:** `(StandbyId)`
- **Foreign keys:** none declared


// Run lifecycle orchestration composition registrations (extracted from PipelineCompositionModule).

using ArchLucid.Application;
using ArchLucid.Application.Advisory;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Alerts;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Authorization;
using ArchLucid.Application.Billing;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Configuration;
using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Application.DataConsistency;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Application.Integrations;
using ArchLucid.Application.Integrations.Confluence;
using ArchLucid.Application.Marketing;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Reports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Application.Search;
using ArchLucid.Application.Summaries;
using ArchLucid.Application.Support;
using ArchLucid.Application.Traceability;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Http;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Runs;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Marketing;
using ArchLucid.Host.Core.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Run create/execute orchestration, replay, manifest/diff exports, and operator lifecycle registrations.
/// </summary>
internal static class RunLifecycleOrchestrationCompositionRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<TechnologyLedgerRequestSeeder>();
        services.AddScoped<TechnologyLedgerEvidenceSeeder>();
        services.AddScoped<TechnologyLedgerTopologyProposalSeeder>();
        services.AddScoped<ITechnologyLedgerRunCommandService, TechnologyLedgerRunCommandService>();
        services.AddScoped<ICoverageQueryService, CoverageQueryService>();
        services.AddScoped<ICoveragePreviewService, CoveragePreviewService>();
        services.AddSingleton<IExaminationStateResolver, ExaminationStateResolver>();
        services.AddScoped<IArchitecturePostureService, ArchitecturePostureService>();
        services.AddSingleton<CoverageAssignmentValidator>();
        services.AddScoped<IArchitectureRunCommandService, ArchitectureRunCommandService>();
        services.AddScoped<Application.Runs.Query.IRunLifecycleCommandService, Application.Runs.Query.RunLifecycleCommandService>();
        services.AddScoped<Application.Runs.Query.IRunFindingsQueryService, Application.Runs.Query.RunFindingsQueryService>();
        services.AddScoped<ArchitectureRunCreateIdempotencyHelper>();
        services.AddScoped<ArchitectureRunCreatePersistenceHelper>();
        services.AddScoped<ArchitectureRunCreatePostCreateHooks>();
        services.AddScoped<ArchitectureRunExecutePostExecuteHooks>();
        services.AddScoped<IArchitectureRunCreateOrchestrator, ArchitectureRunCreateOrchestrator>();
        services.AddScoped<IArchitectureRunBatchCreateOrchestrator, ArchitectureRunBatchCreateOrchestrator>();
        services.AddScoped<IArchitectureRunExecuteOrchestrator, ArchitectureRunExecuteOrchestrator>();
        services.AddScoped<IArchitectureRunArchiveService, ArchitectureRunArchiveService>();
        services.Configure<RunExecuteOwnershipLeaseOptions>(
            configuration.GetSection(RunExecuteOwnershipLeaseOptions.SectionName));
        services.TryAddSingleton<IWorkerHostDrainGate, WorkerHostDrainGate>();
        services.AddScoped<IRunExecuteOwnershipLeaseService, RunExecuteOwnershipLeaseService>();
        services.AddScoped<IRunExecuteOwnershipReconciliationService, RunExecuteOwnershipReconciliationService>();
        services.AddScoped<IStaleInFlightRunRemediator, StaleInFlightRunRemediator>();
        services.AddScoped<IMissingArchitectureRequestRunRemediator, MissingArchitectureRequestRunRemediator>();
        services.AddScoped<IRunEngineProvenanceCaptureService, RunEngineProvenanceCaptureService>();
        services.AddScoped<IExecuteTimeGovernanceScopeCaptureService, ExecuteTimeGovernanceScopeCaptureService>();
        services.AddScoped<ISampleRunPurgeService, SampleRunPurgeService>();
        services.AddSingleton<IFindingTrustLabelMapper, FindingTrustLabelMapper>();
        services.AddSingleton<ICrossReviewFindingCorrelationService, CrossReviewFindingCorrelationService>();
        // Scoped, not singleton: unlike pure correlation this reads the tenant's finding review trail (TB-2194).
        services.AddScoped<ICrossReviewFindingLifecycleService, CrossReviewFindingLifecycleService>();
        services.AddScoped<IRunDetailQueryService, RunDetailQueryService>();
        services.AddScoped<IAuthorityRunDetailOperatorEnricher, AuthorityRunDetailOperatorEnricher>();
        services.AddScoped<IAgentOutputQualityGateOptionsResolver, AgentOutputQualityGateOptionsResolver>();
        services.AddScoped<IInsightDensityGateOptionsResolver, InsightDensityGateOptionsResolver>();
        services.AddScoped<ITenantAgentOutputQualityGateModeService, TenantAgentOutputQualityGateModeService>();
        services.AddScoped<ITenantFindingEngineControlsService, TenantFindingEngineControlsService>();
        services.AddScoped<IWorkspaceModelExecutionProfileService, WorkspaceModelExecutionProfileService>();
        services.AddScoped<IWorkspaceAllowedEngineSetService, WorkspaceAllowedEngineSetService>();
        services.AddScoped<IModelExecutionProfileResolver, ModelExecutionProfileResolver>();
        services.AddScoped<IReviewModelAliasResolver, ReviewModelAliasResolver>();
        services.AddScoped<IAgentModelCatalogEvaluationRecorder, AgentModelCatalogEvaluationRecorder>();
        services.AddScoped<IFaithfulnessHarnessSummaryReader, RepoFaithfulnessHarnessSummaryReader>();
        services.AddScoped<IAgentModelCatalogFaithfulnessHarnessImporter, AgentModelCatalogFaithfulnessHarnessImporter>();
        services.AddScoped<IExternalSubprocessorEngineAcknowledgmentService, ExternalSubprocessorEngineAcknowledgmentService>();
        services.AddScoped<IFeaturedCompletedSampleService, FeaturedCompletedSampleService>();
        services.AddScoped<IPilotRunDeltaComputer, PilotRunDeltaComputer>();
        services.AddScoped<IRecentPilotRunDeltasService, RecentPilotRunDeltasService>();
        services.AddScoped<IPolicyPackDryRunService, PolicyPackDryRunService>();
        services.AddScoped<IPolicyPackGovernanceDryRunService, PolicyPackGovernanceDryRunService>();
        services.AddSingleton<IPolicyPackSchemaKeysService, PolicyPackSchemaKeysService>();
        services.AddScoped<IPolicyPackContentAuthoringValidationService, PolicyPackContentAuthoringValidationService>();
        services.AddSingleton<IPolicyPackRuleTemplatesService, PolicyPackRuleTemplatesService>();
        services.AddSingleton<IEvidencePackSourceProvider, EmbeddedResourceEvidencePackSourceProvider>();
        services.AddSingleton<IEvidencePackBuilder, EvidencePackBuilder>();
        services.AddSingleton<ISupportBundleAssembler, SupportBundleAssembler>();
        services.AddScoped<ILlmMonthlyTenantDollarBudgetStatusService, LlmMonthlyTenantDollarBudgetStatusService>();
        services.AddScoped<IReferenceEvidenceAdminExportService, ReferenceEvidenceAdminExportService>();
        services.AddSingleton<IExecutionProvenanceFooterRenderer, ExecutionProvenanceFooterRenderer>();
        services.AddScoped<IGlobalSearchService, GlobalSearchService>();
        services.AddScoped<ICustomRoleService, CustomRoleService>();
        services.AddScoped<ICustomRolePermissionEvaluator, CustomRolePermissionEvaluator>();
        services.Configure<RecurrenceCompletionNotificationOptions>(
            configuration.GetSection(RecurrenceCompletionNotificationOptions.SectionName));
        services.AddScoped<IRecurrenceCompletionRecipientResolver, RecurrenceCompletionRecipientResolver>();
        services.AddScoped<IRecurrenceCompletionEmailDispatcher, RecurrenceCompletionEmailDispatcher>();
        services.AddScoped<IFindingRemediationAssignmentEmailDispatcher, FindingRemediationAssignmentEmailDispatcher>();
        services.AddScoped<IRecurrenceCompletionNotificationService, RecurrenceCompletionNotificationService>();
        services.Configure<WaiverExpiryNotificationOptions>(
            configuration.GetSection(WaiverExpiryNotificationOptions.SectionName));
        services.AddScoped<IWaiverExpiryNotificationService, WaiverExpiryNotificationService>();
        services.AddScoped<IReviewsAwaitingActionQueryService, ReviewsAwaitingActionQueryService>();
        services.AddScoped<IRecurringArchitectureReviewTriggerService, RecurringArchitectureReviewTriggerService>();
        services
            .AddHttpClient<IPublisherConnector, ConfluenceCloudPublisherConnector>(
                static client => client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.ExternalIntegration))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services.AddScoped<IConfluencePublishingHttpAuthenticator, ConfluencePublishingHttpAuthenticator>();
        services.AddScoped<IOperatorNextBestActionService, OperatorNextBestActionService>();
        services.AddScoped<IConnectorOperationsSummaryReader, ConnectorOperationsSummaryReader>();
        services.AddScoped<IWeeklyDigestHealthReader, WeeklyDigestHealthReader>();
        services.AddScoped<IAlertActionLoopReader, AlertActionLoopReader>();
        services.AddScoped<IPilotReportCardService, PilotReportCardService>();
        services.AddScoped<PilotOutcomeSummaryService>();
        services.TryAddSingleton<IInstrumentationCounterSnapshotProvider, MeterListenerCounterSnapshotProvider>();
        services.AddScoped<IFindingReviewTrailAppendService, FindingReviewTrailAppendService>();
        services.AddScoped<IFindingDispositionService, FindingDispositionService>();
        services.AddScoped<IRunOperatorGovernanceDispositionService, RunOperatorGovernanceDispositionService>();
        services.AddScoped<IAgentToolInvocationRecordWriter, AgentToolInvocationRecordWriter>();
        services.AddScoped<IRiskExceptionService, RiskExceptionService>();
        services.AddScoped<IArchitectureRiskRegisterService, ArchitectureRiskRegisterService>();
        services.AddScoped<IArchitectureDecisionRegisterService, ArchitectureDecisionRegisterService>();
        services.AddScoped<IGovernanceDigestDecisionNeededComposer, GovernanceDigestDecisionNeededComposer>();
        services.AddScoped<IPilotsApplicationService, PilotsApplicationService>();
        services.AddScoped<IComparisonsApplicationService, ComparisonsApplicationService>();
        services.AddScoped<ITraceabilityBundleExportApplicationService, TraceabilityBundleExportApplicationService>();
        services.AddScoped<IDemoSeedRunResolver, DemoSeedRunResolver>();
        services.AddScoped<IDemoReadModelClient, DemoReadModelClient>();
        services.AddScoped<IDemoCommitPagePreviewClient, DemoCommitPagePreviewClient>();
        services.AddScoped<IPublicShowcaseCommitPageClient, PublicShowcaseCommitPageClient>();
        services.AddScoped<IRunRationaleService, RunRationaleService>();
        services.AddScoped<IArchitectureRunProvenanceService, ArchitectureRunProvenanceService>();
        services.AddScoped<IReplayRunService, ReplayRunService>();
        services.AddSingleton<ArchitectureRunAsyncOperationQueue>();
        services.AddSingleton<IArchitectureRunAsyncOperationQueue>(static sp =>
            sp.GetRequiredService<ArchitectureRunAsyncOperationQueue>());
        services.AddSingleton<IArchitectureRunAsyncOperationRegistrar, ArchitectureRunAsyncOperationRegistrar>();
        services.AddScoped<IArchitectureRunAsyncCreateAdmitter, ArchitectureRunAsyncCreateAdmitter>();
        services.AddScoped<IArchitectureRunAsyncOperationAcceptor, ArchitectureRunAsyncOperationAcceptor>();
        services.AddHostedService<ArchitectureRunAsyncOperationHostedService>();
        services.AddScoped<IDeterminismCheckService, DeterminismCheckService>();
        services.AddScoped<IExportReplayService, ExportReplayService>();
        services.AddScoped<IArchitectureKnowledgeModelIntakeBuilder, ArchitectureKnowledgeModelIntakeBuilder>();
        services.AddScoped<IArchitectureSynthesisKernel, ArchitectureSynthesisKernel>();
        services.AddScoped<IArchitectureIdentityService, ArchitectureIdentityService>();
        services.AddScoped<IWorkspaceSystemNameCollisionGuard, WorkspaceSystemNameCollisionGuard>();
        services.AddScoped<IHolisticCriticService, HolisticCriticService>();
        services.Configure<GenerateRunSummaryOptions>(
            configuration.GetSection(GenerateRunSummaryOptions.SectionPath));
        services.AddScoped<IRunSummaryOnePagerExportService, RunSummaryOnePagerExportService>();
        services.AddScoped<IAgentExecutorResolver, DefaultAgentExecutorResolver>();
        services.AddScoped<IDiagramGenerator, MermaidDiagramGenerator>();
        services.AddScoped<IManifestDiagramService, ManifestDiagramService>();
        services.AddScoped<IEvidenceSummaryFormatter, MarkdownEvidenceSummaryFormatter>();
        services.AddScoped<IManifestSummaryGenerator, MarkdownManifestSummaryGenerator>();
        services.AddScoped<IManifestSummaryService, ManifestSummaryService>();
        services.AddScoped<IArchitectureExportService, MarkdownArchitectureExportService>();
        services.AddScoped<ArchitectureReviewDocxBuilder>();
        services.AddScoped<ArchitectureReviewPdfBuilder>();
        services.AddScoped<IArchitectureReviewExportService, ArchitectureReviewExportService>();
        services.AddScoped<IManifestDiffService, ManifestDiffService>();
        services.AddScoped<IManifestDiffSummaryFormatter, MarkdownManifestDiffSummaryFormatter>();
        services.AddScoped<IManifestDiffExportService, MarkdownManifestDiffExportService>();
        services.AddScoped<IAgentResultDiffService, AgentResultDiffService>();
        services.AddScoped<IAgentResultDiffSummaryFormatter, MarkdownAgentResultDiffSummaryFormatter>();
        services.AddScoped<IExportRecordDiffService, ExportRecordDiffService>();
        services.AddScoped<IExportRecordDiffSummaryFormatter, MarkdownExportRecordDiffSummaryFormatter>();
        services.AddScoped<IExportRecordDiffExportService, ExportRecordDiffExportService>();
        services.AddScoped<IDriftReportFormatter, MarkdownDriftReportFormatter>();
        services.AddScoped<DriftReportDocxExport>();
    }
}

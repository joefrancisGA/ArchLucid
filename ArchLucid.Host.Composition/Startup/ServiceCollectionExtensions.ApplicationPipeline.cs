using ArchLucid.Application.OperatorHome;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Common;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Application.Advisory;
using ArchLucid.Application.Alerts;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Integrations;
using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Application.Evolution;
using ArchLucid.Application.SponsorReport;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.DataConsistency;
using ArchLucid.Application.Integrations.Confluence;
using ArchLucid.Host.Core.Http;
using ArchLucid.Application.Billing;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Application.Marketing;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Configuration;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Authorization;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Reports;
using ArchLucid.Core.Scoping;
using ArchLucid.Application.Search;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Core.Runs;
using ArchLucid.Application.Summaries;
using ArchLucid.Application.Support;
using ArchLucid.Application.Traceability;
using ArchLucid.Application.Trust;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Application.Value;
using ArchLucid.ContextIngestion.Canonicalization;

using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Contracts;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.ContextIngestion.Services;
using ArchLucid.ContextIngestion.Summaries;
using ArchLucid.ContextIngestion.Topology;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.ValueReports;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Marketing;
using ArchLucid.Host.Core.Services;
using ArchLucid.KnowledgeGraph.Caching;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Services;
using ArchLucid.Persistence.Coordination.Caching;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

using ContextConnector = ArchLucid.ContextIngestion.Interfaces.IContextConnector;
using ContextIngestionService = ArchLucid.Contracts.Persistence.Ports.IContextIngestionService;
using GraphBuilder = ArchLucid.KnowledgeGraph.Interfaces.IGraphBuilder;
using KnowledgeGraphLimitsOptions = ArchLucid.KnowledgeGraph.Configuration.KnowledgeGraphLimitsOptions;
using KnowledgeGraphProjectionCacheOptions = ArchLucid.KnowledgeGraph.Configuration.KnowledgeGraphProjectionCacheOptions;
using KnowledgeGraphService = ArchLucid.Core.Persistence.Ports.IKnowledgeGraphService;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterRunExportAndArchitectureAnalysis(IServiceCollection services, IConfiguration configuration)
    {
        ArchLucidOptions exportStorage = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsInMemory(exportStorage.StorageProvider))

            services.AddSingleton<IRunExportRecordRepository, InMemoryRunExportRecordRepository>();

        else

            services.AddScoped<IRunExportRecordRepository, RunExportRecordRepository>();


        services.AddScoped<IRunExportAuditService, RunExportAuditService>();
        services.AddScoped<IArchitectureApplicationService, ArchitectureApplicationService>();
        services.AddScoped<IArchitectureAnalysisService, ArchitectureAnalysisService>();
        services.AddScoped<IShadowExecutionService, ShadowExecutionService>();
        services.AddScoped<ISimulationEvaluationService, SimulationEvaluationService>();
        services.AddScoped<IArchitectureAnalysisExportService, MarkdownArchitectureAnalysisExportService>();
        bool mermaidCliEnabled = configuration.GetValue("ArchLucid:MermaidCli:Enabled", false);

        if (mermaidCliEnabled)

            services.AddScoped<IDiagramImageRenderer, MermaidCliDiagramImageRenderer>();

        else

            services.AddScoped<IDiagramImageRenderer, NullDiagramImageRenderer>();

        services.AddScoped<IArchitectureAnalysisDocxExportService, DocxArchitectureAnalysisExportService>();
        services.Configure<ConsultingDocxTemplateOptions>(configuration.GetSection("ConsultingDocxTemplate"));
        services.AddScoped<IConsultingDocxTemplateOptionsProvider, DefaultConsultingDocxTemplateOptionsProvider>();
        services.AddScoped<IDocumentLogoProvider, FileSystemDocumentLogoProvider>();
        services.AddScoped<IArchitectureAnalysisConsultingDocxExportService, ConsultingDocxArchitectureAnalysisExportService>();
        services.AddSingleton<IConsultingDocxTemplateProfileResolver, DefaultConsultingDocxTemplateProfileResolver>();
        services.AddScoped<IConsultingDocxTemplateRecommendationService, ConsultingDocxTemplateRecommendationService>();
        services.AddScoped<IConsultingDocxExportProfileSelector, ConsultingDocxExportProfileSelector>();
        services.AddScoped<IEndToEndReplayComparisonService, EndToEndReplayComparisonService>();
        services.AddScoped<IEndToEndReplayComparisonSummaryFormatter, MarkdownEndToEndReplayComparisonSummaryFormatter>();
        services.AddScoped<IEndToEndReplayComparisonExportService, EndToEndReplayComparisonExportService>();
        services.AddHttpClient(RunExportBlobPushService.HttpClientName, static client =>
        {
            client.Timeout = TimeSpan.FromMinutes(5);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<IRunExportBlobPushService, RunExportBlobPushService>();
        services.AddScoped<IRunExportAuthorityMaterialLoader, RunExportAuthorityMaterialLoader>();
        services.AddScoped<IRunExportPackageBuilder, RunExportPackageBuilder>();
        services.AddScoped<IRunExportLineageVerifier, RunExportLineageVerifier>();
        services.Configure<TerraformGitHubPrOptions>(
            configuration.GetSection(TerraformGitHubPrOptions.SectionPath));
        services.AddHttpClient(TerraformGitHubPrService.HttpClientName, static client =>
        {
            client.BaseAddress = new Uri("https://api.github.com/");
            client.Timeout = TimeSpan.FromSeconds(60);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<ITerraformGitHubPrService, TerraformGitHubPrService>();
    }

    private static void RegisterComparisonReplayAndDrift(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ReplayDiagnosticsOptions>(configuration.GetSection(ReplayDiagnosticsOptions.SectionName));

        ArchLucidOptions storageMode = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsInMemory(storageMode.StorageProvider))

            services.AddSingleton<IComparisonRecordRepository, InMemoryComparisonRecordRepository>();

        else

            services.AddScoped<IComparisonRecordRepository, ComparisonRecordRepository>();


        services.AddScoped<IComparisonAuditService, ComparisonAuditService>();
        services.AddScoped<IComparisonDriftAnalyzer, ComparisonDriftAnalyzer>();
        services.AddScoped<IComparisonReplayService, ComparisonReplayService>();
        services.AddScoped<IComparisonReplayCostEstimator, ComparisonReplayCostEstimator>();
        services.AddScoped<IComparisonReplayApiService, ComparisonReplayApiService>();
        services.AddScoped<IComparisonDriftReportExportService, ComparisonDriftReportExportService>();
        services.AddSingleton<IReplayDiagnosticsRecorder, ReplayDiagnosticsRecorder>();
    }

    private static void RegisterRunReplayManifestAndDiffs(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IActorContext, HttpActorContext>();
        services.AddScoped<IBaselineMutationAuditService, BaselineMutationAuditService>();
        services.Configure<PreCommitGovernanceGateOptions>(
            configuration.GetSection(PreCommitGovernanceGateOptions.SectionPath));
        services.Configure<TechnologyConsistencyFindingEngineOptions>(
            configuration.GetSection(TechnologyConsistencyFindingEngineOptions.SectionPath));
        services.Configure<TechnologyLedgerArtifactLintOptions>(
            configuration.GetSection(TechnologyLedgerArtifactLintOptions.SectionPath));
        services.Configure<AuthorityCommitSchemaValidationOptions>(
            configuration.GetSection(AuthorityCommitSchemaValidationOptions.SectionPath));
        services.Configure<ArchitectureRunCreateOptions>(
            configuration.GetSection(ArchitectureRunCreateOptions.SectionPath));
        services.AddScoped<IPreCommitGovernanceGate, PreCommitGovernanceGate>();
        services.AddScoped<ITechnologyConsistencyFindingEngine, TechnologyConsistencyFindingEngine>();
        services.AddScoped<ICommittedEffectiveGovernanceSnapshotCapturer, CommittedEffectiveGovernanceSnapshotCapturer>();
        services.AddScoped<ICommittedReviewStandardsSnapshotCapturer, CommittedReviewStandardsSnapshotCapturer>();
        services.AddScoped<IManifestFinalizationService, ManifestFinalizationService>();
        services.AddSingleton<DefaultRequestContentSafetyPrecheck>();
        services.AddSingleton<LlmSemanticAdmissionGate>();
        services.AddSingleton<IRequestContentSafetyPrecheck>(sp => new CompositeRequestContentSafetyPrecheck(
        [
            sp.GetRequiredService<DefaultRequestContentSafetyPrecheck>(),
            sp.GetRequiredService<LlmSemanticAdmissionGate>()
        ]));
        services.Configure<EvidenceInjectionMitigationOptions>(
            configuration.GetSection(EvidenceInjectionMitigationOptions.SectionPath));
        services.AddSingleton<IEvidencePackageInjectionMitigator, EvidencePackageInjectionMitigator>();
        services.Configure<SupportBundleOptions>(configuration.GetSection(SupportBundleOptions.SectionPath));
        services.AddSingleton<IRunStateTransitionService, RunStateTransitionService>();
        services.AddScoped<IDraftAdmissionGate, DraftAdmissionGate>();
        services.AddScoped<IQuestionSelectionEngine, QuestionSelectionEngine>();
        services.AddScoped<IDraftRequestProjector, DraftRequestProjector>();
        services.AddScoped<IPriorPackageSemanticMergeService, PriorPackageSemanticMergeService>();
        services.AddScoped<IDraftRequestService, DraftRequestService>();
        services.AddScoped<IDecisionReceiptService, DecisionReceiptService>();
        services.AddScoped<IDraftIntakeReaperService, DraftIntakeReaperService>();
        services.AddScoped<ArchLucid.Decisioning.Feasibility.IDecisionIntakeTrailProvider,
            ArchLucid.Application.Runs.Feasibility.ArchitectureRequestIntakeTrailProvider>();
        services.AddScoped<TechnologyLedgerRequestSeeder>();
        services.AddScoped<TechnologyLedgerEvidenceSeeder>();
        services.AddScoped<TechnologyLedgerTopologyProposalSeeder>();
        services.AddScoped<ITechnologyLedgerRunCommandService, TechnologyLedgerRunCommandService>();
        services.AddScoped<ICoverageQueryService, CoverageQueryService>();
        services.AddSingleton<CoverageAssignmentValidator>();
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
        // ADR 0030 PR A3 (2026-04-24): the legacy ArchitectureRunCommitOrchestrator + RunCommitPathSelector
        // + LegacyRunCommitPathOptions were deleted. The authority-driven orchestrator is the single commit implementation.
        services.AddScoped<PostCommitProjectionEnqueuer>();
        services.Configure<GraphMergeRuntimeInvariantOptions>(
            configuration.GetSection(GraphMergeRuntimeInvariantOptions.SectionName));
        services.AddScoped<IGraphMergeRuntimeInvariantReporter, GraphMergeRuntimeInvariantReporter>();
        services.AddScoped<IDecisionEngineV2NodeMaterializer, DecisionEngineV2NodeMaterializer>();
        services.AddScoped<IArchitectureRunCommitOrchestrator, AuthorityDrivenArchitectureRunCommitOrchestrator>();
        services.AddScoped<ICommitPipelineManifestReuseService, CommitPipelineManifestReuseService>();
        services.AddScoped<ICommitOutputIntegrityService, CommitOutputIntegrityService>();
        services.AddScoped<ArchLucid.Application.Runs.Orchestration.Events.IReviewCompletedEventHandler, ArchLucid.Application.Runs.Orchestration.Events.ReviewCompletedEventHandler>();
        services.AddScoped<ISampleRunPurgeService, SampleRunPurgeService>();
        services.AddSingleton<IFindingTrustLabelMapper, FindingTrustLabelMapper>();
        services.AddSingleton<ICrossReviewFindingCorrelationService, CrossReviewFindingCorrelationService>();
        // Scoped, not singleton: unlike pure correlation this reads the tenant's finding review trail (TB-2194).
        services.AddScoped<ICrossReviewFindingLifecycleService, CrossReviewFindingLifecycleService>();
        services.AddScoped<IRunDetailQueryService, RunDetailQueryService>();
        services.AddScoped<IAuthorityRunDetailOperatorEnricher, AuthorityRunDetailOperatorEnricher>();
        services.Configure<RunRoiEstimatorOptions>(configuration.GetSection(RunRoiEstimatorOptions.SectionPath));
        services.AddScoped<IRunRoiEstimator, RunRoiEstimator>();
        services.AddScoped<ITraceabilityBundleBuilder, TraceabilityBundleBuilder>();
        services.AddScoped<IFindingEvidenceChainService, FindingEvidenceChainService>();
        services.AddScoped<IRunRetrievalGroundingService, RunRetrievalGroundingService>();
        services.AddScoped<IRunTrustEvidenceCardBuilder, RunTrustEvidenceCardBuilder>();
        services.AddScoped<IFindingLlmAuditService, FindingLlmAuditService>();
        services.AddScoped<IAgentOutputQualityGateOptionsResolver, AgentOutputQualityGateOptionsResolver>();
        services.AddScoped<ITenantAgentOutputQualityGateModeService, TenantAgentOutputQualityGateModeService>();
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
        services.AddSingleton<IExecutionProvenanceFooterRenderer,
            ExecutionProvenanceFooterRenderer>();
        services.AddScoped<FirstValueReportBuilder>();
        services.AddScoped<IFirstValueReportBuilder>(static sp => sp.GetRequiredService<FirstValueReportBuilder>());
        services.AddScoped<SponsorReviewPacketBuilder>();
        services.AddScoped<ISponsorReviewPacketBuilder>(static sp => sp.GetRequiredService<SponsorReviewPacketBuilder>());
        services.AddScoped<ISponsorReportService, SponsorReportService>();
        services.AddScoped<ITenantEstimatedUsdSavingsResolver, TenantEstimatedUsdSavingsResolver>();
        services.AddScoped<IGlobalSearchService, GlobalSearchService>();
        services.AddScoped<ICustomRoleService, CustomRoleService>();
        services.AddScoped<ICustomRolePermissionEvaluator, CustomRolePermissionEvaluator>();
        services.AddScoped<SponsorRoiTenantPricingContextResolver>();
        services.AddScoped<RoiCostEvidenceCollectionResolver>();
        services.AddScoped<RoiCostEvidenceFreshnessEvaluator>();
        services.AddScoped<SponsorRoiPricingLabelResolver>();
        services.AddScoped<SponsorRoiSummaryService>();
        services.AddScoped<ISponsorRoiSummaryService>(static sp =>
            new CachingSponsorRoiSummaryService(
                sp.GetRequiredService<SponsorRoiSummaryService>(),
                sp.GetRequiredService<IRiskExceptionService>(),
                sp.GetRequiredService<IArchitectureRiskRegisterService>(),
                sp.GetRequiredService<IHotPathReadCache>(),
                sp.GetRequiredService<IScopeContextProvider>(),
                sp.GetRequiredService<IOptionsMonitor<SponsorRoiCacheWarmupOptions>>()));
        services.AddScoped<SponsorRoiBoardPackPdfBuilder>();
        services.AddScoped<SponsorRoiBoardPackNarrativeBuilder>();
        services.AddScoped<ISponsorRoiBoardPackExporter, SponsorRoiBoardPackExporter>();
        services.Configure<RoiBoardPackNarrativeOptions>(
            configuration.GetSection(RoiBoardPackNarrativeOptions.SectionPath));
        services.Configure<SponsorRoiCacheWarmupOptions>(
            configuration.GetSection(SponsorRoiCacheWarmupOptions.SectionPath));
        services.Configure<SponsorRoiSavingsGaugeOptions>(
            configuration.GetSection(SponsorRoiSavingsGaugeOptions.SectionPath));
        services.Configure<RoiCostEvidenceFreshnessOptions>(
            configuration.GetSection(RoiCostEvidenceFreshnessOptions.SectionPath));
        services.AddScoped<ISponsorReportsSummaryService, SponsorReportsSummaryService>();
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
        services.AddScoped<IConfluenceFirstValueReportPublisher, ConfluenceFirstValueReportPublisher>();
        services.AddScoped<FirstValueReportPdfBuilder>();
        services.AddScoped<WhyArchLucidPackPdfBuilder>();
        services.AddScoped<SponsorBriefPdfBuilder>();
        services.AddScoped<PilotScorecardBuilder>();
        services.AddScoped<IPilotInProductScorecardService, PilotInProductScorecardService>();
        services.AddScoped<IOperatorNextBestActionService, OperatorNextBestActionService>();
        services.AddScoped<IConnectorOperationsSummaryReader, ConnectorOperationsSummaryReader>();
        services.AddScoped<IWeeklyDigestHealthReader, WeeklyDigestHealthReader>();
        services.AddScoped<IAlertActionLoopReader, AlertActionLoopReader>();
        services.AddScoped<IPilotReportCardService, PilotReportCardService>();
        services.AddScoped<PilotOutcomeSummaryService>();
        services.AddScoped<SponsorOnePagerPdfBuilder>();
        services.AddScoped<BoardPackPdfBuilder>();
        services.TryAddSingleton<IInstrumentationCounterSnapshotProvider, MeterListenerCounterSnapshotProvider>();
        services.AddScoped<IWhyArchLucidSnapshotService, WhyArchLucidSnapshotService>();
        services.AddScoped<IFindingReviewTrailAppendService, FindingReviewTrailAppendService>();
        services.AddScoped<IFindingDispositionService, FindingDispositionService>();
        services.AddScoped<IRunOperatorGovernanceDispositionService, RunOperatorGovernanceDispositionService>();
        services.AddScoped<IAgentToolInvocationRecordWriter, AgentToolInvocationRecordWriter>();
        services.AddScoped<IRiskExceptionService, RiskExceptionService>();
        services.AddScoped<IRealizedValueAttestationService, RealizedValueAttestationService>();
        services.AddScoped<IBuyerProofPackBuilder, BuyerProofPackBuilder>();
        services.AddScoped<ITenantLlmCostTopRunRanker, TenantLlmCostTopRunRanker>();
        services.AddScoped<ITenantLlmCostReportingService, TenantLlmCostReportingService>();
        services.AddScoped<IAdminFleetLlmCogsService, AdminFleetLlmCogsService>();
        services.AddScoped<IArchitectureRiskRegisterService, ArchitectureRiskRegisterService>();
        services.AddScoped<IArchitectureDecisionRegisterService, ArchitectureDecisionRegisterService>();
        services.AddScoped<IGovernanceDigestDecisionNeededComposer, GovernanceDigestDecisionNeededComposer>();
        services.AddScoped<ISponsorEvidencePackService, SponsorEvidencePackService>();
        services.AddScoped<IPilotValueReportService, PilotValueReportService>();
        services.AddScoped<IPilotValueReportMarkdownFormatter, PilotValueReportMarkdownFormatter>();
        services.AddScoped<ValueReportSnapshotMarkdownFormatter>();
        services.AddScoped<ITenantMeasuredRoiService, TenantMeasuredRoiService>();
        services.AddScoped<IDemoSeedRunResolver, DemoSeedRunResolver>();
        services.AddScoped<IDemoReadModelClient, DemoReadModelClient>();
        services.AddScoped<IDemoCommitPagePreviewClient, DemoCommitPagePreviewClient>();
        services.AddScoped<IPublicShowcaseCommitPageClient, PublicShowcaseCommitPageClient>();
        services.Configure<ValueReportComputationOptions>(
            configuration.GetSection(ValueReportComputationOptions.SectionPath));
        services.AddScoped<ValueReportBuilder>();
        services.AddSingleton<IValueReportJobQueue, InMemoryValueReportJobQueue>();
        services.AddScoped<IRunRationaleService, RunRationaleService>();
        services.AddScoped<IArchitectureRunProvenanceService, ArchitectureRunProvenanceService>();
        services.AddScoped<IReplayRunService, ReplayRunService>();
        services.AddSingleton<ArchitectureRunAsyncOperationQueue>();
        services.AddSingleton<IArchitectureRunAsyncOperationQueue>(static sp =>
            sp.GetRequiredService<ArchitectureRunAsyncOperationQueue>());
        services.AddSingleton<IArchitectureRunAsyncOperationRegistrar, ArchitectureRunAsyncOperationRegistrar>();
        services.AddScoped<IArchitectureRunAsyncOperationAcceptor, ArchitectureRunAsyncOperationAcceptor>();
        services.AddHostedService<ArchitectureRunAsyncOperationHostedService>();
        services.AddScoped<IDeterminismCheckService, DeterminismCheckService>();
        services.AddScoped<IExportReplayService, ExportReplayService>();
        services.AddScoped<IArchitectureRequestDraftService, ArchitectureRequestDraftService>();
        services.AddScoped<IStructuredBriefSuggestionExplainService, StructuredBriefSuggestionExplainService>();
        services.AddScoped<IArchitectureSynthesisKernel, ArchitectureSynthesisKernel>();
        services.AddScoped<IWorkspaceSystemNameCollisionGuard, WorkspaceSystemNameCollisionGuard>();
        services.AddScoped<IChatIntakeParserService, ChatIntakeParserService>();
        services.AddHttpClient(GitTerraformContentFetcher.HttpClientName)
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<IGitTerraformContentFetcher, GitTerraformContentFetcher>();
        services.AddScoped<IConnectorIntakeParserService, ConnectorIntakeParserService>();
        services.AddScoped<IPolicyPackDraftService, PolicyPackDraftService>();
        services.AddScoped<ICuratedRulesDocumentValidationService, CuratedRulesDocumentValidationService>();
        services.AddScoped<IPolicyPackGeneratorService, PolicyPackGeneratorService>();
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

    private static void RegisterContextIngestionAndKnowledgeGraph(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<KnowledgeGraphLimitsOptions>(
            configuration.GetSection(KnowledgeGraphLimitsOptions.SectionName));
        services.Configure<KnowledgeGraphProjectionCacheOptions>(
            configuration.GetSection(KnowledgeGraphProjectionCacheOptions.SectionName));
        services.AddSingleton<IValidateOptions<KnowledgeGraphProjectionCacheOptions>, KnowledgeGraphProjectionCacheOptionsValidator>();
        services.TryAddSingleton<IMemoryCache>(_ => new MemoryCache(new MemoryCacheOptions { SizeLimit = 1000 }));
        services.TryAddSingleton<IGraphProjectionCacheInvalidationBroadcaster>(
            NullGraphProjectionCacheInvalidationBroadcaster.Instance);
        services.TryAddSingleton<IGraphSnapshotProjectionCache>(static sp =>
        {
            IConfiguration configuration = sp.GetRequiredService<IConfiguration>();
            IOptionsMonitor<KnowledgeGraphProjectionCacheOptions> monitor =
                sp.GetRequiredService<IOptionsMonitor<KnowledgeGraphProjectionCacheOptions>>();
            KnowledgeGraphProjectionCacheOptions opts = monitor.CurrentValue;

            if (!opts.Enabled)
                return NonCachingGraphSnapshotProjectionCache.Instance;

            HotPathCacheOptions hotPath =
                configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>()
                ?? new HotPathCacheOptions();

            bool redisConfigured = !string.IsNullOrWhiteSpace(opts.RedisConnectionString)
                || !string.IsNullOrWhiteSpace(configuration["HotPathCache:RedisConnectionString"])
                || !string.IsNullOrWhiteSpace(configuration["LlmCompletionCache:RedisConnectionString"]);

            GraphProjectionCacheBackend effectiveBackend = GraphProjectionCacheProviderResolver.ResolveEffectiveBackend(
                opts,
                hotPath.ExpectedApiReplicaCount,
                redisConfigured);

            if (effectiveBackend == GraphProjectionCacheBackend.Distributed)
            {
                IDistributedCache distributedCache = sp.GetRequiredService<IDistributedCache>();
                IGraphProjectionCacheInvalidationBroadcaster broadcaster =
                    sp.GetRequiredService<IGraphProjectionCacheInvalidationBroadcaster>();

                return new GraphSnapshotProjectionDistributedCache(distributedCache, monitor, broadcaster);
            }

            IMemoryCache memoryCache = sp.GetRequiredService<IMemoryCache>();

            return new GraphSnapshotProjectionMemoryCache(memoryCache, monitor);
        });
        services.AddSingleton<PlainTextContextDocumentParser>();
        services.AddSingleton<IContextDocumentParser>(static sp => sp.GetRequiredService<PlainTextContextDocumentParser>());
        services.AddSingleton<IReadOnlyList<IContextDocumentParser>>(static sp =>
            ContextDocumentParserPipeline.CreateOrderedContextDocumentParsers(sp));

        services.AddSingleton<IInfrastructureDeclarationParser, JsonInfrastructureDeclarationParser>();
        services.AddSingleton<IInfrastructureDeclarationParser, SimpleTerraformDeclarationParser>();
        services.AddSingleton<IInfrastructureDeclarationParser, TerraformShowJsonInfrastructureDeclarationParser>();

        // Typed connector stages (Phase 1 — composable extract + normalize; connectors remain IContextConnector facades).
        services.AddSingleton<IConnectorInput<StaticRequestPayload>, StaticRequestPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<StaticRequestPayload>, StaticRequestPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<InlineRequirementsPayload>, InlineRequirementsPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<InlineRequirementsPayload>, InlineRequirementsPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<DocumentConnectorPayload>, DocumentConnectorPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<DocumentConnectorPayload>, DocumentConnectorPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<PolicyReferencePayload>, PolicyReferencePayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<PolicyReferencePayload>, PolicyReferencePayloadNormalizer>();
        services.AddSingleton<IPolicyTopologyOverlapResolver, PolicyTopologyOverlapResolver>();
        services.AddSingleton<IConnectorInput<TopologyHintsPayload>, TopologyHintsPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<TopologyHintsPayload>, TopologyHintsPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<SecurityBaselineHintsPayload>, SecurityBaselineHintsPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<SecurityBaselineHintsPayload>, SecurityBaselineHintsPayloadNormalizer>();
        services.AddSingleton<IConnectorInput<InfrastructureDeclarationsPayload>, InfrastructureDeclarationsPayloadExtractor>();
        services.AddSingleton<IConnectorNormalizer<InfrastructureDeclarationsPayload>,
            InfrastructureDeclarationsPayloadNormalizer>();

        // Concrete connectors (registered once each). Order here matches pipeline order for readability only;
        // execution order is defined solely in ContextConnectorPipeline.CreateOrderedConnectorDescriptors /
        // CreateOrderedContextConnectorPipeline.
        services.AddSingleton<StaticRequestContextConnector>();
        services.AddSingleton<InlineRequirementsConnector>();
        services.AddSingleton<DocumentConnector>();
        services.AddSingleton<PolicyReferenceConnector>();
        services.AddSingleton<TopologyHintsConnector>();
        services.AddSingleton<SecurityBaselineHintsConnector>();
        services.AddSingleton<InfrastructureDeclarationConnector>();

        // Ordered pipeline slots (Phase 2); IEnumerable<IContextConnector> below is a projection for legacy resolves.
        services.AddSingleton<IReadOnlyList<IConnectorDescriptor>>(static sp =>
            ContextConnectorPipeline.CreateOrderedConnectorDescriptors(sp));
        services.AddSingleton<IConnectorPipelineOrchestrator, DefaultConnectorPipelineOrchestrator>();

        // IEnumerable<IContextConnector> must come only from CreateOrderedContextConnectorPipeline — preserves
        // deterministic DeltaSummary segment order and operator-facing narrative (see docs/CONTEXT_INGESTION.md).
        services.AddSingleton<IEnumerable<ContextConnector>>(static sp =>
            ContextConnectorPipeline.CreateOrderedContextConnectorPipeline(sp));

        services.AddSingleton<TopologyResourceCanonicalEnricher>();
        services.AddSingleton<SecurityBaselineCanonicalEnricher>();
        services.AddSingleton<TerraformRuntimePlatformCanonicalEnricher>();
        services.AddSingleton<ICanonicalEnricher>(static sp =>
            new CompositeCanonicalEnricher(
            [
                sp.GetRequiredService<TopologyResourceCanonicalEnricher>(),
                sp.GetRequiredService<SecurityBaselineCanonicalEnricher>(),
                sp.GetRequiredService<TerraformRuntimePlatformCanonicalEnricher>(),
            ]));
        services.AddSingleton<ICanonicalDeduplicator, CanonicalDeduplicator>();
        services.AddSingleton<IContextDeltaSummaryBuilder, DefaultContextDeltaSummaryBuilder>();
        services.AddSingleton<IConnectorDeltaComputer, SetDiffConnectorDeltaComputer>();

        services.AddScoped<ContextIngestionService, ArchLucid.ContextIngestion.Services.ContextIngestionService>();
        services.AddScoped<IGraphNodeFactory, GraphNodeFactory>();
        services.AddScoped<IGraphEdgeInferer, DefaultGraphEdgeInferer>();
        services.AddSingleton<IGraphValidator, GraphValidator>();
        services.AddScoped<GraphBuilder, KnowledgeGraph.Builders.DefaultGraphBuilder>();
        services.AddScoped<KnowledgeGraphService, ArchLucid.KnowledgeGraph.Services.KnowledgeGraphService>();
    }
}

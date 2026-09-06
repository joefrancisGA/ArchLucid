using ArchLucid.Application.Advisory;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Alerts;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Authorization;
using ArchLucid.Application.Common;
using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Integrations;
using ArchLucid.Application.Integrations.Confluence;
using ArchLucid.Application.Marketing;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Replay;
using ArchLucid.Application.Reports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Summaries;
using ArchLucid.Application.Support;
using ArchLucid.Application.Traceability;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Http;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Marketing;
using ArchLucid.Host.Core.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    private static void RegisterExportsGovernanceReviewExports(
        IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSingleton<IEvidencePackSourceProvider, EmbeddedResourceEvidencePackSourceProvider>();
        services.AddSingleton<IEvidencePackBuilder, EvidencePackBuilder>();
        services.AddSingleton<ISupportBundleAssembler, SupportBundleAssembler>();
        services.AddSingleton<IExecutionProvenanceFooterRenderer, ExecutionProvenanceFooterRenderer>();
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
        services.AddScoped<IAgentToolInvocationRecordWriter, AgentToolInvocationRecordWriter>();
        services.AddScoped<IGovernanceDigestDecisionNeededComposer, GovernanceDigestDecisionNeededComposer>();
        services.AddScoped<IPilotsApplicationService, PilotsApplicationService>();
        services.AddScoped<IComparisonsApplicationService, ComparisonsApplicationService>();
        services.AddScoped<ICompareRunsApplicationFacade, CompareRunsApplicationFacade>();
        services.AddScoped<IRunExportQueryFacade, RunExportQueryFacade>();
        services.AddScoped<IAdvisoryWorkflowFacade, AdvisoryWorkflowFacade>();
        services.AddScoped<ITraceabilityBundleExportApplicationService, TraceabilityBundleExportApplicationService>();
        services.AddScoped<IDemoSeedRunResolver, DemoSeedRunResolver>();
        services.AddScoped<IDemoReadModelClient, DemoReadModelClient>();
        services.AddScoped<IDemoCommitPagePreviewClient, DemoCommitPagePreviewClient>();
        services.AddScoped<IPublicShowcaseCommitPageClient, PublicShowcaseCommitPageClient>();
        services.AddScoped<IRunRationaleService, RunRationaleService>();
        services.AddScoped<IArchitectureRunProvenanceService, ArchitectureRunProvenanceService>();
        services.AddScoped<IExportReplayService, ExportReplayService>();
        services.AddScoped<IArchitectureKnowledgeModelIntakeBuilder, ArchitectureKnowledgeModelIntakeBuilder>();
        services.AddScoped<IArchitectureSynthesisKernel, ArchitectureSynthesisKernel>();
        services.AddScoped<IArchitectureIdentityService, ArchitectureIdentityService>();
        services.AddScoped<IArchitectureSealDeltaService, ArchitectureSealDeltaService>();
        services.AddScoped<IArchitectureIdentityBackfillService, ArchitectureIdentityBackfillService>();
        services.AddScoped<IArchitectureVersionService, ArchitectureVersionService>();
        services.AddSingleton<IEvidenceGraphMaterializer, EvidenceGraphMaterializer>();
        services.AddScoped<IRunPolicyPackPinService, RunPolicyPackPinService>();
        services.AddScoped<IRunEvidencePackagePinService, RunEvidencePackagePinService>();
        services.AddScoped<IRunGovernanceScopePinService, RunGovernanceScopePinService>();
        services.AddScoped<IRunCreatePinOrchestrator, RunCreatePinOrchestrator>();
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

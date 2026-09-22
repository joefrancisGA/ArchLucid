using ArchLucid.AgentRuntime;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Clarifications;
using ArchLucid.Application.Intake;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

/// <summary>Authority capability composition facade (runs, pipeline, agents, retrieval).</summary>
public static partial class ServiceCollectionExtensions
{
    /// <summary>Registers authority capability services (runs, pipeline, agents, retrieval).</summary>
    public static IServiceCollection AddAuthorityCapability(
        this IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddScoped<Application.Authority.IAuthorityCommittedManifestChainWriter,
            Application.Authority.AuthorityCommittedManifestChainWriter>();
        services.Configure<BatchReplayOptions>(configuration.GetSection(BatchReplayOptions.SectionName));
        services.Configure<ArchitectureProjectRetentionPurgeOptions>(
            configuration.GetSection(ArchitectureProjectRetentionPurgeOptions.SectionName));
        services.Configure<SampleRunPurgeOptions>(
            configuration.GetSection(SampleRunPurgeOptions.SectionName));
        services.Configure<DraftIntakeReaperOptions>(
            configuration.GetSection(DraftIntakeReaperOptions.SectionName));
        services.Configure<DraftIntakeBranchOptions>(
            configuration.GetSection(DraftIntakeBranchOptions.SectionName));
        services.Configure<DraftSemanticAdmissionOptions>(
            configuration.GetSection(DraftSemanticAdmissionOptions.SectionName));
        services.AddKeyedScoped<IArchitectureRunExecuteOrchestrator>(
            ArchitectureRunExecuteOrchestrationKeys.QuickStartForcedSimulator,
            static (sp, _) => ActivatorUtilities.CreateInstance<ArchitectureRunExecuteOrchestrator>(
                sp,
                sp.GetRequiredService<SimulatorExecutionTraceRecordingExecutor>()));
        PipelineCompositionModule.Register(services, configuration);
        CoordinatorArtifactsCompositionModule.Register(services, configuration);
        AgentCompositionModule.Register(services, configuration);
        RetrievalCompositionModule.Register(services, configuration);
        services.AddArchitectureIntelligence();
        services.AddReviewClarificationQuestions();
        services.Configure<ArchitectureIntelligencePipelineOptions>(
            configuration.GetSection(ArchitectureIntelligencePipelineOptions.SectionPath));
        services.Configure<AuthorityPipelineWorkProcessorOptions>(
            configuration.GetSection(AuthorityPipelineWorkProcessorOptions.SectionName));
        services.Configure<RetrievalIndexingOutboxProcessorOptions>(
            configuration.GetSection(RetrievalIndexingOutboxProcessorOptions.SectionName));
        services.Configure<CosmosGraphSnapshotOutboxProcessorOptions>(
            configuration.GetSection(CosmosGraphSnapshotOutboxProcessorOptions.SectionName));
        services.Configure<RunExportBlobPushOutboxProcessorOptions>(
            configuration.GetSection(RunExportBlobPushOutboxProcessorOptions.SectionName));
        services.Configure<PostCommitProjectionOutboxProcessorOptions>(
            configuration.GetSection(PostCommitProjectionOutboxProcessorOptions.SectionName));
        RegisterRetrievalIndexingOutbox(services, hostingRole);
        RegisterRunExportBlobPushOutbox(services, hostingRole);
        RegisterPostCommitProjectionOutbox(services, hostingRole);
        RegisterCosmosGraphSnapshotOutbox(services, configuration, hostingRole);
        RegisterAgentResultBlobCleanupHostedService(services, hostingRole);
        RegisterDurableTaskWorkerInfrastructure(services, configuration, hostingRole);
        RegisterSponsorRoiCacheWarmupHostedService(services, configuration, hostingRole);
        RegisterSponsorRoiSavingsGaugeHostedService(services, configuration, hostingRole);
        RegisterArchitectureProjectRetentionPurgeHostedService(services, hostingRole);
        RegisterSampleRunTtlHostedService(services, hostingRole);
        RegisterDraftIntakeReaperHostedService(services, hostingRole);
        services.AddScoped<IWizardIntakeDraftService, WizardIntakeDraftService>();

        return services;
    }
}

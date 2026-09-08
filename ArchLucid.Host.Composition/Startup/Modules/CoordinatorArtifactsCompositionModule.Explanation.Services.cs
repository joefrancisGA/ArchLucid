using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.AgentRuntime.Explanation.Stages;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Ask;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Decisions;
using ArchLucid.Core.Budgeting;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Explanation;
using ArchLucid.Core.Explanation;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Costing;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Http;
using ArchLucid.Core.Llm;
using ArchLucid.Core.QuickScan;
using ArchLucid.Decisioning.Advisory.Analysis;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Services;
using ArchLucid.Decisioning.Comparison;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Llm;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Host.Core.Services.Drafts;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Architecture;
using ArchLucid.Persistence.Budgeting;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Reads;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class CoordinatorArtifactsCompositionModule
{
    private static void RegisterExplanationServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ExplanationServiceOptions>(
            configuration.GetSection(ExplanationServiceOptions.SectionPath));
        services.Configure<RunExplanationAggregateOptions>(
            configuration.GetSection(RunExplanationAggregateOptions.SectionPath));
        // Binds AgentExecution:LlmCostEstimation; option type defaults keep cost visibility on when the section is absent.
        services.AddOptions<LlmCostEstimationOptions>()
            .Bind(configuration.GetSection(LlmCostEstimationOptions.SectionPath))
            .ValidateOnStart();
        services.AddSingleton<IValidateOptions<LlmCostEstimationOptions>, LlmCostEstimationOptionsValidator>();
        services.AddSingleton<IPostConfigureOptions<LlmCostEstimationOptions>, LlmCostEstimationStartupRateWarningPostConfigure>();

        ArchLucidOptions storageOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);
        RegisterLlmCostEstimationUsdRateOverride(services, storageOptions);
        services.AddSingleton<ILlmCostEstimator, LlmCostEstimator>();
        services.AddSingleton<IDeterministicExplanationService, DeterministicExplanationService>();
        services.AddScoped<IExplanationSignalStage, ExplanationSignalStage>();
        services.AddScoped<IExplanationLlmNarrativeStage, ExplanationLlmNarrativeStage>();
        services.AddScoped<IExplanationFallbackStage, ExplanationFallbackStage>();
        services.AddScoped<IExplanationService, ExplanationService>();
        services.AddScoped<IFindingExplainabilityComposer, FindingExplainabilityComposer>();
        RegisterRunExplanationSummaryService(services, configuration);
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<ArchLucid.Core.Llm.IAgentCompletionClient, JsonCompletionClientAdapter>();
        services.Configure<AskComparisonNarrativeOptions>(
            configuration.GetSection(AskComparisonNarrativeOptions.SectionPath));
        services.Configure<ConversationContextOptions>(
            configuration.GetSection(ConversationContextOptions.SectionPath));
        services.Configure<AskRetrievalOptions>(
            configuration.GetSection(AskRetrievalOptions.SectionPath));
        services.AddScoped<IConversationContextCompressor, ConversationContextCompressor>();
        services.AddScoped<AskConversationHistoryBuilder>();
        services.AddScoped<AskContextPreparer>();
        services.AddScoped<AskComparisonNarrativeBuilder>();
        services.AddScoped<AskResponseComposer>();
        services.AddScoped<FindingInstrumentationAuditSupport>();
        services.AddScoped<IAskService, AskService>();
        services.AddScoped<IDraftIntakeReasoningService, DraftIntakeReasoningService>();
        services.AddScoped<IDraftSemanticAdmissionEvaluator, HostDraftSemanticAdmissionEvaluator>();
        services.AddScoped<IPreCommitGovernanceBlockExplainer, PreCommitGovernanceBlockExplainer>();
        services.AddScoped<IAgentEvaluationService, FindingsBackedAgentEvaluationService>();
        services.AddScoped<DefaultEvidenceBuilder>();
        services.AddScoped<EffectiveGovernanceSnapshotBuilder>();
        services.AddScoped<IEvidenceBuilder, WorkspacePolicyPackEvidenceBuilder>();
        services.AddScoped<IAgentExecutionTraceForensicPersistence, AgentExecutionTraceForensicPersistence>();
        services.AddScoped<IAgentExecutionTraceRecorder, AgentExecutionTraceRecorder>();
        services.AddScoped<ICommitRunIdempotencyCoordinator, CommitRunIdempotencyCoordinator>();
    }

    private static void RegisterRunExplanationSummaryService(
        IServiceCollection services,
        IConfiguration configuration)
    {
        HotPathCacheOptions hotPath = configuration
                                          .GetSection(HotPathCacheOptions.SectionName)
                                          .Get<HotPathCacheOptions>()
                                      ?? new HotPathCacheOptions();

        if (!hotPath.Enabled)
        {
            services.AddScoped<IRunExplanationSummaryService, RunExplanationSummaryService>();
            return;
        }

        services.AddScoped<RunExplanationSummaryService>();
        services.AddScoped<IRunExplanationSummaryService>(sp => new CachingRunExplanationSummaryService(
            sp.GetRequiredService<RunExplanationSummaryService>(),
            sp.GetRequiredService<IHotPathReadCache>(),
            sp.GetRequiredService<IAuthorityQueryService>(),
            sp.GetRequiredService<ILogger<CachingRunExplanationSummaryService>>()));
    }

    private static void RegisterLlmCostEstimationUsdRateOverride(IServiceCollection services, ArchLucidOptions storageOptions)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(storageOptions.StorageProvider))
        {
            services.AddSingleton<ILlmCostEstimationUsdRateOverride>(NoOpLlmCostEstimationUsdRateOverride.Instance);

            return;
        }

        services.AddSingleton<LlmCostEstimationUsdRateOverrideCache>();
        services.AddSingleton<ILlmCostEstimationUsdRateOverride>(static sp =>
            sp.GetRequiredService<LlmCostEstimationUsdRateOverrideCache>());
        services.AddScoped<ILlmCostEstimationUsdRateOverrideRepository, SqlLlmCostEstimationUsdRateOverrideRepository>();
        services.AddHostedService<LlmCostEstimationUsdRateOverrideWarmupHostedService>();
    }
}

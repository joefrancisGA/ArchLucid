using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentLlmSupportCompositionModule
{
    private static void RegisterEvaluationAndSchemaInfrastructure(
        IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<AgentOutputLlmSemanticJudgeOptions>()
            .Bind(configuration.GetSection(AgentOutputLlmSemanticJudgeOptions.LegacySectionPath))
            .Bind(configuration.GetSection(AgentOutputLlmSemanticJudgeOptions.SectionPath));
        services.PostConfigure<AgentOutputLlmSemanticJudgeOptions>(static o =>
        {
            o.BlendWeight = Math.Clamp(o.BlendWeight, 0.0, 1.0);
            o.WarnGateWhenJudgeHeuristicDisagreementAbove =
                Math.Clamp(o.WarnGateWhenJudgeHeuristicDisagreementAbove, 0.0, 1.0);
            o.JudgeInvocationCount = Math.Clamp(o.JudgeInvocationCount, 1, 8);
            o.MaxInputCharacters = Math.Clamp(o.MaxInputCharacters, 1024, 500_000);
            o.MaxCompletionTokens = Math.Clamp(o.MaxCompletionTokens, 64, 4096);
            o.TimeoutSeconds = Math.Clamp(o.TimeoutSeconds, 5, 120);
        });
        services.AddOptions<AgentOutputLlmFaithfulnessOptions>()
            .Bind(configuration.GetSection(AgentOutputLlmFaithfulnessOptions.SectionPath));
        services.PostConfigure<AgentOutputLlmFaithfulnessOptions>(static o =>
        {
            o.MaxEvidenceCharacters = Math.Clamp(o.MaxEvidenceCharacters, 1024, 500_000);
            o.MaxInputCharacters = Math.Clamp(o.MaxInputCharacters, 1024, 500_000);
            o.TimeoutSeconds = Math.Clamp(o.TimeoutSeconds, 5, 120);
            o.MinScoreRejectBelow = Math.Clamp(o.MinScoreRejectBelow, 0.0, 1.0);

            if (o.MinScoreWarnBelow is { } warnFloor)
                o.MinScoreWarnBelow = Math.Clamp(warnFloor, 0.0, 1.0);
        });
        services.AddSingleton<AgentOutputEvaluator>();
        services.AddSingleton<IAgentOutputEvaluator>(static sp => sp.GetRequiredService<AgentOutputEvaluator>());
        services.AddSingleton<IAgentResultEvidenceFaithfulnessChecker, AgentResultEvidenceFaithfulnessChecker>();
        services.Configure<AgentFaithfulnessOptions>(
            configuration.GetSection(AgentFaithfulnessOptions.SectionPath));
        services.PostConfigure<AgentFaithfulnessOptions>(static o =>
        {
            o.EmbeddingMaxChunkUtf16Length = Math.Clamp(o.EmbeddingMaxChunkUtf16Length, 128, 8192);
            int maxOverlap = Math.Max(0, o.EmbeddingMaxChunkUtf16Length - 1);
            o.EmbeddingChunkOverlapUtf16 = Math.Clamp(o.EmbeddingChunkOverlapUtf16, 0, maxOverlap);
            o.MinDistinctOverlapTokens = Math.Clamp(o.MinDistinctOverlapTokens, 1, 32);
            o.MinOverlapDensityRatio = Math.Clamp(o.MinOverlapDensityRatio, 0.0, 1.0);
        });
        services.AddSingleton<IAgentResultEmbeddingFaithfulnessScorer, AgentResultEmbeddingFaithfulnessScorer>();
        services.AddSingleton<HeuristicAgentOutputSemanticEvaluator>();
        services.AddSingleton<IHeuristicAgentOutputSemanticEvaluator>(static sp =>
            sp.GetRequiredService<HeuristicAgentOutputSemanticEvaluator>());
        services.AddSingleton<AgentOutputLlmSemanticJudge>();
        services.AddSingleton<IAgentOutputLlmSemanticJudge>(static sp =>
            sp.GetRequiredService<AgentOutputLlmSemanticJudge>());
        services.AddSingleton<AgentOutputFaithfulnessEvaluator>();
        services.AddSingleton<IAgentOutputFaithfulnessEvaluator>(static sp =>
            sp.GetRequiredService<AgentOutputFaithfulnessEvaluator>());
        services.AddSingleton<CompositeAgentOutputSemanticEvaluator>();
        services.AddSingleton<IAgentOutputSemanticEvaluator>(static sp =>
            sp.GetRequiredService<CompositeAgentOutputSemanticEvaluator>());
        services.AddSingleton<HeuristicOnlyAgentOutputSemanticEvaluator>();
        services.AddSingleton<IAgentOutputEvaluationHarness, AgentOutputEvaluationHarness>();
        services.AddSingleton<IValidateOptions<AgentOutputQualityGateOptions>, AgentOutputQualityGateOptionsValidator>();
        services.AddOptions<AgentOutputQualityGateOptions>()
            .Bind(configuration.GetSection(AgentOutputQualityGateOptions.SectionPath))
            .ValidateOnStart();
        services.AddSingleton<IAgentOutputQualityGate, AgentOutputQualityGate>();
        // Scoped: depends on IAgentEvidencePackageRepository (scoped) and is consumed from scoped IPilotRunDeltaComputer.
        services.AddScoped<IRunAgentOutputPilotEvidenceAggregator, RunAgentOutputPilotEvidenceAggregator>();
        services.Configure<AgentExecutionReferenceEvaluationOptions>(
            configuration.GetSection(AgentExecutionReferenceEvaluationOptions.SectionPath));
        services.AddSingleton<IAgentOutputReferenceCaseCatalog>(sp =>
        {
            IHostEnvironment env = sp.GetRequiredService<IHostEnvironment>();
            IOptionsMonitor<AgentExecutionReferenceEvaluationOptions> refOpts =
                sp.GetRequiredService<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>>();
            ILogger<AgentOutputReferenceCaseCatalog> log = sp.GetRequiredService<ILogger<AgentOutputReferenceCaseCatalog>>();

            return new AgentOutputReferenceCaseCatalog(refOpts, env.ContentRootPath, log);
        });
        services.AddScoped<AgentOutputReferenceCaseRunEvaluator>();
        services.AddScoped<AgentOutputEvaluationRecorder>();
        services.AddScoped<AgentEvaluationConfidencePipeline>();
        services.AddScoped<IAgentArchitectureFindingConfidenceEnricher, AgentArchitectureFindingConfidenceEnricher>();
        services.AddScoped<IFindingsSnapshotEvaluationConfidenceEnricher, FindingsSnapshotEvaluationConfidenceEnricher>();
        services.AddScoped<IAgentOutputTraceEvaluationHook, AgentOutputTraceEvaluationHook>();
        services.Configure<AgentResultSchemaValidationOptions>(
            configuration.GetSection(AgentResultSchemaValidationOptions.SectionPath));
        services.AddSingleton<IPostConfigureOptions<AgentResultSchemaValidationOptions>,
            AgentResultSchemaValidationProductionWarningPostConfigure>();
        services.Configure<AgentSchemaRemediationOptions>(
            configuration.GetSection(AgentSchemaRemediationOptions.SectionPath));
        services.PostConfigure<AgentSchemaRemediationOptions>(static o => o.Normalize());
        services.Configure<AgentLogicalStepSpendCapOptions>(
            configuration.GetSection(AgentLogicalStepSpendCapOptions.SectionPath));
        services.PostConfigure<AgentLogicalStepSpendCapOptions>(static o => o.Normalize());
        services.AddSingleton<IAgentLogicalStepSpendCapPolicy, AgentLogicalStepSpendCapPolicy>();
    }
}

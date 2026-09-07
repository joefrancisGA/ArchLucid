using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.AgentRuntime;
using ArchLucid.AgentSimulator.Services;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Architecture.Execute;
using ArchLucid.Application.Budgeting;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Http;
using ArchLucid.Core.Llm;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DevTesting;
using ArchLucid.Host.Core.Http;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentExecutionCompositionModule
{
    private static void RegisterExecutorWiring(IServiceCollection services, IConfiguration configuration)
    {
        bool allowDevAgentExecutionModeHeaderOverride = configuration.GetValue(
            $"{DeveloperExperienceOptions.SectionName}:{nameof(DeveloperExperienceOptions.AllowAgentExecutionModeHeaderOverride)}",
            false);

        services.AddSingleton<IEffectiveAgentExecutionModeAccessor, EffectiveAgentExecutionModeAccessor>();

        string? agentMode = configuration["AgentExecution:Mode"];

        if (allowDevAgentExecutionModeHeaderOverride)
        {
            agentMode = DevAgentExecutionModeHeaderNames.Real;
        }
        string? completionClientRaw = configuration["AgentExecution:CompletionClient"]?.Trim();
        bool useEchoClient = string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase)
                              && string.Equals(completionClientRaw, "Echo", StringComparison.OrdinalIgnoreCase);

        bool completionIsExplicitAzure = string.Equals(completionClientRaw, "AzureOpenAi", StringComparison.OrdinalIgnoreCase);
        bool azureKeysPresent = AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(configuration);

        bool useAzureOpenAi = !string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase)
                              && !useEchoClient
                              && (string.IsNullOrEmpty(completionClientRaw) || completionIsExplicitAzure)
                              && azureKeysPresent;

        AgentCompletionPipelineCompositionModule.ConfigureLlmTelemetryLabels(services, configuration, agentMode, useAzureOpenAi, useEchoClient);

        if (string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase))
        {
            AgentSimulatorExecutorRegistrar.Register(services);
        }
        else
        {
            // Deterministic simulator is also used by POST /v1/demo/quickstart which must never call real LLMs.
            services.AddScoped<DeterministicAgentSimulator>();
            services.AddScoped<SimulatorExecutionTraceRecordingExecutor>(static sp =>
                new SimulatorExecutionTraceRecordingExecutor(
                    sp.GetRequiredService<DeterministicAgentSimulator>(),
                    sp.GetRequiredService<IAgentExecutionTraceRecorder>()));

            if (allowDevAgentExecutionModeHeaderOverride)
            {
                services.AddScoped<RealAgentExecutor>();
                services.AddScoped<DevSwitchableAgentExecutor>();
                services.AddScoped<IAgentExecutor>(static sp => sp.GetRequiredService<DevSwitchableAgentExecutor>());
            }
            else
            {
                services.AddScoped<IAgentExecutor, RealAgentExecutor>();
            }
            services.AddScoped<ITopologyProposalSecondaryCompletionInvoker, TopologyProposalSecondaryCompletionInvoker>();
            services.AddScoped<IAgentHandler, TopologyAgentHandler>();
            services.AddScoped<IAgentHandler, CostAgentHandler>();
            services.AddScoped<IAgentHandler, ComplianceAgentHandler>();
            services.AddScoped<IAgentHandler, CriticAgentHandler>();
            services.RemoveAll<IInsightDensityLlmJudge>();
            services.AddScoped<IInsightDensityLlmJudge, PremiumInsightDensityLlmJudge>();
            services.RemoveAll<IInsightFindingGenerator>();
            services.AddScoped<IInsightFindingGenerator, PremiumInsightFindingGenerator>();
            services.AddScoped<IAgentResultParser, AgentResultParser>();

            if (allowDevAgentExecutionModeHeaderOverride)
            {
                DevAgentCompletionPipelineRegistrar.RegisterDevSimulatorCompletionClient(services);
            }

            if (useEchoClient)
            {
                AgentEchoExecutorRegistrar.Register(services);
            }
            else if (useAzureOpenAi)
            {
                AgentAzureOpenAiExecutorRegistrar.Register(services, configuration);
            }
            else if (!allowDevAgentExecutionModeHeaderOverride)
            {
                AgentCompletionPipelineCompositionModule.RegisterFakeClient(services);
            }

            if (allowDevAgentExecutionModeHeaderOverride)
            {
                DevAgentCompletionPipelineRegistrar.RegisterDevSwitchableCompletionClient(
                    services,
                    useAzureOpenAi,
                    useEchoClient);

                if (!useAzureOpenAi && !useEchoClient)
                {
                    AgentCompletionPipelineCompositionModule.RegisterSchemaRemediationClient(
                        services,
                        useAzureOpenAi: false);
                }
            }

        }
    }

    private static void RegisterLlmCompletionProvider(IServiceCollection services)
    {
        services.AddScoped<ILlmCompletionProvider>(sp =>
        {
            IAgentCompletionClient inner = sp.GetRequiredService<IAgentCompletionClient>();
            IOptionsMonitor<LlmTelemetryLabelOptions> labelOpts = sp.GetRequiredService<IOptionsMonitor<LlmTelemetryLabelOptions>>();
            LlmTelemetryLabelOptions labels = labelOpts.CurrentValue;

            return new DelegatingLlmCompletionProvider(inner, labels.ProviderId, labels.ModelDeploymentLabel);
        });

        services.AddScoped<ILlmProvider>(sp => sp.GetRequiredService<ILlmCompletionProvider>());
    }
}

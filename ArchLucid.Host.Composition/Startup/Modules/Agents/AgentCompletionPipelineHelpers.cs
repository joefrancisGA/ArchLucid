// Thin forwarding surface so existing registrars keep a single import while helpers are split by concern.

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Resilience;
using ArchLucid.Host.Composition.AzureOpenAI;
using Microsoft.Extensions.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Resilience;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

internal static class AgentCompletionPipelineHelpers
{
    internal static bool IsAgentRuntimeCompletionCacheEnabled(IConfiguration configuration) =>
        AgentCompletionCacheRegistrar.IsAgentRuntimeCompletionCacheEnabled(configuration);

    internal static IAgentCompletionClient WrapWithAgentRuntimeCompletionCacheIfEnabled(
        IServiceProvider serviceProvider,
        IAgentCompletionClient inner,
        bool simulatorMode) =>
        AgentCompletionCacheRegistrar.WrapWithAgentRuntimeCompletionCacheIfEnabled(serviceProvider, inner, simulatorMode);

    internal static IAgentCompletionClient BuildAgentOutputSemanticJudgeCompletionChain(IServiceProvider sp) =>
        AgentCompletionJudgeChainRegistrar.BuildAgentOutputSemanticJudgeCompletionChain(sp);

    internal static IAgentCompletionClient BuildAzureOpenAiScopedCompletionChain(
        IServiceProvider sp,
        AzureOpenAiCompletionClient azureInner,
        CircuitBreakerGate gate,
        string cachingDeploymentLabel) =>
        AgentCompletionAzureScopedChainRegistrar.BuildAzureOpenAiScopedCompletionChain(sp, azureInner, gate, cachingDeploymentLabel);

    internal static IAgentCompletionClient BuildAzureOpenAiScopedCompletionChainWithoutPollyRetry(
        IServiceProvider sp,
        AzureOpenAiCompletionClient azureInner,
        string cachingDeploymentLabel) =>
        AgentCompletionAzureScopedChainRegistrar.BuildAzureOpenAiScopedCompletionChainWithoutPollyRetry(
            sp,
            azureInner,
            cachingDeploymentLabel);

    internal static IAgentCompletionClient BuildAzureOpenAiScopedCompletionChainCore(
        IServiceProvider sp,
        AzureOpenAiCompletionClient azureInner,
        string cachingDeploymentLabel) =>
        AgentCompletionAzureScopedChainRegistrar.BuildAzureOpenAiScopedCompletionChainCore(sp, azureInner, cachingDeploymentLabel);

    internal static int ResolveLlmMaxRetryAttempts(
        AzureOpenAiOptions azureOpenAiOptions,
        AgentExecutionResilienceOptions resOpts) =>
        AgentCompletionResolutionHelper.ResolveLlmMaxRetryAttempts(azureOpenAiOptions, resOpts);

    internal static BinaryData? ResolveStructuredOutputAgentResultSchema(
        IConfiguration configuration,
        AzureOpenAiOptions azureOpenAiOptions) =>
        AgentCompletionResolutionHelper.ResolveStructuredOutputAgentResultSchema(configuration, azureOpenAiOptions);
}

using ArchLucid.AgentRuntime;
using ArchLucid.Host.Composition.AzureOpenAI;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

internal static class FakeAgentCompletionPipelineRegistrar
{
    /// <summary>
    /// Ask/Explanation paths resolve <see cref="IAgentCompletionClient"/> even when
    /// <see cref="SimulatorExecutionTraceRecordingExecutor"/> wraps <see cref="DeterministicAgentSimulator"/> (no real agent handlers).
    /// </summary>
    internal static void RegisterFakeAgentCompletionClient(IServiceCollection services)
    {
        services.AddScoped<ScopedInnerAgentCompletionClient>(_ => new ScopedInnerAgentCompletionClient(
            new FakeAgentCompletionClient(FakeAgentCompletionResolver.Resolve)));

        AgentModelTierCompositionModule.RegisterPassThroughTierCompletionRouter(services);
        SchemaRemediationCompletionRegistrar.RegisterSchemaRemediationAgentCompletionClient(services, useAzureOpenAi: false);
        AgentModelTierCompositionModule.RegisterAgentCompletionClientFromTierRouter(services);
    }
}

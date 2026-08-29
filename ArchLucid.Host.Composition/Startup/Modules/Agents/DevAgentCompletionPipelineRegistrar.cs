using ArchLucid.AgentRuntime;
using ArchLucid.Core.DevTesting;
using ArchLucid.Host.Composition.AzureOpenAI;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
///     Wires <see cref="DevSwitchableAgentCompletionClient" /> so Ask/intake completions honor the same dev execution
///     mode header as <see cref="DevSwitchableAgentExecutor" />.
/// </summary>
internal static class DevAgentCompletionPipelineRegistrar
{
    internal static void RegisterDevSimulatorCompletionClient(IServiceCollection services)
    {
        services.AddKeyedScoped<IAgentCompletionClient>(
            DevAgentCompletionClientKeys.Simulator,
            static (_, _) => new FakeAgentCompletionClient(FakeAgentCompletionResolver.Resolve));
    }

    internal static void RegisterDevSwitchableCompletionClient(
        IServiceCollection services,
        bool useAzureOpenAi,
        bool useEchoClient)
    {
        services.AddScoped<IAgentCompletionClient>(sp =>
        {
            IEffectiveAgentExecutionModeAccessor accessor =
                sp.GetRequiredService<IEffectiveAgentExecutionModeAccessor>();
            IAgentCompletionClient simulator =
                sp.GetRequiredKeyedService<IAgentCompletionClient>(DevAgentCompletionClientKeys.Simulator);
            IAgentCompletionClient? real = TryResolveRealCompletionClient(sp, useAzureOpenAi, useEchoClient);
            ILogger<DevSwitchableAgentCompletionClient> logger =
                sp.GetRequiredService<ILogger<DevSwitchableAgentCompletionClient>>();

            return new DevSwitchableAgentCompletionClient(accessor, simulator, real, logger);
        });
    }

    private static IAgentCompletionClient? TryResolveRealCompletionClient(
        IServiceProvider sp,
        bool useAzureOpenAi,
        bool useEchoClient)
    {
        if (!useAzureOpenAi && !useEchoClient)
            return null;

        return sp.GetRequiredService<ScopedInnerAgentCompletionClient>().Inner;
    }
}

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Caching;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Caching;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

internal static class AgentCompletionCacheRegistrar
{
    internal static bool IsAgentRuntimeCompletionCacheEnabled(IConfiguration configuration)
    {
        LlmCompletionCacheOptions? opts =
            configuration.GetSection(LlmCompletionCacheOptions.SectionName).Get<LlmCompletionCacheOptions>();

        return opts?.Enabled ?? false;
    }

    internal static IAgentCompletionClient WrapWithAgentRuntimeCompletionCacheIfEnabled(
        IServiceProvider serviceProvider,
        IAgentCompletionClient inner,
        bool simulatorMode)
    {
        IConfiguration configuration = serviceProvider.GetRequiredService<IConfiguration>();

        if (!IsAgentRuntimeCompletionCacheEnabled(configuration))
            return inner;

        ILlmCompletionResponseCache completionCache =
            serviceProvider.GetRequiredService<ILlmCompletionResponseCache>();
        IScopeContextProvider scopeContexts = serviceProvider.GetRequiredService<IScopeContextProvider>();
        IOptionsMonitor<LlmCompletionCacheOptions> completionCacheOptionsMonitor =
            serviceProvider.GetRequiredService<IOptionsMonitor<LlmCompletionCacheOptions>>();
        IOptionsMonitor<LlmTelemetryLabelOptions> telemetryLabelOptionsMonitor =
            serviceProvider.GetRequiredService<IOptionsMonitor<LlmTelemetryLabelOptions>>();
        ILogger<CachingLlmCompletionClient> completionCacheLogger =
            serviceProvider.GetRequiredService<ILogger<CachingLlmCompletionClient>>();

        return new CachingLlmCompletionClient(
            inner,
            completionCache,
            simulatorMode,
            scopeContexts,
            completionCacheOptionsMonitor,
            telemetryLabelOptionsMonitor,
            completionCacheLogger);
    }
}

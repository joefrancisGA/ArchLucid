// Echo completion-client agent executor registrations (extracted from AgentExecutionCompositionModule).

using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.AgentRuntime;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
///     Echo completion pipeline when <c>AgentExecution:CompletionClient=Echo</c> in real mode.
/// </summary>
internal static class AgentEchoExecutorRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddSingleton<LlmTokenQuotaWindowTracker>();
        services.AddScoped<LlmCompletionAccountingTelemetry>();
        AgentCompletionPipelineCompositionModule.RegisterEchoPipeline(services);
    }
}

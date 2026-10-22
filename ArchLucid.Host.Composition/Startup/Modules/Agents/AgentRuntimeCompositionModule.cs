namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

/// <summary>
///     AgentRuntime completion routing and tier resolution DI owned by the agent bounded context.
/// </summary>
public static class AgentRuntimeCompositionModule
{
    /// <summary>
    ///     Registers tier resolution plus a baseline <see cref="ArchLucid.AgentRuntime.IAgentTierCompletionRouter" />
    ///     so AgentRuntime consumers (retrieval summarization, handlers, enrichers) resolve before completion
    ///     pipeline registrars replace <see cref="ArchLucid.Host.Composition.AzureOpenAI.ScopedInnerAgentCompletionClient" />
    ///     for echo, fake, or Azure OpenAI modes.
    /// </summary>
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        AgentModelTierCompositionModule.Register(services, configuration);
        AgentModelTierCompositionModule.EnsureBaselineTierCompletionRouter(services);
    }
}

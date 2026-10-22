// Agent bounded-context composition registrations (extracted from ServiceCollectionExtensions.Agents* partials).

using ArchLucid.Host.Composition.Startup.Modules;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
/// Agent executor registration, completion client selection, and Quick Scan.
/// </summary>
public static partial class AgentExecutionCompositionModule
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        AgentEnrichersCompositionModule.Register(services, configuration);
        ContentSafetyCompositionModule.Register(services, configuration);
        AgentLlmSupportCompositionModule.Register(services, configuration);
        LlmBatchCompositionModule.Register(services, configuration);
        AgentRuntimeCompositionModule.Register(services, configuration);

        RegisterExecutorWiring(services, configuration);
        RegisterLlmCompletionProvider(services);
        RegisterQuickScan(services, configuration);
    }
}

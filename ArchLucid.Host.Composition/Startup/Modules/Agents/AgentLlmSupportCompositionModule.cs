// Agent bounded-context composition registrations (extracted from ServiceCollectionExtensions.Agents* partials).

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
/// LLM telemetry, quotas, evaluation, and prompt infrastructure.
/// </summary>
public static partial class AgentLlmSupportCompositionModule
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        RegisterPromptAndTokenInfrastructure(services, configuration);
        RegisterEvaluationAndSchemaInfrastructure(services, configuration);
    }
}

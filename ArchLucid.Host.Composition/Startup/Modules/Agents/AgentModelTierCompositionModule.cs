// Agent bounded-context composition registrations (extracted from ServiceCollectionExtensions.Agents* partials).

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
/// Agent model tier resolution and completion routing.
/// </summary>
public static partial class AgentModelTierCompositionModule
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        RegisterCatalog(services, configuration);
    }
}

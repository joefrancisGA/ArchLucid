using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.AgentRuntime;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentModelTierCompositionModule
{
    private static void RegisterCatalog(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AgentModelTierOptions>(configuration.GetSection(AgentModelTierOptions.SectionPath));
        services.PostConfigure<AgentModelTierOptions>(static opts => AgentModelTierDefaults.ApplyDefaults(opts));
        services.AddSingleton<IAgentModelTierResolver, AgentModelTierResolver>();
        services.AddSingleton<CatalogBackedAgentModelAliasRegistry>();
        services.AddSingleton<IAgentModelAliasRegistry>(static sp =>
            sp.GetRequiredService<CatalogBackedAgentModelAliasRegistry>());
        services.AddSingleton<IAgentModelCatalogCacheInvalidator>(static sp =>
            sp.GetRequiredService<CatalogBackedAgentModelAliasRegistry>());
        services.AddSingleton<IAgentModelAliasResolver, AgentModelAliasResolver>();
    }
}

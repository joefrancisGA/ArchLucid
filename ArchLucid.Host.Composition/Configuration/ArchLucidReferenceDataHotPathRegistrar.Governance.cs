using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Agents;
using ArchLucid.Persistence.AiUsage;
using ArchLucid.Persistence.Authorization;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

partial class ArchLucidReferenceDataHotPathRegistrar
{
    private static void RegisterGovernanceReferenceDataHotPathRepositories(
        IServiceCollection services,
        HotPathCacheOptions hotPath)
    {
        if (!hotPath.Enabled)
        {
            services.AddScoped<ICustomRoleRepository, SqlCustomRoleRepository>();
            services.AddScoped<IPolicyPackVersionRepository, DapperPolicyPackVersionRepository>();
            services.AddScoped<IPolicyPackCatalogRepository, DapperPolicyPackCatalogRepository>();
            services.AddScoped<IAgentModelCatalogRepository, DapperAgentModelCatalogRepository>();
            services.AddScoped<IPlatformBundledPolicyPackRegistryRepository, DapperPlatformBundledPolicyPackRegistryRepository>();
            services.AddScoped<ITenantAiBudgetPolicyRepository, SqlTenantAiBudgetPolicyRepository>();
            return;
        }

        services.AddScoped<SqlCustomRoleRepository>();
        services.AddScoped<ICustomRoleRepository>(static sp => new CachingCustomRoleRepository(
            sp.GetRequiredService<SqlCustomRoleRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperPolicyPackVersionRepository>();
        services.AddScoped<IPolicyPackVersionRepository>(static sp => new CachingPolicyPackVersionRepository(
            sp.GetRequiredService<DapperPolicyPackVersionRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperPolicyPackCatalogRepository>();
        services.AddScoped<IPolicyPackCatalogRepository>(static sp => new CachingPolicyPackCatalogRepository(
            sp.GetRequiredService<DapperPolicyPackCatalogRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperAgentModelCatalogRepository>();
        services.AddScoped<IAgentModelCatalogRepository>(static sp =>
            sp.GetRequiredService<DapperAgentModelCatalogRepository>());

        services.AddScoped<DapperPlatformBundledPolicyPackRegistryRepository>();
        services.AddScoped<IPlatformBundledPolicyPackRegistryRepository>(static sp =>
            sp.GetRequiredService<DapperPlatformBundledPolicyPackRegistryRepository>());

        services.AddScoped<SqlTenantAiBudgetPolicyRepository>();
        services.AddScoped<ITenantAiBudgetPolicyRepository>(static sp => new CachingTenantAiBudgetPolicyRepository(
            sp.GetRequiredService<SqlTenantAiBudgetPolicyRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));
    }
}

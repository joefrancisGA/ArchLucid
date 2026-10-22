using ArchLucid.Core.Identity;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Scim;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

partial class ArchLucidReferenceDataHotPathRegistrar
{
    private static void RegisterTenancyReferenceDataHotPathRepositories(
        IServiceCollection services,
        HotPathCacheOptions hotPath)
    {
        if (!hotPath.Enabled)
        {
            services.AddScoped<IScimUserRepository, DapperScimUserRepository>();
            services.AddScoped<ITenantRepository, DapperTenantRepository>();
            services.AddScoped<ITenantSettingsRepository, SqlTenantSettingsRepository>();
            services.AddScoped<ITenantCostSettingsRepository, DapperTenantCostSettingsRepository>();
            services.AddScoped<ITenantIdentityProviderConfigurationRepository, SqlTenantIdentityProviderConfigurationRepository>();
            services.AddScoped<ITenantSignInEmailDomainRepository, DapperTenantSignInEmailDomainRepository>();
            return;
        }

        services.AddScoped<DapperScimUserRepository>();
        services.AddScoped<IScimUserRepository>(static sp => new CachingScimUserRepository(
            sp.GetRequiredService<DapperScimUserRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperTenantRepository>();
        services.AddScoped<ITenantRepository>(static sp => new CachingTenantRepository(
            sp.GetRequiredService<DapperTenantRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<SqlTenantSettingsRepository>();
        services.AddScoped<ITenantSettingsRepository>(static sp => new CachingTenantSettingsRepository(
            sp.GetRequiredService<SqlTenantSettingsRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperTenantCostSettingsRepository>();
        services.AddScoped<ITenantCostSettingsRepository>(static sp => new CachingTenantCostSettingsRepository(
            sp.GetRequiredService<DapperTenantCostSettingsRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<SqlTenantIdentityProviderConfigurationRepository>();
        services.AddScoped<ITenantIdentityProviderConfigurationRepository>(static sp =>
            new CachingTenantIdentityProviderConfigurationRepository(
                sp.GetRequiredService<SqlTenantIdentityProviderConfigurationRepository>(),
                sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperTenantSignInEmailDomainRepository>();
        services.AddScoped<ITenantSignInEmailDomainRepository>(static sp =>
            new CachingTenantSignInEmailDomainRepository(
                sp.GetRequiredService<DapperTenantSignInEmailDomainRepository>(),
                sp.GetRequiredService<IHotPathReadCache>()));
    }
}

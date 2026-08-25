using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Agents;
using ArchLucid.Persistence.AiUsage;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Authorization;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Scim;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Hybrid;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Hot-path read caching and reference-data repository decorator registrations.
/// </summary>
internal static class ArchLucidReferenceDataHotPathRegistrar
{
    public static void RegisterHotPathReadCaching(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<HotPathCacheOptions>(
            configuration.GetSection(HotPathCacheOptions.SectionName));

        HotPathCacheOptions snapshot = configuration
                                           .GetSection(HotPathCacheOptions.SectionName)
                                           .Get<HotPathCacheOptions>()
                                       ?? new HotPathCacheOptions();

        if (!snapshot.Enabled)
        {
            // Hot-path repository decorators stay off; optional consumers (e.g. `GET /v1/demo/preview`) still use
            // IHotPathReadCache without enabling SQL hot-path repository decorators.
            RegisterHybridCacheCore(services, snapshot, distributedL2Enabled: false);
            services.AddSingleton<IHotPathReadCache, HybridHotPathReadCache>();

            return;
        }

        string provider = HotPathCacheProviderResolver.ResolveEffectiveProvider(snapshot);
        bool distributedL2Enabled = string.Equals(provider, "Redis", StringComparison.OrdinalIgnoreCase);

        if (string.Equals(provider, "Memory", StringComparison.OrdinalIgnoreCase) &&
            snapshot.ExpectedApiReplicaCount > 1)
            services.AddHostedService<HotPathMemoryReplicaCoherenceHostedLogger>();

        if (distributedL2Enabled)
        {
            string redis = snapshot.RedisConnectionString.Trim();

            if (string.IsNullOrEmpty(redis))

                throw new InvalidOperationException(
                    "HotPathCache:RedisConnectionString is required when HotPathCache:Provider is Redis.");


            TryRegisterStackExchangeRedisDistributedCache(services, redis);
            services.AddHostedService<HotPathRedisDistributedCacheHostedLogger>();
        }

        RegisterHybridCacheCore(services, snapshot, distributedL2Enabled);
        services.AddSingleton<IHotPathReadCache, HybridHotPathReadCache>();
    }

    public static TimeSpan ResolveLocalCacheExpiration(
        HotPathCacheOptions snapshot,
        bool distributedL2Enabled,
        int absoluteExpirationSeconds)
    {
        if (!distributedL2Enabled)
            return TimeSpan.FromSeconds(absoluteExpirationSeconds);

        int localSeconds = snapshot.LocalCacheExpirationSeconds;

        if (localSeconds <= 0)
            localSeconds = Math.Clamp(absoluteExpirationSeconds / 4, 1, 15);
        else
            localSeconds = Math.Clamp(localSeconds, 1, absoluteExpirationSeconds);

        return TimeSpan.FromSeconds(localSeconds);
    }

    public static void RegisterGoldenManifestRunAndPolicyPackRepositories(
        IServiceCollection services,
        IConfiguration configuration)
    {
        HotPathCacheOptions hotPath = configuration
                                          .GetSection(HotPathCacheOptions.SectionName)
                                          .Get<HotPathCacheOptions>()
                                      ?? new HotPathCacheOptions();

        if (!hotPath.Enabled)
        {
            services.AddScoped<IGoldenManifestRepository, SqlGoldenManifestRepository>();
            services.AddScoped<IRunRepository, SqlRunRepository>();
            services.AddScoped<IArchitectureIdentityRepository, SqlArchitectureIdentityRepository>();
            services.AddScoped<IPolicyPackRepository, DapperPolicyPackRepository>();
            services.AddScoped<SqlCommittedArchitectureReviewFlagReader>();
            services.AddScoped<ICommittedArchitectureReviewFlagReader>(sp =>
                new CachingCommittedArchitectureReviewFlagReader(
                    sp.GetRequiredService<SqlCommittedArchitectureReviewFlagReader>(),
                    sp.GetRequiredService<IHotPathReadCache>()));

            return;
        }

        services.AddScoped<SqlGoldenManifestRepository>();
        services.AddScoped<IGoldenManifestRepository>(sp => new CachingGoldenManifestRepository(
            sp.GetRequiredService<SqlGoldenManifestRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<SqlRunRepository>();
        services.AddScoped<IArchitectureIdentityRepository, SqlArchitectureIdentityRepository>();
        services.AddScoped<IRunRepository>(sp => new CachingRunRepository(
            sp.GetRequiredService<SqlRunRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperPolicyPackRepository>();
        services.AddScoped<IPolicyPackRepository>(sp => new CachingPolicyPackRepository(
            sp.GetRequiredService<DapperPolicyPackRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<SqlCommittedArchitectureReviewFlagReader>();
        services.AddScoped<ICommittedArchitectureReviewFlagReader>(sp =>
            new CachingCommittedArchitectureReviewFlagReader(
                sp.GetRequiredService<SqlCommittedArchitectureReviewFlagReader>(),
                sp.GetRequiredService<IHotPathReadCache>()));
    }

    public static void RegisterAuditRepository(IServiceCollection services, IConfiguration configuration)
    {
        HotPathCacheOptions hotPath = configuration
                                          .GetSection(HotPathCacheOptions.SectionName)
                                          .Get<HotPathCacheOptions>()
                                      ?? new HotPathCacheOptions();

        if (!hotPath.Enabled)
        {
            services.AddScoped<IAuditRepository, DapperAuditRepository>();
            return;
        }

        services.AddScoped<DapperAuditRepository>();
        services.AddScoped<IAuditRepository>(sp => new CachingAuditRepository(
            sp.GetRequiredService<DapperAuditRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));
    }

    /// <summary>
    ///     Registers slowly changing / reference-data repository decorators when <c>HotPathCache:Enabled</c>
    ///     (authz middleware, tenant gate, settings, policy-pack versions/catalog, alert rules, IdP/sign-in domains).
    /// </summary>
    public static void RegisterReferenceDataHotPathRepositories(
        IServiceCollection services,
        IConfiguration configuration)
    {
        HotPathCacheOptions hotPath = configuration
                                          .GetSection(HotPathCacheOptions.SectionName)
                                          .Get<HotPathCacheOptions>()
                                      ?? new HotPathCacheOptions();

        if (!hotPath.Enabled)
        {
            services.AddScoped<ICustomRoleRepository, SqlCustomRoleRepository>();
            services.AddScoped<IScimUserRepository, DapperScimUserRepository>();
            services.AddScoped<ITenantRepository, DapperTenantRepository>();
            services.AddScoped<ITenantSettingsRepository, SqlTenantSettingsRepository>();
            services.AddScoped<IPolicyPackVersionRepository, DapperPolicyPackVersionRepository>();
            services.AddScoped<IPolicyPackCatalogRepository, DapperPolicyPackCatalogRepository>();
            services.AddScoped<IAgentModelCatalogRepository, DapperAgentModelCatalogRepository>();
            services.AddScoped<IPlatformBundledPolicyPackRegistryRepository, DapperPlatformBundledPolicyPackRegistryRepository>();
            services.AddScoped<IAlertRuleRepository, DapperAlertRuleRepository>();
            services.AddScoped<ICompositeAlertRuleRepository, DapperCompositeAlertRuleRepository>();
            services.AddScoped<ITenantAiBudgetPolicyRepository, SqlTenantAiBudgetPolicyRepository>();
            services.AddScoped<ITenantCostSettingsRepository, DapperTenantCostSettingsRepository>();
            services.AddScoped<ITenantIdentityProviderConfigurationRepository, SqlTenantIdentityProviderConfigurationRepository>();
            services.AddScoped<ITenantSignInEmailDomainRepository, DapperTenantSignInEmailDomainRepository>();

            return;
        }

        services.AddScoped<SqlCustomRoleRepository>();
        services.AddScoped<ICustomRoleRepository>(static sp => new CachingCustomRoleRepository(
            sp.GetRequiredService<SqlCustomRoleRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

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

        services.AddScoped<DapperAlertRuleRepository>();
        services.AddScoped<IAlertRuleRepository>(static sp => new CachingAlertRuleRepository(
            sp.GetRequiredService<DapperAlertRuleRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperCompositeAlertRuleRepository>();
        services.AddScoped<ICompositeAlertRuleRepository>(static sp => new CachingCompositeAlertRuleRepository(
            sp.GetRequiredService<DapperCompositeAlertRuleRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<SqlTenantAiBudgetPolicyRepository>();
        services.AddScoped<ITenantAiBudgetPolicyRepository>(static sp => new CachingTenantAiBudgetPolicyRepository(
            sp.GetRequiredService<SqlTenantAiBudgetPolicyRepository>(),
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

    private static void RegisterHybridCacheCore(
        IServiceCollection services,
        HotPathCacheOptions snapshot,
        bool distributedL2Enabled)
    {
        int seconds = snapshot.AbsoluteExpirationSeconds;

        if (seconds < 1)
            seconds = 60;

        seconds = Math.Clamp(seconds, 1, 3600);
        TimeSpan distributedTtl = TimeSpan.FromSeconds(seconds);
        TimeSpan localTtl = ResolveLocalCacheExpiration(snapshot, distributedL2Enabled, seconds);

        services.AddHybridCache(options =>
        {
            options.MaximumPayloadBytes = 16 * 1024 * 1024;

            options.DefaultEntryOptions = new HybridCacheEntryOptions
            {
                Expiration = distributedTtl,
                LocalCacheExpiration = localTtl
            };
        });
    }

    /// <summary>
    ///     Registers StackExchange Redis backing for <see cref="IDistributedCache" /> when none is present (shared with LLM
    ///     distributed completion store when both are enabled).
    /// </summary>
    private static void TryRegisterStackExchangeRedisDistributedCache(IServiceCollection services, string redis)
    {
        if (services.Any(static d => d.ServiceType == typeof(IDistributedCache)))
            return;

        services.AddStackExchangeRedisCache(o => o.Configuration = redis);
    }
}

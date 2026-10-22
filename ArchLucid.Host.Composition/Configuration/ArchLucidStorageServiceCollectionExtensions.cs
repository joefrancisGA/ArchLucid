using ArchLucid.Application.DataConsistency;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Connections;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Configuration;

public static class ArchLucidStorageServiceCollectionExtensions
{
    public static IServiceCollection AddArchLucidStorage(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArchLucidOptions options = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        services.Configure<SqlOpenResilienceOptions>(configuration.GetSection(SqlOpenResilienceOptions.SectionName));
        services.PostConfigure<SqlOpenResilienceOptions>(static o => o.Normalize());

        services.Configure<CosmosDbOptions>(configuration.GetSection(CosmosDbOptions.SectionName));

        services.Configure<AuthorityPipelineOptions>(
            configuration.GetSection("ArchLucid").GetSection(AuthorityPipelineOptions.SectionName));

        services.Configure<DataConsistencyProbeOptions>(
            configuration.GetSection(DataConsistencyProbeOptions.SectionName));

        services.Configure<RequiredAuditTrailProbeOptions>(
            configuration.GetSection(RequiredAuditTrailProbeOptions.SectionName));

        services.Configure<DataConsistencyReconciliationOptions>(
            configuration.GetSection(DataConsistencyReconciliationOptions.SectionName));

        services.Configure<DataConsistencyEnforcementOptions>(
            configuration.GetSection(DataConsistencyEnforcementOptions.SectionName));

        services.AddSingleton<IPostConfigureOptions<DataConsistencyEnforcementOptions>,
            DataConsistencyEnforcementWarnModeProductionPostConfigure>();

        services.AddOptions<ArchLucidOptions>()
            .Configure<IConfiguration>(
                static (opts, cfg) =>
                {
                    ArchLucidOptions resolved = ArchLucidConfigurationBridge.ResolveArchLucidOptions(cfg);
                    opts.StorageProvider = resolved.StorageProvider;
                });

        IStorageProviderRegistrar registrar = ArchLucidOptions.EffectiveIsInMemory(options.StorageProvider)
            ? new InMemoryStorageProviderRegistrar()
            : new SqlStorageProviderRegistrar();

        registrar.Register(services, configuration);
        ArchLucidTransactionalEmailRegistrar.RegisterTransactionalEmailServices(services, configuration, options);

        return services;
    }

    internal static void RegisterTransactionalEmailServices(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidOptions archLucidOptions) =>
        ArchLucidTransactionalEmailRegistrar.RegisterTransactionalEmailServices(services, configuration, archLucidOptions);

    internal static void RegisterSharedDistributedCacheAndLlmCompletion(
        IServiceCollection services,
        IConfiguration configuration) =>
        ArchLucidDistributedCacheRegistrar.RegisterSharedDistributedCacheAndLlmCompletion(services, configuration);

    internal static void RegisterDistributedCacheForKnowledgeGraphProjectionIfNeeded(
        IServiceCollection services,
        IConfiguration configuration) =>
        ArchLucidDistributedCacheRegistrar.RegisterDistributedCacheForKnowledgeGraphProjectionIfNeeded(services, configuration);

    internal static void RegisterHostLeaderLeaseInfrastructure(IServiceCollection services) =>
        ArchLucidDistributedCacheRegistrar.RegisterHostLeaderLeaseInfrastructure(services);

    internal static void RegisterDistributedCacheForLlmCompletionIfNeeded(
        IServiceCollection services,
        IConfiguration configuration) =>
        ArchLucidDistributedCacheRegistrar.RegisterDistributedCacheForLlmCompletionIfNeeded(services, configuration);

    internal static void RegisterLlmCompletionResponseStore(IServiceCollection services, IConfiguration configuration) =>
        ArchLucidDistributedCacheRegistrar.RegisterLlmCompletionResponseStore(services, configuration);

    internal static void RegisterHotPathReadCaching(IServiceCollection services, IConfiguration configuration) =>
        ArchLucidReferenceDataHotPathRegistrar.RegisterHotPathReadCaching(services, configuration);

    internal static TimeSpan ResolveLocalCacheExpiration(
        HotPathCacheOptions snapshot,
        bool distributedL2Enabled,
        int absoluteExpirationSeconds) =>
        ArchLucidReferenceDataHotPathRegistrar.ResolveLocalCacheExpiration(
            snapshot,
            distributedL2Enabled,
            absoluteExpirationSeconds);

    internal static void RegisterGoldenManifestRunAndPolicyPackRepositories(
        IServiceCollection services,
        IConfiguration configuration) =>
        ArchLucidReferenceDataHotPathRegistrar.RegisterGoldenManifestRunAndPolicyPackRepositories(services, configuration);

    internal static void RegisterAuditRepository(IServiceCollection services, IConfiguration configuration) =>
        ArchLucidReferenceDataHotPathRegistrar.RegisterAuditRepository(services, configuration);

    internal static void RegisterReferenceDataHotPathRepositories(
        IServiceCollection services,
        IConfiguration configuration) =>
        ArchLucidReferenceDataHotPathRegistrar.RegisterReferenceDataHotPathRepositories(services, configuration);

    internal static void RegisterArtifactLargePayloadBlobStore(IServiceCollection services, IConfiguration configuration) =>
        ArchLucidArtifactBlobStoreRegistrar.RegisterArtifactLargePayloadBlobStore(services, configuration);
}

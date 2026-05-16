using ArchLucid.AgentRuntime;
using ArchLucid.Application.DataConsistency;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Startup;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.Persistence.AzureExtractorChunkUpload;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Notifications;
using ArchLucid.Persistence.Notifications.Email;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Tenancy;

using Azure.Core;
using Azure.Identity;
using Azure.Storage.Blobs;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.DependencyInjection.Extensions;
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
        RegisterTransactionalEmailServices(services, configuration, options);

        return services;
    }

    internal static void RegisterTransactionalEmailServices(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidOptions archLucidOptions)
    {
        services.Configure<EmailNotificationOptions>(configuration.GetSection(EmailNotificationOptions.SectionName));
        services.Configure<PublicSiteOptions>(configuration.GetSection(PublicSiteOptions.SectionPath));
        services.Configure<ArchLucidRetentionOptions>(configuration.GetSection(ArchLucidRetentionOptions.SectionPath));

        if (ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
        {
            services.TryAddScoped<ISentEmailLedger, DapperSentEmailLedger>();
            services.TryAddScoped<ITenantTrialEmailContactLookup, DapperTenantTrialEmailContactLookup>();
        }
        else
        {
            services.TryAddSingleton<ISentEmailLedger, InMemorySentEmailLedger>();
            services.TryAddSingleton<ITenantTrialEmailContactLookup, NullTenantTrialEmailContactLookup>();
        }

        services.TryAddSingleton<IEmailTemplateRenderer, RazorLightEmailTemplateRenderer>();
        services.TryAddScoped<ITrialLifecycleEmailDispatcher, TrialLifecycleEmailDispatcher>();
        services.TryAddScoped<ICommitSponsorEmailNotifier, CommitSponsorEmailNotifier>();
        services.TryAddScoped<IMarketingPricingQuoteSalesNotifier, MarketingPricingQuoteSalesNotifier>();
        services.TryAddScoped<IMarketingEarlyAccessSalesNotifier, MarketingEarlyAccessSalesNotifier>();
        services.TryAddScoped<TrialScheduledLifecycleEmailScanner>();
        services.TryAddSingleton<IAzureCommunicationEmailApi, AzureCommunicationEmailApi>();

        services.AddSingleton<IEmailProvider>(static sp =>
        {
            IOptionsMonitor<EmailNotificationOptions> monitor = sp.GetRequiredService<IOptionsMonitor<EmailNotificationOptions>>();
            EmailNotificationOptions opts = monitor.CurrentValue;
            string provider = opts.Provider.Trim();

            if (string.Equals(provider, EmailProviderNames.AzureCommunicationServices, StringComparison.OrdinalIgnoreCase))

                return ActivatorUtilities.CreateInstance<AzureCommunicationServicesEmailProvider>(sp);


            if (string.Equals(provider, EmailProviderNames.Smtp, StringComparison.OrdinalIgnoreCase))
                return ActivatorUtilities.CreateInstance<SmtpEmailProvider>(sp);


            return new NoopEmailProvider();
        });
    }

    /// <summary>
    /// LLM completion cache + response store — same for Sql and InMemory storage (after Sql-only hot-path cache when applicable).
    /// </summary>
    internal static void RegisterSharedDistributedCacheAndLlmCompletion(
        IServiceCollection services,
        IConfiguration configuration)
    {
        RegisterDistributedCacheForLlmCompletionIfNeeded(services, configuration);
        RegisterDistributedCacheForKnowledgeGraphProjectionIfNeeded(services, configuration);
        RegisterLlmCompletionResponseStore(services, configuration);
    }

    internal static void RegisterDistributedCacheForKnowledgeGraphProjectionIfNeeded(
        IServiceCollection services,
        IConfiguration configuration)
    {
        KnowledgeGraphProjectionCacheOptions kg =
            configuration.GetSection(KnowledgeGraphProjectionCacheOptions.SectionName).Get<KnowledgeGraphProjectionCacheOptions>()
            ?? new KnowledgeGraphProjectionCacheOptions();

        if (kg.Backend != GraphProjectionCacheBackend.Distributed)
            return;

        if (services.Any(static d => d.ServiceType == typeof(IDistributedCache)))
            return;

        HotPathCacheOptions hotPath =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName).Get<LlmCompletionResponseCacheOptions>()
            ?? new LlmCompletionResponseCacheOptions();

        string? kgRedis = kg.RedisConnectionString?.Trim();

        string redis = !string.IsNullOrEmpty(kgRedis)
            ? kgRedis
            : !string.IsNullOrWhiteSpace(llm.RedisConnectionString)
                ? llm.RedisConnectionString!.Trim()
                : hotPath.RedisConnectionString.Trim();

        if (string.IsNullOrEmpty(redis))

            throw new InvalidOperationException(
                "ArchLucid:KnowledgeGraph:ProjectionCache:Backend is Distributed but no IDistributedCache is registered and no Redis connection string is available (configure ProjectionCache:RedisConnectionString, LlmCompletionCache:RedisConnectionString, or HotPathCache:RedisConnectionString).");


        services.AddStackExchangeRedisCache(o => o.Configuration = redis);
    }

    internal static void RegisterHostLeaderLeaseInfrastructure(IServiceCollection services)
    {
        services.AddSingleton<HostInstanceIdentifier>();
        services.AddSingleton<HostLeaderElectionCoordinator>();
    }

    internal static void RegisterDistributedCacheForLlmCompletionIfNeeded(
        IServiceCollection services,
        IConfiguration configuration)
    {
        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName).Get<LlmCompletionResponseCacheOptions>()
            ?? new LlmCompletionResponseCacheOptions();

        if (!llm.Enabled || !string.Equals(llm.Provider, "Distributed", StringComparison.OrdinalIgnoreCase))
            return;

        if (services.Any(static d => d.ServiceType == typeof(IDistributedCache)))
            return;

        HotPathCacheOptions hotPath =
            configuration.GetSection(HotPathCacheOptions.SectionName).Get<HotPathCacheOptions>() ??
            new HotPathCacheOptions();

        string redis = string.IsNullOrWhiteSpace(llm.RedisConnectionString)
            ? hotPath.RedisConnectionString.Trim()
            : llm.RedisConnectionString.Trim();

        if (string.IsNullOrEmpty(redis))

            throw new InvalidOperationException(
                "LlmCompletionCache:Provider is Distributed but no IDistributedCache is registered and neither LlmCompletionCache:RedisConnectionString nor HotPathCache:RedisConnectionString is set.");


        services.AddStackExchangeRedisCache(o => o.Configuration = redis);
    }

    internal static void RegisterLlmCompletionResponseStore(IServiceCollection services, IConfiguration configuration)
    {
        LlmCompletionResponseCacheOptions llm =
            configuration.GetSection(LlmCompletionResponseCacheOptions.SectionName).Get<LlmCompletionResponseCacheOptions>()
            ?? new LlmCompletionResponseCacheOptions();

        if (!llm.Enabled)
            return;

        if (string.Equals(llm.Provider, "Distributed", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<ILlmCompletionResponseStore>(sp =>
                new DistributedLlmCompletionResponseStore(sp.GetRequiredService<IDistributedCache>()));

            return;
        }

        int maxEntries = Math.Max(1, llm.MaxEntries);
        services.AddSingleton<ILlmCompletionResponseStore>(_ => new MemoryLlmCompletionResponseStore(maxEntries));
    }

    internal static void RegisterHotPathReadCaching(IServiceCollection services, IConfiguration configuration)
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
            RegisterHybridCacheCore(services, snapshot);
            services.AddSingleton<IHotPathReadCache, HybridHotPathReadCache>();

            return;
        }

        string provider = HotPathCacheProviderResolver.ResolveEffectiveProvider(snapshot);

        if (string.Equals(provider, "Memory", StringComparison.OrdinalIgnoreCase) &&
            snapshot.ExpectedApiReplicaCount > 1)
            services.AddHostedService<HotPathMemoryReplicaCoherenceHostedLogger>();

        if (string.Equals(provider, "Redis", StringComparison.OrdinalIgnoreCase))
        {
            string redis = snapshot.RedisConnectionString.Trim();

            if (string.IsNullOrEmpty(redis))

                throw new InvalidOperationException(
                    "HotPathCache:RedisConnectionString is required when HotPathCache:Provider is Redis.");


            TryRegisterStackExchangeRedisDistributedCache(services, redis);
        }

        RegisterHybridCacheCore(services, snapshot);
        services.AddSingleton<IHotPathReadCache, HybridHotPathReadCache>();

        if (string.Equals(provider, "Memory", StringComparison.OrdinalIgnoreCase) &&
            snapshot.ExpectedApiReplicaCount > 1)
            services.AddHostedService<HotPathMemoryReplicaCoherenceHostedLogger>();
    }

    private static void RegisterHybridCacheCore(IServiceCollection services, HotPathCacheOptions snapshot)
    {
        int seconds = snapshot.AbsoluteExpirationSeconds;

        if (seconds < 1)
            seconds = 60;

        seconds = Math.Clamp(seconds, 1, 3600);
        TimeSpan ttl = TimeSpan.FromSeconds(seconds);

        services.AddHybridCache(options =>
        {
            options.MaximumPayloadBytes = 16 * 1024 * 1024;

            options.DefaultEntryOptions = new HybridCacheEntryOptions
            {
                Expiration = ttl,
                LocalCacheExpiration = ttl
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

    internal static void RegisterGoldenManifestRunAndPolicyPackRepositories(
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
            services.AddScoped<IPolicyPackRepository, DapperPolicyPackRepository>();
            services.AddScoped<
                ICommittedArchitectureReviewFlagReader,
                SqlCommittedArchitectureReviewFlagReader>();

            return;
        }

        services.AddScoped<SqlGoldenManifestRepository>();
        services.AddScoped<IGoldenManifestRepository>(sp => new CachingGoldenManifestRepository(
            sp.GetRequiredService<SqlGoldenManifestRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<SqlRunRepository>();
        services.AddScoped<IRunRepository>(sp => new CachingRunRepository(
            sp.GetRequiredService<SqlRunRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperPolicyPackRepository>();
        services.AddScoped<IPolicyPackRepository>(sp => new CachingPolicyPackRepository(
            sp.GetRequiredService<DapperPolicyPackRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<
            ICommittedArchitectureReviewFlagReader,
            SqlCommittedArchitectureReviewFlagReader>();
    }

    internal static void RegisterArtifactLargePayloadBlobStore(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ArtifactLargePayloadOptions>(
            configuration.GetSection(ArtifactLargePayloadOptions.SectionName));
        services.Configure<AzureExtractorChunkUploadOptions>(
            configuration.GetSection(AzureExtractorChunkUploadOptions.SectionName));

        ArtifactLargePayloadOptions snapshot = configuration
                                                   .GetSection(ArtifactLargePayloadOptions.SectionName)
                                                   .Get<ArtifactLargePayloadOptions>()
                                               ?? new ArtifactLargePayloadOptions();

        AzureExtractorChunkUploadOptions chunkSnapshot =
            configuration.GetSection(AzureExtractorChunkUploadOptions.SectionName).Get<AzureExtractorChunkUploadOptions>()
            ?? new AzureExtractorChunkUploadOptions();

        string provider = snapshot.BlobProvider;

        if (string.Equals(provider, "AzureBlob", StringComparison.OrdinalIgnoreCase))
        {
            string uriText = snapshot.AzureBlobServiceUri;

            if (string.IsNullOrWhiteSpace(uriText))

                throw new InvalidOperationException(
                    "ArtifactLargePayload:AzureBlobServiceUri is required when BlobProvider is AzureBlob.");


            Uri serviceUri = new(uriText, UriKind.Absolute);
            services.AddSingleton<TokenCredential>(_ => new DefaultAzureCredential());
            services.AddSingleton(sp =>
                new BlobServiceClient(serviceUri, sp.GetRequiredService<TokenCredential>()));
            services.AddSingleton<IArtifactBlobStore>(sp =>
                new AzureBlobArtifactBlobStore(
                    sp.GetRequiredService<BlobServiceClient>(),
                    sp.GetRequiredService<TokenCredential>(),
                    sp.GetRequiredService<IScopeContextProvider>()));
            services.AddScoped<IAzureExtractorChunkSessionStore, AzureBlobAzureExtractorChunkSessionStore>();
        }
        else if (string.Equals(provider, "Local", StringComparison.OrdinalIgnoreCase))
        {
            string resolvedRoot = Path.GetFullPath(
                string.IsNullOrWhiteSpace(snapshot.LocalRootPath)
                    ? Path.Combine(AppContext.BaseDirectory, "blob-store")
                    : snapshot.LocalRootPath);

            string stagingRelative = string.IsNullOrWhiteSpace(chunkSnapshot.LocalStagingRelativeDirectory)
                ? "azure-extractor-chunk-upload"
                : chunkSnapshot.LocalStagingRelativeDirectory.Trim();

            string stagingRoot = Path.Combine(resolvedRoot, stagingRelative);

            services.AddSingleton<IArtifactBlobStore>(sp =>
                new LocalFileArtifactBlobStore(resolvedRoot, sp.GetRequiredService<IScopeContextProvider>()));

            services.AddScoped<IAzureExtractorChunkSessionStore>(sp =>
                new LocalAzureExtractorChunkSessionStore(
                    stagingRoot,
                    sp.GetRequiredService<IScopeContextProvider>(),
                    sp.GetRequiredService<IOptions<AzureExtractorChunkUploadOptions>>()));
        }
        else

        {
            services.AddSingleton<IArtifactBlobStore, NullArtifactBlobStore>();

            services.AddSingleton<IAzureExtractorChunkSessionStore, NullAzureExtractorChunkSessionStore>();
        }

    }
}

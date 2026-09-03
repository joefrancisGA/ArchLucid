using ArchLucid.Core.Authority;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

partial class ArchLucidReferenceDataHotPathRegistrar
{
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
            services.AddScoped<IArchitectureVersionRepository, SqlArchitectureVersionRepository>();
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
        services.AddScoped<IArchitectureVersionRepository, SqlArchitectureVersionRepository>();
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
}

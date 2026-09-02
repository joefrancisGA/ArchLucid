using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Bootstrap.Seeders;

public static class DemoSeedSeederServiceCollectionExtensions
{
    public static IServiceCollection AddDemoSeedScenarioSeeders(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<DemoSeedSeederDependencies>(static sp => new DemoSeedSeederDependencies(
            sp.GetRequiredService<IArchitectureRequestRepository>(),
            sp.GetRequiredService<IRunRepository>(),
            sp.GetRequiredService<IScopeContextProvider>(),
            sp.GetRequiredService<IAgentTaskRepository>(),
            sp.GetRequiredService<IAgentResultRepository>(),
            sp.GetRequiredService<IAuthorityCommittedManifestChainWriter>(),
            sp.GetRequiredService<IOptionsMonitor<DemoOptions>>(),
            sp.GetRequiredService<IGovernanceApprovalRequestRepository>(),
            sp.GetRequiredService<IGovernancePromotionRecordRepository>(),
            sp.GetRequiredService<IGovernanceEnvironmentActivationRepository>(),
            sp.GetRequiredService<IRunExportRecordRepository>(),
            sp.GetRequiredService<IArtifactBundleRepository>(),
            sp.GetRequiredService<IAuditService>(),
            sp.GetRequiredService<IActorContext>(),
            sp.GetRequiredService<ILogger<DemoSeedService>>()));

        services.AddScoped<DemoSeedPersistenceChain>();
        services.AddScoped<DemoSeedTrialWelcomeSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedRetailBaselineSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedGovernanceSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedNorthwindTourSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedMeridianAlpineSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedCreatedSampleSeeder>();

        return services;
    }
}

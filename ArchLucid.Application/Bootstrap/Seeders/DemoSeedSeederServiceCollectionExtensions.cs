using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

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
            sp.GetRequiredService<IAuthorityQueryService>(),
            sp.GetRequiredService<IManifestHashService>(),
            sp.GetRequiredService<IAuditRepository>(),
            sp.GetRequiredService<IGoldenManifestRepository>(),
            sp.GetRequiredService<IAuthorityFeasibilityVerdictComposer>(),
            sp.GetRequiredService<IActorContext>(),
            sp.GetRequiredService<ILogger<DemoSeedService>>()));

        services.AddScoped<DemoSeedPersistenceChain>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedExportLineageAuditRepairSeeder>();
        services.AddScoped<DemoSeedTrialWelcomeSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedRetailBaselineSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedGovernanceSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedNorthwindTourSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedMeridianAlpineSeeder>();
        services.AddScoped<IDemoSeedScenarioSeeder, DemoSeedCreatedSampleSeeder>();

        return services;
    }
}

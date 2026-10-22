using ArchLucid.Application.DataConsistency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class DataHealthJobsCompositionModule
{
    private static void RegisterDataConsistencyReconciliation(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.Configure<DataConsistencyReconciliationOptions>(configuration.GetSection(DataConsistencyReconciliationOptions.SectionName));
        services.Configure<StaleInFlightAutoRemediationOptions>(
            configuration.GetSection(StaleInFlightAutoRemediationOptions.SectionName));
        services.Configure<MissingArchitectureRequestAutoRemediationOptions>(
            configuration.GetSection(MissingArchitectureRequestAutoRemediationOptions.SectionName));
        services.Configure<HungReviewExecuteWatchdogOptions>(
            configuration.GetSection(HungReviewExecuteWatchdogOptions.SectionName));
        services.AddScoped<IHungReviewExecuteWatchdog, HungReviewExecuteWatchdog>();
        services.AddSingleton<IArchLucidStorageMode, ArchLucidStorageMode>();
        services.AddSingleton<ILeaderElectionWorkRunner, LeaderElectionWorkRunner>();
        services.AddSingleton<DataConsistencyReconciliationHealthState>();
        services.AddScoped<IDataConsistencyReconciliationService, DataConsistencyReconciliationService>();

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)
        {
            services.AddHostedService<DataConsistencyReconciliationHostedService>();
            services.AddHostedService<RunExecuteOwnershipReconciliationHostedService>();
            services.AddHostedService<RunExecuteOwnershipShutdownReleaseHostedService>();
            services.AddHostedService<StaleInFlightAutoRemediationHostedService>();
            services.AddHostedService<MissingArchitectureRequestAutoRemediationHostedService>();
            services.AddHostedService<HungReviewExecuteWatchdogHostedService>();
        }
    }
}

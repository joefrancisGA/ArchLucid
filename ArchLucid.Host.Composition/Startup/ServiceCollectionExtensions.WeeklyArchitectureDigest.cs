using ArchLucid.Application.WeeklyArchitectureDigest;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterWeeklyArchitectureDigest(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<WeeklyArchitectureDigestOptions>(
            configuration.GetSection(WeeklyArchitectureDigestOptions.SectionName));
        services.AddScoped<WeeklyArchitectureDigestJobRunner>();
    }

    private static void RegisterWeeklyArchitectureDigestWorkerInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;


        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.WeeklyArchitectureDigest))

            services.AddHostedService<WeeklyArchitectureDigestHostedService>();
    }
}

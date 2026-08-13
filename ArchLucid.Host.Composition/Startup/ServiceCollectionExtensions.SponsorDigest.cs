using ArchLucid.Application.SponsorDigest;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterSponsorDigestServices(IServiceCollection services)
    {
        services.AddDataProtection();
        services.AddSingleton<ISponsorDigestUnsubscribeTokenFactory, SponsorDigestUnsubscribeTokenFactory>();
        services.AddScoped<ISponsorDigestComposer, SponsorDigestComposer>();
        services.AddScoped<ISponsorDigestEmailDispatcher, SponsorDigestEmailDispatcher>();
        services.AddScoped<SponsorDigestWeeklyDeliveryScanner>();
    }

    private static void RegisterSponsorDigestWorkerInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;


        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.SponsorDigestWeekly))

            services.AddHostedService<SponsorDigestWeeklyHostedService>();
    }
}

using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.WeeklySponsorReport;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterWeeklySponsorReportServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<WeeklySponsorReportOptions>(
            configuration.GetSection(WeeklySponsorReportOptions.SectionName));

        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
            services.AddScoped<ISponsorReportRecipientLookup, DapperSponsorReportRecipientLookup>();
        else
            services.AddSingleton<ISponsorReportRecipientLookup, NullSponsorReportRecipientLookup>();

        services.AddScoped<IWeeklySponsorReportEmailDispatcher, WeeklySponsorReportEmailDispatcher>();
        services.AddScoped<WeeklySponsorReportDeliveryScanner>();
    }

    private static void RegisterWeeklySponsorReportWorkerInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.WeeklySponsorReport))
            services.AddHostedService<WeeklySponsorReportHostedService>();
    }
}

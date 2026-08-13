using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.WeeklySponsorSummary;
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
    private static void RegisterWeeklySponsorSummaryServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<WeeklySponsorSummaryOptions>(
            configuration.GetSection(WeeklySponsorSummaryOptions.SectionName));

        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
            services.AddScoped<ISponsorSummaryRecipientLookup, DapperSponsorSummaryRecipientLookup>();
        else
            services.AddSingleton<ISponsorSummaryRecipientLookup, NullSponsorSummaryRecipientLookup>();

        services.AddScoped<IWeeklySponsorSummaryEmailDispatcher, WeeklySponsorSummaryEmailDispatcher>();
        services.AddScoped<WeeklySponsorSummaryDeliveryScanner>();
    }

    private static void RegisterWeeklySponsorSummaryWorkerInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.WeeklySponsorSummary))
            services.AddHostedService<WeeklySponsorSummaryHostedService>();
    }
}

using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.WeeklyExecutiveSummary;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterWeeklyExecutiveSummaryServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<WeeklyExecutiveSummaryOptions>(
            configuration.GetSection(WeeklyExecutiveSummaryOptions.SectionName));

        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
            services.AddScoped<IExecutiveSummaryRecipientLookup, DapperExecutiveSummaryRecipientLookup>();
        else
            services.AddSingleton<IExecutiveSummaryRecipientLookup, NullExecutiveSummaryRecipientLookup>();

        services.AddScoped<IWeeklyExecutiveSummaryEmailDispatcher, WeeklyExecutiveSummaryEmailDispatcher>();
        services.AddScoped<WeeklyExecutiveSummaryDeliveryScanner>();
    }

    private static void RegisterWeeklyExecutiveSummaryWorkerInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.WeeklyExecutiveSummary))
            services.AddHostedService<WeeklyExecutiveSummaryHostedService>();
    }
}

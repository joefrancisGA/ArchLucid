// Weekly digest bounded-context composition registrations (exec digest, sponsor report/summary, architecture digest).

using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.SponsorDigest;
using ArchLucid.Application.WeeklyArchitectureDigest;
using ArchLucid.Application.WeeklySponsorReport;
using ArchLucid.Application.WeeklySponsorSummary;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Executive digest, weekly sponsor report/summary, and weekly architecture digest DI registrations.
/// </summary>
public static class WeeklyDigestCompositionModule
{
    /// <summary>
    ///     Registers weekly digest services and worker hosted services for the given host role.
    /// </summary>
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterExecDigestServices(services);
        RegisterWeeklySponsorReportServices(services, configuration);
        RegisterWeeklySponsorSummaryServices(services, configuration);
        RegisterWeeklyArchitectureDigest(services, configuration);
        RegisterExecDigestWorkerInfrastructure(services, configuration, hostingRole);
        RegisterWeeklySponsorReportWorkerInfrastructure(services, configuration, hostingRole);
        RegisterWeeklySponsorSummaryWorkerInfrastructure(services, configuration, hostingRole);
        RegisterWeeklyArchitectureDigestWorkerInfrastructure(services, configuration, hostingRole);
    }

    private static void RegisterExecDigestServices(IServiceCollection services)
    {
        services.AddDataProtection();
        services.AddSingleton<IExecDigestUnsubscribeTokenFactory, ExecDigestUnsubscribeTokenFactory>();
        services.AddSingleton<IExecDigestSponsorDeepLinkTokenFactory, ExecDigestSponsorDeepLinkTokenFactory>();
        services.AddSingleton<ISponsorDigestUnsubscribeTokenFactory, SponsorDigestUnsubscribeTokenFactory>();
        services.AddScoped<IExecDigestComposer, ExecDigestComposer>();
        services.AddScoped<IExecDigestSponsorDeepLinkReadService, ExecDigestSponsorDeepLinkReadService>();
        services.AddScoped<IExecDigestEmailDispatcher, ExecDigestEmailDispatcher>();
        services.AddScoped<ExecDigestWeeklyDeliveryScanner>();
        services.AddScoped<SponsorDigestWeeklyDeliveryScanner>();
    }

    private static void RegisterExecDigestWorkerInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.ExecDigestWeekly))
            services.AddHostedService<ExecDigestWeeklyHostedService>();

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.SponsorDigestWeekly))
            services.AddHostedService<SponsorDigestWeeklyHostedService>();
    }

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

    private static void RegisterWeeklySponsorSummaryServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<WeeklySponsorSummaryOptions>(
            configuration.GetSection(WeeklySponsorSummaryOptions.SectionName));

        ArchLucidOptions archLucidOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
            services.AddScoped<ISponsorReportRecipientLookup, DapperSponsorReportRecipientLookup>();
        else
            services.AddSingleton<ISponsorReportRecipientLookup, NullSponsorReportRecipientLookup>();

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

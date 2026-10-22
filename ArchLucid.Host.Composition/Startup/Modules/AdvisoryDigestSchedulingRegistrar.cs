// Advisory-scan and digest-delivery composition registrations (extracted from ServiceCollectionExtensions.SchedulingAndAlerts).

using ArchLucid.Application.Advisory;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Http;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Notifications;
using ArchLucid.Notifications.Advisory;
using ArchLucid.Persistence.Advisory;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Advisory scan / architecture-review recurrence scheduling and digest webhook/email delivery.
/// </summary>
internal static class AdvisoryDigestSchedulingRegistrar
{
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterAdvisoryScheduling(services, configuration, hostingRole);
        RegisterDigestDelivery(services, configuration);
    }

    internal static void RegisterAdvisoryScheduling(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.AddScoped<IScanScheduleCalculator, SimpleScanScheduleCalculator>();
        services.AddScoped<IArchitectureReviewRecurrenceNextRunCalculator, ArchitectureReviewRecurrenceNextRunCalculator>();
        services.AddScoped<IArchitectureDigestBuilder, ArchitectureDigestBuilder>();
        services.AddScoped<IAdvisoryScanRunner, AdvisoryScanRunner>();
        services.AddScoped<AdvisoryDueScheduleProcessor>();
        services
            .AddOptions<AdvisoryScanHostedServiceOptions>()
            .BindConfiguration(AdvisoryScanHostedServiceOptions.SectionName)
            .PostConfigure(static o =>
            {
                if (o.PollInterval <= TimeSpan.Zero)
                    o.PollInterval = TimeSpan.FromMinutes(5);
            });

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.AdvisoryScan))

            services.AddHostedService<AdvisoryScanHostedService>();

        services.AddScoped<ArchitectureReviewRecurrenceDueScheduleProcessor>();
        services
            .AddOptions<ArchitectureReviewRecurrenceHostedServiceOptions>()
            .BindConfiguration(ArchitectureReviewRecurrenceHostedServiceOptions.SectionName)
            .PostConfigure(static o =>
            {
                if (o.PollInterval <= TimeSpan.Zero)
                    o.PollInterval = TimeSpan.FromMinutes(10);
            });

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)
            services.AddHostedService<ArchitectureReviewRecurrenceHostedService>();

    }

    internal static void RegisterDigestDelivery(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<WebhookDeliveryOptions>(configuration.GetSection(WebhookDeliveryOptions.SectionName));
        services.Configure<ChatOpsIncomingWebhooksOptions>(
            configuration.GetSection(ChatOpsIncomingWebhooksOptions.SectionName));
        services.AddSingleton<IEmailSender, FakeEmailSender>();
        services
            .AddHttpClient(
                HttpWebhookPoster.WebhookHttpClientName,
                static client => client.Timeout = TimeSpan.FromSeconds(60))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services.AddSingleton<HttpWebhookPoster>();
        services.AddSingleton<FakeWebhookPoster>();
        services.AddSingleton<IWebhookPoster>(static sp =>
        {
            IOptionsMonitor<WebhookDeliveryOptions> monitor = sp.GetRequiredService<IOptionsMonitor<WebhookDeliveryOptions>>();
            IWebhookPoster inner = monitor.CurrentValue.UseHttpClient
                ? sp.GetRequiredService<HttpWebhookPoster>()
                : sp.GetRequiredService<FakeWebhookPoster>();

            IWebhookPoster withOptionalCloudEvents = new CloudEventsWrappingWebhookPoster(monitor, inner);

            return new WebhookHmacEnvelopePoster(monitor, withOptionalCloudEvents);
        });
        services.AddSingleton<IChatOpsWebhookDeliveryService, ChatOpsWebhookDeliveryService>();
        services.AddSingleton<IAuthorityRunCommittedChatOpsHook, AuthorityRunCommittedChatOpsHook>();
        services.AddSingleton<ISlackInteractivityVerifier, SlackInteractivityVerifier>();
        services.AddScoped<IDigestDeliveryChannel, DigestEmailDeliveryChannel>();
        services.AddScoped<IDigestDeliveryChannel, DigestTeamsWebhookDeliveryChannel>();
        services.AddScoped<IDigestDeliveryChannel, DigestSlackWebhookDeliveryChannel>();
        services.AddScoped<IDigestDeliveryDispatcher, DigestDeliveryDispatcher>();
    }
}

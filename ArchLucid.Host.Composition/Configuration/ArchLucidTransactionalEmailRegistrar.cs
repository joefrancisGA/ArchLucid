using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Support;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Tenancy;
using ArchLucid.Notifications.Email.RazorLight;
using ArchLucid.Persistence.Notifications;
using ArchLucid.Persistence.Notifications.Email;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Transactional email provider, template rendering, and notification dispatch registrations.
/// </summary>
internal static class ArchLucidTransactionalEmailRegistrar
{
    public static void RegisterTransactionalEmailServices(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidOptions archLucidOptions)
    {
        services.Configure<EmailNotificationOptions>(configuration.GetSection(EmailNotificationOptions.SectionName));
        services.Configure<PublicSiteOptions>(configuration.GetSection(PublicSiteOptions.SectionPath));
        services.Configure<ArchLucidRetentionOptions>(configuration.GetSection(ArchLucidRetentionOptions.SectionPath));

        if (ArchLucidOptions.EffectiveIsSql(archLucidOptions.StorageProvider))
        {
            services.TryAddScoped<ISentEmailLedger, DapperSentEmailLedger>();
            services.TryAddScoped<ITenantTrialEmailContactLookup, DapperTenantTrialEmailContactLookup>();
        }
        else
        {
            services.TryAddSingleton<ISentEmailLedger, InMemorySentEmailLedger>();
            services.TryAddSingleton<ITenantTrialEmailContactLookup, NullTenantTrialEmailContactLookup>();
        }

        services.TryAddSingleton<IEmailTemplateRenderer, RazorLightEmailTemplateRenderer>();
        services.TryAddScoped<ITrialLifecycleEmailDispatcher, TrialLifecycleEmailDispatcher>();
        services.TryAddScoped<ICommitSponsorEmailNotifier, CommitSponsorEmailNotifier>();
        services.TryAddScoped<IMarketingPricingQuoteSalesNotifier, MarketingPricingQuoteSalesNotifier>();
        services.TryAddScoped<IMarketingEarlyAccessSalesNotifier, MarketingEarlyAccessSalesNotifier>();
        services.TryAddScoped<ISupportProblemReportNotifier, SupportProblemReportNotifier>();
        services.TryAddScoped<TrialScheduledLifecycleEmailScanner>();
        services.TryAddSingleton<IAzureCommunicationEmailApi, AzureCommunicationEmailApi>();

        services.AddSingleton<IEmailProvider>(static sp =>
        {
            IOptionsMonitor<EmailNotificationOptions> monitor = sp.GetRequiredService<IOptionsMonitor<EmailNotificationOptions>>();
            EmailNotificationOptions opts = monitor.CurrentValue;
            string provider = opts.Provider.Trim();

            if (string.Equals(provider, EmailProviderNames.AzureCommunicationServices, StringComparison.OrdinalIgnoreCase))

                return ActivatorUtilities.CreateInstance<AzureCommunicationServicesEmailProvider>(sp);


            if (string.Equals(provider, EmailProviderNames.Smtp, StringComparison.OrdinalIgnoreCase))
                return ActivatorUtilities.CreateInstance<SmtpEmailProvider>(sp);


            return new NoopEmailProvider();
        });
    }
}

using ArchLucid.Application.Admin;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;
using ArchLucid.Application.Marketing;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Support;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Secrets;
using ArchLucid.Core.IntegrationSecrets;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Configuration.IntegrationSecrets;
using ArchLucid.Host.Core.Configuration.Secrets;
using ArchLucid.Host.Composition.Metering;
using ArchLucid.Persistence.Metering;

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterTenancyMeteringAndSecrets(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ArchLucid.Core.Metering.MeteringOptions>(
            configuration.GetSection(ArchLucid.Core.Metering.MeteringOptions.SectionName));
        services.PostConfigure<ArchLucid.Core.Metering.MeteringOptions>(static options => options.Normalize());
        services.Configure<ArchLucidSecretOptions>(configuration.GetSection(ArchLucidSecretOptions.SectionName));
        services.Configure<IntegrationsAtlassianOAuthOptions>(
            configuration.GetSection(IntegrationsAtlassianOAuthOptions.SectionName));
        services.Configure<TrialAuthOptions>(configuration.GetSection(TrialAuthOptions.SectionPath));
        services.Configure<EmailOtpAuthOptions>(configuration.GetSection(EmailOtpAuthOptions.SectionPath));
        services.PostConfigure<EmailOtpAuthOptions>(static options => options.Normalize());
        services.Configure<TrialLifecycleSchedulerOptions>(
            configuration.GetSection(TrialLifecycleSchedulerOptions.SectionName));
        services.Configure<TrialLifecycleEmailRoutingOptions>(
            configuration.GetSection(TrialLifecycleEmailRoutingOptions.SectionName));
        services.Configure<TenantProvisioningOptions>(
            configuration.GetSection(TenantProvisioningOptions.SectionName));

        services.AddScoped<ITrialBootstrapEmailVerificationPolicy, TrialBootstrapEmailVerificationPolicy>();
        services.AddSingleton<PasswordHasher<TrialIdentityHasherUser>>();
        services.AddSingleton<TrialPasswordPolicyValidator>();
        services.AddHttpClient<PwnedPasswordRangeClient>(
            client =>
            {
                client.BaseAddress = new Uri("https://api.pwnedpasswords.com/");
                client.DefaultRequestHeaders.TryAddWithoutValidation("Add-Padding", "true");
                client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.ExternalIntegration);
            });
        services.AddScoped<ITrialLocalIdentityAccountExistsNotifier, TrialLocalIdentityAccountExistsEmailNotifier>();
        services.AddScoped<ITrialLocalIdentityService, TrialLocalIdentityService>();
        services.AddScoped<IPlatformIdentityService, PlatformIdentityService>();
        services.AddScoped<ILegacyPlatformIdentityMigrationService, LegacyPlatformIdentityMigrationService>();
        services.AddScoped<IEmailOtpAuthService, EmailOtpAuthService>();
        services.AddScoped<IPostAuthBootstrapService, PostAuthBootstrapService>();
        services.AddScoped<IEmailOtpSignInDomainPolicyService, EmailOtpSignInDomainPolicyService>();
        services.AddScoped<IAuthSignInRoutingService, AuthSignInRoutingService>();
        services.AddScoped<AuthDomainDnsVerificationService>();
        services.AddScoped<TenantAuthDomainAdminService>();
        services.AddScoped<IAuthenticationIdentityLinkingService, AuthenticationIdentityLinkingService>();
        services.AddScoped<ISignInMethodRemovalPolicyService, SignInMethodRemovalPolicyService>();
        services.AddHttpClient<CloudflareDnsTxtRecordLookup>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.ExternalIntegration);
        });
        services.AddScoped<IDnsTxtRecordLookup>(static sp =>
            sp.GetRequiredService<CloudflareDnsTxtRecordLookup>());
        services.AddScoped<IEmailOtpEmailNotifier, EmailOtpEmailNotifier>();
        services.AddScoped<IUserInvitationAdminService, UserInvitationAdminService>();
        services.AddScoped<ISupportProblemReportIntakeService, SupportProblemReportIntakeService>();

        services.AddScoped<IUsageMeteringService, UsageMeteringService>();
        services.AddSingleton<ApiRequestUsageEventBuffer>();
        services.AddSingleton<IApiRequestUsageEventBuffer>(static sp => sp.GetRequiredService<ApiRequestUsageEventBuffer>());
        services.AddHostedService<ApiRequestUsageEventBatchFlushHostedService>();
        services.AddScoped<ITenantProvisioningService, TenantProvisioningService>();
        services.AddScoped<IDefaultPolicyPackSeeder, DefaultPolicyPackSeeder>();
        services.AddScoped<DefaultPolicyPackCloudBaselineApplicator>();
        services.AddScoped<ITrialTenantBootstrapService, TrialTenantBootstrapService>();
        services.AddScoped<IMarketingAttributionService, MarketingAttributionService>();
        services.AddScoped<TrialLimitGate>();
        services.AddSingleton<ITenantTrialSeatSkipCache, TenantTrialSeatSkipCache>();
        services.AddScoped<TrialSeatAccountant>();
        services.AddScoped<ITenantUsageStatusService, TenantUsageStatusService>();
        services.AddScoped<TrialLifecycleTransitionEngine>();

        services.AddSingleton<InMemoryIntegrationSecretStore>();

        services.AddSingleton<ISecretProvider>(sp =>
        {
            IOptions<ArchLucidSecretOptions> options = sp.GetRequiredService<IOptions<ArchLucidSecretOptions>>();
            ArchLucidSecretOptions o = options.Value;
            InMemoryIntegrationSecretStore overlay = sp.GetRequiredService<InMemoryIntegrationSecretStore>();

            if (o.Provider == SecretProviderKind.KeyVault)
            {
                return new KeyVaultSecretProvider(
                    Options.Create(o),
                    sp.GetRequiredService<IMemoryCache>());
            }

            ISecretProvider inner = new EnvironmentVariableSecretProvider(sp.GetRequiredService<IConfiguration>());

            return new CompositeSecretProvider(inner, overlay);
        });

        services.AddSingleton<IIntegrationSecretWriter>(sp =>
        {
            IOptions<ArchLucidSecretOptions> options = sp.GetRequiredService<IOptions<ArchLucidSecretOptions>>();
            ArchLucidSecretOptions o = options.Value;

            if (o.Provider == SecretProviderKind.KeyVault)
            {
                return new KeyVaultIntegrationSecretWriter(
                    Options.Create(o),
                    sp.GetRequiredService<IMemoryCache>());
            }

            return new InMemoryIntegrationSecretWriter(sp.GetRequiredService<InMemoryIntegrationSecretStore>());
        });
    }
}

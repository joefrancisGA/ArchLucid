using ArchLucid.Application.Admin;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Identity;
using ArchLucid.Application.Marketing;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Operator;
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
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Tenancy;
using ArchLucid.Host.Composition.Metering;
using ArchLucid.Persistence.Metering;
using ArchLucid.Persistence.Tenancy;

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
        services.AddSingleton<IValidateOptions<EmailOtpAuthOptions>, EmailOtpAuthOptionsValidator>();
        services.AddOptions<EmailOtpAuthOptions>().ValidateOnStart();
        services.Configure<PublicSignupOptions>(configuration.GetSection(PublicSignupOptions.SectionPath));
        services.Configure<SelfServiceAbuseOptions>(configuration.GetSection(SelfServiceAbuseOptions.SectionPath));
        services.PostConfigure<SelfServiceAbuseOptions>(static options => options.Normalize());
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
            })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<ITrialLocalIdentityAccountExistsNotifier, TrialLocalIdentityAccountExistsEmailNotifier>();
        services.AddScoped<ITrialLocalIdentityService, TrialLocalIdentityService>();
        services.AddScoped<IPlatformIdentityService, PlatformIdentityService>();
        services.AddScoped<ILegacyPlatformIdentityMigrationService, LegacyPlatformIdentityMigrationService>();
        services.AddScoped<IEmailOtpAuthService, EmailOtpAuthService>();
        services.AddHttpClient(
            nameof(TurnstileEmailOtpBotChallengeVerifier),
            static client =>
            {
                client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.ExternalIntegration);
            })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<TurnstileEmailOtpBotChallengeVerifier>();
        services.AddScoped<IEmailOtpBotChallengeVerifier, EmailOtpBotChallengeVerifier>();
        services.AddScoped<ISelfServiceTrialAbusePolicy, SelfServiceTrialAbusePolicy>();
        services.AddScoped<IRegistrationApplicationService, RegistrationApplicationService>();
        services.AddScoped<IWorkspacePackagingLimitEvaluator, WorkspacePackagingLimitEvaluator>();
        services.AddScoped<IPostAuthInvitationBootstrapService, PostAuthInvitationBootstrapService>();
        services.AddScoped<IPostAuthWorkspaceBootstrapService, PostAuthWorkspaceBootstrapService>();
        services.AddScoped<IPostAuthBootstrapService, PostAuthBootstrapService>();
        services.AddScoped<IEmailOtpSignInDomainPolicyService, EmailOtpSignInDomainPolicyService>();
        services.AddScoped<IAuthSignInRoutingService, AuthSignInRoutingService>();
        services.AddScoped<AuthDomainDnsVerificationService>();
        services.AddScoped<TenantAuthDomainAdminService>();
        services.AddScoped<IPlatformAuthRecoveryService, PlatformAuthRecoveryService>();
        services.AddScoped<IPlatformRecoveryNotificationService, PlatformRecoveryNotificationService>();
        services.AddScoped<IUserAccountRecoveryService, UserAccountRecoveryService>();
        services.AddScoped<IAuthenticationIdentityLinkProposalService, AuthenticationIdentityLinkProposalService>();
        services.AddScoped<IAuthenticationIdentityLinkChallengeService, AuthenticationIdentityLinkChallengeService>();
        services.AddScoped<IAuthenticationIdentityLinkingService, AuthenticationIdentityLinkingService>();
        services.AddScoped<ISignInMethodRemovalPolicyService, SignInMethodRemovalPolicyService>();
        services.AddHttpClient<CloudflareDnsTxtRecordLookup>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.ExternalIntegration);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<IDnsTxtRecordLookup>(static sp =>
            sp.GetRequiredService<CloudflareDnsTxtRecordLookup>());
        services.AddScoped<IEmailOtpEmailNotifier, EmailOtpEmailNotifier>();
        services.AddScoped<IUserInvitationAdminService, UserInvitationAdminService>();
        services.AddScoped<IUserInvitationFlowService, UserInvitationFlowService>();
        services.AddScoped<IUserInvitationEmailNotifier, UserInvitationEmailNotifier>();
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
        services.AddScoped<ITenantGetByIdRequestCache, TenantGetByIdRequestCache>();
        services.AddScoped<TrialSeatAccountant>();
        services.AddScoped<ITenantUsageStatusService, TenantUsageStatusService>();
        services.AddScoped<ITenantMigrationStatusService, TenantMigrationStatusService>();
        services.AddScoped<IOperatorShellStatusService, OperatorShellStatusService>();
        services.AddScoped<ITenantMigrationRetrievalOutboxDrainer, TenantMigrationRetrievalOutboxDrainer>();
        services.AddScoped<ITenantMigrationProjectionRefreshService, TenantMigrationProjectionRefreshService>();
        services.AddScoped<ITenantMigrationVerificationProbe, TenantMigrationVerificationProbe>();
        services.AddScoped<ITenantCatalogMigrationOrchestrator, TenantCatalogMigrationOrchestrator>();
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

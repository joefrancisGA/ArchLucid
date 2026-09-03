using ArchLucid.Application.Admin;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Identity;
using ArchLucid.Application.Identity.LinkProposal;
using ArchLucid.Application.Marketing;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Operator;
using ArchLucid.Application.Support;
using ArchLucid.Application.Identity.SignInRouting;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterTenancyLlmWallet(IServiceCollection services, IConfiguration configuration)
    {
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
        services.AddScoped<IAuthSignInBypassResolver, AuthSignInBypassResolver>();
        services.AddScoped<IAuthSignInRoutingEvaluator, AuthSignInRoutingEvaluator>();
        services.AddScoped<IAuthSignInRoutingService, AuthSignInRoutingService>();
        services.AddScoped<AuthDomainDnsVerificationService>();
        services.AddScoped<TenantAuthDomainVerificationService>();
        services.AddScoped<TenantAuthDomainEnforcementService>();
        services.AddScoped<TenantAuthDomainRecoveryAdminService>();
        services.AddScoped<TenantAuthDomainAdminService>();
        services.AddScoped<IPlatformAuthRecoveryService, PlatformAuthRecoveryService>();
        services.AddScoped<IPlatformRecoveryNotificationService, PlatformRecoveryNotificationService>();
        services.AddScoped<IUserAccountRecoveryService, UserAccountRecoveryService>();
        services.AddScoped<IAuthenticationIdentityLinkProposalPersistStage, AuthenticationIdentityLinkProposalPersistStage>();
        services.AddScoped<IAuthenticationIdentityLinkProposalAuditNotifier, AuthenticationIdentityLinkProposalAuditNotifier>();
        services.AddScoped<IExternalKeyEligibilityChecker, ExternalKeyEligibilityChecker>();
        services.AddScoped<IAuthenticationIdentityLinkProposalCreateStage, AuthenticationIdentityLinkProposalCreateStage>();
        services.AddScoped<IAuthenticationIdentityLinkProposalConfirmStage, AuthenticationIdentityLinkProposalConfirmStage>();
        services.AddScoped<IAuthenticationIdentityLinkProposalCancelStage, AuthenticationIdentityLinkProposalCancelStage>();
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

        services.AddScoped<ITenantProvisioningService, TenantProvisioningService>();
        services.AddScoped<IDefaultPolicyPackSeeder, DefaultPolicyPackSeeder>();
        services.AddScoped<DefaultPolicyPackCloudBaselineApplicator>();
        services.AddScoped<ITrialTenantBootstrapService, TrialTenantBootstrapService>();
        services.AddScoped<ITenantTrialAbuseGuard, TenantTrialAbuseGuard>();
        services.AddScoped<ITenantTrialIdentityHandoffStage, TenantTrialIdentityHandoffStage>();
        services.AddScoped<ITenantTrialConversionStage, TenantTrialConversionStage>();
        services.AddScoped<ITenantTrialFacade, TenantTrialFacade>();
        services.AddScoped<IMarketingAttributionService, MarketingAttributionService>();
        services.AddScoped<TrialLimitGate>();
        services.AddScoped<ITenantGetByIdRequestCache, TenantGetByIdRequestCache>();
        services.AddScoped<ITenantMigrationStatusService, TenantMigrationStatusService>();
        services.AddScoped<ITenantMigrationRetrievalOutboxDrainer, TenantMigrationRetrievalOutboxDrainer>();
        services.AddScoped<ITenantMigrationProjectionRefreshService, TenantMigrationProjectionRefreshService>();
        services.AddScoped<ITenantMigrationVerificationProbe, TenantMigrationVerificationProbe>();
        services.AddScoped<ITenantCatalogMigrationOrchestrator, TenantCatalogMigrationOrchestrator>();
        services.AddScoped<TrialLifecycleTransitionEngine>();
    }
}

using ArchLucid.Application.Identity.SignInRouting;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Tests.Identity;

internal static class AuthSignInRoutingServiceTestSupport
{
    public static AuthSignInRoutingService Create(
        ITenantSignInEmailDomainRepository signInDomains,
        ITenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
        ITenantIdentityProviderConfigurationRepository identityProviders,
        IUserInvitationRepository invitations,
        IPlatformTenantAuthRecoveryGrantRepository platformRecoveryGrants,
        TimeProvider timeProvider) =>
        new(new AuthSignInRoutingEvaluator(
            signInDomains,
            identityProviders,
            new AuthSignInBypassResolver(
                recoveryAdmins,
                invitations,
                platformRecoveryGrants,
                timeProvider)));
}

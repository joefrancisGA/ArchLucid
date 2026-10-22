using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.SignInRouting;

public interface IAuthSignInBypassResolver
{
    Task<AuthSignInRoutingBypassKind> ResolveBypassKindAsync(
        AuthSignInRoutingRequest request,
        TenantSignInEmailDomainRecord policy,
        CancellationToken cancellationToken);

    Task<bool> HasActivePlatformRecoveryGrantAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken);
}

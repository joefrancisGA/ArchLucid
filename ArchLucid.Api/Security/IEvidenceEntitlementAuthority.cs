using System.Security.Claims;

namespace ArchLucid.Api.Security;

/// <summary>
/// Trusted, server-side resource entitlement source. Implementations must validate
/// identity, scope, current ACL and revocation at decision time; never trust
/// client-provided entitlement claims or headers as the source of truth.
/// </summary>
public interface IEvidenceEntitlementAuthority
{
    Task<bool> HasCurrentReadEntitlementAsync(
        ClaimsPrincipal principal,
        EvidenceReadResource resource,
        CancellationToken cancellationToken);
}

/// <summary>
/// Secure default until a backed, audited ACL authority is deployed.
/// This is deliberately NOT a claim-based allow implementation.
/// </summary>
public sealed class DenyAllEvidenceEntitlementAuthority : IEvidenceEntitlementAuthority
{
    public Task<bool> HasCurrentReadEntitlementAsync(
        ClaimsPrincipal principal,
        EvidenceReadResource resource,
        CancellationToken cancellationToken) => Task.FromResult(false);
}

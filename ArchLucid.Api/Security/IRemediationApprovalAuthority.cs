using System.Security.Claims;

namespace ArchLucid.Api.Security;

/// <summary>
/// Independent, current-state approval authority for remediation planning.
/// The default implementation is deny-all; no production executor is connected.
/// </summary>
public interface IRemediationApprovalAuthority
{
    Task<bool> IsApprovedAsync(
        ClaimsPrincipal principal,
        CentralAuthorizationRequest request,
        CancellationToken cancellationToken);
}

public sealed class DenyUnconfiguredRemediationApproval : IRemediationApprovalAuthority
{
    public Task<bool> IsApprovedAsync(
        ClaimsPrincipal principal,
        CentralAuthorizationRequest request,
        CancellationToken cancellationToken) => Task.FromResult(false);
}

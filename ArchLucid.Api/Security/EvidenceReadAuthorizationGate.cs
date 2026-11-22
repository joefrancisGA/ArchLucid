using System.Security.Claims;

namespace ArchLucid.Api.Security;

/// <summary>Compatibility adapter delegating evidence authorization to the central decision service.</summary>
public sealed class EvidenceReadAuthorizationGate(ICentralAuthorizationDecisions decisions)
{
    public async Task<EvidenceReadDecision> AuthorizeAsync(
        ClaimsPrincipal principal,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid evidenceId,
        CancellationToken cancellationToken = default)
    {
        CentralAuthorizationDecision decision = await decisions.DecideAsync(
            principal,
            new CentralAuthorizationRequest(
                "evidence.read", tenantId, workspaceId, projectId, evidenceId),
            cancellationToken).ConfigureAwait(false);
        return new EvidenceReadDecision(decision.Allowed, decision.Reason);
    }
}

public sealed record EvidenceReadResource(
    Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid EvidenceId);

public sealed record EvidenceReadDecision(bool Allowed, string Reason)
{
    public static EvidenceReadDecision Deny(string reason) => new(false, reason);
}

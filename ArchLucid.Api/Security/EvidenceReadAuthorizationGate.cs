using System.Security.Claims;
using ArchLucid.Core.Scoping;
using Microsoft.AspNetCore.Authorization;

namespace ArchLucid.Api.Security;

/// <summary>
/// FND-010 .NET authorization boundary for evidence reads.
/// This is a reusable guard, not an exposed endpoint or production wiring.
/// Call before any evidence repository lookup and retain storage-level scope checks.
/// </summary>
public sealed class EvidenceReadAuthorizationGate(
    IAuthorizationService authorization,
    IScopeContextProvider scopes)
{
    public async Task<EvidenceReadDecision> AuthorizeAsync(
        ClaimsPrincipal principal,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid evidenceId,
        CancellationToken cancellationToken = default)
    {
        if (principal.Identity?.IsAuthenticated != true ||
            tenantId == Guid.Empty || workspaceId == Guid.Empty ||
            projectId == Guid.Empty || evidenceId == Guid.Empty)
            return EvidenceReadDecision.Deny("invalid_identity_or_scope");

        ScopeContext scope;
        try
        {
            scope = scopes.GetCurrentScope();
        }
        catch (Exception)
        {
            return EvidenceReadDecision.Deny("scope_unavailable");
        }

        if (scope.TenantId != tenantId ||
            scope.WorkspaceId != workspaceId ||
            scope.ProjectId != projectId)
            return EvidenceReadDecision.Deny("scope_mismatch");

        // FND-010: broad ReadAuthority is necessary but not sufficient.
        // Require an exact, trusted resource entitlement on the authenticated
        // principal; no tenant-wide wildcard is accepted for this exchange.
        // Identity issuance must only mint these claims after resource-level ACL checks.
        string entitlement = $"evidence.read:{tenantId:D}:{workspaceId:D}:{projectId:D}:{evidenceId:D}";
        if (!principal.HasClaim("archlucid.resource_entitlement", entitlement))
            return EvidenceReadDecision.Deny("resource_entitlement_missing");

        try
        {
            AuthorizationResult result = await authorization.AuthorizeAsync(
                principal, new EvidenceReadResource(tenantId, workspaceId, projectId, evidenceId),
                ArchLucid.Core.Authorization.ArchLucidPolicies.ReadAuthority);
            return result.Succeeded
                ? new EvidenceReadDecision(true, "authorized")
                : EvidenceReadDecision.Deny("not_authorized");
        }
        catch (Exception)
        {
            return EvidenceReadDecision.Deny("authorization_unavailable");
        }
    }
}

public sealed record EvidenceReadResource(
    Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid EvidenceId);

public sealed record EvidenceReadDecision(bool Allowed, string Reason)
{
    public static EvidenceReadDecision Deny(string reason) => new(false, reason);
}

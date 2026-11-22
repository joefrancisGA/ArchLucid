using System.Security.Claims;
using ArchLucid.Core.Scoping;
using Microsoft.AspNetCore.Authorization;

namespace ArchLucid.Api.Security;

/// <summary>Single fail-closed decision entry point for HTTP and future workers.</summary>
public interface ICentralAuthorizationDecisions
{
    Task<CentralAuthorizationDecision> DecideAsync(
        ClaimsPrincipal principal, CentralAuthorizationRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record CentralAuthorizationRequest(
    string Action, Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid ResourceId);

public sealed record CentralAuthorizationDecision(bool Allowed, string Reason)
{
    public static CentralAuthorizationDecision Deny(string reason) => new(false, reason);
}

/// <summary>
/// Evaluates trusted scope, current server-side resource ACL, then platform policy.
/// No positive caching: revocations are observed on subsequent authoritative reads.
/// </summary>
public sealed class CentralAuthorizationDecisions(
    IScopeContextProvider scopes,
    IEvidenceEntitlementAuthority entitlements,
    IAuthorizationService authorization,
    ICentralAuthorizationAudit audit,
    TimeProvider clock) : ICentralAuthorizationDecisions
{
    public async Task<CentralAuthorizationDecision> DecideAsync(
        ClaimsPrincipal principal, CentralAuthorizationRequest request,
        CancellationToken cancellationToken = default)
    {
        CentralAuthorizationDecision decision;
        try
        {
            decision = await EvaluateAsync(principal, request, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            decision = CentralAuthorizationDecision.Deny("authorization_unavailable");
        }

        // Audit is mandatory. Never grant access if decision evidence cannot be recorded.
        try
        {
            await audit.WriteAsync(new CentralAuthorizationAuditRecord(
                Guid.NewGuid(), request.Action, request.TenantId, request.WorkspaceId,
                request.ProjectId, request.ResourceId, decision.Allowed, decision.Reason,
                "authenticated-principal", clock.GetUtcNow()), cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return CentralAuthorizationDecision.Deny("audit_unavailable");
        }

        return decision;
    }

    private async Task<CentralAuthorizationDecision> EvaluateAsync(
        ClaimsPrincipal principal, CentralAuthorizationRequest request,
        CancellationToken cancellationToken)
    {
        if (principal.Identity?.IsAuthenticated != true ||
            request.Action != "evidence.read" ||
            request.TenantId == Guid.Empty || request.WorkspaceId == Guid.Empty ||
            request.ProjectId == Guid.Empty || request.ResourceId == Guid.Empty)
            return CentralAuthorizationDecision.Deny("invalid_identity_action_or_resource");

        ScopeContext scope = scopes.GetCurrentScope();
        if (scope.TenantId != request.TenantId ||
            scope.WorkspaceId != request.WorkspaceId ||
            scope.ProjectId != request.ProjectId)
            return CentralAuthorizationDecision.Deny("scope_mismatch");

        var resource = new EvidenceReadResource(
            request.TenantId, request.WorkspaceId, request.ProjectId, request.ResourceId);
        if (!await entitlements.HasCurrentReadEntitlementAsync(
                principal, resource, cancellationToken).ConfigureAwait(false))
            return CentralAuthorizationDecision.Deny("resource_entitlement_missing");

        AuthorizationResult policy = await authorization.AuthorizeAsync(
            principal, resource,
            ArchLucid.Core.Authorization.ArchLucidPolicies.ReadAuthority).ConfigureAwait(false);
        return policy.Succeeded
            ? new CentralAuthorizationDecision(true, "authorized")
            : CentralAuthorizationDecision.Deny("not_authorized");
    }
}

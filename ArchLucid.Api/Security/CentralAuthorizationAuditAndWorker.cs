using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Security;

/// <summary>Security decision audit sink. Replace with durable append-only sink before release.</summary>
public interface ICentralAuthorizationAudit
{
    Task WriteAsync(CentralAuthorizationAuditRecord record, CancellationToken cancellationToken);
}

public sealed record CentralAuthorizationAuditRecord(
    Guid DecisionId,
    string Action,
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    Guid ResourceId,
    bool Allowed,
    string Reason,
    string CallerKind,
    DateTimeOffset OccurredUtc);

/// <summary>Structured logging reference; no raw claims, tokens or evidence bytes.</summary>
public sealed class LoggingCentralAuthorizationAudit(
    ILogger<LoggingCentralAuthorizationAudit> logger) : ICentralAuthorizationAudit
{
    public Task WriteAsync(CentralAuthorizationAuditRecord record, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Authorization decision {DecisionId} action={Action} tenant={TenantId} workspace={WorkspaceId} project={ProjectId} resource={ResourceId} allowed={Allowed} reason={Reason} caller={CallerKind} at={OccurredUtc}",
            record.DecisionId, record.Action, record.TenantId, record.WorkspaceId,
            record.ProjectId, record.ResourceId, record.Allowed, record.Reason,
            record.CallerKind, record.OccurredUtc);
        return Task.CompletedTask;
    }
}

/// <summary>
/// A worker must obtain an independently authenticated service identity.
/// This helper never constructs privileged claims from job payloads.
/// </summary>
public interface ITrustedWorkerIdentity
{
    Task<ClaimsPrincipal?> ResolveAsync(CancellationToken cancellationToken);
}

public sealed class DenyUnconfiguredWorkerIdentity : ITrustedWorkerIdentity
{
    public Task<ClaimsPrincipal?> ResolveAsync(CancellationToken cancellationToken) =>
        Task.FromResult<ClaimsPrincipal?>(null);
}

public sealed class WorkerAuthorizationAdapter(
    ITrustedWorkerIdentity identities,
    ICentralAuthorizationDecisions decisions)
{
    public async Task<CentralAuthorizationDecision> DecideAsync(
        CentralAuthorizationRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            ClaimsPrincipal? principal = await identities.ResolveAsync(cancellationToken)
                .ConfigureAwait(false);
            if (principal?.Identity?.IsAuthenticated != true)
                return CentralAuthorizationDecision.Deny("worker_identity_unavailable");
            return await decisions.DecideAsync(principal, request, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return CentralAuthorizationDecision.Deny("worker_authorization_unavailable");
        }
    }
}

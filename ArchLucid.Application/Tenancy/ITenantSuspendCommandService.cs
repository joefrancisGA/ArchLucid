namespace ArchLucid.Application.Tenancy;

/// <summary>Admin shut-off / resume for tenant API surface without starting erasure quarantine.</summary>
public interface ITenantSuspendCommandService
{
    Task<TenantSuspendOutcome> TrySuspendAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken);

    Task<TenantSuspendOutcome> TryUnsuspendAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken);
}

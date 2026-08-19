namespace ArchLucid.Application.Tenancy;

/// <summary>Platform + tenant-admin mutations for scheduled tenant erasure (quarantine and legal hold).</summary>
public interface ITenantErasureCommandService
{
    Task<TenantErasureOffboardResult?> TryOffboardTenantAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken);

    Task<bool> TryRestoreQuarantineAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken);

    /// <param name="requireErasureQuarantine">Tenant admins must supply <see langword="true" />.</param>
    Task<bool> TrySetLegalHoldAsync(
        Guid tenantId,
        DateTimeOffset untilUtc,
        string? reason,
        string actorUserId,
        string actorUserName,
        bool requireErasureQuarantine,
        string? correlationId,
        CancellationToken cancellationToken);

    Task<bool> TryApproveErasureAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken);

    Task<bool> TryClearLegalHoldAsync(
        Guid tenantId,
        string actorUserId,
        string actorUserName,
        string? correlationId,
        CancellationToken cancellationToken);
}

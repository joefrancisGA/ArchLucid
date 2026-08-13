namespace ArchLucid.Core.Tenancy;

/// <summary>Tenant erasure approval, quarantine, legal hold, and hard-purge scheduling on <c>dbo.Tenants</c>.</summary>
public interface ITenantErasureRepository
{
    Task<bool> TryApproveTenantErasureAsync(Guid tenantId, DateTimeOffset approvedUtc, string approvedByUserId, CancellationToken ct);

    /// <summary>
    ///     Starts erasure quarantine when not already offboarded: sets <c>OffboardedUtc</c>, <c>ErasureEligibleUtc</c>.
    /// </summary>
    Task<bool> TryStartTenantErasureOffboardAsync(
        Guid tenantId,
        DateTimeOffset offboardedUtc,
        DateTimeOffset erasureEligibleUtc,
        CancellationToken ct);

    /// <summary>Clears quarantine columns and <c>SuspendedUtc</c> before eligible hard purge (break-glass restore).</summary>
    Task<bool> TryRestoreTenantErasureQuarantineAsync(Guid tenantId, CancellationToken ct);

    /// <summary>Sets or extends legal hold metadata when <paramref name="legalHoldUntilUtc" /> is after <paramref name="utcNow" />.</summary>
    Task<bool> TrySetTenantErasureLegalHoldAsync(
        Guid tenantId,
        DateTimeOffset legalHoldUntilUtc,
        DateTimeOffset utcNow,
        string? reason,
        string legalHoldSetByUserId,
        CancellationToken ct);

    /// <summary>Clears legal hold columns (platform operator only at HTTP layer).</summary>
    Task<bool> TryClearTenantErasureLegalHoldAsync(Guid tenantId, CancellationToken ct);

    /// <summary>Tenants eligible for hard purge at <paramref name="utcNow" /> (ordered by <c>ErasureEligibleUtc</c>).</summary>
    Task<IReadOnlyList<Guid>> ListTenantIdsEligibleForScheduledHardPurgeAsync(
        DateTimeOffset utcNow,
        int take,
        CancellationToken ct);

    /// <summary>
    ///     Tenants with <c>TenantErasureRequestedUtc</c> on or before <paramref name="erasureRequestedOnOrBefore" />
    ///     and approved erasure, for orphaned catalog cleanup.
    /// </summary>
    Task<IReadOnlyList<Guid>> ListTenantIdsForOrphanedCatalogCleanupAsync(
        DateTimeOffset utcNow,
        DateTimeOffset erasureRequestedOnOrBefore,
        int take,
        CancellationToken ct);
}

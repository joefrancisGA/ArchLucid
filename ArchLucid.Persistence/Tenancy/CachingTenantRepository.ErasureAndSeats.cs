using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class CachingTenantRepository
{
    /// <inheritdoc />
    public async Task<bool> TryIncrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct)
    {
        bool incremented = await _inner.TryIncrementEnterpriseScimSeatAsync(tenantId, ct);

        if (incremented)
            await InvalidateAsync(tenantId, ct);

        return incremented;
    }

    /// <inheritdoc />
    public async Task DecrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct)
    {
        await _inner.DecrementEnterpriseScimSeatAsync(tenantId, ct);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task<bool> TryApproveTenantErasureAsync(
        Guid tenantId,
        DateTimeOffset approvedUtc,
        string approvedByUserId,
        CancellationToken ct)
    {
        bool approved = await _inner.TryApproveTenantErasureAsync(tenantId, approvedUtc, approvedByUserId, ct);

        if (approved)
            await InvalidateAsync(tenantId, ct);

        return approved;
    }

    /// <inheritdoc />
    public async Task<bool> TryStartTenantErasureOffboardAsync(
        Guid tenantId,
        DateTimeOffset offboardedUtc,
        DateTimeOffset erasureEligibleUtc,
        CancellationToken ct)
    {
        bool started = await _inner.TryStartTenantErasureOffboardAsync(
            tenantId,
            offboardedUtc,
            erasureEligibleUtc,
            ct);

        if (started)
            await InvalidateAsync(tenantId, ct);

        return started;
    }

    /// <inheritdoc />
    public async Task<bool> TryRestoreTenantErasureQuarantineAsync(Guid tenantId, CancellationToken ct)
    {
        bool restored = await _inner.TryRestoreTenantErasureQuarantineAsync(tenantId, ct);

        if (restored)
            await InvalidateAsync(tenantId, ct);

        return restored;
    }

    /// <inheritdoc />
    public async Task<bool> TrySetTenantErasureLegalHoldAsync(
        Guid tenantId,
        DateTimeOffset legalHoldUntilUtc,
        DateTimeOffset utcNow,
        string? reason,
        string legalHoldSetByUserId,
        CancellationToken ct)
    {
        bool set = await _inner.TrySetTenantErasureLegalHoldAsync(
            tenantId,
            legalHoldUntilUtc,
            utcNow,
            reason,
            legalHoldSetByUserId,
            ct);

        if (set)
            await InvalidateAsync(tenantId, ct);

        return set;
    }

    /// <inheritdoc />
    public async Task<bool> TryClearTenantErasureLegalHoldAsync(Guid tenantId, CancellationToken ct)
    {
        bool cleared = await _inner.TryClearTenantErasureLegalHoldAsync(tenantId, ct);

        if (cleared)
            await InvalidateAsync(tenantId, ct);

        return cleared;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTenantIdsEligibleForScheduledHardPurgeAsync(
        DateTimeOffset utcNow,
        int take,
        CancellationToken ct) =>
        _inner.ListTenantIdsEligibleForScheduledHardPurgeAsync(utcNow, take, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTenantIdsForOrphanedCatalogCleanupAsync(
        DateTimeOffset utcNow,
        DateTimeOffset erasureRequestedOnOrBefore,
        int take,
        CancellationToken ct) =>
        _inner.ListTenantIdsForOrphanedCatalogCleanupAsync(utcNow, erasureRequestedOnOrBefore, take, ct);
}

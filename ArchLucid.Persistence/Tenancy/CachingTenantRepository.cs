using System.Data;

using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Decorates <see cref="ITenantDirectoryReader.GetByIdAsync" /> for erasure-quarantine middleware and other hot reads.
/// </summary>
public sealed class CachingTenantRepository(ITenantRepository inner, IHotPathReadCache hotPathReadCache)
    : ITenantRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ITenantRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.TenantById(tenantId),
            innerCt => _inner.GetByIdAsync(tenantId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public Task<TenantRecord?> GetByIdFromControlPlaneCatalogAsync(Guid tenantId, CancellationToken ct) =>
        _inner.GetByIdFromControlPlaneCatalogAsync(tenantId, ct);

    /// <inheritdoc />
    public Task<TenantRecord?> GetBySlugFromControlPlaneCatalogAsync(string slug, CancellationToken ct) =>
        _inner.GetBySlugFromControlPlaneCatalogAsync(slug, ct);

    /// <inheritdoc />
    public Task<TenantRecord?> GetByNormalizedOrganizationNameAsync(
        string normalizedOrganizationName,
        CancellationToken ct) =>
        _inner.GetByNormalizedOrganizationNameAsync(normalizedOrganizationName, ct);

    /// <inheritdoc />
    public Task<TenantRecord?> GetBySlugAsync(string slug, CancellationToken ct) =>
        _inner.GetBySlugAsync(slug, ct);

    /// <inheritdoc />
    public Task<TenantRecord?> GetByEntraTenantIdAsync(Guid entraTenantId, CancellationToken ct) =>
        _inner.GetByEntraTenantIdAsync(entraTenantId, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<TenantRecord>> ListAsync(CancellationToken ct) => _inner.ListAsync(ct);

    /// <inheritdoc />
    public async Task InsertTenantAsync(
        Guid tenantId,
        string name,
        string slug,
        TenantTier tier,
        Guid? entraTenantId,
        string dataRegion,
        CancellationToken ct,
        int? enterpriseScimSeatsLimit = null)
    {
        await _inner.InsertTenantAsync(
            tenantId,
            name,
            slug,
            tier,
            entraTenantId,
            dataRegion,
            ct,
            enterpriseScimSeatsLimit);

        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public Task InsertWorkspaceAsync(
        Guid workspaceId,
        Guid tenantId,
        string name,
        Guid defaultProjectId,
        CancellationToken ct) =>
        _inner.InsertWorkspaceAsync(workspaceId, tenantId, name, defaultProjectId, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<TenantWorkspaceListItem>> ListWorkspacesAsync(Guid tenantId, CancellationToken ct) =>
        _inner.ListWorkspacesAsync(tenantId, ct);

    /// <inheritdoc />
    public async Task SuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        await _inner.SuspendTenantAsync(tenantId, ct);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task<bool> TryUnsuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        bool cleared = await _inner.TryUnsuspendTenantAsync(tenantId, ct);

        if (cleared)
            await InvalidateAsync(tenantId, ct);

        return cleared;
    }

    /// <inheritdoc />
    public Task<TenantWorkspaceLink?> GetFirstWorkspaceAsync(Guid tenantId, CancellationToken ct) =>
        _inner.GetFirstWorkspaceAsync(tenantId, ct);

    /// <inheritdoc />
    public async Task CommitSelfServiceTrialAsync(
        Guid tenantId,
        DateTimeOffset trialStartUtc,
        DateTimeOffset trialExpiresUtc,
        int runsLimit,
        int seatsLimit,
        Guid sampleRunId,
        decimal? baselineReviewCycleHours,
        string? baselineReviewCycleSource,
        DateTimeOffset? baselineReviewCycleCapturedUtc,
        string? companySize,
        int? architectureTeamSize,
        string? industryVertical,
        string? industryVerticalOther,
        CancellationToken ct)
    {
        await _inner.CommitSelfServiceTrialAsync(
            tenantId,
            trialStartUtc,
            trialExpiresUtc,
            runsLimit,
            seatsLimit,
            sampleRunId,
            baselineReviewCycleHours,
            baselineReviewCycleSource,
            baselineReviewCycleCapturedUtc,
            companySize,
            architectureTeamSize,
            industryVertical,
            industryVerticalOther,
            ct);

        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task PersistTrialSignupBaselineReviewCycleAsync(
        Guid tenantId,
        decimal baselineReviewCycleHours,
        string? baselineReviewCycleSource,
        DateTimeOffset baselineReviewCycleCapturedUtc,
        CancellationToken ct)
    {
        await _inner.PersistTrialSignupBaselineReviewCycleAsync(
            tenantId,
            baselineReviewCycleHours,
            baselineReviewCycleSource,
            baselineReviewCycleCapturedUtc,
            ct);

        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task UpdateBaselineAsync(
        Guid tenantId,
        decimal? manualPrepHoursPerReview,
        int? peoplePerReview,
        DateTimeOffset? capturedUtc,
        CancellationToken ct)
    {
        await _inner.UpdateBaselineAsync(tenantId, manualPrepHoursPerReview, peoplePerReview, capturedUtc, ct);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task MarkTrialConvertedAsync(Guid tenantId, TenantTier? newCommercialTier, CancellationToken ct)
    {
        await _inner.MarkTrialConvertedAsync(tenantId, newCommercialTier, ct);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task<bool> UpdateEntraTenantIdAsync(Guid tenantId, Guid entraTenantId, CancellationToken ct)
    {
        bool updated = await _inner.UpdateEntraTenantIdAsync(tenantId, entraTenantId, ct);

        if (updated)
            await InvalidateAsync(tenantId, ct);

        return updated;
    }

    /// <inheritdoc />
    public async Task TryIncrementActiveTrialRunAsync(
        Guid tenantId,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        await _inner.TryIncrementActiveTrialRunAsync(tenantId, ct, connection, transaction);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public Task TryClaimTrialSeatAsync(Guid tenantId, string principalKey, CancellationToken ct) =>
        _inner.TryClaimTrialSeatAsync(tenantId, principalKey, ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken ct) =>
        _inner.ListTrialLifecycleAutomationTenantIdsAsync(ct);

    /// <inheritdoc />
    public async Task<bool> TryRecordTrialLifecycleTransitionAsync(
        Guid tenantId,
        string expectedCurrentStatus,
        string nextStatus,
        string reason,
        CancellationToken ct)
    {
        bool recorded = await _inner.TryRecordTrialLifecycleTransitionAsync(
            tenantId,
            expectedCurrentStatus,
            nextStatus,
            reason,
            ct);

        if (recorded)
            await InvalidateAsync(tenantId, ct);

        return recorded;
    }

    /// <inheritdoc />
    public async Task<TrialFirstManifestCommitOutcome?> TryMarkFirstManifestCommittedAsync(
        Guid tenantId,
        DateTimeOffset committedUtc,
        CancellationToken ct)
    {
        TrialFirstManifestCommitOutcome? outcome =
            await _inner.TryMarkFirstManifestCommittedAsync(tenantId, committedUtc, ct);

        if (outcome is not null)
            await InvalidateAsync(tenantId, ct);

        return outcome;
    }

    /// <inheritdoc />
    public async Task E2eHarnessSetTrialExpiresUtcAsync(
        Guid tenantId,
        DateTimeOffset expiresUtc,
        CancellationToken ct)
    {
        await _inner.E2eHarnessSetTrialExpiresUtcAsync(tenantId, expiresUtc, ct);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task EnqueueTrialArchitecturePreseedAsync(Guid tenantId, CancellationToken ct)
    {
        await _inner.EnqueueTrialArchitecturePreseedAsync(tenantId, ct);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTenantIdsPendingTrialArchitecturePreseedAsync(int take, CancellationToken ct) =>
        _inner.ListTenantIdsPendingTrialArchitecturePreseedAsync(take, ct);

    /// <inheritdoc />
    public async Task MarkTrialArchitecturePreseedCompletedAsync(
        Guid tenantId,
        Guid welcomeRunId,
        CancellationToken ct)
    {
        await _inner.MarkTrialArchitecturePreseedCompletedAsync(tenantId, welcomeRunId, ct);
        await InvalidateAsync(tenantId, ct);
    }

    /// <inheritdoc />
    public async Task<int> IncrementTrialArchitecturePreseedAttemptAsync(
        Guid tenantId,
        string lastError,
        CancellationToken ct)
    {
        int attempts = await _inner.IncrementTrialArchitecturePreseedAttemptAsync(tenantId, lastError, ct);
        await InvalidateAsync(tenantId, ct);

        return attempts;
    }

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

    private Task InvalidateAsync(Guid tenantId, CancellationToken ct) =>
        HotPathCacheEviction.RemoveTenantAsync(_hotPathReadCache, tenantId, ct);
}

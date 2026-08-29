using System.Data;

using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class CachingTenantRepository
{
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
}

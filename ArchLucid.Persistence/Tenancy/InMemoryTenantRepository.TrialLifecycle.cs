using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class InMemoryTenantRepository
{
    public Task CommitSelfServiceTrialAsync(
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
        _ = ct;

        TenantRecord? existing;
        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out existing))
                return Task.CompletedTask;
        }

        TenantTrialLifecycleCore.CommitSelfServiceTrialMutation mutation =
            TenantTrialLifecycleCore.CreateCommitSelfServiceTrialMutation(
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
                industryVerticalOther);
        TenantRecord updated = TenantTrialLifecycleCore.ApplyCommitSelfServiceTrial(existing, mutation);

        lock (_trialGate)
        {
            _byId[tenantId] = updated;
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task PersistTrialSignupBaselineReviewCycleAsync(
        Guid tenantId,
        decimal baselineReviewCycleHours,
        string? baselineReviewCycleSource,
        DateTimeOffset baselineReviewCycleCapturedUtc,
        CancellationToken ct)
    {
        _ = ct;

        TenantRecord? existing;
        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out existing))
                return Task.CompletedTask;
        }

        TenantRecord updated = TenantTrialLifecycleCore.ApplyPersistTrialSignupBaselineReviewCycle(
            existing,
            new TenantTrialLifecycleCore.PersistTrialSignupBaselineReviewCycleMutation
            {
                BaselineReviewCycleHours = baselineReviewCycleHours,
                BaselineReviewCycleSource = baselineReviewCycleSource,
                BaselineReviewCycleCapturedUtc = baselineReviewCycleCapturedUtc,
            });

        lock (_trialGate)
        {
            _byId[tenantId] = updated;
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task MarkTrialConvertedAsync(Guid tenantId, TenantTier? newCommercialTier, CancellationToken ct)
    {
        _ = ct;

        TenantRecord? existing;
        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out existing))
                return Task.CompletedTask;
        }

        TenantRecord? updated = TenantTrialLifecycleCore.TryApplyMarkTrialConverted(existing, newCommercialTier);

        if (updated is null)
            return Task.CompletedTask;

        lock (_trialGate)
        {
            _byId[tenantId] = updated;
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken ct)
    {
        _ = ct;

        List<Guid> ids;

        lock (_trialGate)
        {
            ids = _byId.Values
                .Where(TenantTrialLifecycleCore.IsTrialLifecycleAutomationCandidate)
                .Select(static t => t.Id)
                .ToList();
        }

        return Task.FromResult<IReadOnlyList<Guid>>(ids);
    }


    /// <inheritdoc />
    public Task<bool> TryRecordTrialLifecycleTransitionAsync(
        Guid tenantId,
        string expectedCurrentStatus,
        string nextStatus,
        string reason,
        CancellationToken ct)
    {
        _ = reason;
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || !string.Equals(existing.TrialStatus, expectedCurrentStatus, StringComparison.Ordinal))
                return Task.FromResult(false);

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(existing, trialStatus: nextStatus);

            return Task.FromResult(true);
        }
    }


    /// <inheritdoc />
    public Task<TrialFirstManifestCommitOutcome?> TryMarkFirstManifestCommittedAsync(
        Guid tenantId,
        DateTimeOffset committedUtc,
        CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t) || !_trialFirstManifestCommitted.TryAdd(tenantId, 0))
                return Task.FromResult<TrialFirstManifestCommitOutcome?>(null);

            TrialFirstManifestCommitOutcome outcome = TenantTrialLifecycleCore.ComputeFirstManifestCommitOutcome(
                new TenantTrialLifecycleCore.TrialFirstManifestSourceRow
                {
                    TrialRunsUsed = t.TrialRunsUsed,
                    TrialRunsLimit = t.TrialRunsLimit,
                    CreatedUtc = t.CreatedUtc,
                    TrialStartUtc = t.TrialStartUtc,
                },
                committedUtc);

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(t, trialFirstManifestCommittedUtc: committedUtc);

            return Task.FromResult<TrialFirstManifestCommitOutcome?>(outcome);
        }
    }


    /// <inheritdoc />
    public Task E2eHarnessSetTrialExpiresUtcAsync(Guid tenantId, DateTimeOffset expiresUtc, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t))
                return Task.CompletedTask;

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(t, trialExpiresUtc: expiresUtc);
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
}

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
        ct.ThrowIfCancellationRequested();

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
        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.CompletedTask;

            // Read and publish atomically with quota, conversion and other tenant writes.
            // A snapshot constructed outside this lock can overwrite a newer quota debit.
            _byId[tenantId] = TenantTrialLifecycleCore.ApplyCommitSelfServiceTrial(existing, mutation);
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
        ct.ThrowIfCancellationRequested();

        TenantTrialLifecycleCore.PersistTrialSignupBaselineReviewCycleMutation mutation = new()
        {
            BaselineReviewCycleHours = baselineReviewCycleHours,
            BaselineReviewCycleSource = baselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = baselineReviewCycleCapturedUtc,
        };
        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.CompletedTask;

            _byId[tenantId] = TenantTrialLifecycleCore.ApplyPersistTrialSignupBaselineReviewCycle(
                existing, mutation);
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task<bool> MarkTrialConvertedAsync(Guid tenantId, TenantTier? newCommercialTier, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.FromResult(false);

            TenantRecord? updated = TenantTrialLifecycleCore.TryApplyMarkTrialConverted(
                existing, newCommercialTier);
            if (updated is null)
                return Task.FromResult(false);

            // The eligibility check and update must observe the same tenant version.
            _byId[tenantId] = updated;
            return Task.FromResult(true);
        }
    }


    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTrialLifecycleAutomationTenantIdsAsync(CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

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
        ct.ThrowIfCancellationRequested();

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
        ct.ThrowIfCancellationRequested();

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
        ct.ThrowIfCancellationRequested();

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t))
                return Task.CompletedTask;

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(t, trialExpiresUtc: expiresUtc);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task E2eHarnessGrantEnterpriseCommercialAsync(Guid tenantId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        lock (_trialGate)
        {
            if (_byId.TryGetValue(tenantId, out TenantRecord? existing))
            {
                _byId[tenantId] = TenantRepositoryCore.CopyTenant(
                    existing,
                    commercialTier: TenantTier.Enterprise,
                    trialStatus: null);

                return Task.CompletedTask;
            }

            DateTimeOffset now = TimeProvider.System.GetUtcNow();

            _byId[tenantId] = new TenantRecord
            {
                Id = tenantId,
                Name = "CI live E2E tenant",
                Slug = "ci-live-e2e-" + tenantId.ToString("N")[..12],
                Tier = TenantTier.Enterprise,
                EntraTenantId = null,
                DataRegion = TenantDataRegions.Default,
                CreatedUtc = now,
                TrialStatus = null,
            };
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
}

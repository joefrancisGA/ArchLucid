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

        TenantRecord updated = new()
        {
            Id = existing.Id,
            Name = existing.Name,
            Slug = existing.Slug,
            Tier = existing.Tier,
            EntraTenantId = existing.EntraTenantId,
            CreatedUtc = existing.CreatedUtc,
            SuspendedUtc = existing.SuspendedUtc,
            TrialStartUtc = trialStartUtc,
            TrialExpiresUtc = trialExpiresUtc,
            TrialRunsLimit = runsLimit,
            TrialRunsUsed = 0,
            TrialSeatsLimit = seatsLimit,
            TrialSeatsUsed = 0,
            TrialStatus = TrialLifecycleStatus.Active,
            TrialSampleRunId = sampleRunId,
            TrialArchitecturePreseedEnqueuedUtc = null,
            TrialWelcomeRunId = null,
            TrialFirstManifestCommittedUtc = existing.TrialFirstManifestCommittedUtc,
            BaselineReviewCycleHours = baselineReviewCycleHours,
            BaselineReviewCycleSource = baselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = baselineReviewCycleCapturedUtc,
            CompanySize = companySize,
            ArchitectureTeamSize = architectureTeamSize,
            IndustryVertical = industryVertical,
            IndustryVerticalOther = industryVerticalOther,
            BaselineManualPrepHoursPerReview = existing.BaselineManualPrepHoursPerReview,
            BaselinePeoplePerReview = existing.BaselinePeoplePerReview,
            BaselineManualPrepCapturedUtc = existing.BaselineManualPrepCapturedUtc,
            EnterpriseSeatsLimit = existing.EnterpriseSeatsLimit,
            EnterpriseSeatsUsed = existing.EnterpriseSeatsUsed,
            OffboardedUtc = existing.OffboardedUtc,
            ErasureEligibleUtc = existing.ErasureEligibleUtc,
            LegalHoldUntilUtc = existing.LegalHoldUntilUtc,
            LegalHoldReason = existing.LegalHoldReason,
            LegalHoldSetByUserId = existing.LegalHoldSetByUserId,
            LegalHoldSetUtc = existing.LegalHoldSetUtc,
            TenantErasureRequestedUtc = existing.TenantErasureRequestedUtc,
            TenantErasureApprovedUtc = existing.TenantErasureApprovedUtc,
            TenantErasureApprovedByUserId = existing.TenantErasureApprovedByUserId
        };

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

        TenantRecord updated = new()
        {
            Id = existing.Id,
            Name = existing.Name,
            Slug = existing.Slug,
            Tier = existing.Tier,
            EntraTenantId = existing.EntraTenantId,
            CreatedUtc = existing.CreatedUtc,
            SuspendedUtc = existing.SuspendedUtc,
            TrialStartUtc = existing.TrialStartUtc,
            TrialExpiresUtc = existing.TrialExpiresUtc,
            TrialRunsLimit = existing.TrialRunsLimit,
            TrialRunsUsed = existing.TrialRunsUsed,
            TrialSeatsLimit = existing.TrialSeatsLimit,
            TrialSeatsUsed = existing.TrialSeatsUsed,
            TrialStatus = existing.TrialStatus,
            TrialSampleRunId = existing.TrialSampleRunId,
            TrialArchitecturePreseedEnqueuedUtc = existing.TrialArchitecturePreseedEnqueuedUtc,
            TrialWelcomeRunId = existing.TrialWelcomeRunId,
            TrialFirstManifestCommittedUtc = existing.TrialFirstManifestCommittedUtc,
            BaselineReviewCycleHours = baselineReviewCycleHours,
            BaselineReviewCycleSource = baselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = baselineReviewCycleCapturedUtc,
            BaselineManualPrepHoursPerReview = existing.BaselineManualPrepHoursPerReview,
            BaselinePeoplePerReview = existing.BaselinePeoplePerReview,
            BaselineManualPrepCapturedUtc = existing.BaselineManualPrepCapturedUtc,
            CompanySize = existing.CompanySize,
            ArchitectureTeamSize = existing.ArchitectureTeamSize,
            IndustryVertical = existing.IndustryVertical,
            IndustryVerticalOther = existing.IndustryVerticalOther,
            EnterpriseSeatsLimit = existing.EnterpriseSeatsLimit,
            EnterpriseSeatsUsed = existing.EnterpriseSeatsUsed,
            OffboardedUtc = existing.OffboardedUtc,
            ErasureEligibleUtc = existing.ErasureEligibleUtc,
            LegalHoldUntilUtc = existing.LegalHoldUntilUtc,
            LegalHoldReason = existing.LegalHoldReason,
            LegalHoldSetByUserId = existing.LegalHoldSetByUserId,
            LegalHoldSetUtc = existing.LegalHoldSetUtc,
            TenantErasureRequestedUtc = existing.TenantErasureRequestedUtc,
            TenantErasureApprovedUtc = existing.TenantErasureApprovedUtc,
            TenantErasureApprovedByUserId = existing.TenantErasureApprovedByUserId
        };

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

        if (!string.Equals(existing.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
            return Task.CompletedTask;

        TenantTier tier = newCommercialTier ?? existing.Tier;

        TenantRecord updated = new()
        {
            Id = existing.Id,
            Name = existing.Name,
            Slug = existing.Slug,
            Tier = tier,
            EntraTenantId = existing.EntraTenantId,
            CreatedUtc = existing.CreatedUtc,
            SuspendedUtc = existing.SuspendedUtc,
            TrialStartUtc = existing.TrialStartUtc,
            TrialExpiresUtc = existing.TrialExpiresUtc,
            TrialRunsLimit = existing.TrialRunsLimit,
            TrialRunsUsed = existing.TrialRunsUsed,
            TrialSeatsLimit = existing.TrialSeatsLimit,
            TrialSeatsUsed = existing.TrialSeatsUsed,
            TrialStatus = TrialLifecycleStatus.Converted,
            TrialSampleRunId = existing.TrialSampleRunId,
            TrialArchitecturePreseedEnqueuedUtc = existing.TrialArchitecturePreseedEnqueuedUtc,
            TrialWelcomeRunId = existing.TrialWelcomeRunId,
            TrialFirstManifestCommittedUtc = existing.TrialFirstManifestCommittedUtc,
            BaselineReviewCycleHours = existing.BaselineReviewCycleHours,
            BaselineReviewCycleSource = existing.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = existing.BaselineReviewCycleCapturedUtc,
            BaselineManualPrepHoursPerReview = existing.BaselineManualPrepHoursPerReview,
            BaselinePeoplePerReview = existing.BaselinePeoplePerReview,
            BaselineManualPrepCapturedUtc = existing.BaselineManualPrepCapturedUtc,
            CompanySize = existing.CompanySize,
            ArchitectureTeamSize = existing.ArchitectureTeamSize,
            IndustryVertical = existing.IndustryVertical,
            IndustryVerticalOther = existing.IndustryVerticalOther,
            EnterpriseSeatsLimit = existing.EnterpriseSeatsLimit,
            EnterpriseSeatsUsed = existing.EnterpriseSeatsUsed,
            OffboardedUtc = existing.OffboardedUtc,
            ErasureEligibleUtc = existing.ErasureEligibleUtc,
            LegalHoldUntilUtc = existing.LegalHoldUntilUtc,
            LegalHoldReason = existing.LegalHoldReason,
            LegalHoldSetByUserId = existing.LegalHoldSetByUserId,
            LegalHoldSetUtc = existing.LegalHoldSetUtc,
            TenantErasureRequestedUtc = existing.TenantErasureRequestedUtc,
            TenantErasureApprovedUtc = existing.TenantErasureApprovedUtc,
            TenantErasureApprovedByUserId = existing.TenantErasureApprovedByUserId
        };

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
                .Where(static t =>
                    t.TrialExpiresUtc is not null &&
                    !string.IsNullOrWhiteSpace(t.TrialStatus) &&
                    !string.Equals(t.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal))
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

            _byId[tenantId] = CopyTenant(existing, trialStatus: nextStatus);

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

            DateTimeOffset anchor = t.TrialStartUtc ?? t.CreatedUtc;
            double seconds = (committedUtc - anchor).TotalSeconds;

            double ratio = 0;

            if (t.TrialRunsLimit is { } lim and > 0)

                ratio = (double)t.TrialRunsUsed / lim;

            _byId[tenantId] = CopyTenant(t, trialFirstManifestCommittedUtc: committedUtc);

            return Task.FromResult<TrialFirstManifestCommitOutcome?>(
                new TrialFirstManifestCommitOutcome { SignupToCommitSeconds = seconds, TrialRunUsageRatio = ratio });
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

            _byId[tenantId] = CopyTenant(t, trialExpiresUtc: expiresUtc);
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
}

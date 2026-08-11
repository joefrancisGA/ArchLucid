using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class InMemoryTenantRepository
{

    public Task<bool> TryApproveTenantErasureAsync(Guid tenantId, DateTimeOffset approvedUtc, string approvedByUserId, CancellationToken ct)
    {
        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t) || t.OffboardedUtc is null || t.TenantErasureApprovedUtc is not null)
                return Task.FromResult(false);

            _byId[tenantId] = new TenantRecord
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Tier = t.Tier,
                EntraTenantId = t.EntraTenantId,
                DataRegion = t.DataRegion,
                CreatedUtc = t.CreatedUtc,
                SuspendedUtc = t.SuspendedUtc,
                OffboardedUtc = t.OffboardedUtc,
                ErasureEligibleUtc = t.ErasureEligibleUtc,
                LegalHoldUntilUtc = t.LegalHoldUntilUtc,
                LegalHoldReason = t.LegalHoldReason,
                LegalHoldSetByUserId = t.LegalHoldSetByUserId,
                LegalHoldSetUtc = t.LegalHoldSetUtc,
                TrialStartUtc = t.TrialStartUtc,
                TrialExpiresUtc = t.TrialExpiresUtc,
                TrialRunsLimit = t.TrialRunsLimit,
                TrialRunsUsed = t.TrialRunsUsed,
                TrialSeatsLimit = t.TrialSeatsLimit,
                TrialSeatsUsed = t.TrialSeatsUsed,
                TrialStatus = t.TrialStatus,
                TrialSampleRunId = t.TrialSampleRunId,
                TrialArchitecturePreseedEnqueuedUtc = t.TrialArchitecturePreseedEnqueuedUtc,
                TrialWelcomeRunId = t.TrialWelcomeRunId,
                TrialFirstManifestCommittedUtc = t.TrialFirstManifestCommittedUtc,
                BaselineReviewCycleHours = t.BaselineReviewCycleHours,
                BaselineReviewCycleSource = t.BaselineReviewCycleSource,
                BaselineReviewCycleCapturedUtc = t.BaselineReviewCycleCapturedUtc,
                BaselineManualPrepHoursPerReview = t.BaselineManualPrepHoursPerReview,
                BaselinePeoplePerReview = t.BaselinePeoplePerReview,
                BaselineManualPrepCapturedUtc = t.BaselineManualPrepCapturedUtc,
                CompanySize = t.CompanySize,
                ArchitectureTeamSize = t.ArchitectureTeamSize,
                IndustryVertical = t.IndustryVertical,
                IndustryVerticalOther = t.IndustryVerticalOther,
                EnterpriseSeatsLimit = t.EnterpriseSeatsLimit,
                EnterpriseSeatsUsed = t.EnterpriseSeatsUsed,
                TenantErasureRequestedUtc = t.TenantErasureRequestedUtc,
                TenantErasureApprovedUtc = approvedUtc,
                TenantErasureApprovedByUserId = approvedByUserId
            };

            return Task.FromResult(true);
        }
    }


    /// <inheritdoc />
    public Task<bool> TryStartTenantErasureOffboardAsync(
        Guid tenantId,
        DateTimeOffset offboardedUtc,
        DateTimeOffset erasureEligibleUtc,
        CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.OffboardedUtc is not null)
                return Task.FromResult(false);

            _byId[tenantId] = CopyTenant(existing, offboardedUtc: offboardedUtc, erasureEligibleUtc: erasureEligibleUtc);
        }

        return Task.FromResult(true);
    }


    /// <inheritdoc />
    public Task<bool> TryRestoreTenantErasureQuarantineAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.OffboardedUtc is null)
                return Task.FromResult(false);

            _byId[tenantId] = CopyTenant(existing, clearErasureQuarantine: true);
        }

        return Task.FromResult(true);
    }


    /// <inheritdoc />
    public Task<bool> TrySetTenantErasureLegalHoldAsync(
        Guid tenantId,
        DateTimeOffset legalHoldUntilUtc,
        DateTimeOffset utcNow,
        string? reason,
        string legalHoldSetByUserId,
        CancellationToken ct)
    {
        _ = ct;

        if (legalHoldUntilUtc <= utcNow)
            return Task.FromResult(false);

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.FromResult(false);

            DateTimeOffset setUtc = TimeProvider.System.GetUtcNow();
            _byId[tenantId] = CopyTenant(
                existing,
                legalHoldUntilUtc: legalHoldUntilUtc,
                legalHoldReason: reason,
                legalHoldSetByUserId: legalHoldSetByUserId,
                legalHoldSetUtc: setUtc);
        }

        return Task.FromResult(true);
    }


    /// <inheritdoc />
    public Task<bool> TryClearTenantErasureLegalHoldAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.LegalHoldUntilUtc is null)
                return Task.FromResult(false);

            _byId[tenantId] = CopyTenant(existing, clearLegalHold: true);
        }

        return Task.FromResult(true);
    }


    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTenantIdsEligibleForScheduledHardPurgeAsync(
        DateTimeOffset utcNow,
        int take,
        CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            int clamped = Math.Clamp(take, 1, 100);

            List<Guid> ids = _byId.Values
                .Where(t => TenantErasureEligibility.IsEligibleForScheduledHardPurge(t, utcNow))
                .OrderBy(static t => t.ErasureEligibleUtc)
                .Take(clamped)
                .Select(static t => t.Id)
                .ToList();

            return Task.FromResult<IReadOnlyList<Guid>>(ids);
        }
    }


    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTenantIdsForOrphanedCatalogCleanupAsync(
        DateTimeOffset utcNow,
        DateTimeOffset erasureRequestedOnOrBefore,
        int take,
        CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            int clamped = Math.Clamp(take, 1, 100);

            List<Guid> ids = _byId.Values
                .Where(t =>
                    t.TenantErasureRequestedUtc is not null &&
                    t.TenantErasureRequestedUtc <= erasureRequestedOnOrBefore &&
                    t.TenantErasureApprovedUtc is not null &&
                    (t.LegalHoldUntilUtc is null || t.LegalHoldUntilUtc <= utcNow))
                .OrderBy(static t => t.TenantErasureRequestedUtc)
                .Take(clamped)
                .Select(static t => t.Id)
                .ToList();

            return Task.FromResult<IReadOnlyList<Guid>>(ids);
        }
    }
}

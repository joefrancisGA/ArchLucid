using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class InMemoryTenantRepository
{

    public Task InsertTenantAsync(
        Guid tenantId,
        string name,
        string slug,
        TenantTier tier,
        Guid? entraTenantId,
        string dataRegion,
        CancellationToken ct,
        int? enterpriseScimSeatsLimit = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        ct.ThrowIfCancellationRequested();

        string slugKey = TenantRepositoryCore.NormalizeSlug(slug);

        string residencyKey = TenantDataRegions.NormalizeOptional(dataRegion);
        TenantRecord record = new()
        {
            Id = tenantId,
            Name = name,
            Slug = slugKey,
            Tier = tier,
            EntraTenantId = entraTenantId,
            DataRegion = residencyKey,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            SuspendedUtc = null,
            TrialStartUtc = null,
            TrialExpiresUtc = null,
            TrialRunsLimit = null,
            TrialRunsUsed = 0,
            TrialSeatsLimit = null,
            TrialSeatsUsed = 0,
            TrialStatus = null,
            TrialSampleRunId = null,
            TrialArchitecturePreseedEnqueuedUtc = null,
            TrialWelcomeRunId = null,
            BaselineReviewCycleHours = null,
            BaselineReviewCycleSource = null,
            BaselineReviewCycleCapturedUtc = null,
            BaselineManualPrepHoursPerReview = null,
            BaselinePeoplePerReview = null,
            BaselineManualPrepCapturedUtc = null,
            CompanySize = null,
            ArchitectureTeamSize = null,
            IndustryVertical = null,
            IndustryVerticalOther = null,
            EnterpriseSeatsLimit = enterpriseScimSeatsLimit,
            EnterpriseSeatsUsed = 0,
            OffboardedUtc = null,
            ErasureEligibleUtc = null,
            LegalHoldUntilUtc = null,
            LegalHoldReason = null,
            LegalHoldSetByUserId = null,
            LegalHoldSetUtc = null,
            TenantErasureRequestedUtc = null,
            TenantErasureApprovedUtc = null,
            TenantErasureApprovedByUserId = null
        };

        // Tenant, slug and Entra indexes form a single logical registry.
        // Do not expose a half-inserted tenant or permit a competing Entra
        // binding to overwrite a winner between dictionary operations.
        lock (_trialGate)
        {
            ct.ThrowIfCancellationRequested();

            if (!_byId.TryAdd(tenantId, record))
                throw new InvalidOperationException($"Tenant id '{tenantId:D}' already exists.");

            if (!_slugToId.TryAdd(slugKey, tenantId))
            {
                _byId.TryRemove(tenantId, out _);
                throw new InvalidOperationException($"Tenant slug '{slugKey}' already exists.");
            }

            if (entraTenantId is { } entraId && !_entraTenantIdToTenantId.TryAdd(entraId, tenantId))
            {
                _slugToId.TryRemove(slugKey, out _);
                _byId.TryRemove(tenantId, out _);
                throw new InvalidOperationException($"Entra tenant id '{entraId:D}' is already linked.");
            }

            _workspacesByTenant.TryAdd(tenantId, []);
        }

        return Task.CompletedTask;
    }


    public Task SuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        lock (_trialGate)
        {
            ct.ThrowIfCancellationRequested();

            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.CompletedTask;

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(existing, suspendedUtcOverride: TimeProvider.System.GetUtcNow());
        }

        return Task.CompletedTask;
    }

    public Task<bool> TrySuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        lock (_trialGate)
        {
            ct.ThrowIfCancellationRequested();

            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing)
                || existing.OffboardedUtc is not null
                || existing.SuspendedUtc is not null)
            {
                return Task.FromResult(false);
            }

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(
                existing,
                suspendedUtcOverride: TimeProvider.System.GetUtcNow());
            return Task.FromResult(true);
        }
    }


    /// <inheritdoc />
    public Task<bool> TryUnsuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        lock (_trialGate)
        {
            ct.ThrowIfCancellationRequested();

            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.FromResult(false);

            if (existing.OffboardedUtc is not null || existing.SuspendedUtc is null)
                return Task.FromResult(false);

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(existing, clearSuspendedUtc: true);

            return Task.FromResult(true);
        }
    }


    /// <inheritdoc />
    public Task UpdateBaselineAsync(
        Guid tenantId,
        decimal? manualPrepHoursPerReview,
        int? peoplePerReview,
        DateTimeOffset? capturedUtc,
        CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.CompletedTask;

            _byId[tenantId] = new TenantRecord
            {
                Id = existing.Id,
                Name = existing.Name,
                Slug = existing.Slug,
                Tier = existing.Tier,
                EntraTenantId = existing.EntraTenantId,
                DataRegion = existing.DataRegion,
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
                TrialArchitecturePreseedAttemptCount = existing.TrialArchitecturePreseedAttemptCount,
                TrialArchitecturePreseedFailedUtc = existing.TrialArchitecturePreseedFailedUtc,
                TrialArchitecturePreseedLastError = existing.TrialArchitecturePreseedLastError,
                TrialWelcomeRunId = existing.TrialWelcomeRunId,
                TrialFirstManifestCommittedUtc = existing.TrialFirstManifestCommittedUtc,
                BaselineReviewCycleHours = existing.BaselineReviewCycleHours,
                BaselineReviewCycleSource = existing.BaselineReviewCycleSource,
                BaselineReviewCycleCapturedUtc = existing.BaselineReviewCycleCapturedUtc,
                BaselineManualPrepHoursPerReview = manualPrepHoursPerReview,
                BaselinePeoplePerReview = peoplePerReview,
                BaselineManualPrepCapturedUtc = capturedUtc,
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
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task<bool> UpdateEntraTenantIdAsync(Guid tenantId, Guid entraTenantId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        // The registry binding and the tenant row must change atomically.
        // A stale row reconstructed outside the lock can erase recent trial,
        // erasure, seat, or residency metadata; dictionary index assignment
        // can also steal another tenant's Entra directory under concurrency.
        lock (_trialGate)
        {
            ct.ThrowIfCancellationRequested();
            if (!_byId.TryGetValue(tenantId, out TenantRecord? tenant))
                return Task.FromResult(false);

            if (tenant.EntraTenantId is { } existing)
                return Task.FromResult(existing == entraTenantId);

            if (_entraTenantIdToTenantId.TryGetValue(entraTenantId, out Guid holderTenantId)
                && holderTenantId != tenantId)
                return Task.FromResult(false);

            if (!_entraTenantIdToTenantId.TryAdd(entraTenantId, tenantId)
                && (!_entraTenantIdToTenantId.TryGetValue(entraTenantId, out Guid holder)
                    || holder != tenantId))
                return Task.FromResult(false);

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(
                tenant, entraTenantIdOverride: entraTenantId);
            return Task.FromResult(true);
        }
    }

}

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

        _ = ct;

        string slugKey = slug.Trim().ToLowerInvariant();

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

        lock (_trialGate)
        {
            if (!_byId.TryAdd(tenantId, record))
                throw new InvalidOperationException($"Tenant id '{tenantId:D}' already exists.");
        }

        if (!_slugToId.TryAdd(slugKey, tenantId))
        {
            lock (_trialGate)
            {
                _byId.TryRemove(tenantId, out _);
            }

            throw new InvalidOperationException($"Tenant slug '{slugKey}' already exists.");
        }

        if (entraTenantId.HasValue)

            if (!_entraTenantIdToTenantId.TryAdd(entraTenantId.Value, tenantId))
            {
                _slugToId.TryRemove(slugKey, out _);
                lock (_trialGate)
                {
                    _byId.TryRemove(tenantId, out _);
                }
                throw new InvalidOperationException($"Entra tenant id '{entraTenantId.Value:D}' is already linked.");
            }

        _workspacesByTenant.TryAdd(tenantId, []);

        return Task.CompletedTask;
    }


    public Task SuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.CompletedTask;

            _byId[tenantId] = CopyTenant(existing, suspendedUtcOverride: TimeProvider.System.GetUtcNow());
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task<bool> TryUnsuspendTenantAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.FromResult(false);

            if (existing.OffboardedUtc is not null)
                return Task.FromResult(false);

            _byId[tenantId] = CopyTenant(existing, clearSuspendedUtc: true);

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

        TenantRecord? existing;
        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out existing))
                return Task.CompletedTask;
        }

        lock (_trialGate)
        {
            _byId[tenantId] = new TenantRecord
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
        _ = ct;

        TenantRecord? tenant;

        lock (_trialGate)
        {

            if (!_byId.TryGetValue(tenantId, out tenant))
                return Task.FromResult(false);
        }

        if (tenant.EntraTenantId is { } existing && existing != entraTenantId)
            return Task.FromResult(false);

        if (tenant.EntraTenantId == entraTenantId)
            return Task.FromResult(true);

        if (_entraTenantIdToTenantId.TryGetValue(entraTenantId, out Guid holderTenantId) && holderTenantId != tenantId)
            return Task.FromResult(false);

        _entraTenantIdToTenantId[entraTenantId] = tenantId;

        lock (_trialGate)
        {
            _byId[tenantId] = new TenantRecord
            {
                Id = tenant.Id,
                Name = tenant.Name,
                Slug = tenant.Slug,
                Tier = tenant.Tier,
                EntraTenantId = entraTenantId,
                CreatedUtc = tenant.CreatedUtc,
                SuspendedUtc = tenant.SuspendedUtc,
                TrialStartUtc = tenant.TrialStartUtc,
                TrialExpiresUtc = tenant.TrialExpiresUtc,
                TrialRunsLimit = tenant.TrialRunsLimit,
                TrialRunsUsed = tenant.TrialRunsUsed,
                TrialSeatsLimit = tenant.TrialSeatsLimit,
                TrialSeatsUsed = tenant.TrialSeatsUsed,
                TrialStatus = tenant.TrialStatus,
                TrialSampleRunId = tenant.TrialSampleRunId,
                TrialArchitecturePreseedEnqueuedUtc = tenant.TrialArchitecturePreseedEnqueuedUtc,
                TrialWelcomeRunId = tenant.TrialWelcomeRunId,
                TrialFirstManifestCommittedUtc = tenant.TrialFirstManifestCommittedUtc,
                BaselineReviewCycleHours = tenant.BaselineReviewCycleHours,
                BaselineReviewCycleSource = tenant.BaselineReviewCycleSource,
                BaselineReviewCycleCapturedUtc = tenant.BaselineReviewCycleCapturedUtc,
                BaselineManualPrepHoursPerReview = tenant.BaselineManualPrepHoursPerReview,
                BaselinePeoplePerReview = tenant.BaselinePeoplePerReview,
                BaselineManualPrepCapturedUtc = tenant.BaselineManualPrepCapturedUtc,
                CompanySize = tenant.CompanySize,
                ArchitectureTeamSize = tenant.ArchitectureTeamSize,
                IndustryVertical = tenant.IndustryVertical,
                IndustryVerticalOther = tenant.IndustryVerticalOther,
                EnterpriseSeatsLimit = tenant.EnterpriseSeatsLimit,
                EnterpriseSeatsUsed = tenant.EnterpriseSeatsUsed,
                OffboardedUtc = tenant.OffboardedUtc,
                ErasureEligibleUtc = tenant.ErasureEligibleUtc,
                LegalHoldUntilUtc = tenant.LegalHoldUntilUtc,
                LegalHoldReason = tenant.LegalHoldReason,
                LegalHoldSetByUserId = tenant.LegalHoldSetByUserId,
                LegalHoldSetUtc = tenant.LegalHoldSetUtc,
                TenantErasureRequestedUtc = tenant.TenantErasureRequestedUtc,
                TenantErasureApprovedUtc = tenant.TenantErasureApprovedUtc,
                TenantErasureApprovedByUserId = tenant.TenantErasureApprovedByUserId
            };
        }

        return Task.FromResult(true);
    }
}

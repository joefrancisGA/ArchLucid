using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>In-memory tenant registry for tests and <c>InMemory</c> storage mode.</summary>
/// <remarks>
///     Aggregate methods live in <c>InMemoryTenantRepository.{Directory|Lifecycle|Workspace|Trial|Seat|Erasure}.cs</c>
///     partials that mirror <see cref="ITenantRepository"/>'s composed interfaces.
/// </remarks>
public sealed partial class InMemoryTenantRepository : ITenantRepository
{
    private readonly ConcurrentDictionary<Guid, TenantRecord> _byId = new();
    private readonly ConcurrentDictionary<Guid, Guid> _entraTenantIdToTenantId = new();
    private readonly ConcurrentDictionary<string, Guid> _slugToId = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<Guid, byte> _trialFirstManifestCommitted = new();
    private readonly Lock _trialGate = new();
    private readonly ConcurrentDictionary<(Guid TenantId, string PrincipalKey), byte> _trialSeatOccupants = new();
    private readonly ConcurrentDictionary<Guid, List<TenantWorkspaceRow>> _workspacesByTenant = new();

    /// <summary>
    ///     Seeds <see cref="ScopeIds.DefaultTenant" /> so DevelopmentBypass + commercial-tier filters resolve a Standard
    ///     tenant without SQL.
    /// </summary>
    public InMemoryTenantRepository()
    {
        TrySeedDefaultDevelopmentTenant();
    }

    /// <summary>
    ///     Integration test hosts using the in-memory tenant registry; mutates tier for commercial gate HTTP assertions.
    /// </summary>
    internal Task SetCommercialTierForIntegrationTestsAsync(Guid tenantId, TenantTier tier, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                throw new InvalidOperationException($"Tenant '{tenantId:D}' is missing from the in-memory registry.");

            _byId[tenantId] = CopyTenant(existing, commercialTier: tier);
        }

        return Task.CompletedTask;
    }

    private void TrySeedDefaultDevelopmentTenant()
    {
        lock (_trialGate)
        {
            if (_byId.ContainsKey(ScopeIds.DefaultTenant))
                return;
        }

        const string slug = "archlucid-dev-default-scope";
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        TenantRecord record = new()
        {
            Id = ScopeIds.DefaultTenant,
            Name = "Development default tenant",
            Slug = slug,
            Tier = TenantTier.Standard,
            EntraTenantId = null,
            DataRegion = TenantDataRegions.Default,
            CreatedUtc = now,
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
            EnterpriseSeatsLimit = null,
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
            if (!_byId.TryAdd(ScopeIds.DefaultTenant, record))
                return;
        }

        _ = _slugToId.TryAdd(slug, ScopeIds.DefaultTenant);
    }

    private static TenantRecord CopyTenant(
        TenantRecord source,
        TenantTier? commercialTier = null,
        int? trialRunsUsed = null,
        int? trialSeatsUsed = null,
        string? trialStatus = null,
        DateTimeOffset? trialExpiresUtc = null,
        DateTimeOffset? trialArchitecturePreseedEnqueuedUtc = null,
        int? trialArchitecturePreseedAttemptCount = null,
        DateTimeOffset? trialArchitecturePreseedFailedUtc = null,
        string? trialArchitecturePreseedLastError = null,
        Guid? trialWelcomeRunId = null,
        DateTimeOffset? trialFirstManifestCommittedUtc = null,
        int? enterpriseSeatsUsedOverride = null,
        DateTimeOffset? suspendedUtcOverride = null,
        bool clearSuspendedUtc = false,
        DateTimeOffset? offboardedUtc = null,
        DateTimeOffset? erasureEligibleUtc = null,
        bool clearErasureQuarantine = false,
        DateTimeOffset? legalHoldUntilUtc = null,
        string? legalHoldReason = null,
        string? legalHoldSetByUserId = null,
        DateTimeOffset? legalHoldSetUtc = null,
        bool clearLegalHold = false)
    {
        return new TenantRecord
        {
            Id = source.Id,
            Name = source.Name,
            Slug = source.Slug,
            Tier = commercialTier ?? source.Tier,
            EntraTenantId = source.EntraTenantId,
            DataRegion = source.DataRegion,
            CreatedUtc = source.CreatedUtc,
            SuspendedUtc = clearErasureQuarantine || clearSuspendedUtc
                ? null
                : suspendedUtcOverride ?? source.SuspendedUtc,
            OffboardedUtc = clearErasureQuarantine ? null : offboardedUtc ?? source.OffboardedUtc,
            ErasureEligibleUtc = clearErasureQuarantine ? null : erasureEligibleUtc ?? source.ErasureEligibleUtc,
            LegalHoldUntilUtc = clearLegalHold ? null : legalHoldUntilUtc ?? source.LegalHoldUntilUtc,
            LegalHoldReason = clearLegalHold ? null : legalHoldReason ?? source.LegalHoldReason,
            LegalHoldSetByUserId = clearLegalHold ? null : legalHoldSetByUserId ?? source.LegalHoldSetByUserId,
            LegalHoldSetUtc = clearLegalHold ? null : legalHoldSetUtc ?? source.LegalHoldSetUtc,
            TrialStartUtc = source.TrialStartUtc,
            TrialExpiresUtc = trialExpiresUtc ?? source.TrialExpiresUtc,
            TrialRunsLimit = source.TrialRunsLimit,
            TrialRunsUsed = trialRunsUsed ?? source.TrialRunsUsed,
            TrialSeatsLimit = source.TrialSeatsLimit,
            TrialSeatsUsed = trialSeatsUsed ?? source.TrialSeatsUsed,
            TrialStatus = trialStatus ?? source.TrialStatus,
            TrialSampleRunId = source.TrialSampleRunId,
            TrialArchitecturePreseedEnqueuedUtc =
                trialArchitecturePreseedEnqueuedUtc ?? source.TrialArchitecturePreseedEnqueuedUtc,
            TrialArchitecturePreseedAttemptCount =
                trialArchitecturePreseedAttemptCount ?? source.TrialArchitecturePreseedAttemptCount,
            TrialArchitecturePreseedFailedUtc =
                trialArchitecturePreseedFailedUtc ?? source.TrialArchitecturePreseedFailedUtc,
            TrialArchitecturePreseedLastError =
                trialArchitecturePreseedLastError ?? source.TrialArchitecturePreseedLastError,
            TrialWelcomeRunId = trialWelcomeRunId ?? source.TrialWelcomeRunId,
            TrialFirstManifestCommittedUtc = trialFirstManifestCommittedUtc ?? source.TrialFirstManifestCommittedUtc,
            BaselineReviewCycleHours = source.BaselineReviewCycleHours,
            BaselineReviewCycleSource = source.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = source.BaselineReviewCycleCapturedUtc,
            BaselineManualPrepHoursPerReview = source.BaselineManualPrepHoursPerReview,
            BaselinePeoplePerReview = source.BaselinePeoplePerReview,
            BaselineManualPrepCapturedUtc = source.BaselineManualPrepCapturedUtc,
            CompanySize = source.CompanySize,
            ArchitectureTeamSize = source.ArchitectureTeamSize,
            IndustryVertical = source.IndustryVertical,
            IndustryVerticalOther = source.IndustryVerticalOther,
            EnterpriseSeatsLimit = source.EnterpriseSeatsLimit,
            EnterpriseSeatsUsed = enterpriseSeatsUsedOverride ?? source.EnterpriseSeatsUsed,
            TenantErasureRequestedUtc = clearErasureQuarantine
                ? null
                : offboardedUtc ?? source.TenantErasureRequestedUtc,
            TenantErasureApprovedUtc = source.TenantErasureApprovedUtc,
            TenantErasureApprovedByUserId = source.TenantErasureApprovedByUserId
        };
    }

    private static int ComputeDaysRemaining(DateTimeOffset? trialExpiresUtc)
    {
        if (trialExpiresUtc is null)
            return 0;

        double totalDays = (trialExpiresUtc.Value - TimeProvider.System.GetUtcNow()).TotalDays;
        int days = (int)Math.Floor(totalDays);

        return days < 0 ? 0 : days;
    }

    private sealed record TenantWorkspaceRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public Guid TenantId
        {
            [UsedImplicitly]
            get;
            init;
        }

        public string Name
        {
            [UsedImplicitly]
            get;
            init;
        } = string.Empty;

        public Guid DefaultProjectId
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }
    }
}

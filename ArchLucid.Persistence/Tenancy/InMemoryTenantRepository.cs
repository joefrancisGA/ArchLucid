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
public sealed partial class InMemoryTenantRepository : ITenantRepository, IWorkspaceQueryTenantRepository
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

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(existing, commercialTier: tier);
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

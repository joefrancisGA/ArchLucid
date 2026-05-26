using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>In-memory tenant registry for tests and <c>InMemory</c> storage mode.</summary>
public sealed class InMemoryTenantRepository : ITenantRepository
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

    public Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            return Task.FromResult(_byId.GetValueOrDefault(tenantId));
        }
    }

    public Task<TenantRecord?> GetBySlugAsync(string slug, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);
        _ = ct;

        string key = slug.Trim().ToLowerInvariant();

        return !_slugToId.TryGetValue(key, out Guid id) ? Task.FromResult<TenantRecord?>(null) : GetByIdAsync(id, ct);
    }

    public Task<TenantRecord?> GetByEntraTenantIdAsync(Guid entraTenantId, CancellationToken ct)
    {
        _ = ct;

        return !_entraTenantIdToTenantId.TryGetValue(entraTenantId, out Guid tenantId) ? Task.FromResult<TenantRecord?>(null) : GetByIdAsync(tenantId, ct);
    }

    public Task<IReadOnlyList<TenantRecord>> ListAsync(CancellationToken ct)
    {
        _ = ct;

        IReadOnlyList<TenantRecord> list;

        lock (_trialGate)
        {
            list = _byId.Values.OrderByDescending(static r => r.CreatedUtc).ToList();
        }

        return Task.FromResult(list);
    }

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

    public Task InsertWorkspaceAsync(
        Guid workspaceId,
        Guid tenantId,
        string name,
        Guid defaultProjectId,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        _ = ct;

        List<TenantWorkspaceRow> list = _workspacesByTenant.GetOrAdd(tenantId, static _ => []);

        lock (list)

            list.Add(
                new TenantWorkspaceRow
                {
                    Id = workspaceId,
                    TenantId = tenantId,
                    Name = name,
                    DefaultProjectId = defaultProjectId,
                    CreatedUtc = TimeProvider.System.GetUtcNow()
                });

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

    /// <inheritdoc />
    public Task TryIncrementActiveTrialRunAsync(
        Guid tenantId,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = connection;
        _ = transaction;
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t) ||
                !string.Equals(t.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal) ||
                t.TrialRunsLimit is not { } runCap ||
                runCap < 1)
                return Task.CompletedTask;

            DateTimeOffset now = TimeProvider.System.GetUtcNow();

            if (t.TrialExpiresUtc is { } exp && exp <= now)

                throw new TrialLimitExceededException(
                    TrialLimitReason.Expired,
                    ComputeDaysRemaining(t.TrialExpiresUtc));

            if (t.TrialRunsUsed >= runCap)

                throw new TrialLimitExceededException(
                    TrialLimitReason.RunsExceeded,
                    ComputeDaysRemaining(t.TrialExpiresUtc));

            _byId[tenantId] = CopyTenant(t, trialRunsUsed: t.TrialRunsUsed + 1);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task TryClaimTrialSeatAsync(Guid tenantId, string principalKey, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(principalKey);
        _ = ct;

        string key = principalKey.Trim();

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t) ||
                !string.Equals(t.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal) ||
                t.TrialSeatsLimit is not { } seatCap ||
                seatCap < 1)
                return Task.CompletedTask;

            if (t.TrialExpiresUtc is { } exp && exp <= TimeProvider.System.GetUtcNow())

                throw new TrialLimitExceededException(
                    TrialLimitReason.Expired,
                    ComputeDaysRemaining(t.TrialExpiresUtc));

            if (_trialSeatOccupants.ContainsKey((tenantId, key)))
                return Task.CompletedTask;

            if (t.TrialSeatsUsed >= seatCap)

                throw new TrialLimitExceededException(
                    TrialLimitReason.SeatsExceeded,
                    ComputeDaysRemaining(t.TrialExpiresUtc));

            _trialSeatOccupants[(tenantId, key)] = 1;

            _byId[tenantId] = CopyTenant(t, trialSeatsUsed: t.TrialSeatsUsed + 1);
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
    public Task<bool> TryIncrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t) || t.EnterpriseSeatsLimit is { } lim && t.EnterpriseSeatsUsed >= lim)
                return Task.FromResult(false);

            _byId[tenantId] = CopyTenant(t, enterpriseSeatsUsedOverride: t.EnterpriseSeatsUsed + 1);
        }

        return Task.FromResult(true);
    }

    /// <inheritdoc />
    public Task DecrementEnterpriseScimSeatAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t))
                return Task.CompletedTask;

            int next = t.EnterpriseSeatsUsed > 0 ? t.EnterpriseSeatsUsed - 1 : 0;
            _byId[tenantId] = CopyTenant(t, enterpriseSeatsUsedOverride: next);
        }

        return Task.CompletedTask;
    }

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

    /// <inheritdoc />
    public Task EnqueueTrialArchitecturePreseedAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.TrialWelcomeRunId is not null || existing.TrialArchitecturePreseedEnqueuedUtc is not null)
                return Task.CompletedTask;

            _byId[tenantId] = CopyTenant(existing, trialArchitecturePreseedEnqueuedUtc: TimeProvider.System.GetUtcNow());
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTenantIdsPendingTrialArchitecturePreseedAsync(int take, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            List<Guid> ids = _byId.Values
                .Where(static t =>
                    t.TrialArchitecturePreseedEnqueuedUtc is not null
                    && t.TrialWelcomeRunId is null
                    && string.Equals(t.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
                .OrderBy(static t => t.TrialArchitecturePreseedEnqueuedUtc)
                .Take(Math.Clamp(take, 1, 50))
                .Select(static t => t.Id)
                .ToList();

            return Task.FromResult<IReadOnlyList<Guid>>(ids);
        }
    }

    /// <inheritdoc />
    public Task MarkTrialArchitecturePreseedCompletedAsync(Guid tenantId, Guid welcomeRunId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.TrialWelcomeRunId is not null)
                return Task.CompletedTask;

            _byId[tenantId] = CopyTenant(existing, trialWelcomeRunId: welcomeRunId);
        }

        return Task.CompletedTask;
    }

    public Task<TenantWorkspaceLink?> GetFirstWorkspaceAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        if (!_workspacesByTenant.TryGetValue(tenantId, out List<TenantWorkspaceRow>? list))
            return Task.FromResult<TenantWorkspaceLink?>(null);

        TenantWorkspaceRow? row;

        lock (list)

            row = list.OrderBy(static w => w.CreatedUtc).FirstOrDefault();

        if (row is null)
            return Task.FromResult<TenantWorkspaceLink?>(null);

        return Task.FromResult<TenantWorkspaceLink?>(
            new TenantWorkspaceLink { WorkspaceId = row.Id, DefaultProjectId = row.DefaultProjectId });
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<TenantWorkspaceListItem>> ListWorkspacesAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        if (!_workspacesByTenant.TryGetValue(tenantId, out List<TenantWorkspaceRow>? list))
            return Task.FromResult<IReadOnlyList<TenantWorkspaceListItem>>([]);

        List<TenantWorkspaceListItem> copy;

        lock (list)
        {
            copy = list.OrderBy(static w => w.CreatedUtc)
                .Select(static w => new TenantWorkspaceListItem
                {
                    WorkspaceId = w.Id,
                    TenantId = w.TenantId,
                    Name = w.Name,
                    DefaultProjectId = w.DefaultProjectId,
                    CreatedUtc = w.CreatedUtc
                })
                .ToList();
        }

        return Task.FromResult<IReadOnlyList<TenantWorkspaceListItem>>(copy);
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
        Guid? trialWelcomeRunId = null,
        DateTimeOffset? trialFirstManifestCommittedUtc = null,
        int? enterpriseSeatsUsedOverride = null,
        DateTimeOffset? suspendedUtcOverride = null,
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
            SuspendedUtc = clearErasureQuarantine ? null : suspendedUtcOverride ?? source.SuspendedUtc,
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
            TenantErasureRequestedUtc = source.TenantErasureRequestedUtc,
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

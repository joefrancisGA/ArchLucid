using System.Text.Json;

using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Application.Roi;

/// <summary>Computes hybrid realized-value metrics from disposition and waiver evidence.</summary>
internal static class RealizedValueMetricsCalculator
{
    internal static readonly TimeSpan TrailingWindow = TimeSpan.FromDays(30);

    internal static async Task<RealizedValueSummary> ComputeAsync(
        IFindingReviewTrailRepository findingReviewTrailRepository,
        IRiskExceptionService riskExceptionService,
        ITenantSettingsRepository tenantSettingsRepository,
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(findingReviewTrailRepository);
        ArgumentNullException.ThrowIfNull(riskExceptionService);
        ArgumentNullException.ThrowIfNull(tenantSettingsRepository);

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        DateTimeOffset since = now.Subtract(TrailingWindow);

        IReadOnlyList<FindingReviewEventRecord> events =
            await findingReviewTrailRepository.ListSinceUtcAsync(tenantId, since, cancellationToken).ConfigureAwait(false);

        int remediatedCount = CountDistinctFindings(
            events,
            static reviewEvent => reviewEvent.Disposition == FindingDisposition.Remediated);

        double? medianDays = ComputeMedianTimeToRemediationDays(events, now);
        IReadOnlyList<RiskExceptionRecord> activeWaivers =
            await riskExceptionService.ListActiveAsync(tenantId, projectId, cancellationToken).ConfigureAwait(false);
        IReadOnlyList<RiskExceptionRecord> retiredWaivers =
            await riskExceptionService.ListRetiredSinceAsync(tenantId, projectId, since, cancellationToken).ConfigureAwait(false);

        (int retiredCount, int expiryReversionCount) = CountWaiverRetirements(retiredWaivers, since, now);
        RealizedValueAttestation attestation = await LoadAttestationAsync(tenantSettingsRepository, tenantId, cancellationToken)
            .ConfigureAwait(false);

        return new RealizedValueSummary
        {
            FindingsRemediatedCount30Days = remediatedCount,
            MedianTimeToRemediationDays = medianDays,
            ActiveWaiversCount = activeWaivers.Count,
            WaiversRetiredCount30Days = retiredCount,
            WaiverExpiryReversionCount30Days = expiryReversionCount,
            AttestedIncidentsAvoided = attestation.AttestedIncidentsAvoided,
            AttestedRevenueOrRetentionImpact = attestation.AttestedRevenueOrRetentionImpact,
            AttestedReviewerTimeSavedNote = attestation.AttestedReviewerTimeSavedNote,
        };
    }

    internal static async Task<RealizedValueAttestationResponse> LoadAttestationResponseAsync(
        ITenantSettingsRepository tenantSettingsRepository,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        RealizedValueAttestation attestation =
            await LoadAttestationAsync(tenantSettingsRepository, tenantId, cancellationToken).ConfigureAwait(false);

        bool hasAttestation = attestation.AttestedIncidentsAvoided is not null
                              || !string.IsNullOrWhiteSpace(attestation.AttestedRevenueOrRetentionImpact)
                              || !string.IsNullOrWhiteSpace(attestation.AttestedReviewerTimeSavedNote);

        return new RealizedValueAttestationResponse
        {
            AttestedIncidentsAvoided = attestation.AttestedIncidentsAvoided,
            AttestedRevenueOrRetentionImpact = attestation.AttestedRevenueOrRetentionImpact,
            AttestedReviewerTimeSavedNote = attestation.AttestedReviewerTimeSavedNote,
            HasAttestation = hasAttestation,
        };
    }

    internal static async Task SaveAttestationAsync(
        ITenantSettingsRepository tenantSettingsRepository,
        Guid tenantId,
        UpsertRealizedValueAttestationRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(tenantSettingsRepository);
        ArgumentNullException.ThrowIfNull(request);

        RealizedValueAttestation attestation = new()
        {
            AttestedIncidentsAvoided = request.AttestedIncidentsAvoided,
            AttestedRevenueOrRetentionImpact = NormalizeOptionalText(request.AttestedRevenueOrRetentionImpact),
            AttestedReviewerTimeSavedNote = NormalizeOptionalText(request.AttestedReviewerTimeSavedNote),
        };

        string json = JsonSerializer.Serialize(attestation);
        await tenantSettingsRepository.UpsertAsync(tenantId, TenantSettingKeys.RealizedValueAttestation, json, cancellationToken)
            .ConfigureAwait(false);
    }

    private static int CountDistinctFindings(
        IReadOnlyList<FindingReviewEventRecord> events,
        Func<FindingReviewEventRecord, bool> predicate)
    {
        HashSet<string> findingIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingReviewEventRecord reviewEvent in events)
        {
            if (!predicate(reviewEvent))
                continue;

            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
                continue;

            findingIds.Add(reviewEvent.FindingId.Trim());
        }

        return findingIds.Count;
    }

    private static double? ComputeMedianTimeToRemediationDays(
        IReadOnlyList<FindingReviewEventRecord> events,
        DateTimeOffset now)
    {
        Dictionary<string, DateTimeOffset> firstSeen = new(StringComparer.OrdinalIgnoreCase);
        List<double> durations = [];

        foreach (FindingReviewEventRecord reviewEvent in events.OrderBy(static e => e.OccurredAtUtc))
        {
            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
                continue;

            string findingId = reviewEvent.FindingId.Trim();

            if (!firstSeen.ContainsKey(findingId))
                firstSeen[findingId] = reviewEvent.OccurredAtUtc;

            if (reviewEvent.Disposition != FindingDisposition.Remediated)
                continue;

            DateTimeOffset start = firstSeen[findingId];
            double days = Math.Max(0, (reviewEvent.OccurredAtUtc - start).TotalDays);
            durations.Add(days);
        }

        if (durations.Count == 0)
            return null;

        durations.Sort();
        int mid = durations.Count / 2;

        if (durations.Count % 2 == 1)
            return Math.Round(durations[mid], 1);

        return Math.Round((durations[mid - 1] + durations[mid]) / 2.0, 1);
    }

    private static (int RetiredCount, int ExpiryReversionCount) CountWaiverRetirements(
        IReadOnlyList<RiskExceptionRecord> retiredWaivers,
        DateTimeOffset since,
        DateTimeOffset now)
    {
        int expiryReversions = retiredWaivers.Count(w =>
            w.Status == RiskExceptionStatus.Expired && w.ExpiresAtUtc >= since && w.ExpiresAtUtc <= now);

        int revoked = retiredWaivers.Count(w =>
            w.Status == RiskExceptionStatus.Revoked
            && w.RevokedAtUtc is not null
            && w.RevokedAtUtc >= since
            && w.RevokedAtUtc <= now);

        return (expiryReversions + revoked, expiryReversions);
    }

    private static async Task<RealizedValueAttestation> LoadAttestationAsync(
        ITenantSettingsRepository tenantSettingsRepository,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        string? raw = await tenantSettingsRepository
            .TryGetAsync(tenantId, TenantSettingKeys.RealizedValueAttestation, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(raw))
            return new RealizedValueAttestation();

        try
        {
            return JsonSerializer.Deserialize<RealizedValueAttestation>(raw) ?? new RealizedValueAttestation();
        }
        catch (JsonException)
        {
            return new RealizedValueAttestation();
        }
    }

    private static string? NormalizeOptionalText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }

    private sealed class RealizedValueAttestation
    {
        public int? AttestedIncidentsAvoided
        {
            get;
            init;
        }

        public string? AttestedRevenueOrRetentionImpact
        {
            get;
            init;
        }

        public string? AttestedReviewerTimeSavedNote
        {
            get;
            init;
        }
    }
}

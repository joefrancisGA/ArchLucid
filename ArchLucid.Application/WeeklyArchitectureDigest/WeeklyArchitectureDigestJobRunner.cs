using System.Text.Json;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.WeeklyDigest;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.WeeklyArchitectureDigest;

/// <summary>Pulls relational critical findings across tenants and emits a capped mock payload to logs.</summary>
public sealed class WeeklyArchitectureDigestJobRunner(
    IWeeklyArchitectureCriticalFindingSummaryRepository weeklyFindingSummaryRepository,
    TimeProvider timeProvider,
    IOptionsMonitor<WeeklyArchitectureDigestOptions> weeklyDigestOptions,
    ILogger<WeeklyArchitectureDigestJobRunner> logger)
{
    private readonly IWeeklyArchitectureCriticalFindingSummaryRepository _weeklyFindingSummaryRepository =
        weeklyFindingSummaryRepository ??
        throw new ArgumentNullException(nameof(weeklyFindingSummaryRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly IOptionsMonitor<WeeklyArchitectureDigestOptions> _weeklyDigestOptions =
        weeklyDigestOptions ?? throw new ArgumentNullException(nameof(weeklyDigestOptions));

    private readonly ILogger<WeeklyArchitectureDigestJobRunner> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    internal async Task<WeeklyArchitectureDigestLogPayload> BuildDigestPayloadAsync(
        CancellationToken cancellationToken)
    {
        WeeklyArchitectureDigestOptions optionsSnapshot = _weeklyDigestOptions.CurrentValue;
        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        int boundedLookbackDays = Math.Clamp(optionsSnapshot.LookbackDays, 1, 90);
        int topCount = Math.Clamp(optionsSnapshot.TopCriticalFindingCount, 1, 100);

        int sampleFetchCap =
            Math.Clamp(
                Math.Max(optionsSnapshot.CriticalFindingSampleFetchCap, topCount),
                topCount,
                10_000);

        DateTime cutoffUtc = utcNow.AddDays(-boundedLookbackDays);
        string criticalKeyword = FindingSeverity.Critical.ToString();

        WeeklyArchitectureCriticalFindingsSlice slice =
            await _weeklyFindingSummaryRepository
                .ListRecentCriticalAsync(cutoffUtc, criticalKeyword, sampleFetchCap, cancellationToken)
                .ConfigureAwait(false);

        List<WeeklyArchitectureDigestCriticalFindingSummaryLine> summarized = slice.SampleRows.Take(topCount)
            .Select(static row => new WeeklyArchitectureDigestCriticalFindingSummaryLine
            {
                FindingId = row.FindingId,
                Title = row.Title,
                Category = row.Category,
                TenantId = row.TenantId,
                SnapshotCreatedUtc = row.SnapshotCreatedUtc,
            })
            .ToList();

        return new WeeklyArchitectureDigestLogPayload
        {
            DigestGeneratedUtc = utcNow,
            IncludedSinceUtc = cutoffUtc,
            CriticalSeverityKeyword = criticalKeyword,
            ApproximateCriticalFindingCountLastWindow = slice.ApproximateMatchingCount,
            SummarizedCriticalFindings = summarized,
        };
    }

    /// <summary>Serializes <see cref="WeeklyArchitectureDigestLogPayload"/> via <see cref="ContractJson.CamelCaseIgnoreNullCompact"/>.</summary>
    public async Task RunOnceEmitLogAsync(CancellationToken cancellationToken)
    {
        WeeklyArchitectureDigestLogPayload digest =
            await BuildDigestPayloadAsync(cancellationToken).ConfigureAwait(false);

        string serialized =
            JsonSerializer.Serialize(digest, ContractJson.CamelCaseIgnoreNullCompact);

        _logger.LogInformation(
            "Weekly architecture digest scaffold (mock delivery payload JSON): {Payload}",
            serialized);
    }
}

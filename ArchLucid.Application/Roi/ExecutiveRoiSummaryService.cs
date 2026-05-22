using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

/// <inheritdoc cref="IExecutiveRoiSummaryService"/>
public sealed class ExecutiveRoiSummaryService(
    IRunDetailQueryService runDetailQueryService,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    ILogger<ExecutiveRoiSummaryService> logger) : IExecutiveRoiSummaryService
{
    /// <summary>Max distinct systems whose run details are loaded per request (defense against huge tenants).</summary>
    public const int DefaultSystemDetailCap = 200;

    private const string UnspecifiedSystemName = "(unspecified)";

    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));

    private readonly ILogger<ExecutiveRoiSummaryService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    /// <inheritdoc/>
    public async Task<ExecutiveRoiSummaryResponse> BuildAsync(CancellationToken cancellationToken = default)
    {
        Dictionary<string, RunSummary> latestBySystem = await CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);
        List<RunSummary> selectedSummaries = latestBySystem.Values
            .OrderByDescending(static summary => summary.CreatedUtc)
            .Take(DefaultSystemDetailCap)
            .ToList();

        if (selectedSummaries.Count < latestBySystem.Count && _logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Executive ROI summary: loading details for {Loaded} of {Total} systems (cap {Cap}).",
                selectedSummaries.Count,
                latestBySystem.Count,
                DefaultSystemDetailCap);
        }

        List<SystemLatestRunRoi> systems = [];
        List<ArchitectureRunDetail> latestDetails = [];
        foreach (RunSummary summary in selectedSummaries)
        {
            ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(summary.RunId, cancellationToken).ConfigureAwait(false);

            if (detail is null)
                continue;

            latestDetails.Add(detail);
            decimal? savings = await TryResolveEstimatedUsdSavingsAsync(detail.Run.FindingsSnapshotId, cancellationToken).ConfigureAwait(false);
            systems.Add(new SystemLatestRunRoi
            {
                SystemName = ResolveSystemName(summary, detail),
                RunId = summary.RunId,
                CommittedUtc = detail.Manifest?.Metadata.CreatedUtc ?? detail.Run.CompletedUtc,
                EstimatedUsdSavings = savings,
            });
        }

        List<SystemicIssueSummary> topIssues = AggregateTopSystemicIssues(latestDetails);
        decimal totalSavings = systems.Sum(static system => system.EstimatedUsdSavings ?? 0m);

        return new ExecutiveRoiSummaryResponse
        {
            TotalEstimatedUsdSavings = totalSavings,
            SystemCount = systems.Count,
            LatestRunCount = systems.Count,
            Systems = systems,
            TopSystemicIssues = topIssues,
        };
    }

    private async Task<Dictionary<string, RunSummary>> CollectLatestCommittedRunPerSystemAsync(CancellationToken cancellationToken)
    {
        Dictionary<string, RunSummary> latestBySystem = new(StringComparer.OrdinalIgnoreCase);
        string? cursor = null;
        const int take = 100;

        while (true)
        {
            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            foreach (RunSummary summary in items)
            {
                if (!IsCommittedSummary(summary))
                    continue;

                string systemKey = NormalizeSystemName(summary.SystemName);

                if (!latestBySystem.TryGetValue(systemKey, out RunSummary? existing) || summary.CreatedUtc > existing.CreatedUtc)
                    latestBySystem[systemKey] = summary;
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return latestBySystem;
    }

    private static List<SystemicIssueSummary> AggregateTopSystemicIssues(IReadOnlyList<ArchitectureRunDetail> latestDetails)
    {
        IEnumerable<ArchitectureFinding> activeFindings = latestDetails
            .SelectMany(static detail => detail.Results.SelectMany(static result => result.Findings))
            .Where(static finding => !finding.IsMuted);

        return DeduplicateFindingsByStableIdentity(activeFindings)
            .GroupBy(static finding => (Category: NormalizeCategory(finding.Category), Severity: finding.Severity.ToString()))
            .Select(static group => new SystemicIssueSummary
            {
                Category = group.Key.Category,
                Severity = group.Key.Severity,
                Count = group.Count(),
            })
            .OrderByDescending(static issue => issue.Count)
            .ThenBy(static issue => issue.Category, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static issue => issue.Severity, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();
    }

    /// <summary>
    /// Collapses overlapping CI reruns: the same stable <see cref="ArchitectureFinding.FindingId"/> across
    /// included runs counts once toward portfolio systemic-issue totals (V1 §2.8).
    /// Findings without a stable id are never deduplicated against each other.
    /// </summary>
    private static IEnumerable<ArchitectureFinding> DeduplicateFindingsByStableIdentity(IEnumerable<ArchitectureFinding> findings)
    {
        HashSet<string> seenFindingIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureFinding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
            {
                yield return finding;
                continue;
            }

            if (seenFindingIds.Add(finding.FindingId))
                yield return finding;
        }
    }

    private Task<decimal?> TryResolveEstimatedUsdSavingsAsync(Guid? findingsSnapshotId, CancellationToken cancellationToken) =>
        _tenantEstimatedUsdSavingsResolver.ResolveFromFindingsSnapshotIdAsync(findingsSnapshotId, cancellationToken);

    private static bool IsCommittedSummary(RunSummary summary)
    {
        if (string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return true;

        return !string.IsNullOrWhiteSpace(summary.CurrentManifestVersion);
    }

    private static string ResolveSystemName(RunSummary summary, ArchitectureRunDetail detail)
    {
        if (!string.IsNullOrWhiteSpace(summary.SystemName))
            return summary.SystemName.Trim();

        if (!string.IsNullOrWhiteSpace(detail.Manifest?.SystemName))
            return detail.Manifest.SystemName.Trim();

        return UnspecifiedSystemName;
    }

    private static string NormalizeSystemName(string? systemName)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            return UnspecifiedSystemName;

        return systemName.Trim();
    }

    private static string NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return "(uncategorized)";

        return category.Trim();
    }
}

using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Interfaces;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Findings.PortfolioRecurrence;

public sealed class PortfolioRunScanSource(
    IRunDetailQueryService runDetailQueryService,
    ILogger<PortfolioRunScanSource> logger) : IPortfolioRunScanSource
{
    private const int RunSummaryPageSize = 100;
    private const int RunSummaryMaxPages = 2_000;

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly ILogger<PortfolioRunScanSource> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<IReadOnlyList<KeyValuePair<string, RunSummary>>> CollectLatestCommittedSystemsAsync(
        int maxSystemsScanned,
        CancellationToken cancellationToken)
    {
        Dictionary<string, RunSummary> latestBySystem =
            await CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);

        return latestBySystem
            .OrderByDescending(static pair => pair.Value.CreatedUtc)
            .Take(maxSystemsScanned)
            .ToList();
    }

    private async Task<Dictionary<string, RunSummary>> CollectLatestCommittedRunPerSystemAsync(CancellationToken ct)
    {
        Dictionary<string, RunSummary> latestBySystem = new(StringComparer.OrdinalIgnoreCase);
        string? cursor = null;
        int pageCount = 0;

        while (true)
        {
            if (pageCount >= RunSummaryMaxPages)
            {
                _logger.LogWarning(
                    "CollectLatestCommittedRunPerSystemAsync: safety max-page cap ({Cap}) reached; stopping early.",
                    RunSummaryMaxPages);
                break;
            }

            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, RunSummaryPageSize, ct)
                    .ConfigureAwait(false);

            pageCount++;

            foreach (RunSummary summary in items)
            {
                if (!SponsorRoiRunCollector.IsCommittedSummary(summary))
                    continue;

                string systemKey = SponsorRoiRunCollector.NormalizeSystemName(summary.SystemName);

                if (!latestBySystem.TryGetValue(systemKey, out RunSummary? existing)
                    || summary.CreatedUtc > existing.CreatedUtc)
                {
                    latestBySystem[systemKey] = summary;
                }
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return latestBySystem;
    }
}

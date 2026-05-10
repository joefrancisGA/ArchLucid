using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

/// <summary>Maps <see cref="QuickScanResult" /> domain output to the HTTP contract (top findings by severity).</summary>
public static class ArchitectureQuickScanResponseMapper
{
    private const int DefaultMaxFindings = 5;

    /// <summary>Returns a new API DTO with at most <paramref name="maxFindings" /> findings, highest severities first.</summary>
    public static ArchitectureQuickScanResponse Map(QuickScanResult result, int maxFindings = DefaultMaxFindings)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (maxFindings < 1)
            throw new ArgumentOutOfRangeException(nameof(maxFindings));

        List<ArchitectureQuickScanFindingItem> findings = result.Findings
            .OrderByDescending(static f => f.Severity)
            .Take(maxFindings)
            .Select(static f => new ArchitectureQuickScanFindingItem
            {
                Title = f.Category,
                Description = f.Message,
                Severity = f.Severity,
                ConfidenceScore = f.ConfidenceScore,
                ConfidenceLevel = f.ConfidenceLevel
            })
            .ToList();

        return new ArchitectureQuickScanResponse
        {
            ScanId = result.ScanId,
            Summary = result.Summary,
            Findings = findings,
            CompletedUtc = result.CompletedUtc
        };
    }
}

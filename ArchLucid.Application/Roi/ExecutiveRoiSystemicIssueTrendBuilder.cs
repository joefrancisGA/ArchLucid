using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Roi;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Roi;

/// <summary>Builds six-month systemic-issue trends for executive ROI (Improvement #12).</summary>
public static class ExecutiveRoiSystemicIssueTrendBuilder
{
    private const int TrendMonths = 6;

    private const int TopSeriesCount = 5;

    /// <summary>
    ///     Aggregates committed runs in the trailing <see cref="TrendMonths" /> months, picks the top
    ///     <see cref="TopSeriesCount" /> finding identities, and returns monthly counts per series.
    /// </summary>
    public static List<ExecutiveRoiSystemicIssueTrendSeries> Build(
        IReadOnlyList<(RunSummary Summary, ArchitectureRunDetail Detail)> committedRuns)
    {
        ArgumentNullException.ThrowIfNull(committedRuns);

        DateTime cutoffUtc = DateTime.UtcNow.AddMonths(-TrendMonths);
        Dictionary<string, Dictionary<string, int>> countsByFindingAndMonth = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, (string Category, string Severity)> labelsByFinding = new(StringComparer.OrdinalIgnoreCase);

        foreach ((RunSummary summary, ArchitectureRunDetail detail) in committedRuns)
        {
            if (summary.CreatedUtc < cutoffUtc)
                continue;

            string monthKey = summary.CreatedUtc.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);

            IEnumerable<ArchitectureFinding> activeFindings = detail.Results
                .SelectMany(static result => result.Findings)
                .Where(static finding => !finding.IsMuted);

            IEnumerable<ArchitectureFinding> deduped =
                ExecutiveRoiFindingDeduplicator.DeduplicateByStableIdentity(activeFindings);

            foreach (ArchitectureFinding finding in deduped)
            {
                if (string.IsNullOrWhiteSpace(finding.FindingId))
                    continue;

                string findingId = finding.FindingId.Trim();
                labelsByFinding[findingId] = (NormalizeCategory(finding.Category), finding.Severity.ToString());

                if (!countsByFindingAndMonth.TryGetValue(findingId, out Dictionary<string, int>? byMonth))
                {
                    byMonth = new Dictionary<string, int>(StringComparer.Ordinal);
                    countsByFindingAndMonth[findingId] = byMonth;
                }

                byMonth.TryGetValue(monthKey, out int existing);
                byMonth[monthKey] = existing + 1;
            }
        }

        List<string> topFindingIds = countsByFindingAndMonth
            .OrderByDescending(static pair => pair.Value.Values.Sum())
            .ThenBy(static pair => pair.Key, StringComparer.OrdinalIgnoreCase)
            .Take(TopSeriesCount)
            .Select(static pair => pair.Key)
            .ToList();

        List<string> monthKeys = BuildTrailingMonthKeys(TrendMonths);
        List<ExecutiveRoiSystemicIssueTrendSeries> series = [];

        foreach (string findingId in topFindingIds)
        {
            if (!labelsByFinding.TryGetValue(findingId, out (string Category, string Severity) labels))
                continue;

            countsByFindingAndMonth.TryGetValue(findingId, out Dictionary<string, int>? byMonth);
            byMonth ??= [];

            List<ExecutiveRoiSystemicIssueTrendPoint> points = monthKeys
                .Select(monthKey => new ExecutiveRoiSystemicIssueTrendPoint
                {
                    MonthKey = monthKey,
                    Count = byMonth.TryGetValue(monthKey, out int count) ? count : 0,
                })
                .ToList();

            series.Add(new ExecutiveRoiSystemicIssueTrendSeries
            {
                FindingId = findingId,
                Category = labels.Category,
                Severity = labels.Severity,
                Points = points,
            });
        }

        return series;
    }

    private static List<string> BuildTrailingMonthKeys(int months)
    {
        DateTime cursor = new(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        List<string> keys = [];

        for (int index = months - 1; index >= 0; index--)
        {
            DateTime month = cursor.AddMonths(-index);
            keys.Add(month.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture));
        }

        return keys;
    }

    private static string NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return "(uncategorized)";

        return category.Trim();
    }
}

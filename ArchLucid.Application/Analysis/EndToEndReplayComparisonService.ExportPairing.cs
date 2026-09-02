using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

public sealed partial class EndToEndReplayComparisonService
{
    private async Task AddExportDiffsAsync(
        EndToEndReplayComparisonReport report,
        IReadOnlyList<RunExportRecord> leftExports,
        IReadOnlyList<RunExportRecord> rightExports,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);

        Dictionary<string, List<RunExportRecord>> leftByKey = GroupExportsByPairingKey(leftExports);
        Dictionary<string, List<RunExportRecord>> rightByKey = GroupExportsByPairingKey(rightExports);

        foreach (string pairingKey in leftByKey.Keys.Union(rightByKey.Keys, StringComparer.OrdinalIgnoreCase)
                     .OrderBy(key => key, StringComparer.OrdinalIgnoreCase))
        {
            leftByKey.TryGetValue(pairingKey, out List<RunExportRecord>? leftRecords);
            rightByKey.TryGetValue(pairingKey, out List<RunExportRecord>? rightRecords);
            leftRecords ??= [];
            rightRecords ??= [];
            int pairCount = Math.Max(leftRecords.Count, rightRecords.Count);

            for (int index = 0; index < pairCount; index++)
            {
                bool hasLeft = index < leftRecords.Count;
                bool hasRight = index < rightRecords.Count;
                string exportLabel = DescribeExportPairingKey(pairingKey, index, pairCount);

                if (hasLeft && hasRight)
                {
                    report.ExportDiffs.Add(
                        await _exportRecordDiffService.CompareAsync(
                            leftRecords[index],
                            rightRecords[index],
                            cancellationToken));
                    continue;
                }

                if (!hasLeft)
                {
                    report.Warnings.Add($"Export {exportLabel} exists on the right run but not the left.");
                    continue;
                }

                report.Warnings.Add($"Export {exportLabel} exists on the left run but not the right.");
            }
        }
    }

    private static Dictionary<string, List<RunExportRecord>> GroupExportsByPairingKey(
        IReadOnlyList<RunExportRecord> exports)
    {
        return exports
            .GroupBy(BuildExportPairingKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderBy(record => record.CreatedUtc)
                    .ThenBy(record => record.ExportRecordId, StringComparer.OrdinalIgnoreCase)
                    .ToList(),
                StringComparer.OrdinalIgnoreCase);
    }

    internal static string BuildExportPairingKey(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        string exportType = record.ExportType.Trim();
        string templateProfile = record.TemplateProfile?.Trim() ?? string.Empty;
        string format = record.Format?.Trim() ?? string.Empty;

        return $"{exportType}|{templateProfile}|{format}";
    }

    private static string DescribeExportPairingKey(string pairingKey, int index, int pairCount)
    {
        if (pairCount <= 1)
        {
            return $"'{pairingKey}'";
        }

        return $"'{pairingKey}' occurrence {index + 1}";
    }
}

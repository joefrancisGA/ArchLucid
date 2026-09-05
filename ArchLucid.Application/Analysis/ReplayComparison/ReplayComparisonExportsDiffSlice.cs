using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <inheritdoc cref="IReplayComparisonDiffSlice" />
public sealed class ReplayComparisonExportsDiffSlice(IExportRecordDiffService exportRecordDiffService) : IReplayComparisonDiffSlice
{
    private readonly IExportRecordDiffService _exportRecordDiffService =
        exportRecordDiffService ?? throw new ArgumentNullException(nameof(exportRecordDiffService));

    public async Task ApplyAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        Dictionary<string, List<RunExportRecord>> leftByKey = GroupExportsByPairingKey(context.LeftExports);
        Dictionary<string, List<RunExportRecord>> rightByKey = GroupExportsByPairingKey(context.RightExports);

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
                    context.Report.ExportDiffs.Add(
                        await _exportRecordDiffService.CompareAsync(
                            leftRecords[index],
                            rightRecords[index],
                            cancellationToken));
                    continue;
                }

                if (!hasLeft)
                {
                    context.Report.Warnings.Add($"Export {exportLabel} exists on the right run but not the left.");
                    continue;
                }

                context.Report.Warnings.Add($"Export {exportLabel} exists on the left run but not the right.");
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
        string compareRunId = record.CompareRunId?.Trim() ?? string.Empty;
        string compareManifestVersion = record.CompareManifestVersion?.Trim() ?? string.Empty;

        return $"{exportType}|{templateProfile}|{format}|{compareRunId}|{compareManifestVersion}";
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

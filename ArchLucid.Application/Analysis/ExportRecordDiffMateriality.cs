namespace ArchLucid.Application.Analysis;

/// <summary>
///     Shared materiality checks for <see cref="ExportRecordDiffResult" /> used by end-to-end comparison persist/rehydrate.
/// </summary>
internal static class ExportRecordDiffMateriality
{
    internal static bool HasMaterialChanges(ExportRecordDiffResult diff)
    {
        ArgumentNullException.ThrowIfNull(diff);

        ExportRecordRequestDiff requestDiff = diff.RequestDiff;

        return diff.ChangedTopLevelFields.Count > 0
               || diff.Warnings.Count > 0
               || requestDiff.ChangedFlags.Count > 0
               || requestDiff.ChangedValues.Count > 0
               || HasMaterialRequest(requestDiff.LeftRequest)
               || HasMaterialRequest(requestDiff.RightRequest);
    }

    private static bool HasMaterialRequest(PersistedAnalysisExportRequest? request) =>
        request is not null && !PersistedAnalysisExportRequestMetadata.IsPersistedEmptyShell(request);

    internal static void DedupeByExportRecordIdPairKeepFirstInPlace(List<ExportRecordDiffResult> exportDiffs)
    {
        if (exportDiffs.Count < 2)
            return;

        HashSet<(string Left, string Right)> seen = new();
        List<ExportRecordDiffResult> distinct = [];

        foreach (ExportRecordDiffResult diff in exportDiffs)
        {
            (string Left, string Right) key = (diff.LeftExportRecordId, diff.RightExportRecordId);

            if (key.Left.Length == 0 && key.Right.Length == 0)
            {
                distinct.Add(diff);
                continue;
            }

            if (!seen.Add(key))
                continue;

            distinct.Add(diff);
        }

        if (distinct.Count == exportDiffs.Count)
            return;

        exportDiffs.Clear();
        exportDiffs.AddRange(distinct);
    }
}

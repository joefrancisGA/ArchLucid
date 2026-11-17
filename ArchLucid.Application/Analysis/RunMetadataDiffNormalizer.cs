namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes run-metadata diff sections on end-to-end comparison payloads before persist and rehydrate.
/// </summary>
internal static class RunMetadataDiffNormalizer
{
    private static readonly HashSet<string> KnownChangedFieldNames = new(StringComparer.Ordinal)
    {
        "RequestId",
        "Status",
        "CurrentManifestVersion",
        "CompletedUtc",
        "StructuralExecutionMode",
        "ModelAliasId",
    };

    internal static void NormalizeInPlace(RunMetadataDiffResult runDiff)
    {
        ArgumentNullException.ThrowIfNull(runDiff);

        ComparisonPersistedStringListNormalizer.NormalizeInPlace(runDiff.ChangedFields);
        RemoveUnknownChangedFieldNamesInPlace(runDiff.ChangedFields);

        if (runDiff.ChangedFields.Count == 0)
        {
            ClearDiffFlagsInPlace(runDiff);
            return;
        }

        SyncDiffFlagsFromChangedFieldsInPlace(runDiff);
    }

    private static void ClearDiffFlagsInPlace(RunMetadataDiffResult runDiff)
    {
        runDiff.RequestIdsDiffer = false;
        runDiff.ManifestVersionsDiffer = false;
        runDiff.StatusDiffers = false;
        runDiff.CompletionStateDiffers = false;
        runDiff.ExecutionModesDiffer = false;
        runDiff.ModelAliasIdsDiffer = false;
    }

    private static void SyncDiffFlagsFromChangedFieldsInPlace(RunMetadataDiffResult runDiff)
    {
        IReadOnlyList<string> changedFields = runDiff.ChangedFields;

        runDiff.RequestIdsDiffer = changedFields.Contains("RequestId");
        runDiff.ManifestVersionsDiffer = changedFields.Contains("CurrentManifestVersion");
        runDiff.StatusDiffers = changedFields.Contains("Status");
        runDiff.CompletionStateDiffers = changedFields.Contains("CompletedUtc");
        runDiff.ExecutionModesDiffer = changedFields.Contains("StructuralExecutionMode");
        runDiff.ModelAliasIdsDiffer = changedFields.Contains("ModelAliasId");

        if (runDiff.ExecutionModesDiffer)
            runDiff.SharedNonRealExecutionMode = false;
    }

    private static void RemoveUnknownChangedFieldNamesInPlace(List<string> changedFields)
    {
        for (int i = changedFields.Count - 1; i >= 0; i--)
        {
            if (!KnownChangedFieldNames.Contains(changedFields[i]))
                changedFields.RemoveAt(i);
        }
    }
}

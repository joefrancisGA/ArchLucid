namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes run-metadata diff sections on end-to-end comparison payloads before persist and rehydrate.
/// </summary>
internal static class RunMetadataDiffNormalizer
{
    internal static void NormalizeInPlace(RunMetadataDiffResult runDiff)
    {
        ArgumentNullException.ThrowIfNull(runDiff);

        ComparisonPersistedStringListNormalizer.NormalizeInPlace(runDiff.ChangedFields);

        if (runDiff.ChangedFields.Count > 0)
            return;

        runDiff.RequestIdsDiffer = false;
        runDiff.ManifestVersionsDiffer = false;
        runDiff.StatusDiffers = false;
        runDiff.CompletionStateDiffers = false;
        runDiff.ExecutionModesDiffer = false;
        runDiff.SharedNonRealExecutionMode = false;
        runDiff.ModelAliasIdsDiffer = false;
    }
}

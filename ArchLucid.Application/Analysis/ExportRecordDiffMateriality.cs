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
}

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Trims optional string metadata on persisted analysis export requests at record and rehydrate boundaries.
/// </summary>
internal static class PersistedAnalysisExportRequestMetadata
{
    internal static void TrimOptionalStrings(PersistedAnalysisExportRequest? request)
    {
        if (request is null)
            return;

        request.CompareRunId = request.CompareRunId?.Trim();
        request.CompareManifestVersion = request.CompareManifestVersion?.Trim();
        request.TemplateProfile = request.TemplateProfile?.Trim();
        request.Audience = request.Audience?.Trim();
        request.ReviewBoardWhitelabelFirmDisplayName = request.ReviewBoardWhitelabelFirmDisplayName?.Trim();
        request.ReviewBoardWhitelabelClientEngagementTitle = request.ReviewBoardWhitelabelClientEngagementTitle?.Trim();
        request.ReviewBoardWhitelabelLogoBlobReference = request.ReviewBoardWhitelabelLogoBlobReference?.Trim();
        request.ReviewBoardWhitelabelFooterAttribution = request.ReviewBoardWhitelabelFooterAttribution?.Trim();
    }
}

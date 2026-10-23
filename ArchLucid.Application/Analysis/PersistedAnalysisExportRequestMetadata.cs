namespace ArchLucid.Application.Analysis;

/// <summary>
///     Trims optional string metadata on persisted analysis export requests at record and rehydrate boundaries.
/// </summary>
internal static class PersistedAnalysisExportRequestMetadata
{
    internal static string? NormalizeOptionalString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }

    internal static void TrimOptionalStrings(PersistedAnalysisExportRequest? request)
    {
        if (request is null)
            return;

        request.CompareRunId = NormalizeOptionalString(request.CompareRunId);
        request.CompareManifestVersion = NormalizeOptionalString(request.CompareManifestVersion);
        request.TemplateProfile = NormalizeOptionalString(request.TemplateProfile);
        request.Audience = NormalizeOptionalString(request.Audience);
        request.ReviewBoardWhitelabelFirmDisplayName = NormalizeOptionalString(request.ReviewBoardWhitelabelFirmDisplayName);
        request.ReviewBoardWhitelabelClientEngagementTitle =
            NormalizeOptionalString(request.ReviewBoardWhitelabelClientEngagementTitle);
        request.ReviewBoardWhitelabelLogoBlobReference = NormalizeOptionalString(request.ReviewBoardWhitelabelLogoBlobReference);
        request.ReviewBoardWhitelabelFooterAttribution = NormalizeOptionalString(request.ReviewBoardWhitelabelFooterAttribution);
    }
}

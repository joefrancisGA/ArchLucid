using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Trims optional string metadata on persisted analysis export requests at record and rehydrate boundaries.
/// </summary>
internal static class PersistedAnalysisExportRequestMetadata
{
    internal static string? NormalizeOptionalString(string? value) =>
        OptionalExportMetadataStringNormalizer.NormalizeOptionalString(value);

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

    internal static bool IsPersistedEmptyShell(PersistedAnalysisExportRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.TemplateProfile is null
               && request.Audience is null
               && !request.ExternalDelivery
               && !request.ExecutiveFriendly
               && !request.RegulatedEnvironment
               && !request.NeedDetailedEvidence
               && !request.NeedExecutionTraces
               && !request.NeedDeterminismOrCompareAppendices
               && !request.IncludeEvidence
               && !request.IncludeExecutionTraces
               && !request.IncludeManifest
               && !request.IncludeDiagram
               && !request.IncludeSummary
               && !request.IncludeDeterminismCheck
               && request.DeterminismIterations == 0
               && !request.IncludeManifestCompare
               && request.CompareManifestVersion is null
               && !request.IncludeAgentResultCompare
               && request.CompareRunId is null
               && request.ReviewBoardWhitelabelFirmDisplayName is null
               && request.ReviewBoardWhitelabelClientEngagementTitle is null
               && request.ReviewBoardWhitelabelLogoBlobReference is null
               && request.ReviewBoardWhitelabelFooterAttribution is null;
    }
}

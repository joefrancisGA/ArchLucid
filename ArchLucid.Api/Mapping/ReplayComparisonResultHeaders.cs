using ArchLucid.Api.Http;
using ArchLucid.Application.Analysis;

namespace ArchLucid.Api.Mapping;

internal static class ReplayComparisonResultHeaders
{
    /// <summary>Headers returned with full replay artifact responses.</summary>
    public static void ApplyFull(HttpResponse response, ReplayComparisonResult result)
    {
        response.Headers[ArchLucidHttpHeaders.ComparisonRecordId] = result.ComparisonRecordId;
        response.Headers[ArchLucidHttpHeaders.ComparisonType] = result.ComparisonType;
        response.Headers[ArchLucidHttpHeaders.ReplayMode] = result.ReplayMode;
        response.Headers[ArchLucidHttpHeaders.VerificationPassed] = result.VerificationPassed.ToString();
        if (result.VerificationMessage is { } msg)
            response.Headers[ArchLucidHttpHeaders.VerificationMessage] = msg;
        ApplyOptionalIdentifiers(response, result);
    }

    /// <summary>Subset of headers for metadata-only replay responses.</summary>
    public static void ApplyMetadata(HttpResponse response, ReplayComparisonResult result)
    {
        ApplyOptionalIdentifiers(response, result);
    }

    private static void ApplyOptionalIdentifiers(HttpResponse response, ReplayComparisonResult result)
    {
        if (result.LeftRunId is { } leftRunId)
            response.Headers[ArchLucidHttpHeaders.LeftRunId] = leftRunId;
        if (result.RightRunId is { } rightRunId)
            response.Headers[ArchLucidHttpHeaders.RightRunId] = rightRunId;
        if (result.LeftExportRecordId is { } leftExportId)
            response.Headers[ArchLucidHttpHeaders.LeftExportRecordId] = leftExportId;
        if (result.RightExportRecordId is { } rightExportId)
            response.Headers[ArchLucidHttpHeaders.RightExportRecordId] = rightExportId;
        if (result.CreatedUtc is { } createdUtc)
            response.Headers[ArchLucidHttpHeaders.CreatedUtc] = createdUtc.ToString("O");
        if (result.FormatProfile is { } formatProfile)
            response.Headers[ArchLucidHttpHeaders.FormatProfile] = formatProfile;
        if (result.PersistedReplayRecordId is { } persistedId)
            response.Headers[ArchLucidHttpHeaders.PersistedReplayRecordId] = persistedId;
    }
}

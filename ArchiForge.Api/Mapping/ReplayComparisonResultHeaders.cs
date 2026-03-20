using ArchiForge.Application.Analysis;

namespace ArchiForge.Api.Mapping;

internal static class ReplayComparisonResultHeaders
{
    /// <summary>Headers returned with full replay artifact responses.</summary>
    public static void ApplyFull(HttpResponse response, ReplayComparisonResult result)
    {
        response.Headers["X-ArchiForge-ComparisonRecordId"] = result.ComparisonRecordId;
        response.Headers["X-ArchiForge-ComparisonType"] = result.ComparisonType;
        response.Headers["X-ArchiForge-ReplayMode"] = result.ReplayMode;
        response.Headers["X-ArchiForge-VerificationPassed"] = result.VerificationPassed.ToString();
        if (result.VerificationMessage is { } msg)
            response.Headers["X-ArchiForge-VerificationMessage"] = msg;
        ApplyOptionalIdentifiers(response, result);
    }

    /// <summary>Subset of headers for metadata-only replay responses.</summary>
    public static void ApplyMetadata(HttpResponse response, ReplayComparisonResult result) =>
        ApplyOptionalIdentifiers(response, result);

    private static void ApplyOptionalIdentifiers(HttpResponse response, ReplayComparisonResult result)
    {
        if (result.LeftRunId is { } leftRunId)
            response.Headers["X-ArchiForge-LeftRunId"] = leftRunId;
        if (result.RightRunId is { } rightRunId)
            response.Headers["X-ArchiForge-RightRunId"] = rightRunId;
        if (result.LeftExportRecordId is { } leftExportId)
            response.Headers["X-ArchiForge-LeftExportRecordId"] = leftExportId;
        if (result.RightExportRecordId is { } rightExportId)
            response.Headers["X-ArchiForge-RightExportRecordId"] = rightExportId;
        if (result.CreatedUtc is { } createdUtc)
            response.Headers["X-ArchiForge-CreatedUtc"] = createdUtc.ToString("O");
        if (result.FormatProfile is { } formatProfile)
            response.Headers["X-ArchiForge-Format-Profile"] = formatProfile;
        if (result.PersistedReplayRecordId is { } persistedId)
            response.Headers["X-ArchiForge-PersistedReplayRecordId"] = persistedId;
    }
}

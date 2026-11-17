using ArchLucid.Application.AzureExtractor;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Stable 202 body for extractor upload. <c>snapshotId</c> is null when ingest stored the ZIP
///     but did not create an inventory snapshot header.
/// </summary>
public static class AzureExtractorUploadAcceptedBody
{
    public static object Create(AzureExtractorIngestResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new
        {
            packageId = result.PackageId,
            snapshotId = result.SnapshotId,
        };
    }
}

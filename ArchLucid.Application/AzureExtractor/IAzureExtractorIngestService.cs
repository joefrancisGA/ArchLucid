using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.AzureExtractor;

public interface IAzureExtractorIngestService
{
    Task<AzureExtractorIngestResult> IngestZipAsync(IFormFile? file, Guid? runId, CancellationToken ct, string? correlationId = null);

    /// <param name="maxAcceptedZipBytes">
    ///     Upper bound on <paramref name="zipBytes" /> length (multipart ingest uses <see cref="AzureExtractorUploadLimits.MaxZipBytes" />;
    ///     chunked assembly uses configured <c>AzureExtractorChunkUpload:MaxAssembledZipBytes</c>).
    /// </param>
    Task<AzureExtractorIngestResult> IngestZipBytesAsync(
        byte[] zipBytes,
        string originalFileName,
        Guid? runId,
        CancellationToken ct,
        string? correlationId,
        long maxAcceptedZipBytes);
}

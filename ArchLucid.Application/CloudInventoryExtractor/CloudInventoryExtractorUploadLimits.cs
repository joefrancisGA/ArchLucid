namespace ArchLucid.Application.CloudInventoryExtractor;

/// <summary>Multipart and payload bounds for AWS/GCP inventory ingest.</summary>
public static class CloudInventoryExtractorUploadLimits
{
    public const long MaxZipBytes = 200L * 1024 * 1024;

    public const long MultipartEnvelopeBudgetBytes = MaxZipBytes + 256L * 1024;

    /// <summary>
    ///     Single-request chunk payload bound; align with <c>AzureExtractorChunkUpload:MaxChunkUploadBytes</c> configuration defaults.
    /// </summary>
    public const long DefaultMaxChunkUploadBodyBytes = 8L * 1024 * 1024;

    /// <summary>Small multipart / framing slack above each raw chunk body.</summary>
    public const long ChunkUploadHttpEnvelopeBudgetBytes = DefaultMaxChunkUploadBodyBytes + 256L * 1024;
}

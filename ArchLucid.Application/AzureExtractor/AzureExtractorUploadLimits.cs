namespace ArchLucid.Application.AzureExtractor;

/// <summary>Multipart and payload bounds for extractor ingest.</summary>
public static class AzureExtractorUploadLimits
{
    public const long MaxZipBytes = 52L * 1024 * 1024;

    public const long MultipartEnvelopeBudgetBytes = MaxZipBytes + 256L * 1024;

    /// <summary>
    ///     Single-request chunk payload bound; align with <c>AzureExtractorChunkUpload:MaxChunkUploadBytes</c> configuration defaults.
    /// </summary>
    public const long DefaultMaxChunkUploadBodyBytes = 8L * 1024 * 1024;

    /// <summary>Small multipart / framing slack above each raw chunk body.</summary>
    public const long ChunkUploadHttpEnvelopeBudgetBytes = DefaultMaxChunkUploadBodyBytes + 256L * 1024;
}

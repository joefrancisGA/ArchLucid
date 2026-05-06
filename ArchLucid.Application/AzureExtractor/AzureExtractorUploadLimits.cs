namespace ArchLucid.Application.AzureExtractor;

/// <summary>Multipart and payload bounds for extractor ingest.</summary>
public static class AzureExtractorUploadLimits
{
    public const long MaxZipBytes = 52L * 1024 * 1024;

    public const long MultipartEnvelopeBudgetBytes = MaxZipBytes + 256L * 1024;

}

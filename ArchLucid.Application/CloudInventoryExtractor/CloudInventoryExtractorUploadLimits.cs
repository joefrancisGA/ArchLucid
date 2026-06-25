namespace ArchLucid.Application.CloudInventoryExtractor;

/// <summary>Multipart and payload bounds for AWS/GCP inventory ingest.</summary>
public static class CloudInventoryExtractorUploadLimits
{
    public const long MaxZipBytes = 200L * 1024 * 1024;

    public const long MultipartEnvelopeBudgetBytes = MaxZipBytes + 256L * 1024;
}

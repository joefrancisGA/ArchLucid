namespace ArchLucid.Core.Configuration;

/// <summary>
/// Configuration options for bulk evidence uploads.
/// </summary>
public sealed class EvidenceBulkUploadOptions
{
    public const string SectionName = "ArchLucid";
    public const string MaxFilesKey = SectionName + ":EvidenceBulkUploadMaxFiles";

    /// <summary>
    /// Maximum allowed number of files in a bulk evidence upload.
    /// </summary>
    public int EvidenceBulkUploadMaxFiles { get; set; } = 30;

    /// <summary>Files processed per request when <c>paginationToken</c> batching is used.</summary>
    public int EvidenceBulkUploadBatchSize { get; set; } = 10;

    /// <summary>Maximum total declared bytes per multipart request (HTTP 413 when exceeded).</summary>
    public long EvidenceBulkUploadMaxTotalBytes { get; set; } = 100L * 1024 * 1024;
}

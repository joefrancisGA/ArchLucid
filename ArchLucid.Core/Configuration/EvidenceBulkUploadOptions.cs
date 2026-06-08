namespace ArchLucid.Core.Configuration;

/// <summary>
/// Configuration options for bulk evidence uploads.
/// </summary>
public sealed class EvidenceBulkUploadOptions
{
    public const string SectionName = "ArchLucid";
    public const string MaxFilesKey = SectionName + ":EvidenceBulkUploadMaxFiles";

    /// <summary>
    /// ASP.NET <c>RequestFormLimits.ValueCountLimit</c> for bulk upload (files plus optional
    /// <c>paginationToken</c> and multipart overhead). Must stay well above
    /// <see cref="EvidenceBulkUploadMaxFiles" /> so limit-exceeded requests reach application validation.
    /// </summary>
    public const int FormValueCountLimit = 512;

    /// <summary>
    /// Maximum allowed number of files in a bulk evidence upload.
    /// ZIP archives count as one file each; the server expands them up to 1 000 entries.
    /// </summary>
    public int EvidenceBulkUploadMaxFiles { get; set; } = 200;

    /// <summary>Files processed per request when <c>paginationToken</c> batching is used.</summary>
    public int EvidenceBulkUploadBatchSize { get; set; } = 10;

    /// <summary>Maximum total declared bytes per multipart request (HTTP 413 when exceeded).</summary>
    public long EvidenceBulkUploadMaxTotalBytes { get; set; } = 100L * 1024 * 1024;
}

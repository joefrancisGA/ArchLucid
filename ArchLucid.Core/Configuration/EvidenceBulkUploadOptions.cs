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
}

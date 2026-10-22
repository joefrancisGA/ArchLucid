namespace ArchLucid.Persistence.AzureExtractorChunkUpload;

/// <summary>Staging configuration for multi-request Azure extractor ZIP uploads (bypasses single-request size limits).</summary>
public sealed class AzureExtractorChunkUploadOptions
{
    public const string SectionName = "AzureExtractorChunkUpload";

    public const string DefaultLocalStagingRelativeDirectory = "azure-extractor-chunk-upload";

    /// <summary>Azure Blob container for staged blocks when <see cref="BlobStore.ArtifactLargePayloadOptions.BlobProvider" /> is AzureBlob.</summary>
    public string AzureContainerName
    {
        get;
        set;
    } = "azure-extractor-chunk-upload";

    /// <summary>Maximum assembled ZIP size for chunked completion (defaults below SQL Server <c>VARBINARY(MAX)</c> practical limits).</summary>
    public long MaxAssembledZipBytes
    {
        get;
        set;
    } = 512L * 1024 * 1024;

    /// <summary>Logical subdirectory under the Local artifact root used when BlobProvider is Local.</summary>
    public string LocalStagingRelativeDirectory
    {
        get;
        set;
    } = DefaultLocalStagingRelativeDirectory;

    /// <summary>Maximum permitted HTTP body size for a single chunk (controller should align <see cref="RequestSizeLimitAttribute" />).</summary>
    public long MaxChunkUploadBytes
    {
        get;
        set;
    } = 8L * 1024 * 1024;

    /// <summary>Hard cap on chunk slots per session (protects block-list / filesystem fan-out).</summary>
    public int MaxChunksPerSession
    {
        get;
        set;
    } = 50_000;
}

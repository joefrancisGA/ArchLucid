using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.AzureExtractorChunkUpload;

/// <summary>Immutable inputs captured when a chunked extractor upload session is created.</summary>
public sealed class AzureExtractorChunkSessionDescriptor
{
    public AzureExtractorChunkSessionDescriptor(
        ScopeContext scope,
        string originalFileName,
        int totalChunks,
        long? declaredTotalBytes)
    {
        Scope = scope ?? throw new ArgumentNullException(nameof(scope));

        if (string.IsNullOrWhiteSpace(originalFileName))
            throw new ArgumentException("Original file name is required.", nameof(originalFileName));

        if (totalChunks < 1)
            throw new ArgumentOutOfRangeException(nameof(totalChunks), totalChunks, "Total chunks must be at least 1.");

        OriginalFileName = originalFileName.Trim();
        TotalChunks = totalChunks;
        DeclaredTotalBytes = declaredTotalBytes;
    }

    public ScopeContext Scope
    {
        get;
    }

    public string OriginalFileName
    {
        get;
    }

    public int TotalChunks
    {
        get;
    }

    public long? DeclaredTotalBytes
    {
        get;
    }
}

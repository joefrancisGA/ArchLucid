using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.AzureExtractorChunkUpload;

/// <summary>Serialized alongside staged ZIP chunks so completion validates tenant scope and chunk cardinality.</summary>
public sealed class AzureExtractorChunkSessionMetadata
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public string OriginalFileName
    {
        get;
        set;
    } = "";

    public int TotalChunks
    {
        get;
        set;
    }

    public long? DeclaredTotalBytes
    {
        get;
        set;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        set;
    }

    public static AzureExtractorChunkSessionMetadata FromDescriptor(
        AzureExtractorChunkSessionDescriptor descriptor,
        DateTimeOffset createdUtc)
    {
        ArgumentNullException.ThrowIfNull(descriptor);

        return new AzureExtractorChunkSessionMetadata
        {
            TenantId = descriptor.Scope.TenantId,
            WorkspaceId = descriptor.Scope.WorkspaceId,
            ProjectId = descriptor.Scope.ProjectId,
            OriginalFileName = descriptor.OriginalFileName,
            TotalChunks = descriptor.TotalChunks,
            DeclaredTotalBytes = descriptor.DeclaredTotalBytes,
            CreatedUtc = createdUtc,
        };
    }

    public void EnsureMatchesScope(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (TenantId != scope.TenantId || WorkspaceId != scope.WorkspaceId || ProjectId != scope.ProjectId)

            throw new InvalidOperationException("Chunk upload session scope does not match the current request scope.");
    }
}

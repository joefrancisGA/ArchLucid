namespace ArchLucid.KnowledgeGraph.Caching;

/// <summary>Invalidation payload published when an authority commit clears projection cache entries.</summary>
public sealed class GraphProjectionCacheInvalidationMessage
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

    public Guid RunId
    {
        get;
        set;
    }

    public Guid GraphSnapshotId
    {
        get;
        set;
    }
}

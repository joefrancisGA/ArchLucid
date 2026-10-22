namespace ArchLucid.KnowledgeGraph.Caching;

/// <summary>Redis pub/sub channel for cross-replica graph projection cache invalidation.</summary>
public static class GraphProjectionCacheInvalidationChannels
{
    public const string InvalidateChannel = "graph-proj-invalidate";
}

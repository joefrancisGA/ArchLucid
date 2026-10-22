using ArchLucid.Core.Scoping;

namespace ArchLucid.KnowledgeGraph.Caching;

/// <summary>Broadcasts graph projection invalidations to peer API replicas (Redis pub/sub when distributed).</summary>
public interface IGraphProjectionCacheInvalidationBroadcaster
{
    void PublishInvalidation(ScopeContext scope, Guid runId, Guid graphSnapshotId);
}

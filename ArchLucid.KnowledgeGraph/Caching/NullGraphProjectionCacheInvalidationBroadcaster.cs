using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Configuration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.KnowledgeGraph.Caching;

/// <summary>No-op broadcaster when projection cache is in-process only.</summary>
public sealed class NullGraphProjectionCacheInvalidationBroadcaster : IGraphProjectionCacheInvalidationBroadcaster
{
    public static NullGraphProjectionCacheInvalidationBroadcaster Instance { get; } = new();

    public void PublishInvalidation(ScopeContext scope, Guid runId, Guid graphSnapshotId)
    {
    }
}

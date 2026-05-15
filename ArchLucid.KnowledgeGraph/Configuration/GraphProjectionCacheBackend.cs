namespace ArchLucid.KnowledgeGraph.Configuration;

/// <summary>Backing store for <see cref="ArchLucid.KnowledgeGraph.Interfaces.IGraphSnapshotProjectionCache" /> read-through entries.</summary>
public enum GraphProjectionCacheBackend
{
    Memory = 0,

    Distributed = 1,
}

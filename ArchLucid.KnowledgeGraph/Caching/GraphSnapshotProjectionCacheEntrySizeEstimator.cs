using ArchLucid.KnowledgeGraph.Serialization;

namespace ArchLucid.KnowledgeGraph.Caching;

/// <summary>Approximates in-memory cache entry weight for hydrated graph snapshot projections.</summary>
public static class GraphSnapshotProjectionCacheEntrySizeEstimator
{
    /// <summary>Minimum size unit when <see cref="Microsoft.Extensions.Caching.Memory.MemoryCacheOptions.SizeLimit" /> is enabled.</summary>
    public const long MinimumEntrySize = 1;

    /// <summary>Estimates cache entry size from MessagePack projection bytes (same shape as distributed cache).</summary>
    public static long EstimateCacheEntrySize(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        long bytes = GraphSnapshotMessagePackSerialization.SerializeSnapshot(snapshot).LongLength;

        return Math.Max(MinimumEntrySize, bytes);
    }
}

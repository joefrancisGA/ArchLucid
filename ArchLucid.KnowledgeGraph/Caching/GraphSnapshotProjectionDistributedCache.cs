using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.KnowledgeGraph.Serialization;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace ArchLucid.KnowledgeGraph.Caching;

/// <summary><see cref="IDistributedCache" />-backed implementation of <see cref="IGraphSnapshotProjectionCache" />.</summary>
public sealed class GraphSnapshotProjectionDistributedCache(
    IDistributedCache distributedCache,
    IOptionsMonitor<KnowledgeGraphProjectionCacheOptions> optionsMonitor) : IGraphSnapshotProjectionCache
{
    private readonly IDistributedCache _distributedCache =
        distributedCache ?? throw new ArgumentNullException(nameof(distributedCache));

    private readonly IOptionsMonitor<KnowledgeGraphProjectionCacheOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <inheritdoc />
    public async Task<GraphSnapshot?> GetOrLoadAsync(
        ScopeContext scope,
        Guid runId,
        Guid graphSnapshotId,
        Func<CancellationToken, Task<GraphSnapshot?>> loadFromStore,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(loadFromStore);

        if (!_optionsMonitor.CurrentValue.Enabled)
            return await loadFromStore(cancellationToken);

        string key = GraphSnapshotProjectionCacheKeys.Projection(scope, runId, graphSnapshotId);

        byte[]? cached = await _distributedCache.GetAsync(key, cancellationToken);

        if (cached is { Length: > 0 })
        {
            GraphSnapshot? deserialized = GraphJsonSerialization.DeserializeSnapshot(cached);

            if (deserialized is not null)
                return deserialized;
        }

        GraphSnapshot? created = await loadFromStore(cancellationToken);

        if (created is null)
            return null;

        TimeSpan ttl = ResolveTtl();

        await _distributedCache.SetAsync(
            key,
            GraphJsonSerialization.SerializeSnapshotToUtf8Bytes(created),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl },
            cancellationToken);

        return created;
    }

    /// <inheritdoc />
    public void Invalidate(ScopeContext scope, Guid runId, Guid graphSnapshotId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string key = GraphSnapshotProjectionCacheKeys.Projection(scope, runId, graphSnapshotId);

        _distributedCache.Remove(key);
    }

    private TimeSpan ResolveTtl()
    {
        KnowledgeGraphProjectionCacheOptions options = _optionsMonitor.CurrentValue;
        int seconds = options.AbsoluteExpirationSeconds;

        if (seconds < 1)
            seconds = KnowledgeGraphProjectionCacheOptions.DefaultAbsoluteExpirationSeconds;

        int maxSeconds = options.MaxAbsoluteExpirationSeconds;

        if (maxSeconds < 1)
            maxSeconds = KnowledgeGraphProjectionCacheOptions.DefaultMaxAbsoluteExpirationSeconds;

        seconds = Math.Clamp(seconds, 1, maxSeconds);

        return TimeSpan.FromSeconds(seconds);
    }
}

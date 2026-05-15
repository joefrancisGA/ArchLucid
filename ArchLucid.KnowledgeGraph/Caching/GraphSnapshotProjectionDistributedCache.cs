using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Models;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace ArchLucid.KnowledgeGraph.Caching;

/// <summary><see cref="IDistributedCache" />-backed implementation of <see cref="IGraphSnapshotProjectionCache" />.</summary>
public sealed class GraphSnapshotProjectionDistributedCache(
    IDistributedCache distributedCache,
    IOptionsMonitor<KnowledgeGraphProjectionCacheOptions> optionsMonitor) : IGraphSnapshotProjectionCache
{
    private static readonly JsonSerializerOptions SerializerOptions = CreateSerializerOptions();

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
            GraphSnapshot? deserialized = Deserialize(cached);

            if (deserialized is not null)
                return deserialized;
        }

        GraphSnapshot? created = await loadFromStore(cancellationToken);

        if (created is null)
            return null;

        TimeSpan ttl = ResolveTtl();

        await _distributedCache.SetAsync(
            key,
            Serialize(created),
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
        int seconds = _optionsMonitor.CurrentValue.AbsoluteExpirationSeconds;

        if (seconds < 1)
            seconds = 300;

        seconds = Math.Clamp(seconds, 1, 86400);

        return TimeSpan.FromSeconds(seconds);
    }

    private static JsonSerializerOptions CreateSerializerOptions()
    {
        JsonSerializerOptions options = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = false,
        };

        return options;
    }

    private static byte[] Serialize(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        return JsonSerializer.SerializeToUtf8Bytes(snapshot, SerializerOptions);
    }

    private static GraphSnapshot? Deserialize(byte[] bytes)
    {
        try
        {
            return JsonSerializer.Deserialize<GraphSnapshot>(bytes, SerializerOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}

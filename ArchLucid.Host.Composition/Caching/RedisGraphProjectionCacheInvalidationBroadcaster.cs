using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Caching;
using ArchLucid.KnowledgeGraph.Configuration;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using StackExchange.Redis;

namespace ArchLucid.Host.Composition.Caching;

/// <summary>Publishes graph projection invalidations to Redis pub/sub for peer replicas.</summary>
public sealed class RedisGraphProjectionCacheInvalidationBroadcaster : IGraphProjectionCacheInvalidationBroadcaster
{
    private readonly IConnectionMultiplexer _multiplexer;
    private readonly ILogger<RedisGraphProjectionCacheInvalidationBroadcaster> _logger;

    public RedisGraphProjectionCacheInvalidationBroadcaster(
        IConnectionMultiplexer multiplexer,
        ILogger<RedisGraphProjectionCacheInvalidationBroadcaster> logger)
    {
        _multiplexer = multiplexer ?? throw new ArgumentNullException(nameof(multiplexer));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public void PublishInvalidation(ScopeContext scope, Guid runId, Guid graphSnapshotId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        GraphProjectionCacheInvalidationMessage message = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = runId,
            GraphSnapshotId = graphSnapshotId,
        };

        try
        {
            byte[] payload = GraphProjectionCacheInvalidationMessageSerializer.Serialize(message);

            _multiplexer.GetSubscriber().Publish(
                RedisChannel.Literal(GraphProjectionCacheInvalidationChannels.InvalidateChannel),
                payload);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to publish graph projection invalidation for RunId={RunId}",
                runId);
        }
    }
}

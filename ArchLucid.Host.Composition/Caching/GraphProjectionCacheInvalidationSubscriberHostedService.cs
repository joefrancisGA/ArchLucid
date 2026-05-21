using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Caching;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using StackExchange.Redis;

namespace ArchLucid.Host.Composition.Caching;

/// <summary>Subscribes to graph projection invalidations and evicts local distributed cache keys on peer commits.</summary>
public sealed class GraphProjectionCacheInvalidationSubscriberHostedService(
    IConnectionMultiplexer multiplexer,
    IDistributedCache distributedCache,
    ILogger<GraphProjectionCacheInvalidationSubscriberHostedService> logger) : BackgroundService
{
    private readonly IConnectionMultiplexer _multiplexer =
        multiplexer ?? throw new ArgumentNullException(nameof(multiplexer));

    private readonly IDistributedCache _distributedCache =
        distributedCache ?? throw new ArgumentNullException(nameof(distributedCache));

    private readonly ILogger<GraphProjectionCacheInvalidationSubscriberHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        ChannelMessageQueue queue = await _multiplexer
            .GetSubscriber()
            .SubscribeAsync(RedisChannel.Literal(GraphProjectionCacheInvalidationChannels.InvalidateChannel))
            .WaitAsync(stoppingToken);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                ChannelMessage message = await queue.ReadAsync(stoppingToken);

                if (message.Message.IsNullOrEmpty)
                    continue;

                GraphProjectionCacheInvalidationMessage? payload =
                    GraphProjectionCacheInvalidationMessageSerializer.Deserialize(message.Message!);

                if (payload is null)
                    continue;

                ScopeContext scope = new()
                {
                    TenantId = payload.TenantId,
                    WorkspaceId = payload.WorkspaceId,
                    ProjectId = payload.ProjectId,
                };
                string key = GraphSnapshotProjectionCacheKeys.Projection(scope, payload.RunId, payload.GraphSnapshotId);

                _distributedCache.Remove(key);

                _logger.LogDebug(
                    "Evicted graph projection cache key for RunId={RunId} via pub/sub",
                    payload.RunId);
            }
        }
        finally
        {
            await _multiplexer
                .GetSubscriber()
                .UnsubscribeAsync(RedisChannel.Literal(GraphProjectionCacheInvalidationChannels.InvalidateChannel))
                .WaitAsync(CancellationToken.None);
        }
    }
}

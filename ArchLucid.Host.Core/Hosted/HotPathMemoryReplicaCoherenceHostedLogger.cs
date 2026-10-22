using ArchLucid.Persistence.Coordination.Caching;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Logs once at startup when hot-path reads use in-process memory while the configured API replica count suggests a
///     multi-instance deployment (cache coherence risk without Redis).
/// </summary>
public sealed class HotPathMemoryReplicaCoherenceHostedLogger(
    IOptions<HotPathCacheOptions> options,
    ILogger<HotPathMemoryReplicaCoherenceHostedLogger> logger) : IHostedService
{
    private readonly IOptions<HotPathCacheOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<HotPathMemoryReplicaCoherenceHostedLogger> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public Task StartAsync(CancellationToken cancellationToken)
    {
        HotPathCacheOptions o = _options.Value;

        if (!o.Enabled)
            return Task.CompletedTask;

        string effective = HotPathCacheProviderResolver.ResolveEffectiveProvider(o);

        if (!string.Equals(effective, "Memory", StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        if (o.ExpectedApiReplicaCount <= 1)
            return Task.CompletedTask;

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning(
                "HotPathCache effective provider is Memory while HotPathCache:ExpectedApiReplicaCount={ReplicaCount}. "
                + "In-memory entries do not cohere across API replicas — set HotPathCache:Provider=Redis (or Auto with "
                + "HotPathCache:RedisConnectionString) for horizontally scaled deployments.",
                o.ExpectedApiReplicaCount);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

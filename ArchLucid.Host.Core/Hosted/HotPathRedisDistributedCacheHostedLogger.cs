using ArchLucid.Persistence.Coordination.Caching;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Logs once at startup when hot-path reads use HybridCache with Redis L2 (TB-580).
/// </summary>
public sealed class HotPathRedisDistributedCacheHostedLogger(
    IOptions<HotPathCacheOptions> options,
    ILogger<HotPathRedisDistributedCacheHostedLogger> logger) : IHostedService
{
    private readonly IOptions<HotPathCacheOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<HotPathRedisDistributedCacheHostedLogger> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public Task StartAsync(CancellationToken cancellationToken)
    {
        HotPathCacheOptions o = _options.Value;

        if (!o.Enabled)
            return Task.CompletedTask;

        string effective = HotPathCacheProviderResolver.ResolveEffectiveProvider(o);

        if (!string.Equals(effective, "Redis", StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation(
                "HotPathCache effective provider is Redis (HybridCache L1 + distributed L2). "
                + "ExpectedApiReplicaCount={ReplicaCount}.",
                o.ExpectedApiReplicaCount);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using StackExchange.Redis;

namespace ArchLucid.Host.Core.Health;

/// <summary>Readiness probe for distributed graph projection cache when Redis backs <see cref="Interfaces.IGraphSnapshotProjectionCache" />.</summary>
public sealed class RedisGraphProjectionHealthCheck(
    IConfiguration configuration,
    IOptionsMonitor<KnowledgeGraphProjectionCacheOptions> projectionOptions) : IHealthCheck
{
    public const string RegistrationName = "graph-projection-cache";

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        KnowledgeGraphProjectionCacheOptions options = projectionOptions.CurrentValue;

        if (options.Backend != GraphProjectionCacheBackend.Distributed)
            return HealthCheckResult.Healthy("Graph projection cache uses in-process memory (probe skipped).");

        string? connectionString = ResolveRedisConnectionString(configuration, options);

        if (string.IsNullOrWhiteSpace(connectionString))
            return HealthCheckResult.Degraded("Distributed graph projection cache is enabled but Redis is not configured.");

        IConnectionMultiplexer? multiplexer = null;

        try
        {
            ConfigurationOptions redisOptions = ConfigurationOptions.Parse(connectionString);
            redisOptions.AbortOnConnectFail = false;
            redisOptions.ConnectTimeout = 1500;
            redisOptions.SyncTimeout = 1500;

            multiplexer = await ConnectionMultiplexer
                .ConnectAsync(redisOptions)
                .WaitAsync(cancellationToken);

            TimeSpan latency = await multiplexer.GetDatabase().PingAsync().WaitAsync(cancellationToken);

            return HealthCheckResult.Healthy($"Graph projection Redis responded (ping {latency.TotalMilliseconds:F0} ms).");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Graph projection Redis probe failed.", ex);
        }
        finally
        {
            multiplexer?.Dispose();
        }
    }

    private static string? ResolveRedisConnectionString(
        IConfiguration configuration,
        KnowledgeGraphProjectionCacheOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.RedisConnectionString))
            return options.RedisConnectionString.Trim();

        string? hotPath = configuration["HotPathCache:RedisConnectionString"]?.Trim();

        if (!string.IsNullOrWhiteSpace(hotPath))
            return hotPath;

        return configuration["LlmCompletionCache:RedisConnectionString"]?.Trim();
    }
}

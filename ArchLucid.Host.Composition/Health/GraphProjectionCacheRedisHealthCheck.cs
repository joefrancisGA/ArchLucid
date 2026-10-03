using ArchLucid.Host.Composition.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

using StackExchange.Redis;

namespace ArchLucid.Host.Composition.Health;

/// <summary>
///     Readiness probe for distributed graph projection cache using the same Redis resolution as host composition
///     registration (shared <c>IDistributedCache</c> vs projection-specific connection strings).
/// </summary>
public sealed class GraphProjectionCacheRedisHealthCheck(IConfiguration configuration) : IHealthCheck
{
    public const string RegistrationName = "graph-projection-cache";

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        string? connectionString =
            RedisHealthProbeConnectionResolver.TryResolveGraphProjectionDistributedRedisConnectionString(configuration);

        if (connectionString is null)
            return HealthCheckResult.Healthy("Graph projection cache uses in-process memory (probe skipped).");

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
}

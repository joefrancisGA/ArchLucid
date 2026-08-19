using Microsoft.Extensions.Diagnostics.HealthChecks;

using StackExchange.Redis;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Lightweight Redis reachability probe. Registers with <c>failureStatus: Degraded</c> so optional cache outages
///     downgrade without failing strict readiness predicates that distinguish Unhealthy vs Degraded.
/// </summary>
public sealed class OptionalRedisConnectionHealthCheck(string connectionString) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(connectionString);

        if (string.IsNullOrWhiteSpace(connectionString))

            return HealthCheckResult.Degraded("Redis connection string is blank.");

        IConnectionMultiplexer? multiplexer = null;

        try
        {
            ConfigurationOptions redisOptions = ConfigurationOptions.Parse(connectionString);
            redisOptions.AbortOnConnectFail = false;

            // Bounded so `/health` stays responsive when Redis is down or unreachable.
            redisOptions.ConnectTimeout = 1500;
            redisOptions.SyncTimeout = 1500;

            multiplexer = await ConnectionMultiplexer
                .ConnectAsync(redisOptions)
                .WaitAsync(cancellationToken);

            cancellationToken.ThrowIfCancellationRequested();

            TimeSpan latency = await multiplexer.GetDatabase().PingAsync().WaitAsync(cancellationToken);

            return HealthCheckResult.Healthy($"Redis responded (ping {latency.TotalMilliseconds:F0} ms).");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Degraded("Redis probe failed.", ex);
        }
        finally
        {
            multiplexer?.Dispose();
        }
    }
}

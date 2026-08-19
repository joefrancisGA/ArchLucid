using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Probes <see cref="IDistributedCache" /> reachability via a short-lived round-trip (no connection strings in output).
/// </summary>
public sealed class DistributedCacheHealthCheck(IServiceProvider serviceProvider) : IHealthCheck
{
    private const string ProbeKeyPrefix = "archlucid:health:dist-cache-probe:";

    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(2);

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        IDistributedCache? cache = serviceProvider.GetService<IDistributedCache>();

        if (cache is null)

            return HealthyNotRegistered();

        string probeKey = ProbeKeyPrefix + Guid.NewGuid().ToString("N");
        byte[] payload = "ok"u8.ToArray();

        using CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        timeout.CancelAfter(ProbeTimeout);

        try
        {
            DistributedCacheEntryOptions options = new()
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30),
            };

            await cache.SetAsync(probeKey, payload, options, timeout.Token).ConfigureAwait(false);

            byte[]? roundTrip = await cache.GetAsync(probeKey, timeout.Token).ConfigureAwait(false);

            if (roundTrip is null || roundTrip.Length != payload.Length)

                return UnreachableRegistered("Distributed cache read did not round-trip the probe value.");

            await cache.RemoveAsync(probeKey, timeout.Token).ConfigureAwait(false);

            return ReachableRegistered();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Degraded(
                "Distributed cache probe failed.",
                ex,
                ReachableData(registered: true, reachable: false));
        }
    }

    private static HealthCheckResult HealthyNotRegistered() =>
        HealthCheckResult.Healthy(
            "IDistributedCache is not registered on this host.",
            ReachableData(registered: false, reachable: false));

    private static HealthCheckResult ReachableRegistered() =>
        HealthCheckResult.Healthy(
            "Distributed cache probe succeeded.",
            ReachableData(registered: true, reachable: true));

    private static HealthCheckResult UnreachableRegistered(string description) =>
        HealthCheckResult.Degraded(description, data: ReachableData(registered: true, reachable: false));

    private static IReadOnlyDictionary<string, object> ReachableData(bool registered, bool reachable) =>
        new Dictionary<string, object> { ["registered"] = registered, ["reachable"] = reachable, };
}

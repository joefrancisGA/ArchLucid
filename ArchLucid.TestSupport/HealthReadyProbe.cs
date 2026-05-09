using System.Net;

namespace ArchLucid.TestSupport;

/// <summary>
///     Polls <c>GET /health/ready</c> until HTTP 200. Combined API hosts register
///     <c>DataConsistencyHealthCheck</c>, which stays unhealthy until the first reconciliation pass records state; cold SQL
///     + leader election can also extend the window. Single-shot probes flake in CI.
/// </summary>
public static class HealthReadyProbe
{
    /// <summary>Waits for readiness OK or throws <see cref="InvalidOperationException" />.</summary>
    public static async Task EnsureReadyAsync(HttpClient client, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        int delayMs = 500;

        for (int attempt = 0; attempt < 60; attempt++)
        {
            using HttpResponseMessage response = await client.GetAsync("/health/ready", cancellationToken);

            if (response.StatusCode == HttpStatusCode.OK)
                return;

            if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
                response.EnsureSuccessStatusCode();

            await Task.Delay(delayMs, cancellationToken);
            delayMs = Math.Min(delayMs * 2, 8000);
        }

        throw new InvalidOperationException(
            "GET /health/ready did not return HTTP 200 within the probe budget (host warming, SQL, or readiness checks).");
    }
}

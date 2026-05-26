using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>Shared HTTP status mapping for <c>/health/ready</c> (Improvement #10).</summary>
public static class ArchLucidReadinessHealthCheckOptions
{
    /// <summary>Maps degraded readiness checks to HTTP 503 so load balancers stop routing traffic.</summary>
    public static IReadOnlyDictionary<HealthStatus, int> ReadyEndpointResultStatusCodes { get; } =
        new Dictionary<HealthStatus, int>
        {
            [HealthStatus.Healthy] = StatusCodes.Status200OK,
            [HealthStatus.Degraded] = StatusCodes.Status503ServiceUnavailable,
            [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable,
        };
}

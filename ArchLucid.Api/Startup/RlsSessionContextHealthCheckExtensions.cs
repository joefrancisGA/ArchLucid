using ArchLucid.Host.Core.Health;

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Api.Startup;

internal static class RlsSessionContextHealthCheckExtensions
{
    internal static IHealthChecksBuilder AddArchLucidRlsSessionContextInfrastructureProbe(
        this IHealthChecksBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        return builder.AddCheck<RlsSessionContextInfrastructureHealthCheck>(
            "rls_session_context_infrastructure",
            failureStatus: HealthStatus.Unhealthy,
            tags: [ReadinessTags.Ready]);
    }
}

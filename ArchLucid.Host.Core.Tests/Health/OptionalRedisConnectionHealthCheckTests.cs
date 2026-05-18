using System.Net;

using FluentAssertions;

using ArchLucid.Host.Core.Health;

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Tests.Health;

public sealed class OptionalRedisConnectionHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_reports_degraded_when_nothing_is_listening_locally()
    {
        TcpListener listener = new(IPAddress.Loopback, port: 0);

        listener.Start();

        int port = ((IPEndPoint)listener.LocalEndpoint).Port;

        listener.Stop();

        OptionalRedisConnectionHealthCheck check =
            new(
                $"{IPAddress.Loopback}:{port},abortConnect=false,connectTimeout=600,syncTimeout=600");

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Degraded);
    }
}

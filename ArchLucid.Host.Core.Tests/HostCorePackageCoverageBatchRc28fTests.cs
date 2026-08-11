using ArchLucid.Host.Core.Health;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Tests;

/// <summary>
///     RC28f package-coverage batch: process temp directory health probe.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatchRc28fTests
{
    [Fact]
    public async Task ProcessTempDirectoryHealthCheck_CheckHealthAsync_reports_writable_temp_directory()
    {
        ProcessTempDirectoryHealthCheck healthCheck = new();
        HealthCheckContext context = new()
        {
            Registration = new HealthCheckRegistration("temp", healthCheck, HealthStatus.Unhealthy, null),
        };

        HealthCheckResult result = await healthCheck.CheckHealthAsync(context, CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("writable");
    }
}

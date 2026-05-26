using ArchLucid.Host.Core.Health;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Tests.Health;

[Trait("Category", "Unit")]
public sealed class ArchLucidReadinessHealthCheckOptionsTests
{
    [Fact]
    public void ReadyEndpointResultStatusCodes_maps_degraded_to_503()
    {
        ArchLucidReadinessHealthCheckOptions.ReadyEndpointResultStatusCodes[HealthStatus.Degraded]
            .Should()
            .Be(StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    public void ReadyEndpointResultStatusCodes_maps_healthy_to_200()
    {
        ArchLucidReadinessHealthCheckOptions.ReadyEndpointResultStatusCodes[HealthStatus.Healthy]
            .Should()
            .Be(StatusCodes.Status200OK);
    }
}

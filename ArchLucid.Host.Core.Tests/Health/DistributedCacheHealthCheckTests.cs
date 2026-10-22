using ArchLucid.Host.Core.Health;

using FluentAssertions;

using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Tests.Health;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DistributedCacheHealthCheckTests
{
    [Fact]
    public async Task When_cache_not_registered_returns_healthy_with_registered_false()
    {
        await using ServiceProvider provider = new ServiceCollection().BuildServiceProvider();
        DistributedCacheHealthCheck check = new(provider);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Data["registered"].Should().Be(false);
        result.Data["reachable"].Should().Be(false);
    }

    [Fact]
    public async Task When_memory_cache_registered_round_trips_probe()
    {
        ServiceCollection services = new();
        services.AddDistributedMemoryCache();
        await using ServiceProvider provider = services.BuildServiceProvider();
        DistributedCacheHealthCheck check = new(provider);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Data["registered"].Should().Be(true);
        result.Data["reachable"].Should().Be(true);
    }
}

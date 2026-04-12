using System.Data.Common;

using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;
using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
/// Verifies <see cref="DualPersistenceConsistencyHealthCheck"/> classifies Healthy / Degraded from counts
/// and reports Unhealthy when SQL access fails.
/// </summary>
[Trait("Category", "Unit")]
public sealed class DualPersistenceConsistencyHealthCheckTests
{
    [Fact]
    public void Healthy_WhenCountsMatchWithinThreshold()
    {
        DualPersistenceConsistencyHealthCheckOptions options = new() { MaxAllowedDelta = 5, RecentWindowHours = 24 };

        HealthCheckResult result = DualPersistenceConsistencyHealthCheck.EvaluateCounts(100, 103, options);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Data.Should().NotBeNull();
        result.Data!["architectureRunCount"].Should().Be(100L);
        result.Data["runCount"].Should().Be(103L);
        result.Data["delta"].Should().Be(3L);
    }

    [Fact]
    public void Degraded_WhenDeltaExceedsThreshold_DataIncludesCounts()
    {
        DualPersistenceConsistencyHealthCheckOptions options = new() { MaxAllowedDelta = 5, RecentWindowHours = 24 };

        HealthCheckResult result = DualPersistenceConsistencyHealthCheck.EvaluateCounts(10, 20, options);

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Data.Should().NotBeNull();
        result.Data!["architectureRunCount"].Should().Be(10L);
        result.Data["runCount"].Should().Be(20L);
        result.Data["delta"].Should().Be(10L);
        result.Data["maxAllowedDelta"].Should().Be(5);
    }

    [Fact]
    public async Task Unhealthy_WhenOpenAsyncThrows()
    {
        Mock<DbConnection> mockConnection = new();
        mockConnection
            .Setup(c => c.OpenAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Simulated SQL connectivity failure"));

        Mock<IDbConnectionFactory> factory = new();
        factory.Setup(f => f.CreateConnection()).Returns(mockConnection.Object);

        DualPersistenceConsistencyHealthCheck sut = new(
            factory.Object,
            Options.Create(new DualPersistenceConsistencyHealthCheckOptions()));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("Dual persistence consistency query failed");
        result.Exception.Should().NotBeNull();
    }
}

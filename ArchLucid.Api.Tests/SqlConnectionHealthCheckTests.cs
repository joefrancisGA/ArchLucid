using ArchLucid.Api.Tests.Testing;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;
using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Verifies <see cref="SqlConnectionHealthCheck" /> reports Healthy, Degraded, or Unhealthy
///     depending on the exception type thrown by <see cref="IDbConnectionFactory" />.
/// </summary>
[Trait("Category", "Unit")]
public sealed class SqlConnectionHealthCheckTests
{
    [Fact]
    public async Task Healthy_WhenConnectionOpensSuccessfully()
    {
        Mock<IDbConnectionFactory> factory = CreateFactory(static _ => Task.FromResult<object?>(1));

        SqlConnectionHealthCheck sut = CreateSut(factory.Object);
        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("ms");
    }

    [Fact]
    public async Task Degraded_WhenSelectOneExceedsThreshold()
    {
        Mock<IDbConnectionFactory> factory = CreateFactory(async _ =>
        {
            await Task.Delay(50);
            return 1;
        });

        SqlConnectionHealthCheck sut = CreateSut(
            factory.Object,
            healthCheckOptions: new SqlConnectionHealthCheckOptions { DegradedThresholdMs = 1 });
        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("threshold");
    }

    [Fact]
    public async Task Healthy_WhenInMemoryStorage_SkipsDatabaseOpen()
    {
        Mock<IDbConnectionFactory> factory = new();
        factory.Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("should not open SQL"));

        SqlConnectionHealthCheck sut = CreateSut(
            factory.Object,
            archLucidOptions: new ArchLucidOptions { StorageProvider = "InMemory" });
        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description!.ToLowerInvariant().Should().Contain("inmemory");
    }

    [Fact]
    public async Task Degraded_WhenTimeoutExceptionThrown()
    {
        Mock<IDbConnectionFactory> factory = new();
        factory.Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TimeoutException("Connection timed out"));

        SqlConnectionHealthCheck sut = CreateSut(factory.Object);
        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("timed out");
    }

    [Fact]
    public async Task Unhealthy_WhenGenericExceptionThrown()
    {
        Mock<IDbConnectionFactory> factory = new();
        factory.Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Connection string missing"));

        SqlConnectionHealthCheck sut = CreateSut(factory.Object);
        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("failed");
    }

    private static Mock<IDbConnectionFactory> CreateFactory(Func<CancellationToken, Task<object?>> executeScalar)
    {
        Mock<IDbConnectionFactory> factory = new();
        factory
            .Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StubDbConnection(executeScalar));

        return factory;
    }

    private static SqlConnectionHealthCheck CreateSut(
        IDbConnectionFactory connectionFactory,
        ArchLucidOptions? archLucidOptions = null,
        SqlConnectionHealthCheckOptions? healthCheckOptions = null) =>
        new(
            connectionFactory,
            Options.Create(archLucidOptions ?? new ArchLucidOptions { StorageProvider = "Sql" }),
            Options.Create(healthCheckOptions ?? new SqlConnectionHealthCheckOptions()));
}

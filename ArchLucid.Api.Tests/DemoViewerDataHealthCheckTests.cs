using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Health;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Verifies <see cref="DemoViewerDataHealthCheck" /> only degrades readiness when the anonymous viewer is enabled and
///     no committed demo run is available.
/// </summary>
[Trait("Category", "Unit")]
public sealed class DemoViewerDataHealthCheckTests
{
    [Fact]
    public async Task Healthy_when_anonymous_viewer_disabled()
    {
        Mock<IDemoSeedRunResolver> resolver = new();
        DemoViewerDataHealthCheck sut = new(
            Options.Create(new DemoOptions { AnonymousViewer = new DemoAnonymousViewerOptions { Enabled = false } }),
            resolver.Object);

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("disabled");
        resolver.Verify(
            r => r.ResolveLatestCommittedDemoRunAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Degraded_when_anonymous_viewer_enabled_and_no_committed_demo_run_exists()
    {
        Mock<IDemoSeedRunResolver> resolver = new();
        resolver.Setup(r => r.ResolveLatestCommittedDemoRunAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        DemoViewerDataHealthCheck sut = new(
            Options.Create(new DemoOptions { AnonymousViewer = new DemoAnonymousViewerOptions { Enabled = true } }),
            resolver.Object);

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("no committed Contoso demo run");
    }

    [Fact]
    public async Task Healthy_when_anonymous_viewer_enabled_and_committed_demo_run_exists()
    {
        Mock<IDemoSeedRunResolver> resolver = new();
        resolver.Setup(r => r.ResolveLatestCommittedDemoRunAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = Guid.NewGuid() });
        DemoViewerDataHealthCheck sut = new(
            Options.Create(new DemoOptions { AnonymousViewer = new DemoAnonymousViewerOptions { Enabled = true } }),
            resolver.Object);

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("committed demo data");
    }
}

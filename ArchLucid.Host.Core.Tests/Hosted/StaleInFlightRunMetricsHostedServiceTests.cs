using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Coordination.Diagnostics;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

/// <summary>TB-958 — fleet-wide stale in-flight gauges publish without per-tenant Prom labels.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
[Trait("Backlog", "TB-958")]
public sealed class StaleInFlightRunMetricsHostedServiceTests
{
    [Fact]
    public async Task StartAsync_when_stale_runs_exist_publishes_fleet_gauges()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        StaleInFlightRunMetricsSnapshot snapshot = new()
        {
            StaleInFlightCount = 1,
            OldestStaleAgeSeconds = 4200,
            TriageSamples =
            [
                new StaleInFlightRunTriageSample
                {
                    TenantId = tenantId,
                    RunId = runId,
                    Status = "WaitingForResults",
                    AgeSeconds = 4200,
                },
            ],
        };

        Mock<IStaleInFlightRunMetricsReader> reader = new();
        reader
            .Setup(r => r.ReadSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        ServiceCollection services = [];
        services.AddSingleton(reader.Object);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        Mock<IOptionsMonitor<HostLeaderElectionOptions>> electionOpts = new();
        electionOpts.Setup(o => o.CurrentValue).Returns(new HostLeaderElectionOptions { Enabled = false });

        HostLeaderElectionCoordinator coordinator = new(
            electionOpts.Object,
            new NoOpHostLeaderLeaseRepository(),
            HostInstanceIdentifier.ForTests("host-core-stale-in-flight-tests"),
            NullLogger<HostLeaderElectionCoordinator>.Instance);

        StaleInFlightRunMetricsHostedService sut = new(
            scopeFactory,
            coordinator,
            NullLogger<StaleInFlightRunMetricsHostedService>.Instance);

        using CancellationTokenSource cts = new();
        await sut.StartAsync(cts.Token);
        await Task.Delay(300, CancellationToken.None);
        await cts.CancelAsync();
        await sut.StopAsync(CancellationToken.None);

        StaleInFlightRunGaugeValues gauges = ArchLucidInstrumentation.StaleInFlightRunGauges.Current;
        gauges.StaleInFlightCount.Should().Be(1);
        gauges.OldestStaleAgeSeconds.Should().Be(4200);

        reader.Verify(
            r => r.ReadSnapshotAsync(It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }
}

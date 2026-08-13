using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
public sealed class RunExecuteOwnershipShutdownReleaseHostedServiceTests
{
    [Fact]
    public async Task ApplicationStopping_releases_all_leases_held_by_instance()
    {
        CancellationTokenSource stopping = new();
        TestHostApplicationLifetime lifetime = new(stopping.Token);
        Mock<IRunExecuteOwnershipLeaseService> leaseService = new();
        leaseService
            .Setup(s => s.ReleaseAllHeldByThisInstanceAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        ServiceCollection services = new();
        services.AddScoped(_ => leaseService.Object);
        ServiceProvider provider = services.BuildServiceProvider();

        RunExecuteOwnershipShutdownReleaseHostedService sut = new(
            lifetime,
            new WorkerHostDrainGate(),
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<RunExecuteOwnershipShutdownReleaseHostedService>.Instance);

        await sut.StartAsync(CancellationToken.None);
        await stopping.CancelAsync();

        leaseService.Verify(
            s => s.ReleaseAllHeldByThisInstanceAsync(It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ApplicationStopping_sets_drain_gate_before_lease_release_when_both_services_registered()
    {
        CancellationTokenSource stopping = new();
        TestHostApplicationLifetime lifetime = new(stopping.Token);
        WorkerHostDrainGate drainGate = new();
        bool drainObservedBeforeRelease = false;

        Mock<IRunExecuteOwnershipLeaseService> leaseService = new();
        leaseService
            .Setup(s => s.ReleaseAllHeldByThisInstanceAsync(It.IsAny<CancellationToken>()))
            .Callback(() => drainObservedBeforeRelease = drainGate.IsDraining)
            .ReturnsAsync(0);

        ServiceCollection services = new();
        services.AddScoped(_ => leaseService.Object);
        ServiceProvider provider = services.BuildServiceProvider();

        WorkerHostDrainHostedService drainService = new(
            lifetime,
            drainGate,
            NullLogger<WorkerHostDrainHostedService>.Instance);

        RunExecuteOwnershipShutdownReleaseHostedService releaseService = new(
            lifetime,
            drainGate,
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<RunExecuteOwnershipShutdownReleaseHostedService>.Instance);

        await drainService.StartAsync(CancellationToken.None);
        await releaseService.StartAsync(CancellationToken.None);
        await stopping.CancelAsync();

        drainGate.IsDraining.Should().BeTrue();
        drainObservedBeforeRelease.Should().BeTrue("drain must begin before lease release on ApplicationStopping");
    }

    private sealed class TestHostApplicationLifetime(CancellationToken stoppingToken) : IHostApplicationLifetime
    {
        public CancellationToken ApplicationStarted => CancellationToken.None;

        public CancellationToken ApplicationStopping => stoppingToken;

        public CancellationToken ApplicationStopped => CancellationToken.None;

        public void StopApplication()
        {
        }
    }
}

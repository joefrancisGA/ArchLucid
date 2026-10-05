using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Runs.ExecuteOwnership;

[Trait("Category", "Unit")]
public sealed class RunExecuteOwnershipLeaseServiceRenewTests
{
    [Fact]
    public async Task RenewAsync_calls_repository_acquire_or_renew_for_current_instance()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases);

        await sut.RenewAsync(runId, CancellationToken.None);

        leases.Verify(
            l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RenewAsync_throws_conflict_when_peer_holds_live_lease()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases);

        Func<Task> act = () => sut.RenewAsync(runId, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*another host instance may own this run*");
    }

    [Fact]
    public async Task BeginRenewalScope_when_disabled_completes_without_error()
    {
        DisabledRunExecuteOwnershipLeaseService sut = new();

        await using IAsyncDisposable scope = sut.BeginRenewalScope(Guid.NewGuid(), new CancellationTokenSource());

        await scope.DisposeAsync();
    }

    [Fact]
    public async Task RenewAsync_when_ownership_disabled_still_invokes_repository_on_sql_storage()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        RunExecuteOwnershipLeaseOptions options = new() { Enabled = true };
        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(() => options);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, optionsMonitor);

        options.Enabled = false;

        await sut.RenewAsync(runId, CancellationToken.None);

        leases.Verify(
            l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task BeginRenewalScope_when_ownership_disabled_after_acquire_still_performs_immediate_renewal()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        RunExecuteOwnershipLeaseOptions options = new()
        {
            Enabled = true,
            LeaseDurationSeconds = 900,
            HeartbeatRenewIntervalSeconds = 300,
        };
        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(() => options);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, optionsMonitor);

        await sut.AcquireAsync(runId, CancellationToken.None);
        options.Enabled = false;

        await using IAsyncDisposable scope = sut.BeginRenewalScope(runId, new CancellationTokenSource());

        await Task.Delay(100);

        leases.Verify(
            l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()),
            Times.AtLeast(2),
            "heartbeat must keep renewing SQL ownership after a runtime disable while the lease is still held");
    }

    private static RunExecuteOwnershipLeaseService CreateSut(
        Mock<IRunExecuteOwnershipLeaseRepository> leases,
        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>>? optionsMonitor = null)
    {
        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns("instance-a");

        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(false);

        if (optionsMonitor is null)
        {
            optionsMonitor = new Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>>();
            optionsMonitor.Setup(o => o.CurrentValue).Returns(new RunExecuteOwnershipLeaseOptions { Enabled = true });
        }

        return new RunExecuteOwnershipLeaseService(
            leases.Object,
            instance.Object,
            storage.Object,
            new WorkerHostDrainGate(),
            optionsMonitor.Object,
            NullLogger<RunExecuteOwnershipLeaseService>.Instance);
    }
}

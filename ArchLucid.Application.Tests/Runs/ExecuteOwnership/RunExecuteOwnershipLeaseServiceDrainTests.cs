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

/// <summary>TB-961 / TB-962: execute ownership admission and shutdown drain semantics.</summary>
[Trait("Category", "Unit")]
public sealed class RunExecuteOwnershipLeaseServiceDrainTests
{
    [Fact]
    public async Task AcquireAsync_when_drain_begins_during_repository_call_rolls_back_and_throws_conflict()
    {
        Guid runId = Guid.NewGuid();
        TaskCompletionSource<bool> acquireCompleted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .Returns(acquireCompleted.Task);
        leases
            .Setup(l => l.TryReleaseAsync(runId, "instance-a", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        WorkerHostDrainGate drainGate = new();
        RunExecuteOwnershipLeaseService sut = CreateSut(leases, drainGate);

        Task acquireTask = sut.AcquireAsync(runId, CancellationToken.None);

        drainGate.BeginDrain();
        acquireCompleted.SetResult(true);

        Func<Task> act = async () => await acquireTask;

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*draining*");

        leases.Verify(
            l => l.TryReleaseAsync(runId, "instance-a", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcquireAsync_when_host_is_draining_throws_conflict_without_claiming_lease()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        WorkerHostDrainGate drainGate = new();
        drainGate.BeginDrain();

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, drainGate);

        Func<Task> act = () => sut.AcquireAsync(runId, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*draining*");

        leases.Verify(
            l => l.TryAcquireOrRenewAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RenewAsync_when_host_is_draining_still_renews_in_flight_execute_lease()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        WorkerHostDrainGate drainGate = new();
        drainGate.BeginDrain();

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, drainGate);

        await sut.RenewAsync(runId, CancellationToken.None);

        leases.Verify(
            l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ReleaseAsync_when_ownership_disabled_still_invokes_repository_on_sql_storage()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryReleaseAsync(runId, "instance-a", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        RunExecuteOwnershipLeaseOptions options = new() { Enabled = true };
        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(() => options);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, new WorkerHostDrainGate(), optionsMonitor: optionsMonitor);

        options.Enabled = false;

        await sut.ReleaseAsync(runId, CancellationToken.None);

        leases.Verify(
            l => l.TryReleaseAsync(runId, "instance-a", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ReleaseAllHeldByThisInstanceAsync_when_ownership_disabled_still_invokes_repository_on_sql_storage()
    {
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.ReleaseAllHeldByInstanceAsync("instance-a", It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        RunExecuteOwnershipLeaseOptions options = new() { Enabled = true };
        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(() => options);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, new WorkerHostDrainGate(), optionsMonitor: optionsMonitor);

        options.Enabled = false;

        int released = await sut.ReleaseAllHeldByThisInstanceAsync(CancellationToken.None);

        released.Should().Be(1);
        leases.Verify(
            l => l.ReleaseAllHeldByInstanceAsync("instance-a", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ReleaseAllHeldByThisInstanceAsync_releases_all_leases_for_instance()
    {
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.ReleaseAllHeldByInstanceAsync("instance-a", It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns("instance-a");

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, new WorkerHostDrainGate(), instance);

        int released = await sut.ReleaseAllHeldByThisInstanceAsync(CancellationToken.None);

        released.Should().Be(2);
    }

    private static RunExecuteOwnershipLeaseService CreateSut(
        Mock<IRunExecuteOwnershipLeaseRepository> leases,
        IWorkerHostDrainGate drainGate,
        Mock<IHostProcessInstanceId>? instance = null,
        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>>? optionsMonitor = null)
    {
        instance ??= new Mock<IHostProcessInstanceId>();
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
            drainGate,
            optionsMonitor.Object,
            NullLogger<RunExecuteOwnershipLeaseService>.Instance);
    }
}

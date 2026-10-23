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
    public async Task AcquireAsync_when_drain_begins_after_acquire_rolls_back_sql_with_non_cancellable_release_when_caller_token_is_cancelled()
    {
        Guid runId = Guid.NewGuid();
        TaskCompletionSource<bool> acquireCompleted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .Returns(acquireCompleted.Task);
        CancellationToken releaseToken = default;
        leases
            .Setup(l => l.TryReleaseAsync(runId, "instance-a", It.IsAny<CancellationToken>()))
            .Callback<Guid, string, CancellationToken>((_, _, token) => releaseToken = token)
            .Returns<Guid, string, CancellationToken>((_, _, token) =>
            {
                if (token.IsCancellationRequested)
                    throw new OperationCanceledException(token);

                return Task.CompletedTask;
            });

        WorkerHostDrainGate drainGate = new();
        RunExecuteOwnershipLeaseService sut = CreateSut(leases, drainGate);

        using CancellationTokenSource callerCancellation = new();
        Task acquireTask = sut.AcquireAsync(runId, callerCancellation.Token);

        drainGate.BeginDrain();
        callerCancellation.Cancel();
        acquireCompleted.SetResult(true);

        Func<Task> act = async () => await acquireTask;

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*draining*");

        releaseToken.Should().Be(CancellationToken.None);
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
        RunExecuteOwnershipLeaseService sut = CreateSut(leases, drainGate);

        await sut.AcquireAsync(runId, CancellationToken.None);
        drainGate.BeginDrain();

        await sut.RenewAsync(runId, CancellationToken.None);

        leases.Verify(
            l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()),
            Times.Exactly(2));
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

    [Fact]
    public async Task ReleaseAllHeldByThisInstanceAsync_propagates_repository_exceptions()
    {
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.ReleaseAllHeldByInstanceAsync("instance-a", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("storage unavailable"));

        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns("instance-a");

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, new WorkerHostDrainGate(), instance);

        Func<Task> act = () => sut.ReleaseAllHeldByThisInstanceAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*storage unavailable*");
    }

    [Fact]
    public async Task ReleaseAllHeldByThisInstanceAsync_when_repository_throws_preserves_local_acquire_pin()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        leases
            .Setup(l => l.ReleaseAllHeldByInstanceAsync("instance-a", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("storage unavailable"));

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, new WorkerHostDrainGate());

        await sut.AcquireAsync(runId, CancellationToken.None);
        sut.IsLocallyHoldingExecuteOwnership(runId).Should().BeTrue();

        Func<Task> act = () => sut.ReleaseAllHeldByThisInstanceAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();

        sut.IsLocallyHoldingExecuteOwnership(runId).Should().BeTrue(
            "bulk drain must not clear local admission when repository release fails");
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
            NullLogger<RunExecuteOwnershipLeaseService>.Instance,
            new RunExecuteOwnershipActiveHolderRegistry());
    }
}

using System.Threading;

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
public sealed class RunExecuteOwnershipLeaseServiceAcquireTests
{
    [Fact]
    public async Task AcquireAsync_propagates_repository_exceptions_instead_of_mapping_to_peer_conflict()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated SQL timeout"));

        RunExecuteOwnershipLeaseService sut = CreateSut(leases);

        Func<Task> act = () => sut.AcquireAsync(runId, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("simulated SQL timeout");

        sut.IsLocallyHoldingExecuteOwnership(runId).Should().BeFalse(
            "repository failure after TryAdmit must roll back local admission");
    }

    [Fact]
    public async Task AcquireAsync_clears_local_admission_when_repository_reports_peer_conflict()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases);

        Func<Task> act = () => sut.AcquireAsync(runId, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already owned by another host instance*");

        sut.IsLocallyHoldingExecuteOwnership(runId).Should().BeFalse(
            "peer conflict after TryAdmit must roll back local admission in the acquire catch path");
    }

    [Fact]
    public async Task AcquireAsync_when_run_already_held_locally_throws_conflict_without_second_repository_claim()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases);

        await sut.AcquireAsync(runId, CancellationToken.None);

        Func<Task> secondAcquire = () => sut.AcquireAsync(runId, CancellationToken.None);

        await secondAcquire.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already in progress on this host instance*");

        leases.Verify(
            l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcquireAsync_when_concurrent_acquires_only_one_invokes_repository()
    {
        Guid runId = Guid.NewGuid();
        int repositoryCalls = 0;
        TaskCompletionSource releaseWinner = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                Interlocked.Increment(ref repositoryCalls);
                await releaseWinner.Task;

                return true;
            });

        RunExecuteOwnershipLeaseService sut = CreateSut(leases);

        Task winnerTask = Task.Run(() => sut.AcquireAsync(runId, CancellationToken.None));
        await Task.Delay(50);

        ConflictException? loserError = null;

        try
        {
            await Task.Run(() => sut.AcquireAsync(runId, CancellationToken.None));
        }
        catch (ConflictException ex)
        {
            loserError = ex;
        }

        loserError.Should().NotBeNull();
        loserError!.Message.Should().Contain("already in progress on this host instance");

        releaseWinner.TrySetResult();
        await winnerTask;

        repositoryCalls.Should().Be(1);

        leases.Verify(
            l => l.TryReleaseAsync(runId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "the losing acquire is rejected at local admission and never claims SQL");
    }

    [Fact]
    public async Task IsLocallyHoldingExecuteOwnership_is_false_when_acquire_no_ops_because_ownership_disabled()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new(MockBehavior.Strict);

        RunExecuteOwnershipLeaseOptions options = new() { Enabled = true };
        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(() => options);

        RunExecuteOwnershipLeaseService sut = CreateSut(leases, optionsMonitor);

        options.Enabled = false;

        await sut.AcquireAsync(runId, CancellationToken.None);

        sut.IsLocallyHoldingExecuteOwnership(runId).Should().BeFalse();
        leases.VerifyNoOtherCalls();
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
            NullLogger<RunExecuteOwnershipLeaseService>.Instance,
            new RunExecuteOwnershipActiveHolderRegistry());
    }
}

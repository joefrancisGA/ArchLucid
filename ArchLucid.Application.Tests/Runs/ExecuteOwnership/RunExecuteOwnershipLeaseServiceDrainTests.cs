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
        Mock<IHostProcessInstanceId>? instance = null)
    {
        instance ??= new Mock<IHostProcessInstanceId>();
        instance.Setup(i => i.Value).Returns("instance-a");

        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(false);

        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new RunExecuteOwnershipLeaseOptions { Enabled = true });

        return new RunExecuteOwnershipLeaseService(
            leases.Object,
            instance.Object,
            storage.Object,
            drainGate,
            options.Object,
            NullLogger<RunExecuteOwnershipLeaseService>.Instance);
    }
}

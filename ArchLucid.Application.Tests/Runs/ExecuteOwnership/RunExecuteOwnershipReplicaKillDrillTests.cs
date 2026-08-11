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

/// <summary>TB-962: replica-kill semantics without ACA — expired lease reconciles to honest terminal status.</summary>
[Trait("Category", "Unit")]
public sealed class RunExecuteOwnershipReplicaKillDrillTests
{
    [Fact]
    public async Task Acquire_conflict_when_live_lease_held_by_peer()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "peer", It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns("peer");

        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(false);

        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new RunExecuteOwnershipLeaseOptions { Enabled = true });

        RunExecuteOwnershipLeaseService sut = new(
            leases.Object,
            instance.Object,
            storage.Object,
            options.Object,
            NullLogger<RunExecuteOwnershipLeaseService>.Instance);

        Func<Task> act = () => sut.AcquireAsync(runId, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }
}

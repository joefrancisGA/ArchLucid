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

/// <summary>
/// Scoped lease services must share admission state. Otherwise two requests on one replica
/// both reach SQL with the same holder id and both are treated as renewals.
/// </summary>
[Trait("Category", "Unit")]
public sealed class RunExecuteOwnershipLeaseServiceSharedAdmissionTests
{
    [Fact]
    public async Task AcquireAsync_second_scope_sharing_registry_does_not_renew_sql_lease()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        RunExecuteOwnershipActiveHolderRegistry registry = new();
        RunExecuteOwnershipLeaseService first = CreateSut(leases, registry);
        RunExecuteOwnershipLeaseService second = CreateSut(leases, registry);

        await first.AcquireAsync(runId, CancellationToken.None);

        Func<Task> act = () => second.AcquireAsync(runId, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already in progress*");

        leases.Verify(
            l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static RunExecuteOwnershipLeaseService CreateSut(
        Mock<IRunExecuteOwnershipLeaseRepository> leases,
        RunExecuteOwnershipActiveHolderRegistry registry)
    {
        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns("instance-a");

        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(false);

        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new RunExecuteOwnershipLeaseOptions { Enabled = true });

        return new RunExecuteOwnershipLeaseService(
            leases.Object,
            instance.Object,
            storage.Object,
            new WorkerHostDrainGate(),
            options.Object,
            NullLogger<RunExecuteOwnershipLeaseService>.Instance,
            registry);
    }
}

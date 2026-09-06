using ArchLucid.Application.Runs.ExecuteOwnership;
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
    public async Task BeginRenewalScope_when_disabled_completes_without_error()
    {
        DisabledRunExecuteOwnershipLeaseService sut = new();

        await using IAsyncDisposable scope = sut.BeginRenewalScope(Guid.NewGuid(), CancellationToken.None);

        await scope.DisposeAsync();
    }

    private static RunExecuteOwnershipLeaseService CreateSut(Mock<IRunExecuteOwnershipLeaseRepository> leases)
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
            NullLogger<RunExecuteOwnershipLeaseService>.Instance);
    }
}

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
[Trait("Suite", "RunExecuteOwnership")]
public sealed class RunExecuteOwnershipLeaseRenewalScopeTests
{
    [Fact]
    public async Task BeginRenewalScope_cancels_linked_execute_token_when_renewal_loses_lease()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .SetupSequence(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);

        RunExecuteOwnershipLeaseService service = CreateService(leases);
        using CancellationTokenSource executeCts = new();

        await service.AcquireAsync(runId, CancellationToken.None);

        await using IAsyncDisposable scope = service.BeginRenewalScope(runId, executeCts);

        await WaitUntilAsync(() => executeCts.Token.IsCancellationRequested, TimeSpan.FromSeconds(5));

        executeCts.Token.IsCancellationRequested.Should().BeTrue(
            "losing execute ownership during heartbeat renew must cancel the in-flight execute batch");
    }

    private static async Task WaitUntilAsync(Func<bool> condition, TimeSpan timeout)
    {
        DateTimeOffset deadline = DateTimeOffset.UtcNow.Add(timeout);

        while (!condition())
        {
            if (DateTimeOffset.UtcNow >= deadline)
                break;

            await Task.Delay(50);
        }
    }

    private static RunExecuteOwnershipLeaseService CreateService(Mock<IRunExecuteOwnershipLeaseRepository> leases)
    {
        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns("instance-a");

        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(false);

        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new RunExecuteOwnershipLeaseOptions
        {
            Enabled = true,
            LeaseDurationSeconds = 900,
            HeartbeatRenewIntervalSeconds = 300,
        });

        return new RunExecuteOwnershipLeaseService(
            leases.Object,
            instance.Object,
            storage.Object,
            new WorkerHostDrainGate(),
            options.Object,
            NullLogger<RunExecuteOwnershipLeaseService>.Instance);
    }
}

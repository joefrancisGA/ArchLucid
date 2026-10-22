using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Coordination.Export;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunExportBlobPushOutboxHostedServiceTests
{
    [SkippableFact]
    public async Task ExecuteAsync_exits_cleanly_when_stopped_during_delay()
    {
        Mock<IRunExportBlobPushOutboxProcessor> processor = new();
        processor
            .Setup(p => p.ProcessPendingBatchAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        RunExportBlobPushOutboxHostedService sut = new(
            processor.Object,
            NullLogger<RunExportBlobPushOutboxHostedService>.Instance,
            HostLeaderElectionTestDoubles.CoordinatorWithElectionDisabled());

        using CancellationTokenSource cts = new();
        await sut.StartAsync(cts.Token);
        await Task.Delay(150, CancellationToken.None);
        await cts.CancelAsync();

        Func<Task> act = () => sut.StopAsync(CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}

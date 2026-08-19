using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Async;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunAsyncOperationAcceptorTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    [Fact]
    public async Task AcceptExecuteAsync_unknown_run_throws_not_found()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        ArchitectureRunAsyncOperationAcceptor sut = CreateSut(runs: runs);

        Func<Task> act = () => sut.AcceptExecuteAsync(
            runId.ToString("D"),
            DefaultScope,
            "actor",
            "corr",
            CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    [Fact]
    public async Task AcceptExecuteAsync_returns_run_operation_id_and_enqueues()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });
        Mock<IArchitectureRunAsyncOperationQueue> queue = new();
        ArchitectureRunAsyncOperationAcceptor sut = CreateSut(runs: runs, queue: queue);

        string operationId = await sut.AcceptExecuteAsync(
            runId.ToString("D"),
            DefaultScope,
            "actor",
            "corr",
            CancellationToken.None);

        operationId.Should().Be($"run:{runId:D}");
        queue.Verify(
            q => q.EnqueueAsync(It.IsAny<ArchitectureRunAsyncOperationWorkItem>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static ArchitectureRunAsyncOperationAcceptor CreateSut(
        Mock<IRunRepository>? runs = null,
        Mock<IArchitectureRunAsyncOperationQueue>? queue = null,
        Mock<IReplayRunService>? replay = null)
    {
        Mock<IRunRepository> runRepo = runs ?? new Mock<IRunRepository>();
        Mock<IArchitectureRunAsyncOperationQueue> operationQueue = queue ?? new Mock<IArchitectureRunAsyncOperationQueue>();
        Mock<IReplayRunService> replayService = replay ?? new Mock<IReplayRunService>();

        return new ArchitectureRunAsyncOperationAcceptor(
            runRepo.Object,
            operationQueue.Object,
            new ArchitectureRunAsyncOperationRegistrar(),
            replayService.Object);
    }
}

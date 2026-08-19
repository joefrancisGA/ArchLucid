using ArchLucid.Application.Common;
using ArchLucid.Application.Jobs;
using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Operations;

[Trait("Category", "Unit")]
public sealed class OperationCancelServiceTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    [Fact]
    public async Task RequestCancelAsync_unknown_operation_throws_not_found()
    {
        Mock<IOperationQueryService> query = new();
        query
            .Setup(q => q.GetAsync("run:missing", DefaultScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync((OperationDetail?)null);
        OperationCancelService sut = CreateSut(query: query);

        Func<Task> act = () => sut.RequestCancelAsync("run:missing", DefaultScope, CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    [Fact]
    public async Task RequestCancelAsync_terminal_operation_throws_conflict()
    {
        OperationDetail succeeded = new(
            OperationIdCodec.ForRun(Guid.NewGuid()),
            OperationState.Succeeded,
            "Done",
            null,
            null,
            TimeProvider.System.GetUtcNow(),
            null);
        Mock<IOperationQueryService> query = new();
        query
            .Setup(q => q.GetAsync(succeeded.OperationId, DefaultScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(succeeded);
        OperationCancelService sut = CreateSut(query: query);

        Func<Task> act = () => sut.RequestCancelAsync(succeeded.OperationId, DefaultScope, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RequestCancelAsync_running_operation_returns_cancel_requested()
    {
        Guid runId = Guid.NewGuid();
        string operationId = OperationIdCodec.ForRun(runId);
        OperationDetail running = new(
            operationId,
            OperationState.Running,
            "Running agents",
            1,
            3,
            TimeProvider.System.GetUtcNow(),
            new OperationResultRef(runId, null, null));
        OperationDetail cancelRequested = running with { State = OperationState.CancelRequested, StepLabel = "Cancel requested" };

        Mock<IOperationQueryService> query = new();
        query
            .SetupSequence(q => q.GetAsync(operationId, DefaultScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(running)
            .ReturnsAsync(cancelRequested);

        OperationCancelService sut = CreateSut(query: query);

        OperationDetail result = await sut.RequestCancelAsync(operationId, DefaultScope, CancellationToken.None);

        result.State.Should().Be(OperationState.CancelRequested);
    }

    private static OperationCancelService CreateSut(
        Mock<IOperationQueryService>? query = null,
        IOperationCancellationRegistry? registry = null)
    {
        Mock<IOperationQueryService> operationQuery = query ?? new Mock<IOperationQueryService>();
        IOperationCancellationRegistry cancellationRegistry = registry ?? new OperationCancellationRegistry();
        Mock<IRunRepository> runs = new();
        Mock<IBackgroundJobInfoReader> jobs = new();
        Mock<IBackgroundJobCancellationWriter> cancelWriter = new();
        Mock<IBackgroundJobTenantAccessVerifier> access = new();

        return new OperationCancelService(
            operationQuery.Object,
            cancellationRegistry,
            new OperationRunCancellationMarker(runs.Object),
            jobs.Object,
            cancelWriter.Object,
            access.Object);
    }
}

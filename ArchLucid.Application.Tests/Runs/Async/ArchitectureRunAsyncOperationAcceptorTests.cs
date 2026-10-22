using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.Orchestration.Execute.Hooks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
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

    [Fact]
    public async Task AcceptExecuteAsync_failed_run_marks_retrying_before_enqueue()
    {
        Guid runId = Guid.NewGuid();
        RunRecord header = new()
        {
            RunId = runId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            RetryCount = 0,
            CompletedUtc = TimeProvider.System.UtcNowDateTime()
        };
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        Mock<IArchitectureRunAsyncOperationQueue> queue = new();
        queue
            .Setup(q => q.EnqueueAsync(It.IsAny<ArchitectureRunAsyncOperationWorkItem>(), It.IsAny<CancellationToken>()))
            .Returns(ValueTask.CompletedTask);
        Mock<IArchitectureRunExecuteAuditHook> audit = new();
        ArchitectureRunAsyncOperationAcceptor sut = CreateSut(runs: runs, queue: queue, audit: audit);

        string operationId = await sut.AcceptExecuteAsync(
            runId.ToString("D"),
            DefaultScope,
            "actor",
            "corr",
            CancellationToken.None);

        operationId.Should().Be($"run:{runId:D}");
        header.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.Retrying));
        header.RetryCount.Should().Be(1);
        header.CompletedUtc.Should().BeNull();
        audit.Verify(
            a => a.LogFailedRunRetryRequestedAsync(
                It.Is<ArchitectureRun>(run => run.Status == ArchitectureRunStatus.Failed),
                runId.ToString("D"),
                "actor",
                It.IsAny<CancellationToken>()),
            Times.Once);
        queue.Verify(
            q => q.EnqueueAsync(It.IsAny<ArchitectureRunAsyncOperationWorkItem>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcceptCreateAsync_admits_then_enqueues_create_without_waiting_on_pipeline()
    {
        Guid runId = Guid.NewGuid();
        Mock<IArchitectureRunAsyncCreateAdmitter> admitter = new();
        admitter
            .Setup(a => a.AdmitAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                DefaultScope,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunAsyncCreateAdmitResult(runId, IdempotentReplay: false));
        Mock<IArchitectureRunAsyncOperationQueue> queue = new();
        ArchitectureRunAsyncOperationAcceptor sut = CreateSut(queue: queue, admitter: admitter);
        ArchitectureRequest request = new()
        {
            RequestId = "req-async-create",
            Description = "Fast admit should enqueue create work.",
            SystemName = "Sys",
            Environment = "prod"
        };

        string operationId = await sut.AcceptCreateAsync(
            request,
            null,
            DefaultScope,
            "actor",
            "corr",
            CancellationToken.None);

        operationId.Should().Be($"run:{runId:D}");
        queue.Verify(
            q => q.EnqueueAsync(
                It.Is<ArchitectureRunAsyncOperationWorkItem>(item =>
                    item.Kind == ArchitectureRunAsyncOperationKind.Create
                    && item.RunId == runId.ToString("N")
                    && item.CreateRequest == request),
                It.IsAny<CancellationToken>()),
            Times.Once);
        admitter.Verify(
            a => a.AdmitAsync(request, null, DefaultScope, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcceptCreateAsync_idempotent_replay_re_enqueues_when_stub_still_created()
    {
        Guid runId = Guid.NewGuid();
        Mock<IArchitectureRunAsyncCreateAdmitter> admitter = new();
        admitter
            .Setup(a => a.AdmitAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                DefaultScope,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunAsyncCreateAdmitResult(runId, IdempotentReplay: true));
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
            });
        Mock<IArchitectureRunAsyncOperationQueue> queue = new();
        ArchitectureRunAsyncOperationAcceptor sut = CreateSut(runs: runs, queue: queue, admitter: admitter);

        string operationId = await sut.AcceptCreateAsync(
            new ArchitectureRequest
            {
                RequestId = "req-replay-created",
                Description = "Same-key retry must re-enqueue incomplete admits.",
                SystemName = "Sys",
                Environment = "prod"
            },
            null,
            DefaultScope,
            "actor",
            "corr",
            CancellationToken.None);

        operationId.Should().Be($"run:{runId:D}");
        queue.Verify(
            q => q.EnqueueAsync(
                It.Is<ArchitectureRunAsyncOperationWorkItem>(item =>
                    item.Kind == ArchitectureRunAsyncOperationKind.Create
                    && item.RunId == runId.ToString("N")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcceptCreateAsync_idempotent_replay_skips_enqueue_when_create_completed()
    {
        Guid runId = Guid.NewGuid();
        Mock<IArchitectureRunAsyncCreateAdmitter> admitter = new();
        admitter
            .Setup(a => a.AdmitAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                DefaultScope,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunAsyncCreateAdmitResult(runId, IdempotentReplay: true));
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated)
            });
        Mock<IArchitectureRunAsyncOperationQueue> queue = new();
        ArchitectureRunAsyncOperationAcceptor sut = CreateSut(runs: runs, queue: queue, admitter: admitter);

        string operationId = await sut.AcceptCreateAsync(
            new ArchitectureRequest
            {
                RequestId = "req-replay-done",
                Description = "Completed create must not re-enqueue.",
                SystemName = "Sys",
                Environment = "prod"
            },
            null,
            DefaultScope,
            "actor",
            "corr",
            CancellationToken.None);

        operationId.Should().Be($"run:{runId:D}");
        queue.Verify(
            q => q.EnqueueAsync(It.IsAny<ArchitectureRunAsyncOperationWorkItem>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AcceptCreateAsync_idempotent_replay_skips_enqueue_when_create_already_in_flight()
    {
        Guid runId = Guid.NewGuid();
        Mock<IArchitectureRunAsyncCreateAdmitter> admitter = new();
        admitter
            .Setup(a => a.AdmitAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                DefaultScope,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunAsyncCreateAdmitResult(runId, IdempotentReplay: true));
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Created)
            });
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        registrar.TryRegister(DefaultScope, runId.ToString("N"), ArchitectureRunAsyncOperationKind.Create)
            .Should()
            .BeTrue();
        Mock<IArchitectureRunAsyncOperationQueue> queue = new();
        ArchitectureRunAsyncOperationAcceptor sut = CreateSut(
            runs: runs,
            queue: queue,
            admitter: admitter,
            registrar: registrar);

        string operationId = await sut.AcceptCreateAsync(
            new ArchitectureRequest
            {
                RequestId = "req-replay-inflight",
                Description = "In-flight create must not double-enqueue.",
                SystemName = "Sys",
                Environment = "prod"
            },
            null,
            DefaultScope,
            "actor",
            "corr",
            CancellationToken.None);

        operationId.Should().Be($"run:{runId:D}");
        queue.Verify(
            q => q.EnqueueAsync(It.IsAny<ArchitectureRunAsyncOperationWorkItem>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ArchitectureRunAsyncOperationAcceptor CreateSut(
        Mock<IRunRepository>? runs = null,
        Mock<IArchitectureRunAsyncOperationQueue>? queue = null,
        Mock<IReplayRunService>? replay = null,
        Mock<IArchitectureRunAsyncCreateAdmitter>? admitter = null,
        ArchitectureRunAsyncOperationRegistrar? registrar = null,
        Mock<IArchitectureRunExecuteAuditHook>? audit = null)
    {
        Mock<IRunRepository> runRepo = runs ?? new Mock<IRunRepository>();
        Mock<IArchitectureRunAsyncOperationQueue> operationQueue = queue ?? new Mock<IArchitectureRunAsyncOperationQueue>();
        Mock<IReplayRunService> replayService = replay ?? new Mock<IReplayRunService>();

        return new ArchitectureRunAsyncOperationAcceptor(
            runRepo.Object,
            operationQueue.Object,
            registrar ?? new ArchitectureRunAsyncOperationRegistrar(),
            replayService.Object,
            (admitter ?? new Mock<IArchitectureRunAsyncCreateAdmitter>()).Object,
            new FailedRunRetryAdmission(runRepo.Object),
            (audit ?? new Mock<IArchitectureRunExecuteAuditHook>()).Object);
    }
}

using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IncompleteAuthorityPipelineExecuteHandlerTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TryResumeAsync_returns_null_when_agent_tasks_already_exist()
    {
        IncompleteAuthorityPipelineExecuteHandler sut = CreateHandler(
            new Mock<IAuthorityRunOrchestrator>(MockBehavior.Strict).Object,
            new Mock<IArchitectureRequestRepository>(MockBehavior.Strict).Object,
            new Mock<IRunRepository>(MockBehavior.Strict).Object);

        ArchitectureRun run = CreateRun(ArchitectureRunStatus.Failed, taskIds: ["t1"]);

        ExecuteRunResult? result = await sut.TryResumeAsync(run, run.RunId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task TryResumeAsync_returns_null_when_context_snapshot_already_exists()
    {
        IncompleteAuthorityPipelineExecuteHandler sut = CreateHandler(
            new Mock<IAuthorityRunOrchestrator>(MockBehavior.Strict).Object,
            new Mock<IArchitectureRequestRepository>(MockBehavior.Strict).Object,
            new Mock<IRunRepository>(MockBehavior.Strict).Object);

        ArchitectureRun run = CreateRun(ArchitectureRunStatus.Failed);
        run.ContextSnapshotId = Guid.NewGuid().ToString("N");

        ExecuteRunResult? result = await sut.TryResumeAsync(run, run.RunId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task TryResumeAsync_when_failed_deferred_run_resumes_authority_pipeline_and_marks_retrying()
    {
        Guid runGuid = Guid.Parse("851472cf-81fa-4314-9679-1ab899ae8324");
        string runId = runGuid.ToString("N");
        const string requestId = "req-deferred-resume";

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "ArchLucid",
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Failed),
            LastFailureReason = """{"schemaVersion":1,"failureClass":"invalidOperation"}""",
            CompletedUtc = TimeProvider.System.UtcNowDateTime(),
            RetryCount = 0,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ArchitectureRequest request = new()
        {
            RequestId = requestId,
            SystemName = "ArchLucid",
            Description = new string('x', 12),
        };

        List<RunRecord> updates = [];
        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (row, _, _, _) => updates.Add(CloneStatus(row)))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        ContextIngestionRequest? capturedIngestion = null;
        Mock<IAuthorityRunOrchestrator> authority = new();
        authority
            .Setup(a => a.CompleteQueuedAuthorityPipelineAsync(
                It.IsAny<ContextIngestionRequest>(),
                It.IsAny<CancellationToken>()))
            .Callback<ContextIngestionRequest, CancellationToken>((ingestion, _) => capturedIngestion = ingestion)
            .ReturnsAsync(() => new RunRecord
            {
                RunId = runGuid,
                ProjectId = "ArchLucid",
                ContextSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            });

        IncompleteAuthorityPipelineExecuteHandler sut = CreateHandler(
            authority.Object,
            requestRepo.Object,
            runRepo.Object);

        ArchitectureRun run = CreateRun(ArchitectureRunStatus.Failed, runId, requestId);

        ExecuteRunResult? result = await sut.TryResumeAsync(run, runId);

        result.Should().NotBeNull();
        result!.RunId.Should().Be(runId);
        result.Results.Should().BeEmpty();
        capturedIngestion.Should().NotBeNull();
        capturedIngestion!.RunId.Should().Be(runGuid);
        capturedIngestion.ProjectId.Should().Be("ArchLucid");

        updates.Should().Contain(row => row.LegacyRunStatus == nameof(ArchitectureRunStatus.Retrying));
        updates.Should().NotContain(row => row.LegacyRunStatus == nameof(ArchitectureRunStatus.TasksGenerated));
        header.RetryCount.Should().Be(1);

        authority.Verify(
            a => a.CompleteQueuedAuthorityPipelineAsync(
                It.IsAny<ContextIngestionRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryResumeAsync_when_created_deferred_run_resumes_without_retrying_status()
    {
        Guid runGuid = Guid.Parse("851472cf-81fa-4314-9679-1ab899ae8324");
        string runId = runGuid.ToString("N");
        const string requestId = "req-created-resume";

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "ArchLucid",
            ArchitectureRequestId = requestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            RetryCount = 0,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        ArchitectureRequest request = new()
        {
            RequestId = requestId,
            SystemName = "ArchLucid",
            Description = new string('x', 12),
        };

        List<RunRecord> updates = [];
        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runRepo
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (row, _, _, _) => updates.Add(CloneStatus(row)))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IAuthorityRunOrchestrator> authority = new();
        authority
            .Setup(a => a.CompleteQueuedAuthorityPipelineAsync(
                It.IsAny<ContextIngestionRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                ProjectId = "ArchLucid",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            });

        IncompleteAuthorityPipelineExecuteHandler sut = CreateHandler(
            authority.Object,
            requestRepo.Object,
            runRepo.Object);

        ExecuteRunResult? result = await sut.TryResumeAsync(
            CreateRun(ArchitectureRunStatus.Created, runId, requestId),
            runId);

        result.Should().NotBeNull();
        header.RetryCount.Should().Be(0);
        updates.Should().NotContain(row => row.LegacyRunStatus == nameof(ArchitectureRunStatus.Retrying));
        updates.Should().NotContain(row => row.LegacyRunStatus == nameof(ArchitectureRunStatus.TasksGenerated));
        authority.Verify(
            a => a.CompleteQueuedAuthorityPipelineAsync(
                It.IsAny<ContextIngestionRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryResumeAsync_when_request_missing_throws_without_calling_pipeline()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = runGuid.ToString("N");

        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(r => r.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IArchitectureRequestRepository> requestRepo = new();
        requestRepo
            .Setup(r => r.GetByIdAsync("missing-req", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        Mock<IAuthorityRunOrchestrator> authority = new(MockBehavior.Strict);

        IncompleteAuthorityPipelineExecuteHandler sut = CreateHandler(
            authority.Object,
            requestRepo.Object,
            runRepo.Object);

        ArchitectureRun run = CreateRun(ArchitectureRunStatus.Failed, runId, "missing-req");

        Func<Task> act = () => sut.TryResumeAsync(run, runId);

        await act.Should()
            .ThrowAsync<InvalidOperationException>()
            .WithMessage("*missing-req*cannot resume the deferred authority pipeline*");
    }

    private static IncompleteAuthorityPipelineExecuteHandler CreateHandler(
        IAuthorityRunOrchestrator authority,
        IArchitectureRequestRepository requests,
        IRunRepository runs)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        return new IncompleteAuthorityPipelineExecuteHandler(
            authority,
            requests,
            runs,
            scope.Object,
            Mock.Of<IRunGovernanceScopePinService>(),
            new RunStateTransitionService(),
            new FailedRunRetryAdmission(runs),
            NullLogger<IncompleteAuthorityPipelineExecuteHandler>.Instance);
    }

    private static ArchitectureRun CreateRun(
        ArchitectureRunStatus status,
        string? runId = null,
        string requestId = "req-1",
        IReadOnlyList<string>? taskIds = null)
    {
        return new ArchitectureRun
        {
            RunId = runId ?? Guid.NewGuid().ToString("N"),
            RequestId = requestId,
            Status = status,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            TaskIds = taskIds ?? [],
        };
    }

    private static RunRecord CloneStatus(RunRecord row)
    {
        return new RunRecord
        {
            RunId = row.RunId,
            LegacyRunStatus = row.LegacyRunStatus,
            RetryCount = row.RetryCount,
            LastFailureReason = row.LastFailureReason,
            CompletedUtc = row.CompletedUtc,
        };
    }
}

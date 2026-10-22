using ArchLucid.Application.Jobs;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Operations;

[Trait("Category", "Unit")]
public sealed class OperationQueryServiceTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task GetAsync_null_or_whitespace_operation_id_throws(string operationId)
    {
        OperationQueryService sut = CreateSut();

        Func<Task> act = async () => await sut.GetAsync(operationId, DefaultScope, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Theory]
    [InlineData("not-prefixed")]
    public async Task GetAsync_invalid_operation_id_returns_null(string operationId)
    {
        OperationQueryService sut = CreateSut();

        OperationDetail? detail = await sut.GetAsync(operationId, DefaultScope, CancellationToken.None);

        detail.Should().BeNull();
    }

    [Fact]
    public async Task GetAsync_job_cross_tenant_returns_null()
    {
        Mock<IBackgroundJobTenantAccessVerifier> access = new();
        access
            .Setup(v => v.IsAccessibleAsync("foreign", DefaultScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        OperationQueryService sut = CreateSut(tenantAccess: access);

        OperationDetail? detail = await sut.GetAsync(OperationIdCodec.ForJob("foreign"), DefaultScope, CancellationToken.None);

        detail.Should().BeNull();
    }

    [Fact]
    public async Task GetAsync_job_found_projects_background_job()
    {
        DateTimeOffset created = TimeProvider.System.GetUtcNow();
        BackgroundJobInfo job = new(
            "job-1",
            BackgroundJobState.Running,
            created,
            created,
            null,
            null,
            "export.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        Mock<IBackgroundJobInfoReader> jobs = new();
        jobs.Setup(j => j.GetInfoAsync("job-1", It.IsAny<CancellationToken>())).ReturnsAsync(job);
        OperationQueryService sut = CreateSut(jobs: jobs);

        string operationId = OperationIdCodec.ForJob("job-1");
        OperationDetail? detail = await sut.GetAsync(operationId, DefaultScope, CancellationToken.None);

        detail.Should().NotBeNull();
        detail!.OperationId.Should().Be(operationId);
        detail.State.Should().Be(OperationState.Running);
        detail.StepLabel.Should().Be("Processing export");
        detail.ResultRef!.JobId.Should().Be("job-1");
        detail.ResultRef.DownloadPath.Should().BeNull();
        detail.CurrentStep.Should().BeNull();
        detail.TotalSteps.Should().BeNull();
    }

    [Fact]
    public async Task GetAsync_job_succeeded_includes_download_path()
    {
        DateTimeOffset created = TimeProvider.System.GetUtcNow();
        BackgroundJobInfo job = new(
            "job-2",
            BackgroundJobState.Succeeded,
            created,
            created,
            created,
            null,
            "export.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        Mock<IBackgroundJobInfoReader> jobs = new();
        jobs.Setup(j => j.GetInfoAsync("job-2", It.IsAny<CancellationToken>())).ReturnsAsync(job);
        OperationQueryService sut = CreateSut(jobs: jobs);

        OperationDetail? detail = await sut.GetAsync(OperationIdCodec.ForJob("job-2"), DefaultScope, CancellationToken.None);

        detail!.State.Should().Be(OperationState.Succeeded);
        detail.ResultRef!.DownloadPath.Should().Be("/v1/jobs/job-2/file");
    }

    [Fact]
    public async Task GetAsync_run_out_of_scope_returns_null()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);
        OperationQueryService sut = CreateSut(runs: runs);

        OperationDetail? detail = await sut.GetAsync(OperationIdCodec.ForRun(runId), DefaultScope, CancellationToken.None);

        detail.Should().BeNull();
    }

    [Fact]
    public async Task GetAsync_run_waiting_for_results_projects_agent_progress()
    {
        Guid runId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        RunRecord run = new()
        {
            RunId = runId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.WaitingForResults),
            CreatedUtc = DateTime.UtcNow.AddMinutes(-2)
        };
        List<AgentTask> tasks =
        [
            new()
            {
                RunId = runId.ToString("D"),
                AgentType = AgentType.Topology,
                Status = AgentTaskStatus.Completed,
                CreatedUtc = DateTime.UtcNow.AddMinutes(-2),
                CompletedUtc = DateTime.UtcNow.AddMinutes(-1)
            },
            new()
            {
                RunId = runId.ToString("D"),
                AgentType = AgentType.Cost,
                Status = AgentTaskStatus.InProgress,
                CreatedUtc = DateTime.UtcNow.AddMinutes(-1)
            },
            new()
            {
                RunId = runId.ToString("D"),
                AgentType = AgentType.Compliance,
                Status = AgentTaskStatus.Created,
                CreatedUtc = DateTime.UtcNow
            }
        ];

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);
        Mock<IAgentTaskRepository> agentTasks = new();
        agentTasks
            .Setup(t => t.GetByRunIdAsync(DefaultScope, runId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);
        OperationQueryService sut = CreateSut(runs: runs, agentTasks: agentTasks);

        OperationDetail? detail = await sut.GetAsync(OperationIdCodec.ForRun(runId), DefaultScope, CancellationToken.None);

        detail.Should().NotBeNull();
        detail!.State.Should().Be(OperationState.Running);
        detail.StepLabel.Should().Be("Cost agent running");
        detail.CurrentStep.Should().Be(1);
        detail.TotalSteps.Should().Be(3);
        detail.ResultRef!.RunId.Should().Be(runId);
    }

    [Fact]
    public async Task GetAsync_run_waiting_for_results_projects_staged_critic_phase_label()
    {
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        RunRecord run = new()
        {
            RunId = runId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.WaitingForResults),
            CreatedUtc = DateTime.UtcNow.AddMinutes(-3)
        };
        List<AgentTask> tasks =
        [
            new()
            {
                RunId = runId.ToString("D"),
                AgentType = AgentType.Topology,
                Status = AgentTaskStatus.Completed,
                CreatedUtc = DateTime.UtcNow.AddMinutes(-3),
                CompletedUtc = DateTime.UtcNow.AddMinutes(-2)
            },
            new()
            {
                RunId = runId.ToString("D"),
                AgentType = AgentType.Compliance,
                Status = AgentTaskStatus.Completed,
                CreatedUtc = DateTime.UtcNow.AddMinutes(-3),
                CompletedUtc = DateTime.UtcNow.AddMinutes(-2)
            },
            new()
            {
                RunId = runId.ToString("D"),
                AgentType = AgentType.Critic,
                Status = AgentTaskStatus.InProgress,
                CreatedUtc = DateTime.UtcNow.AddMinutes(-1)
            }
        ];

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);
        Mock<IAgentTaskRepository> agentTasks = new();
        agentTasks
            .Setup(t => t.GetByRunIdAsync(DefaultScope, runId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(tasks);
        OperationQueryService sut = CreateSut(runs: runs, agentTasks: agentTasks);

        OperationDetail? detail = await sut.GetAsync(OperationIdCodec.ForRun(runId), DefaultScope, CancellationToken.None);

        detail.Should().NotBeNull();
        detail!.StepLabel.Should().Be("Critic phase running");
        detail.CurrentStep.Should().Be(2);
        detail.TotalSteps.Should().Be(3);
    }

    private static OperationQueryService CreateSut(
        Mock<IBackgroundJobInfoReader>? jobs = null,
        Mock<IBackgroundJobTenantAccessVerifier>? tenantAccess = null,
        Mock<IRunRepository>? runs = null,
        Mock<IAgentTaskRepository>? agentTasks = null)
    {
        Mock<IBackgroundJobInfoReader> jobReader = jobs ?? new Mock<IBackgroundJobInfoReader>();
        Mock<IBackgroundJobTenantAccessVerifier> access = tenantAccess ?? new Mock<IBackgroundJobTenantAccessVerifier>();
        access
            .Setup(v => v.IsAccessibleAsync(It.IsAny<string>(), It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        Mock<IRunRepository> runRepo = runs ?? new Mock<IRunRepository>();
        Mock<IAgentTaskRepository> taskRepo = agentTasks ?? new Mock<IAgentTaskRepository>();
        Mock<IOperationCancellationRegistry> cancellation = new();

        return new OperationQueryService(
            jobReader.Object,
            access.Object,
            runRepo.Object,
            taskRepo.Object,
            cancellation.Object,
            new InMemoryAdvisoryDraftOperationStore());
    }
}

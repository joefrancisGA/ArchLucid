using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
/// Shared contract assertions for <see cref="IAgentExecutionTraceRepository"/>.
/// </summary>
public abstract class AgentExecutionTraceRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract IAgentExecutionTraceRepository CreateRepository();

    protected virtual Task PrepareRunAndTaskAsync(string requestId, string runId, AgentTask task, CancellationToken ct)
    {
        _ = requestId;
        _ = runId;
        _ = task;
        _ = ct;

        return Task.CompletedTask;
    }

    [SkippableFact]
    public async Task Create_GetByRunId_orders_by_CreatedUtc()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-aet");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        DateTime first = DateTime.UtcNow.AddMinutes(-2);
        DateTime second = DateTime.UtcNow.AddMinutes(-1);

        await repo.CreateAsync(NewTrace(runId, task.TaskId, "t1", first), CancellationToken.None);
        await repo.CreateAsync(NewTrace(runId, task.TaskId, "t2", second), CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        list.Should().HaveCount(2);
        list[0].TraceId.Should().Be("t1");
        list[1].TraceId.Should().Be("t2");
    }

    [SkippableFact]
    public async Task GetPagedByRunIdAsync_returns_slice_and_total()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet2-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-aet2");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewTrace(runId, task.TaskId, "p0", DateTime.UtcNow.AddMinutes(-3)), CancellationToken.None);
        await repo.CreateAsync(NewTrace(runId, task.TaskId, "p1", DateTime.UtcNow.AddMinutes(-2)), CancellationToken.None);
        await repo.CreateAsync(NewTrace(runId, task.TaskId, "p2", DateTime.UtcNow.AddMinutes(-1)), CancellationToken.None);

        (IReadOnlyList<AgentExecutionTrace> page, int total) = await repo.GetPagedByRunIdAsync(
            runId,
            offset: 1,
            limit: 1,
            CancellationToken.None);

        total.Should().Be(3);
        page.Should().ContainSingle();
    }

    [SkippableFact]
    public async Task GetByTaskIdAsync_filters_task()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet3-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask taskA = NewTask(runId, "task-a");
        AgentTask taskB = NewTask(runId, "task-b");

        await PrepareRunAndTaskAsync(requestId, runId, taskA, CancellationToken.None);
        await PrepareRunAndTaskAsync(requestId, runId, taskB, CancellationToken.None);

        await repo.CreateAsync(NewTrace(runId, taskA.TaskId, "x1", DateTime.UtcNow), CancellationToken.None);
        await repo.CreateAsync(NewTrace(runId, taskB.TaskId, "x2", DateTime.UtcNow), CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> forA = await repo.GetByTaskIdAsync(taskA.TaskId, CancellationToken.None);

        forA.Should().ContainSingle();
        forA[0].TraceId.Should().Be("x1");
    }

    [SkippableFact]
    public async Task PatchBlobStorageFieldsAsync_updates_blob_keys_on_read()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-patch-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-patch");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        AgentExecutionTrace created = NewTrace(runId, task.TaskId, "patch-trace", DateTime.UtcNow);
        await repo.CreateAsync(created, CancellationToken.None);

        await repo.PatchBlobStorageFieldsAsync(
            "patch-trace",
            fullSystemPromptBlobKey: "file:///sys",
            fullUserPromptBlobKey: "file:///usr",
            fullResponseBlobKey: "file:///rsp",
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);
        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.FullSystemPromptBlobKey.Should().Be("file:///sys");
        t.FullUserPromptBlobKey.Should().Be("file:///usr");
        t.FullResponseBlobKey.Should().Be("file:///rsp");
    }

    private static AgentTask NewTask(string runId, string taskId)
    {
        return new AgentTask
        {
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective = "o",
            Status = AgentTaskStatus.Created,
            CreatedUtc = DateTime.UtcNow,
            EvidenceBundleRef = "eb-aet",
        };
    }

    private static AgentExecutionTrace NewTrace(string runId, string taskId, string traceId, DateTime createdUtc)
    {
        return new AgentExecutionTrace
        {
            TraceId = traceId,
            RunId = runId,
            TaskId = taskId,
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            CreatedUtc = createdUtc,
        };
    }
}

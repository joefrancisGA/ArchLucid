using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Shared contract assertions for <see cref="IAgentExecutionTraceRepository" />.
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

        DateTime first = TimeProvider.System.UtcNowDateTime().AddMinutes(-2);
        DateTime second = TimeProvider.System.UtcNowDateTime().AddMinutes(-1);

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

        await repo.CreateAsync(NewTrace(runId, task.TaskId, "p0", TimeProvider.System.UtcNowDateTime().AddMinutes(-3)),
            CancellationToken.None);
        await repo.CreateAsync(NewTrace(runId, task.TaskId, "p1", TimeProvider.System.UtcNowDateTime().AddMinutes(-2)),
            CancellationToken.None);
        await repo.CreateAsync(NewTrace(runId, task.TaskId, "p2", TimeProvider.System.UtcNowDateTime().AddMinutes(-1)),
            CancellationToken.None);

        (IReadOnlyList<AgentExecutionTrace> page, int total) = await repo.GetPagedByRunIdAsync(
            runId,
            1,
            1,
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

        await repo.CreateAsync(NewTrace(runId, taskA.TaskId, "x1", TimeProvider.System.UtcNowDateTime()), CancellationToken.None);
        await repo.CreateAsync(NewTrace(runId, taskB.TaskId, "x2", TimeProvider.System.UtcNowDateTime()), CancellationToken.None);

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

        AgentExecutionTrace created = NewTrace(runId, task.TaskId, "patch-trace", TimeProvider.System.UtcNowDateTime());
        await repo.CreateAsync(created, CancellationToken.None);

        await repo.PatchBlobStorageFieldsAsync(
            "patch-trace",
            "file:///sys",
            "file:///usr",
            "file:///rsp",
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);
        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.FullSystemPromptBlobKey.Should().Be("file:///sys");
        t.FullUserPromptBlobKey.Should().Be("file:///usr");
        t.FullResponseBlobKey.Should().Be("file:///rsp");
    }

    [SkippableFact]
    public async Task PatchInlinePromptFallbackAsync_merges_inline_fields_on_read()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-inline-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-inline");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        AgentExecutionTrace created = NewTrace(runId, task.TaskId, "inline-trace", TimeProvider.System.UtcNowDateTime());
        await repo.CreateAsync(created, CancellationToken.None);

        await repo.PatchInlinePromptFallbackAsync(
            "inline-trace",
            "sys-full",
            null,
            "resp-full",
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);
        AgentExecutionTrace t = list.Should().ContainSingle().Subject;
        t.FullSystemPromptInline.Should().Be("sys-full");
        t.FullUserPromptInline.Should().BeNull();
        t.FullResponseInline.Should().Be("resp-full");

        await repo.PatchInlinePromptFallbackAsync(
            "inline-trace",
            null,
            "user-full",
            null,
            CancellationToken.None);

        list = await repo.GetByRunIdAsync(runId, CancellationToken.None);
        t = list.Should().ContainSingle().Subject;
        t.FullSystemPromptInline.Should().Be("sys-full");
        t.FullUserPromptInline.Should().Be("user-full");
        t.FullResponseInline.Should().Be("resp-full");
    }

    [SkippableFact]
    public async Task GetByTraceIdAsync_returns_single_row()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-traceid-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-traceid");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewTrace(runId, task.TaskId, "by-trace-id-1", TimeProvider.System.UtcNowDateTime()), CancellationToken.None);

        AgentExecutionTrace? found = await repo.GetByTraceIdAsync("by-trace-id-1", CancellationToken.None);

        found.Should().NotBeNull();
        found.TraceId.Should().Be("by-trace-id-1");
        found.RunId.Should().Be(runId);
    }

    [SkippableFact]
    public async Task PatchInlineFallbackFailedAsync_persists_on_read()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-inline-fail-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-inline-fail");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewTrace(runId, task.TaskId, "inline-fail-trace", TimeProvider.System.UtcNowDateTime()),
            CancellationToken.None);

        await repo.PatchInlineFallbackFailedAsync("inline-fail-trace", true, CancellationToken.None);

        AgentExecutionTrace? t = await repo.GetByTraceIdAsync("inline-fail-trace", CancellationToken.None);

        t.Should().NotBeNull();
        t.InlineFallbackFailed.Should().BeTrue();
    }

    [SkippableFact]
    public async Task PatchQualityWarningAsync_merges_into_trace_json_on_read()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-qw-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-qw");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewTrace(runId, task.TaskId, "qw-trace", TimeProvider.System.UtcNowDateTime()), CancellationToken.None);

        await repo.PatchQualityWarningAsync("qw-trace", true, CancellationToken.None);

        AgentExecutionTrace? t = await repo.GetByTraceIdAsync("qw-trace", CancellationToken.None);

        t.Should().NotBeNull();
        t.QualityWarning.Should().BeTrue();
    }

    [SkippableFact]
    public async Task PatchQualityRejectedAsync_merges_into_trace_json_on_read()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-qr-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-qr");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewTrace(runId, task.TaskId, "qr-trace", TimeProvider.System.UtcNowDateTime()), CancellationToken.None);

        await repo.PatchQualityRejectedAsync("qr-trace", true, CancellationToken.None);

        AgentExecutionTrace? t = await repo.GetByTraceIdAsync("qr-trace", CancellationToken.None);

        t.Should().NotBeNull();
        t.QualityRejected.Should().BeTrue();
    }

    [SkippableFact]
    public async Task GetDistinctAgentTypesWithLlmResourceFallbackAsync_excludes_non_fallback_deployments()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-llm-fb-empty-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTask(runId, "task-llm-fb-empty");

        await PrepareRunAndTaskAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(
            NewTrace(
                runId,
                task.TaskId,
                "fb-absent-1",
                TimeProvider.System.UtcNowDateTime(),
                modelDeploymentName: "gpt-4-primary"),
            CancellationToken.None);

        IReadOnlyList<string> agents = await repo.GetDistinctAgentTypesWithLlmResourceFallbackAsync(
            runId,
            CancellationToken.None);

        agents.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task GetDistinctAgentTypesWithLlmResourceFallbackAsync_orders_distinct_agent_types()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-llm-fb-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask taskTopology = NewTask(runId, "task-top");
        AgentTask taskCost = NewTask(runId, "task-cost");

        await PrepareRunAndTaskAsync(requestId, runId, taskTopology, CancellationToken.None);
        await PrepareRunAndTaskAsync(requestId, runId, taskCost, CancellationToken.None);

        string fallbackName =
            AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "eastus2-secondary";

        await repo.CreateAsync(
            NewTrace(
                runId,
                taskCost.TaskId,
                "fb-1",
                TimeProvider.System.UtcNowDateTime().AddMinutes(-2),
                AgentType.Cost,
                fallbackName),
            CancellationToken.None);
        await repo.CreateAsync(
            NewTrace(
                runId,
                taskTopology.TaskId,
                "fb-2",
                TimeProvider.System.UtcNowDateTime().AddMinutes(-1),
                AgentType.Topology,
                fallbackName),
            CancellationToken.None);
        await repo.CreateAsync(
            NewTrace(
                runId,
                taskTopology.TaskId,
                "fb-dup",
                TimeProvider.System.UtcNowDateTime(),
                AgentType.Topology,
                fallbackName),
            CancellationToken.None);

        IReadOnlyList<string> agents = await repo.GetDistinctAgentTypesWithLlmResourceFallbackAsync(
            runId,
            CancellationToken.None);

        agents.Should().Equal("Cost", "Topology");
    }

    [SkippableFact]
    public async Task GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync_partitions_runs()
    {
        SkipIfSqlServerUnavailable();
        IAgentExecutionTraceRepository repo = CreateRepository();
        string requestId = "aet-llm-fb-batch-" + Guid.NewGuid().ToString("N");
        string runA = Guid.NewGuid().ToString("N");
        string runB = Guid.NewGuid().ToString("N");
        AgentTask taskA = NewTask(runA, "task-a");
        AgentTask taskB = NewTask(runB, "task-b");

        await PrepareRunAndTaskAsync(requestId, runA, taskA, CancellationToken.None);
        await PrepareRunAndTaskAsync(requestId, runB, taskB, CancellationToken.None);

        string fallbackName =
            AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "secondary";

        await repo.CreateAsync(
            NewTrace(
                runA,
                taskA.TaskId,
                "fb-a",
                TimeProvider.System.UtcNowDateTime(),
                AgentType.Compliance,
                fallbackName),
            CancellationToken.None);
        await repo.CreateAsync(
            NewTrace(
                runB,
                taskB.TaskId,
                "plain-b",
                TimeProvider.System.UtcNowDateTime(),
                AgentType.Critic,
                "primary-deployment"),
            CancellationToken.None);

        IReadOnlyDictionary<string, IReadOnlyList<string>> map =
            await repo.GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync([runA, runB], CancellationToken.None);

        map.Should().ContainKey(runA);
        map[runA].Should().Equal("Compliance");
        map.Should().ContainKey(runB);
        map[runB].Should().BeEmpty();
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
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            EvidenceBundleRef = "eb-aet"
        };
    }

    private static AgentExecutionTrace NewTrace(
        string runId,
        string taskId,
        string traceId,
        DateTime createdUtc,
        AgentType agentType = AgentType.Topology,
        string? modelDeploymentName = null)
    {
        return new AgentExecutionTrace
        {
            TraceId = traceId,
            RunId = runId,
            TaskId = taskId,
            AgentType = agentType,
            ParseSucceeded = true,
            CreatedUtc = createdUtc,
            ModelDeploymentName = modelDeploymentName
        };
    }
}

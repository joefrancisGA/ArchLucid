using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Tests.Support;
namespace ArchLucid.Persistence.Tests.Contracts;
[Trait("Category", "Unit")]

/// <summary>
///     Shared contract assertions for <see cref="IAgentResultRepository" />.
/// </summary>
public abstract class AgentResultRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract IAgentResultRepository CreateRepository();

    protected virtual Task PrepareRunTaskChainAsync(string requestId, string runId, AgentTask task,
        CancellationToken ct)
    {
        _ = requestId;
        _ = runId;
        _ = task;
        _ = ct;

        return Task.CompletedTask;
    }

    [SkippableFact]
    public async Task Create_then_GetByRunId_returns_result()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTaskRow(runId, "res-task-1");

        await PrepareRunTaskChainAsync(requestId, runId, task, CancellationToken.None);

        AgentResult result = NewResult(runId, task.TaskId, "r1", TimeProvider.System.UtcNowDateTime());

        await repo.CreateAsync(result, CancellationToken.None);

        IReadOnlyList<AgentResult> loaded = await repo.GetByRunIdAsync(ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        loaded.Should().ContainSingle();
        loaded[0].TaskId.Should().Be(task.TaskId);
        loaded[0].ResultId.Should().Be("r1");
    }

    [SkippableFact]
    public async Task CreateMany_replaces_prior_results_for_same_run()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr2-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTaskRow(runId, "res-task-2");

        await PrepareRunTaskChainAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewResult(runId, task.TaskId, "old", TimeProvider.System.UtcNowDateTime().AddMinutes(-1)),
            CancellationToken.None);

        await repo.CreateManyAsync(
            [NewResult(runId, task.TaskId, "new", TimeProvider.System.UtcNowDateTime())],
            CancellationToken.None);

        IReadOnlyList<AgentResult> loaded = await repo.GetByRunIdAsync(ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        loaded.Should().ContainSingle();
        loaded[0].ResultId.Should().Be("new");
    }

    [SkippableFact]
    public async Task Create_duplicate_task_for_run_throws_AgentResultDuplicateConflictException()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr-dup-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTaskRow(runId, "res-task-dup");

        await PrepareRunTaskChainAsync(requestId, runId, task, CancellationToken.None);

        AgentResult first = NewResult(runId, task.TaskId, "first", TimeProvider.System.UtcNowDateTime());
        AgentResult second = NewResult(runId, task.TaskId, "second", TimeProvider.System.UtcNowDateTime().AddSeconds(1));

        await repo.CreateAsync(first, CancellationToken.None);

        Func<Task> act = () => repo.CreateAsync(second, CancellationToken.None);

        await act.Should().ThrowAsync<AgentResultDuplicateConflictException>();
    }

    private static AgentTask NewTaskRow(string runId, string taskId)
    {
        return new AgentTask
        {
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective = "o",
            Status = AgentTaskStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            EvidenceBundleRef = "eb-ar"
        };
    }

    private static AgentResult NewResult(string runId, string taskId, string resultId, DateTime createdUtc)
    {
        return new AgentResult
        {
            ResultId = resultId,
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims = [],
            EvidenceRefs = [],
            Confidence = 0.5,
            CreatedUtc = createdUtc
        };
    }
}

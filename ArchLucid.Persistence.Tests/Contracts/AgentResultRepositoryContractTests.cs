using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
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
        loaded[0].ResultId.Should().Be(result.ResultId);
    }

    [SkippableFact]
    public async Task CreateMany_persists_all_results()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr-many-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask taskA = NewTaskRow(runId, "res-task-a");
        AgentTask taskB = NewTaskRow(runId, "res-task-b");

        await PrepareRunTaskChainAsync(requestId, runId, taskA, CancellationToken.None);
        await PrepareRunTaskChainAsync(requestId, runId, taskB, CancellationToken.None);

        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

        await repo.CreateManyAsync(
            [
                NewResult(runId, taskA.TaskId, "r-a", createdUtc),
                NewResult(runId, taskB.TaskId, "r-b", createdUtc.AddSeconds(1))
            ],
            CancellationToken.None);

        IReadOnlyList<AgentResult> loaded =
            await repo.GetByRunIdAsync(ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        loaded.Should().HaveCount(2);
        loaded.Select(static r => r.ResultId).Should().BeEquivalentTo([
            ArchitectureCommitTestSeed.RunScopedRowId(runId, "r-a"),
            ArchitectureCommitTestSeed.RunScopedRowId(runId, "r-b")]);
    }

    [SkippableFact]
    public async Task CreateMany_leaves_run_unchanged_when_a_task_already_exists()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr2-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTaskRow(runId, "res-task-2");

        AgentTask freshTask = NewTaskRow(runId, "res-task-fresh");

        await PrepareRunTaskChainAsync(requestId, runId, task, CancellationToken.None);
        await PrepareRunTaskChainAsync(requestId, runId, freshTask, CancellationToken.None);

        await repo.CreateAsync(NewResult(runId, task.TaskId, "old", TimeProvider.System.UtcNowDateTime().AddMinutes(-1)),
            CancellationToken.None);

        Func<Task> act = () => repo.CreateManyAsync(
            [
                NewResult(runId, freshTask.TaskId, "fresh", TimeProvider.System.UtcNowDateTime()),
                NewResult(runId, task.TaskId, "new", TimeProvider.System.UtcNowDateTime())
            ],
            CancellationToken.None);

        await act.Should().ThrowAsync<AgentResultDuplicateConflictException>();

        IReadOnlyList<AgentResult> loaded =
            await repo.GetByRunIdAsync(ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        loaded.Select(static result => result.ResultId).Should().Equal(ArchitectureCommitTestSeed.RunScopedRowId(runId, "old"));
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

    [SkippableFact]
    public async Task DeleteForRunTask_removes_result_so_task_can_be_recreated()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr-del-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTaskRow(runId, "res-task-del");

        await PrepareRunTaskChainAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewResult(runId, task.TaskId, "to-delete", TimeProvider.System.UtcNowDateTime()),
            CancellationToken.None);

        await repo.DeleteForRunTaskAsync(runId, task.TaskId, CancellationToken.None);

        IReadOnlyList<AgentResult> afterDelete =
            await repo.GetByRunIdAsync(ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        afterDelete.Should().BeEmpty();

        AgentResult recreated = NewResult(runId, task.TaskId, "recreated", TimeProvider.System.UtcNowDateTime());
        await repo.CreateAsync(recreated, CancellationToken.None);

        IReadOnlyList<AgentResult> afterCreate =
            await repo.GetByRunIdAsync(ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        afterCreate.Should().ContainSingle(r => r.ResultId == recreated.ResultId);
    }

    [SkippableFact]
    public async Task Create_then_GetAgentTypeMarkersByRunId_maps_uniqueidentifier_run_id()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr-marker-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTaskRow(runId, "res-task-marker");

        await PrepareRunTaskChainAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewResult(runId, task.TaskId, "marker-r1", TimeProvider.System.UtcNowDateTime()),
            CancellationToken.None);

        IReadOnlyList<AgentResult> markers =
            await repo.GetAgentTypeMarkersByRunIdAsync(
                ArchitectureCommitTestSeed.AsScopeContext(),
                runId,
                CancellationToken.None);

        markers.Should().ContainSingle();
        markers[0].ResultId.Should().Be(ArchitectureCommitTestSeed.RunScopedRowId(runId, "marker-r1"));
        markers[0].RunId.Should().Be(runId);
        markers[0].AgentType.Should().Be(AgentType.Topology);
    }

    [SkippableFact]
    public async Task Create_then_GetRollupProjectionByRunId_keeps_claims_and_strips_reasoning()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr-rollup-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTaskRow(runId, "res-task-rollup");

        await PrepareRunTaskChainAsync(requestId, runId, task, CancellationToken.None);

        AgentResult seeded = NewResult(runId, task.TaskId, "rollup-r1", TimeProvider.System.UtcNowDateTime());
        seeded.Claims = ["claim-one"];
        seeded.EvidenceRefs = ["ev-one"];
        seeded.ReasoningTrace = "should-not-survive-in-memory-strip-path";
        seeded.Findings =
        [
            new ArchitectureFinding
            {
                SourceAgent = AgentType.Topology,
                Message = "finding-one",
                Severity = FindingSeverity.Warning,
                IacStub = "stub",
            },
        ];
        seeded.ProposedChanges = new AgentTopologyProposal
        {
            SourceAgent = AgentType.Topology,
            RequiredControls = ["ctrl-one"],
            Warnings = ["warn-one"],
            AddedServices = [new ManifestService { ServiceName = "svc" }],
        };

        await repo.CreateAsync(seeded, CancellationToken.None);

        IReadOnlyList<AgentResult> projected =
            await repo.GetRollupProjectionByRunIdAsync(
                ArchitectureCommitTestSeed.AsScopeContext(),
                runId,
                CancellationToken.None);

        projected.Should().ContainSingle();
        projected[0].ResultId.Should().Be(seeded.ResultId);
        projected[0].Claims.Should().ContainSingle("claim-one");
        projected[0].EvidenceRefs.Should().ContainSingle("ev-one");
        projected[0].Findings.Should().ContainSingle(f => f.Message == "finding-one");
        projected[0].ProposedChanges.Should().NotBeNull();
        AgentTopologyProposal proposed = projected[0].ProposedChanges!;
        proposed.RequiredControls.Should().ContainSingle("ctrl-one");
        proposed.Warnings.Should().ContainSingle("warn-one");
        proposed.AddedServices.Should().BeEmpty();
        projected[0].ReasoningTrace.Should().BeNull();
        projected[0].Findings[0].IacStub.Should().BeNull();
    }

    [SkippableFact]
    [Trait("Suite", "Core")]
    public async Task Same_result_and_task_labels_are_isolated_across_runs()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr-isolation-" + Guid.NewGuid().ToString("N");
        string firstRun = Guid.NewGuid().ToString("N");
        string secondRun = Guid.NewGuid().ToString("N");
        AgentTask firstTask = NewTaskRow(firstRun, "task");
        AgentTask secondTask = NewTaskRow(secondRun, "task");
        await PrepareRunTaskChainAsync(requestId, firstRun, firstTask, CancellationToken.None);
        await PrepareRunTaskChainAsync(requestId, secondRun, secondTask, CancellationToken.None);

        DateTime createdUtc = new(2026, 5, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentResult first = NewResult(firstRun, firstTask.TaskId, "result", createdUtc);
        AgentResult second = NewResult(secondRun, secondTask.TaskId, "result", createdUtc);
        await repo.CreateAsync(first, CancellationToken.None);
        await repo.CreateAsync(second, CancellationToken.None);

        ScopeContext scope = ArchitectureCommitTestSeed.AsScopeContext();
        AgentResult firstRow = (await repo.GetByRunIdAsync(scope, firstRun, CancellationToken.None)).Should().ContainSingle().Subject;
        AgentResult secondRow = (await repo.GetByRunIdAsync(scope, secondRun, CancellationToken.None)).Should().ContainSingle().Subject;
        firstRow.ResultId.Should().Be(first.ResultId).And.NotBe(secondRow.ResultId);
        secondRow.ResultId.Should().Be(second.ResultId);
        firstRow.TaskId.Should().Be(firstTask.TaskId).And.NotBe(secondRow.TaskId);
        secondRow.TaskId.Should().Be(secondTask.TaskId);
    }

    protected static AgentTask NewTaskRow(string runId, string label)
    {
        return new AgentTask
        {
            TaskId = ArchitectureCommitTestSeed.RunScopedRowId(runId, label),
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective = "o",
            Status = AgentTaskStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            EvidenceBundleRef = "eb-ar"
        };
    }

    protected static AgentResult NewResult(string runId, string taskId, string label, DateTime createdUtc)
    {
        return new AgentResult
        {
            ResultId = ArchitectureCommitTestSeed.RunScopedRowId(runId, label),
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

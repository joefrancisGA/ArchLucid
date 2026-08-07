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
        loaded[0].ResultId.Should().Be("r1");
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
        loaded.Select(static r => r.ResultId).Should().BeEquivalentTo(["r-a", "r-b"]);
    }

    [SkippableFact]
    public async Task CreateMany_throws_when_task_already_exists_for_run()
    {
        SkipIfSqlServerUnavailable();
        IAgentResultRepository repo = CreateRepository();
        string requestId = "arr2-req-" + Guid.NewGuid().ToString("N");
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = NewTaskRow(runId, "res-task-2");

        await PrepareRunTaskChainAsync(requestId, runId, task, CancellationToken.None);

        await repo.CreateAsync(NewResult(runId, task.TaskId, "old", TimeProvider.System.UtcNowDateTime().AddMinutes(-1)),
            CancellationToken.None);

        Func<Task> act = () => repo.CreateManyAsync(
            [NewResult(runId, task.TaskId, "new", TimeProvider.System.UtcNowDateTime())],
            CancellationToken.None);

        await act.Should().ThrowAsync<AgentResultDuplicateConflictException>();
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

        await repo.CreateAsync(NewResult(runId, task.TaskId, "recreated", TimeProvider.System.UtcNowDateTime()),
            CancellationToken.None);

        IReadOnlyList<AgentResult> afterCreate =
            await repo.GetByRunIdAsync(ArchitectureCommitTestSeed.AsScopeContext(), runId, CancellationToken.None);

        afterCreate.Should().ContainSingle(r => r.ResultId == "recreated");
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
        markers[0].ResultId.Should().Be("marker-r1");
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
                Message = "finding-one",
                Severity = FindingSeverity.Warning,
                IacStub = "stub",
            },
        ];
        seeded.ProposedChanges = new AgentTopologyProposal
        {
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
        projected[0].ResultId.Should().Be("rollup-r1");
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

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Execute;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Application.Runs.Orchestration.Execute.Hooks;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Runs;
using ArchLucid.Application.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration.Execute;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteIdempotencyStageTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_TryReturnExistingExecuteResultsAsync_merges_tasks_and_results_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("51515151-5151-5151-5151-515151515151");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();
        const string taskId = "task-legacy-1";

        List<AgentTask> legacyTasks =
        [
            new AgentTask { TaskId = taskId, RunId = legacyUpper, AgentType = AgentType.Topology },
        ];

        List<AgentResult> legacyResults =
        [
            new AgentResult
            {
                TaskId = taskId,
                RunId = legacyUpper,
                AgentType = AgentType.Topology,
                Confidence = 0.9,
            },
        ];

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        Mock<IAgentResultRepository> results = new();
        results
            .Setup(r => r.GetByRunIdAsync(Scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        results
            .Setup(r => r.GetByRunIdAsync(Scope, legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacyResults);
        results
            .Setup(r => r.GetByRunIdAsync(
                Scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentTaskRepository> tasks = new();
        tasks
            .Setup(r => r.GetByRunIdAsync(Scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        tasks
            .Setup(r => r.GetByRunIdAsync(Scope, legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacyTasks);
        tasks
            .Setup(r => r.GetByRunIdAsync(
                Scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated),
            });
        runs
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureRunExecuteIdempotencyStage sut = new(
            scopeProvider.Object,
            runs.Object,
            tasks.Object,
            results.Object,
            new RunStateTransitionService(),
            new OperationCancellationRegistry(),
            Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
            Mock.Of<IActorContext>(),
            new ArchitectureRunExecutePostExecuteHooks(
                Mock.Of<IArchitectureRunExecuteAuditHook>(),
                Mock.Of<IArchitectureRunExecuteBaselineMutationHook>(),
                Mock.Of<IArchitectureRunExecuteOutboxPublishHook>()),
            NullLogger<ArchitectureRunExecuteIdempotencyStage>.Instance);

        ArchitectureRun run = new()
        {
            RunId = canonicalRunId,
            Status = ArchitectureRunStatus.TasksGenerated,
        };

        ExecuteRunResult? idempotent =
            await sut.TryReturnExistingExecuteResultsAsync(run, canonicalRunId, CancellationToken.None);

        idempotent.Should().NotBeNull();
        idempotent!.Results.Should().ContainSingle(r => r.TaskId == taskId);
    }
}

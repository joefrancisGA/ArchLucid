using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceUpsertPolicyTests
{
    [Fact]
    public void ShouldRemoveExisting_removes_all_attempts_when_reexecuting_attempt_zero()
    {
        AgentExecutionTrace incoming = Trace(attemptIndex: 0);
        AgentExecutionTrace laterAttempt = Trace(attemptIndex: 2);

        AgentExecutionTraceUpsertPolicy.ShouldRemoveExisting(laterAttempt, incoming).Should().BeTrue();
    }

    [Fact]
    public void ShouldRemoveExisting_removes_only_matching_attempt_for_retries()
    {
        AgentExecutionTrace incoming = Trace(attemptIndex: 2);
        AgentExecutionTrace sameAttempt = Trace(attemptIndex: 2);
        AgentExecutionTrace otherAttempt = Trace(attemptIndex: 1);

        AgentExecutionTraceUpsertPolicy.ShouldRemoveExisting(sameAttempt, incoming).Should().BeTrue();
        AgentExecutionTraceUpsertPolicy.ShouldRemoveExisting(otherAttempt, incoming).Should().BeFalse();
    }

    [Fact]
    public void ShouldRemoveExisting_ignores_different_run_task_agent_keys()
    {
        AgentExecutionTrace incoming = Trace(attemptIndex: 0);
        AgentExecutionTrace differentTask = Trace(attemptIndex: 0);
        differentTask.TaskId = "other-task";

        AgentExecutionTraceUpsertPolicy.ShouldRemoveExisting(differentTask, incoming).Should().BeFalse();
    }

    [Fact]
    public void ShouldRemoveExisting_removes_same_attempt_when_task_id_differs_only_by_casing()
    {
        AgentExecutionTrace incoming = Trace(attemptIndex: 2);
        incoming.TaskId = "Task-1";
        AgentExecutionTrace existing = Trace(attemptIndex: 2);
        existing.TaskId = "task-1";

        AgentExecutionTraceUpsertPolicy.ShouldRemoveExisting(existing, incoming).Should().BeTrue();
    }

    private static AgentExecutionTrace Trace(int attemptIndex) =>
        new()
        {
            TraceId = Guid.NewGuid().ToString("D"),
            RunId = "run-1",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            AttemptIndex = attemptIndex,
            CreatedUtc = DateTime.UtcNow,
        };
}

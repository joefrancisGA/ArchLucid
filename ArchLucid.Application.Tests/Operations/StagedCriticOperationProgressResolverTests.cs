using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Operations;

[Trait("Category", "Unit")]
public sealed class StagedCriticOperationProgressResolverTests
{
    [Fact]
    public void TryResolve_returns_false_when_critic_and_non_critic_run_in_parallel()
    {
        List<AgentTask> tasks =
        [
            Task(AgentType.Topology, AgentTaskStatus.InProgress),
            Task(AgentType.Critic, AgentTaskStatus.InProgress)
        ];

        bool resolved = StagedCriticOperationProgressResolver.TryResolveAgentExecutionStepLabel(tasks, out string label);

        resolved.Should().BeFalse();
        label.Should().BeEmpty();
    }

    [Fact]
    public void TryResolve_phase1_label_when_non_critic_in_progress()
    {
        List<AgentTask> tasks =
        [
            Task(AgentType.Topology, AgentTaskStatus.InProgress),
            Task(AgentType.Compliance, AgentTaskStatus.Created),
            Task(AgentType.Critic, AgentTaskStatus.Created)
        ];

        bool resolved = StagedCriticOperationProgressResolver.TryResolveAgentExecutionStepLabel(tasks, out string label);

        resolved.Should().BeTrue();
        label.Should().Be("Phase 1 agents running (before Critic)");
    }

    [Fact]
    public void TryResolve_preparing_label_when_phase1_complete_and_critic_pending()
    {
        List<AgentTask> tasks =
        [
            Task(AgentType.Topology, AgentTaskStatus.Completed),
            Task(AgentType.Compliance, AgentTaskStatus.Completed),
            Task(AgentType.Critic, AgentTaskStatus.Created)
        ];

        bool resolved = StagedCriticOperationProgressResolver.TryResolveAgentExecutionStepLabel(tasks, out string label);

        resolved.Should().BeTrue();
        label.Should().Be("Preparing Critic phase");
    }

    [Fact]
    public void TryResolve_critic_phase_label_when_only_critic_in_progress()
    {
        List<AgentTask> tasks =
        [
            Task(AgentType.Topology, AgentTaskStatus.Completed),
            Task(AgentType.Critic, AgentTaskStatus.InProgress)
        ];

        bool resolved = StagedCriticOperationProgressResolver.TryResolveAgentExecutionStepLabel(tasks, out string label);

        resolved.Should().BeTrue();
        label.Should().Be("Critic phase running");
    }

    private static AgentTask Task(AgentType agentType, AgentTaskStatus status) =>
        new()
        {
            TaskId = Guid.NewGuid().ToString("N"),
            RunId = Guid.NewGuid().ToString("N"),
            AgentType = agentType,
            Status = status,
            CreatedUtc = DateTime.UtcNow
        };
}

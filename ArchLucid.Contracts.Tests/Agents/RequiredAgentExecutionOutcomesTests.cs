using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RequiredAgentExecutionOutcomesTests
{
    [Fact]
    public void Project_marks_missing_required_agents()
    {
        IReadOnlyList<AgentExecutionOutcome> outcomes = RequiredAgentExecutionOutcomes.Project(
        [
            CommitReady(AgentType.Topology),
        ]);

        outcomes.Should().HaveCount(4);
        outcomes.Single(o => o.AgentType == AgentType.Topology).Outcome.Should().Be(AgentExecutionOutcomeKind.Succeeded);
        outcomes.Where(o => o.AgentType != AgentType.Topology)
            .Should()
            .OnlyContain(o => o.Outcome == AgentExecutionOutcomeKind.Missing);
        RequiredAgentExecutionOutcomes.HasCommitReadyOutcomes(outcomes).Should().BeFalse();
        RequiredAgentExecutionOutcomes.HasAnySucceededRequiredAgent(outcomes).Should().BeTrue();
    }

    [Fact]
    public void Project_marks_degraded_and_empty_as_not_succeeded()
    {
        IReadOnlyList<AgentExecutionOutcome> outcomes = RequiredAgentExecutionOutcomes.Project(
        [
            CommitReady(AgentType.Topology),
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = "run-1",
                TaskId = "cost",
                AgentType = AgentType.Cost,
                Claims = ["x"],
                DegradationReasonCode = AgentHandlerDegradationReasonCodes.CircuitOpen,
            },
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = "run-1",
                TaskId = "compliance",
                AgentType = AgentType.Compliance,
            },
            CommitReady(AgentType.Critic),
        ]);

        outcomes.Single(o => o.AgentType == AgentType.Cost).Outcome.Should().Be(AgentExecutionOutcomeKind.Degraded);
        outcomes.Single(o => o.AgentType == AgentType.Compliance).Outcome.Should().Be(AgentExecutionOutcomeKind.Failed);
        RequiredAgentExecutionOutcomes.HasCommitReadyOutcomes(outcomes).Should().BeFalse();
    }

    [Fact]
    public void ProjectPresenceMarkers_treats_presence_as_succeeded()
    {
        IReadOnlyList<AgentExecutionOutcome> outcomes = RequiredAgentExecutionOutcomes.ProjectPresenceMarkers(
        [
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = "run-1",
                TaskId = "topology",
                AgentType = AgentType.Topology,
            },
        ]);

        outcomes.Single(o => o.AgentType == AgentType.Topology).Outcome.Should().Be(AgentExecutionOutcomeKind.Succeeded);
        outcomes.Count(o => o.Outcome == AgentExecutionOutcomeKind.Missing).Should().Be(3);
    }

    private static AgentResult CommitReady(AgentType agentType)
    {
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = "run-1",
            TaskId = agentType.ToString(),
            AgentType = agentType,
            Claims = ["ok"],
            CreatedUtc = DateTime.UtcNow,
        };
    }
}

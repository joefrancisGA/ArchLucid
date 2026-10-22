using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Runs;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunStateTransitionEnforcementTests
{
    [Fact]
    public void EnsureCommitAllowed_throws_conflict_when_transition_denied()
    {
        Mock<IRunStateTransitionService> transitions = new();
        transitions
            .Setup(t => t.ValidateCommitAllowed(ArchitectureRunStatus.Failed))
            .Returns(RunStateTransitionCheck.Denied("cannot be committed in Failed status."));
        ArchitectureRun run = new() { Status = ArchitectureRunStatus.Failed };

        Action act = () => RunStateTransitionEnforcement.EnsureCommitAllowed(transitions.Object, run, "run-1");

        act.Should()
            .Throw<ConflictException>()
            .WithMessage("*run-1*cannot be committed in Failed status*");
    }

    [Fact]
    public void EnsureCommitAllowed_uses_default_message_when_check_message_is_blank()
    {
        Mock<IRunStateTransitionService> transitions = new();
        transitions
            .Setup(t => t.ValidateCommitAllowed(ArchitectureRunStatus.Failed))
            .Returns(new RunStateTransitionCheck(false, "   "));
        ArchitectureRun run = new() { Status = ArchitectureRunStatus.Failed };

        Action act = () => RunStateTransitionEnforcement.EnsureCommitAllowed(transitions.Object, run, "run-2");

        act.Should().Throw<ConflictException>().WithMessage("*run-2*cannot be committed*");
    }

    [Fact]
    public void EnsureCommitAllowedLegacy_throws_conflict_when_transition_denied()
    {
        Mock<IRunStateTransitionService> transitions = new();
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        transitions
            .Setup(t => t.ValidateCommitAllowedLegacy("Created"))
            .Returns(RunStateTransitionCheck.Denied("is not ready for commit."));

        Action act = () => RunStateTransitionEnforcement.EnsureCommitAllowedLegacy(transitions.Object, runId, "Created");

        act.Should()
            .Throw<ConflictException>()
            .WithMessage($"*'{runId:D}'*is not ready for commit*");
    }

    [Fact]
    public void EnsureCommitReadyAgentResults_throws_when_required_agents_incomplete()
    {
        RunStateTransitionService transitions = new();

        Action act = () => RunStateTransitionEnforcement.EnsureCommitReadyAgentResults(
            transitions,
            "run-partial",
            [
                new AgentResult
                {
                    ResultId = Guid.NewGuid().ToString("N"),
                    RunId = "run-partial",
                    TaskId = "topology",
                    AgentType = AgentType.Topology,
                    Claims = ["ok"],
                },
            ]);

        act.Should()
            .Throw<ConflictException>()
            .WithMessage("*run-partial*Incomplete*Cost:Missing*");
    }

    [Fact]
    public void EnsureCommitReadyAgentResults_allows_full_commit_ready_set()
    {
        RunStateTransitionService transitions = new();
        List<AgentResult> results =
        [
            CommitReady(AgentType.Topology),
            CommitReady(AgentType.Cost),
            CommitReady(AgentType.Compliance),
            CommitReady(AgentType.Critic),
        ];

        Action act = () => RunStateTransitionEnforcement.EnsureCommitReadyAgentResults(
            transitions,
            "run-ok",
            results);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureCommitReadyAgentResults_throws_when_critic_is_stale()
    {
        RunStateTransitionService transitions = new();
        AgentResult topology = CommitReady(AgentType.Topology);
        topology.ResultId = "topology-v2";
        AgentResult critic = CommitReady(AgentType.Critic);
        critic.UpstreamResultFingerprints = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            [AgentType.Topology.ToString()] = "topology-v1",
            [AgentType.Cost.ToString()] = CommitReady(AgentType.Cost).ResultId,
            [AgentType.Compliance.ToString()] = CommitReady(AgentType.Compliance).ResultId,
        };

        Action act = () => RunStateTransitionEnforcement.EnsureCommitReadyAgentResults(
            transitions,
            "run-stale",
            [topology, CommitReady(AgentType.Cost), CommitReady(AgentType.Compliance), critic]);

        act.Should()
            .Throw<ConflictException>()
            .WithMessage("*Critic out of date*");
    }

    private static AgentResult CommitReady(AgentType agentType)
    {
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = "run-ok",
            TaskId = agentType.ToString(),
            AgentType = agentType,
            Claims = ["ok"],
        };
    }
}

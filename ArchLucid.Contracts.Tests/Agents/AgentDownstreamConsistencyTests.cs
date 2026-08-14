using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentDownstreamConsistencyTests
{
    [Fact]
    public void IsCriticStale_returns_true_when_stamped_upstream_result_ids_differ()
    {
        AgentResult topology = Upstream(AgentType.Topology, "topology-v1");
        AgentResult cost = Upstream(AgentType.Cost, "cost-v1");
        AgentResult compliance = Upstream(AgentType.Compliance, "compliance-v1");
        AgentResult critic = CriticWithStamp(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [AgentType.Topology.ToString()] = "topology-v0",
                [AgentType.Cost.ToString()] = "cost-v1",
                [AgentType.Compliance.ToString()] = "compliance-v1",
            });

        AgentDownstreamConsistency.IsCriticStale(
                critic,
                [topology, cost, compliance, critic])
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsCriticStale_returns_false_when_stamped_upstream_result_ids_match()
    {
        AgentResult topology = Upstream(AgentType.Topology, "topology-v1");
        AgentResult cost = Upstream(AgentType.Cost, "cost-v1");
        AgentResult compliance = Upstream(AgentType.Compliance, "compliance-v1");
        AgentResult critic = CriticWithStamp(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [AgentType.Topology.ToString()] = topology.ResultId,
                [AgentType.Cost.ToString()] = cost.ResultId,
                [AgentType.Compliance.ToString()] = compliance.ResultId,
            });

        AgentDownstreamConsistency.IsCriticStale(
                critic,
                [topology, cost, compliance, critic])
            .Should()
            .BeFalse();
    }

    [Fact]
    public void StampCriticResults_writes_upstream_fingerprints_on_critic_rows()
    {
        AgentResult topology = Upstream(AgentType.Topology, "topology-v1");
        AgentResult cost = Upstream(AgentType.Cost, "cost-v1");
        AgentResult compliance = Upstream(AgentType.Compliance, "compliance-v1");
        AgentResult critic = CommitReady(AgentType.Critic, "critic-v1");

        AgentDownstreamConsistency.StampCriticResults([topology, cost, compliance, critic]);

        critic.UpstreamResultFingerprints.Should().NotBeNull();
        critic.UpstreamResultFingerprints![AgentType.Topology.ToString()].Should().Be(topology.ResultId);
        critic.UpstreamResultFingerprints[AgentType.Cost.ToString()].Should().Be(cost.ResultId);
        critic.UpstreamResultFingerprints[AgentType.Compliance.ToString()].Should().Be(compliance.ResultId);
    }

    [Fact]
    public void Project_marks_stale_critic_when_upstream_re_executed()
    {
        AgentResult topology = Upstream(AgentType.Topology, "topology-v2");
        AgentResult cost = Upstream(AgentType.Cost, "cost-v1");
        AgentResult compliance = Upstream(AgentType.Compliance, "compliance-v1");
        AgentResult critic = CriticWithStamp(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [AgentType.Topology.ToString()] = "topology-v1",
                [AgentType.Cost.ToString()] = cost.ResultId,
                [AgentType.Compliance.ToString()] = compliance.ResultId,
            });

        IReadOnlyList<AgentExecutionOutcome> outcomes = RequiredAgentExecutionOutcomes.Project(
            [topology, cost, compliance, critic]);

        outcomes.Single(o => o.AgentType == AgentType.Critic).Outcome.Should().Be(AgentExecutionOutcomeKind.Stale);
        RequiredAgentExecutionOutcomes.HasCommitReadyOutcomes(outcomes).Should().BeFalse();
    }

    private static AgentResult Upstream(AgentType agentType, string resultId)
    {
        return new AgentResult
        {
            ResultId = resultId,
            RunId = "run-1",
            TaskId = agentType.ToString().ToLowerInvariant(),
            AgentType = agentType,
            Claims = ["ok"],
            CreatedUtc = DateTime.UtcNow,
        };
    }

    private static AgentResult CommitReady(AgentType agentType, string resultId)
    {
        return new AgentResult
        {
            ResultId = resultId,
            RunId = "run-1",
            TaskId = agentType.ToString().ToLowerInvariant(),
            AgentType = agentType,
            Claims = ["ok"],
            CreatedUtc = DateTime.UtcNow,
        };
    }

    private static AgentResult CriticWithStamp(IReadOnlyDictionary<string, string> stamp)
    {
        AgentResult critic = CommitReady(AgentType.Critic, "critic-v1");
        critic.UpstreamResultFingerprints = stamp.ToDictionary(
            static pair => pair.Key,
            static pair => pair.Value,
            StringComparer.Ordinal);

        return critic;
    }
}

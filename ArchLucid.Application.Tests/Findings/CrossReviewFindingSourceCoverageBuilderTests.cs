using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class CrossReviewFindingSourceCoverageBuilderTests
{
    [Fact]
    public void FromAgentResults_collects_distinct_agent_types_per_side()
    {
        CrossReviewFindingSourceCoverage coverage = CrossReviewFindingSourceCoverageBuilder.FromAgentResults(
            [Result(AgentType.Compliance), Result(AgentType.Compliance), Result(AgentType.Cost)],
            [Result(AgentType.Compliance)]);

        coverage.PriorAgentTypes.Should().BeEquivalentTo([AgentType.Compliance, AgentType.Cost]);
        coverage.CurrentAgentTypes.Should().BeEquivalentTo([AgentType.Compliance]);
    }

    [Fact]
    public void HasReducedCoverage_is_true_when_a_prior_agent_did_not_run_again()
    {
        CrossReviewFindingSourceCoverage coverage = CrossReviewFindingSourceCoverageBuilder.FromAgentResults(
            [Result(AgentType.Compliance), Result(AgentType.Cost)],
            [Result(AgentType.Compliance)]);

        coverage.HasReducedCoverage.Should().BeTrue();
        coverage.AgentTypesMissingFromCurrent.Should().Equal(AgentType.Cost);
    }

    /// <summary>A newer review running <em>more</em> analysis is not reduced coverage.</summary>
    [Fact]
    public void HasReducedCoverage_is_false_when_the_newer_review_added_agents()
    {
        CrossReviewFindingSourceCoverage coverage = CrossReviewFindingSourceCoverageBuilder.FromAgentResults(
            [Result(AgentType.Compliance)],
            [Result(AgentType.Compliance), Result(AgentType.Cost)]);

        coverage.HasReducedCoverage.Should().BeFalse();
        coverage.CoversInCurrent(AgentType.Cost).Should().BeTrue();
    }

    [Fact]
    public void CoversInCurrent_is_false_for_an_agent_absent_from_the_newer_review()
    {
        CrossReviewFindingSourceCoverage coverage = CrossReviewFindingSourceCoverageBuilder.FromAgentResults(
            [Result(AgentType.Topology)],
            []);

        coverage.CoversInCurrent(AgentType.Topology).Should().BeFalse();
    }

    [Fact]
    public void FromAgentResults_rejects_null_collections()
    {
        Action act = () => CrossReviewFindingSourceCoverageBuilder.FromAgentResults(null!, []);

        act.Should().Throw<ArgumentNullException>();
    }

    private static AgentResult Result(AgentType agentType)
    {
        return new AgentResult { AgentType = agentType };
    }
}

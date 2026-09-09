using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputTraceFindingCitationCoverageApplicatorTests
{
    [Theory]
    [InlineData(StructuralExecutionMode.Real, "Simulator", true)]
    [InlineData(StructuralExecutionMode.Mixed, "Simulator", true)]
    [InlineData(StructuralExecutionMode.Simulator, "Real", false)]
    [InlineData(StructuralExecutionMode.Fallback, "Real", false)]
    [InlineData(null, "Real", true)]
    [InlineData(null, "Simulator", false)]
    public void ShouldEvaluateFindingCitationCoverage_respects_task_and_host_modes(
        StructuralExecutionMode? taskMode,
        string hostMode,
        bool expected)
    {
        bool actual = AgentOutputTraceFindingCitationCoverageApplicator.ShouldEvaluateFindingCitationCoverage(
            taskMode,
            hostMode);

        actual.Should().Be(expected);
    }

    [Fact]
    public void Apply_real_task_sets_finding_citation_coverage_ratio_from_parsed_findings()
    {
        AgentOutputSemanticScore semantic = new();
        string parsedJson =
            """
            {"findings":[{"findingId":"f-uncited","severity":"High","description":"Long enough description text.","enforcementTier":"PolicyViolation","evidenceRefs":[]}]}
            """;

        AgentOutputTraceFindingCitationCoverageApplicator.Apply(
            semantic,
            parsedJson,
            StructuralExecutionMode.Real,
            hostAgentExecutionMode: "Simulator");

        semantic.FindingCitationCoverageRatio.Should().Be(0.0);
    }

    [Fact]
    public void Apply_simulator_task_leaves_finding_citation_coverage_ratio_null()
    {
        AgentOutputSemanticScore semantic = new();
        string parsedJson =
            """
            {"findings":[{"findingId":"f-uncited","severity":"High","description":"Long enough description text.","enforcementTier":"PolicyViolation","evidenceRefs":[]}]}
            """;

        AgentOutputTraceFindingCitationCoverageApplicator.Apply(
            semantic,
            parsedJson,
            StructuralExecutionMode.Simulator,
            hostAgentExecutionMode: "Real");

        semantic.FindingCitationCoverageRatio.Should().BeNull();
    }
}

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandLaneBSemanticScoreIndexTests
{
    [Fact]
    public void BuildFromTraces_populates_faithfulness_ratio_when_evidence_exists()
    {
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-abc",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = "{\"findings\":[]}",
        };

        AgentEvidencePackage evidence = new()
        {
            RunId = "run-1",
        };

        Mock<IAgentResultEvidenceFaithfulnessChecker> faithfulnessChecker = new();
        faithfulnessChecker
            .Setup(static checker => checker.Evaluate(It.IsAny<string>(), It.IsAny<AgentEvidencePackage>()))
            .Returns(new AgentResultEvidenceFaithfulnessReport(1, 1, 0, 0, 0.82, []));

        Dictionary<string, AgentOutputSemanticScore> index =
            FindingSemanticSupportBandLaneBSemanticScoreIndex.BuildFromTraces(
                [trace],
                evidence,
                faithfulnessChecker.Object);

        index.Should().ContainKey("trace-abc");
        index["trace-abc"].AgentResultFaithfulnessSupportRatio.Should().Be(0.82);
    }

    [Fact]
    public void BuildFromTraces_skips_traces_without_lane_b_signal()
    {
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-abc",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = "{\"findings\":[]}",
        };

        Dictionary<string, AgentOutputSemanticScore> index =
            FindingSemanticSupportBandLaneBSemanticScoreIndex.BuildFromTraces(
                [trace],
                evidence: null,
                Mock.Of<IAgentResultEvidenceFaithfulnessChecker>());

        index.Should().BeEmpty();
    }
}

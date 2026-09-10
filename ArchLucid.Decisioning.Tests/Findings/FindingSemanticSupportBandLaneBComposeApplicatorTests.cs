using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandLaneBComposeApplicatorTests
{
    [Fact]
    public void ApplyToAgentResults_missing_lane_b_row_downgrades_supported_to_unchecked()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "finding-1",
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Supported,
        };

        AgentResult result = new()
        {
            TaskId = "task-1",
            Findings = [finding],
        };

        FindingSemanticSupportBandLaneBComposeApplicator.ApplyToAgentResults(
            [result],
            new Dictionary<string, AgentOutputSemanticScore>(StringComparer.Ordinal),
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["task-1"] = "trace-1",
            });

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public void ApplyToAgentResults_lane_b_mismatch_maps_unsupported()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "finding-1",
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Supported,
        };

        AgentResult result = new()
        {
            TaskId = "task-1",
            Findings = [finding],
        };

        Dictionary<string, AgentOutputSemanticScore> semanticScores = new(StringComparer.Ordinal)
        {
            ["trace-1"] = new()
            {
                TraceId = "trace-1",
                AgentResultFaithfulnessSupportRatio = 0.1,
            },
        };

        FindingSemanticSupportBandLaneBComposeApplicator.ApplyToAgentResults(
            [result],
            semanticScores,
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["task-1"] = "trace-1",
            });

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unsupported);
    }
}

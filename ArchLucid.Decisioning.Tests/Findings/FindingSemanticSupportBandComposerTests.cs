using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandComposerTests
{
    [Fact]
    public void ComposeForWorking_missing_async_row_returns_unchecked_not_supported()
    {
        FindingSemanticSupportBand band = FindingSemanticSupportBandComposer.ComposeForWorking(
            FindingSemanticSupportBand.Supported,
            asyncSemanticScore: null);

        band.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public void ComposeForWorking_uses_async_lane_b_score_when_present()
    {
        AgentOutputSemanticScore semantic = new()
        {
            TraceId = "trace-1",
            FindingCitationCoverageRatio = 0.85,
        };

        FindingSemanticSupportBand band = FindingSemanticSupportBandComposer.ComposeForWorking(
            FindingSemanticSupportBand.Unchecked,
            semantic);

        band.Should().Be(FindingSemanticSupportBand.Supported);
    }

    [Fact]
    public void ComposeForWorking_preserves_not_scored_for_checklist_exempt()
    {
        FindingSemanticSupportBand band = FindingSemanticSupportBandComposer.ComposeForWorking(
            FindingSemanticSupportBand.NotScored,
            asyncSemanticScore: null);

        band.Should().Be(FindingSemanticSupportBand.NotScored);
    }

    [Fact]
    public void ComposeForWorking_resolves_trace_semantic_score_from_dictionary()
    {
        AgentOutputSemanticScore semantic = new()
        {
            TraceId = "trace-abc",
            AgentResultFaithfulnessSupportRatio = 0.2,
        };

        Dictionary<string, AgentOutputSemanticScore> byTrace = new(StringComparer.Ordinal)
        {
            ["trace-abc"] = semantic,
        };

        FindingSemanticSupportBand band = FindingSemanticSupportBandComposer.ComposeForWorking(
            FindingSemanticSupportBand.Supported,
            "trace-abc",
            byTrace);

        band.Should().Be(FindingSemanticSupportBand.Unsupported);
    }
}

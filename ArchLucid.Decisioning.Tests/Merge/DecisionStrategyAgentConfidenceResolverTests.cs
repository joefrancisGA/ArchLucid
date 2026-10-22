using ArchLucid.Contracts.Agents;
using ArchLucid.Decisioning.Merge;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Merge;

[Trait("Category", "Unit")]
public sealed class DecisionStrategyAgentConfidenceResolverTests
{
    [Fact]
    public void ResolveAcceptPriorWithSource_prefers_calibrated_when_in_range()
    {
        AgentResult result = new() { Confidence = 0.41, CalibratedConfidence = 0.88 };

        (double prior, string source) = DecisionStrategyAgentConfidenceResolver.ResolveAcceptPriorWithSource(result);

        prior.Should().Be(0.88);
        source.Should().Be(MergeAcceptPriorConfidenceSources.Calibrated);
    }

    [Fact]
    public void ResolveAcceptPriorWithSource_falls_back_to_raw_when_calibration_missing()
    {
        AgentResult result = new() { Confidence = 0.62, CalibratedConfidence = null };

        (double prior, string source) = DecisionStrategyAgentConfidenceResolver.ResolveAcceptPriorWithSource(result);

        prior.Should().Be(0.62);
        source.Should().Be(MergeAcceptPriorConfidenceSources.Raw);
    }

    [Fact]
    public void ResolveAcceptPriorWithSource_ignores_out_of_range_calibration()
    {
        AgentResult result = new() { Confidence = 0.55, CalibratedConfidence = 1.2 };

        (double prior, string source) = DecisionStrategyAgentConfidenceResolver.ResolveAcceptPriorWithSource(result);

        prior.Should().Be(0.55);
        source.Should().Be(MergeAcceptPriorConfidenceSources.Raw);
    }
}

using ArchLucid.Core.Explanation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Explanation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunExplanationConfidenceCalloutBuilderTests
{
    [Fact]
    public void FromAggregateJson_maps_string_encoded_faithfulness_support_ratio()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": "0.55"
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_deterministic_fallback_flag()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": "true"
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }
}

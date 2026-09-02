using ArchLucid.Core.Explanation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Explanation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunExplanationConfidenceCalloutBuilderTests
{
    [Fact]
    public void FromAggregateJson_maps_numeric_citation_count()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 2
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

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

    [Fact]
    public void FromAggregateJson_maps_numeric_deterministic_fallback_flag()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromAggregateJson_maps_whole_number_double_deterministic_fallback_flag()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": 1.0
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_whole_number_deterministic_fallback_flag()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": "1.0"
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromAggregateJson_maps_boolean_false_faithfulness_support_ratio_as_hold()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": false
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromAggregateJson_maps_numeric_faithfulness_warning()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessWarning": 42
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("42");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_citation_count()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": "2"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_maps_boolean_faithfulness_warning()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessWarning": true
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("true");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_maps_whole_number_citation_count()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 2.0
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_whole_number_citation_count()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": "2.0"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_boolean_faithfulness_support_ratio_as_hold()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": "false"
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromAggregateJson_maps_boolean_citation_count()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": true
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(1);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_boolean_citation_count()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": "true"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(1);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }
}

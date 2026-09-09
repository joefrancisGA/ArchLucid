using System.Text.Json;

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
    public void FromAggregateJson_maps_whole_number_double_faithfulness_warning()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessWarning": 42.0
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("42");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_whole_number_double_faithfulness_warning()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessWarning": "42.0"
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
    public void FromAggregateJson_maps_string_encoded_boolean_faithfulness_warning()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessWarning": "True"
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

    [Fact]
    public void FromAggregateJson_maps_string_encoded_on_faithfulness_support_ratio()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": "on",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(1.0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_on_citation_count()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": "on"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(1);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_on_deterministic_fallback_flag()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": "on"
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromAggregateJson_treats_omitted_citations_as_empty_for_disposition()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_maps_object_citation_as_single_citation_count()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": {
                "id": "c1"
              }
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(1);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_maps_string_encoded_decision_count_without_throwing()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "decisionCount": "5"
            }
            """);

        signals.Should().NotBeNull();
        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse("""{"decisionCount":"5"}""").RootElement).Should().Be(5);
    }
}

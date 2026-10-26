using System.Text.Json;

using ArchLucid.Core.Explanation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Explanation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunExplanationConfidenceCalloutBuilderTests
{
    [Fact]
    public void FromAggregateJson_returns_null_for_malformed_json()
    {
        RunExplanationConfidenceCalloutBuilder.FromAggregateJson("{\"citations\":")
            .Should()
            .BeNull();
    }

    [Fact]
    public void Missing_signals_hold_and_describe_uncollected_aggregate()
    {
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(null).Should().Be("HOLD");

        string? line = RunExplanationConfidenceCalloutBuilder.BuildLimitationsLine(null);
        line.Should().Be(
            "**Explanation confidence:** aggregate narrative was not collected — verify review detail before sponsor send.");

        string? export = RunExplanationConfidenceCalloutBuilder.BuildExportCallout(null);
        export.Should().Be(
            "Explanation confidence: aggregate narrative was not collected — verify review detail before sponsor send.");
    }

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
    public void FromAggregateJson_scales_percent_suffixed_faithfulness_support_ratio()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": "55%",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_scales_percent_suffixed_faithfulness_support_ratio_with_interior_space_before_percent()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": "75 %",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.75);
    }

    [Fact]
    public void FromAggregateJson_scales_percent_suffixed_faithfulness_support_ratio_with_leading_space_before_digits()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": " 75%",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.75);
    }

    [Fact]
    public void FromAggregateJson_scales_percent_suffixed_faithfulness_support_ratio_in_sole_element_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": ["55%"],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_scales_percent_suffixed_faithfulness_support_ratio_at_one_hundred_in_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": ["100%"],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(1.0);
    }

    [Fact]
    public void FromAggregateJson_scales_percent_suffixed_faithfulness_support_ratio_in_nested_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": [["55%"]],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_faithfulness_ratio_when_later_duplicate_is_one_in_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.55,
              "FAITHFULNESSSUPPORTRATIO": ["1"],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_maps_unit_faithfulness_support_ratio_in_sole_element_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": [1],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(1.0);
    }

    [Fact]
    public void FromAggregateJson_maps_string_one_faithfulness_support_ratio_in_sole_element_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": ["1"],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(1.0);
    }

    [Fact]
    public void FromAggregateJson_maps_unit_faithfulness_support_ratio_in_sole_element_decimal_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": [0.95],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.95);
    }

    [Fact]
    public void FromAggregateJson_maps_whole_number_string_faithfulness_in_sole_element_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": ["100"],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(1.0);
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_faithfulness_ratio_when_later_duplicate_is_hundred_percent_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.55,
              "FAITHFULNESSSUPPORTRATIO": ["100%"],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_faithfulness_ratio_when_later_duplicate_is_hundred_in_numeric_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.55,
              "FAITHFULNESSSUPPORTRATIO": [100],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_faithfulness_ratio_when_later_duplicate_is_hundred_string_array_without_percent()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.55,
              "FAITHFULNESSSUPPORTRATIO": ["100"],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_ignores_boolean_faithfulness_support_ratio_in_sole_element_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": [true],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().BeNull();
    }

    [Fact]
    public void FromAggregateJson_maps_whole_number_faithfulness_in_sole_element_numeric_array_without_percent()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": [55],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_scales_whole_number_string_faithfulness_support_ratio_scalar_without_percent()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": "55",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_scales_whole_number_faithfulness_support_ratio_in_nested_numeric_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": [[55]],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
    }

    [Fact]
    public void FromAggregateJson_ignores_numeric_whole_faithfulness_ratio_in_array_as_duplicate_alias_poison()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.55,
              "FAITHFULNESSSUPPORTRATIO": [55],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.55);
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
    public void FromAggregateJson_treats_null_citations_as_zero_for_disposition()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": null
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_treats_unparseable_string_citations_as_zero_for_disposition()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": "none"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_treats_empty_object_citation_entries_as_zero_for_disposition()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [ {} ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_array_count_when_later_duplicate_is_one_numeric_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [ { "id": "c1" }, { "id": "c2" } ],
              "CITATIONS": [ 1 ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_ratio_when_later_duplicate_is_string_numeric_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.45,
              "FAITHFULNESSSUPPORTRATIO": [ "42" ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.45);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_ratio_when_later_duplicate_is_numeric_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.45,
              "FAITHFULNESSSUPPORTRATIO": [ 42 ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.45);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_array_count_when_later_duplicate_is_string_one_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [ { "id": "c1" }, { "id": "c2" } ],
              "CITATIONS": [ "1" ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_array_count_when_later_duplicate_is_string_numeric_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [ { "id": "c1" }, { "id": "c2" } ],
              "CITATIONS": [ "42" ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_array_count_when_later_duplicate_is_numeric_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [ { "id": "c1" }, { "id": "c2" } ],
              "CITATIONS": [ 42 ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_counts_numeric_citation_array_entries_for_disposition()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [42, "dec-1"]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_ignores_negative_numeric_citation_entries()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [-1]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_flattens_nested_array_citations_for_disposition()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [
                [],
                [ { "id": "c1" }, { "id": "c2" } ]
              ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_treats_nested_empty_citation_wrappers_as_zero_for_disposition()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [ [] ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_treats_empty_string_citations_as_zero_for_disposition()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": ""
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
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

    [Fact]
    public void FromAggregateJson_ignores_out_of_range_whole_number_counts_without_throwing()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "decisionCount": "1e20",
              "unresolvedIssueCount": "1e20",
              "complianceGapCount": "1e20"
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.95);
        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse("""{"decisionCount":"1e20"}""").RootElement).Should().BeNull();
    }

    [Fact]
    public void FromAggregateJson_ignores_out_of_range_numeric_whole_number_counts()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "decisionCount": 1e20,
              "unresolvedIssueCount": 1e20,
              "complianceGapCount": 1e20
            }
            """);

        signals.Should().NotBeNull();
        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse("""{"decisionCount":1e20}""").RootElement).Should().BeNull();
    }

    [Fact]
    public void FromAggregateJson_ignores_negative_whole_number_counts_without_throwing()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "decisionCount": -1,
              "unresolvedIssueCount": -2,
              "complianceGapCount": -3
            }
            """);

        signals.Should().NotBeNull();
        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse("""{"decisionCount":-1}""").RootElement).Should().BeNull();
        RunExplanationRiskCalloutBuilder.TryParseUnresolvedIssueCount(
            JsonDocument.Parse("""{"unresolvedIssueCount":-2}""").RootElement).Should().BeNull();
        RunExplanationComplianceCalloutBuilder.TryParseComplianceGapCount(
            JsonDocument.Parse("""{"complianceGapCount":-3}""").RootElement).Should().BeNull();
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_decision_count_when_later_duplicate_is_zero()
    {
        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse(
                """
                {
                  "decisionCount": 5,
                  "DECISIONCOUNT": 0
                }
                """).RootElement).Should().Be(5);
    }

    [Fact]
    public void FromAggregateJson_preserves_explicit_zero_decision_count_when_only_value()
    {
        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse("""{"decisionCount":0}""").RootElement).Should().Be(0);
    }

    [Fact]
    public void FromAggregateJson_ignores_negative_string_encoded_whole_number_counts()
    {
        RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "decisionCount": "-1",
              "unresolvedIssueCount": "-2",
              "complianceGapCount": "-3"
            }
            """).Should().NotBeNull();

        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse("""{"decisionCount":"-1"}""").RootElement).Should().BeNull();
        RunExplanationRiskCalloutBuilder.TryParseUnresolvedIssueCount(
            JsonDocument.Parse("""{"unresolvedIssueCount":"-2"}""").RootElement).Should().BeNull();
        RunExplanationComplianceCalloutBuilder.TryParseComplianceGapCount(
            JsonDocument.Parse("""{"complianceGapCount":"-3"}""").RootElement).Should().BeNull();
    }

    [Fact]
    public void FromAggregateJson_returns_null_for_non_object_root()
    {
        RunExplanationConfidenceSignals? signals =
            RunExplanationConfidenceCalloutBuilder.FromAggregateJson("[]");

        signals.Should().BeNull();
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_faithfulness_ratio_when_later_duplicate_is_zero()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "FAITHFULNESSSUPPORTRATIO": 0,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.95);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_preserves_explicit_zero_faithfulness_ratio_when_only_value()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_citation_count_when_later_duplicate_is_zero()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 2,
              "CITATIONS": 0
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_preserves_explicit_zero_citation_count_when_only_value()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 0
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_deterministic_fallback_flag_when_later_duplicate_is_false()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": true,
              "DETERMINISTICFALLBACKUSED": false,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void FromAggregateJson_preserves_explicit_false_deterministic_fallback_flag_when_only_value()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": false,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_faithfulness_warning_when_later_duplicate_is_empty()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations missing",
              "FAITHFULNESSWARNING": "",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations missing");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void FromAggregateJson_uses_non_empty_risk_posture_when_later_duplicate_is_empty()
    {
        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(
            JsonDocument.Parse(
                """
                {
                  "riskPosture": "elevated",
                  "RISKPOSTURE": ""
                }
                """).RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_nested_empty_wrapper_object()
    {
        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(
            JsonDocument.Parse(
                """
                {
                  "riskPosture": "elevated",
                  "RISKPOSTURE": {"wrapper":{}}
                }
                """).RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_zero_numeric()
    {
        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(
            JsonDocument.Parse(
                """
                {
                  "riskPosture": "elevated",
                  "RISKPOSTURE": 0
                }
                """).RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_arbitrary_numeric()
    {
        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(
            JsonDocument.Parse(
                """
                {
                  "riskPosture": "elevated",
                  "RISKPOSTURE": 42
                }
                """).RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_arbitrary_numeric_string()
    {
        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(
            JsonDocument.Parse(
                """
                {
                  "riskPosture": "elevated",
                  "RISKPOSTURE": "42"
                }
                """).RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_arbitrary_numeric_string()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations missing",
              "FAITHFULNESSWARNING": "42",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations missing");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_nested_empty_wrapper_object()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations missing",
              "FAITHFULNESSWARNING": {"wrapper":{}},
              "citations": [{"id":"c-1"}]
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations missing");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_false_boolean()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations missing",
              "FAITHFULNESSWARNING": false,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations missing");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_true_boolean()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations missing",
              "FAITHFULNESSWARNING": true,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations missing");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_count_when_later_duplicate_is_true_boolean()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 3,
              "CITATIONS": true
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(3);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_array_count_when_later_duplicate_is_true_boolean()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [{"id":"c-1"},{"id":"c-2"}],
              "CITATIONS": true
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_zero_citation_array_when_later_duplicate_is_true_boolean()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [],
              "CITATIONS": true
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(0);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_zero_numeric()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations missing",
              "FAITHFULNESSWARNING": 0,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations missing");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_one_numeric()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations missing",
              "FAITHFULNESSWARNING": 1,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations missing");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_decision_count_when_later_duplicate_is_one_numeric()
    {
        using JsonDocument document = JsonDocument.Parse("""{"decisionCount":5,"DECISIONCOUNT":1}""");

        RunExplanationCostCalloutBuilder.TryParseDecisionCount(document.RootElement).Should().Be(5);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_array_count_when_later_duplicate_is_one_numeric()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [{"id":"c-1"},{"id":"c-2"}],
              "CITATIONS": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_array_count_when_later_duplicate_is_arbitrary_numeric()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [{"id":"c-1"},{"id":"c-2"}],
              "CITATIONS": 42
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_array_count_when_later_duplicate_is_arbitrary_numeric_string()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [{"id":"c-1"},{"id":"c-2"}],
              "CITATIONS": "42"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void FromAggregateJson_counts_object_citation_when_later_case_variant_id_is_empty()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [{"id":"c-1","ID":""}]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(1);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_ignores_citation_array_entries_with_blank_text_and_id_poison_shape()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [{"id":"c-1"},{"text":"   ","id":"spoof"}]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(1);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_uses_non_empty_citations_when_later_duplicate_is_blank_text_object_with_id()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [{"id":"c-1"}],
              "CITATIONS": {"text":"   ","id":"spoof"}
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(1);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_ratio_when_later_duplicate_is_nested_empty_wrapper_object()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "FAITHFULNESSSUPPORTRATIO": {"wrapper":{}},
              "citations": [{"id":"c-1"}]
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.95);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_ratio_when_later_duplicate_is_one_numeric()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.45,
              "FAITHFULNESSSUPPORTRATIO": 1,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.45);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_ratio_when_later_duplicate_is_arbitrary_numeric()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.45,
              "FAITHFULNESSSUPPORTRATIO": 42,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.45);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_ratio_when_later_duplicate_is_arbitrary_numeric_string()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.45,
              "FAITHFULNESSSUPPORTRATIO": "42",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.45);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_decision_count_when_later_duplicate_is_nested_empty_wrapper_object()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"decisionCount":3,"DECISIONCOUNT":{"wrapper":{}}}""");

        RunExplanationCostCalloutBuilder.TryParseDecisionCount(document.RootElement).Should().Be(3);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_when_later_duplicate_is_nested_empty_wrapper_object()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": true,
              "DETERMINISTICFALLBACKUSED": {"wrapper":{}},
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_when_later_duplicate_is_zero_numeric()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": true,
              "DETERMINISTICFALLBACKUSED": 0,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_risk_posture_from_sole_string_array_alias()
    {
        using JsonDocument document = JsonDocument.Parse("""{"riskPosture":["elevated"]}""");

        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(document.RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_faithfulness_warning_from_sole_nested_string_array_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": [ [ "Citations incomplete" ] ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_risk_posture_from_sole_nested_string_array_alias()
    {
        using JsonDocument document = JsonDocument.Parse("""{"riskPosture":[["elevated"]]}""");

        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(document.RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_nested_prose_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations incomplete",
              "FAITHFULNESSWARNING": [ [ "Nested spoof warning" ] ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_decision_count_from_sole_numeric_array_alias()
    {
        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse("""{"decisionCount":[3]}""").RootElement).Should().Be(3);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_decision_count_from_sole_nested_numeric_array_alias()
    {
        RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse("""{"decisionCount":[[3]]}""").RootElement).Should().Be(3);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_faithfulness_ratio_from_sole_nested_numeric_array_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": [ [ 0.95 ] ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.95);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_deterministic_fallback_from_sole_nested_boolean_array_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "deterministicFallbackUsed": [ [ true ] ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_count_when_later_duplicate_is_nested_citation_object_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 2,
              "CITATIONS": [ [ { "id": "spoof-citation" } ] ],
              "faithfulnessWarning": "Citations incomplete"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_scalar_object_prose_poison_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations incomplete",
              "FAITHFULNESSWARNING": { "text": "Nested spoof warning" },
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_count_when_later_duplicate_is_flat_citation_object_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 2,
              "CITATIONS": [ { "id": "spoof-citation" } ],
              "faithfulnessWarning": "Citations incomplete"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_count_when_later_duplicate_is_nested_numeric_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 2,
              "CITATIONS": [ [ 4 ] ],
              "faithfulnessWarning": "Citations incomplete"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_faithfulness_ratio_from_sole_numeric_array_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": [ 0.95 ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.95);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_ratio_when_later_duplicate_is_supported_ratio_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "FAITHFULNESSSUPPORTRATIO": [ 0.5 ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.95);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_citation_count_from_sole_numeric_array_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": [ 3 ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(3);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_count_when_later_duplicate_is_numeric_array_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "citations": 2,
              "CITATIONS": [ 3 ]
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_deterministic_fallback_from_sole_boolean_array_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "deterministicFallbackUsed": [ true ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_numeric_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"riskPosture":"elevated","RISKPOSTURE":[42]}""");

        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(document.RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_one_string_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations incomplete",
              "FAITHFULNESSWARNING": [ "1" ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_supported_prose_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations incomplete",
              "FAITHFULNESSWARNING": [ "Different warning" ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_multi_entry_prose_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations incomplete",
              "FAITHFULNESSWARNING": [ "spoof-a", "spoof-b" ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_unresolved_issue_count_when_later_duplicate_is_one_string_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"unresolvedIssueCount":2,"UNRESOLVEDISSUECOUNT":["1"]}""");

        RunExplanationRiskCalloutBuilder.TryParseUnresolvedIssueCount(document.RootElement).Should().Be(2);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_string_numeric_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"riskPosture":"elevated","RISKPOSTURE":["42"]}""");

        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(document.RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_supported_prose_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"riskPosture":"elevated","RISKPOSTURE":["moderate"]}""");

        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(document.RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_multi_entry_prose_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"riskPosture":"elevated","RISKPOSTURE":["spoof-a","spoof-b"]}""");

        RunExplanationRiskCalloutBuilder.TryParseRiskPosture(document.RootElement).Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_string_numeric_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": "Citations incomplete",
              "FAITHFULNESSWARNING": [ "42" ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_compliance_gap_count_when_later_duplicate_is_string_numeric_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"complianceGapCount":2,"COMPLIANCEGAPCOUNT":["42"]}""");

        RunExplanationComplianceCalloutBuilder.TryParseComplianceGapCount(document.RootElement).Should().Be(2);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_decision_count_when_later_duplicate_is_string_numeric_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"decisionCount":3,"DECISIONCOUNT":["42"]}""");

        RunExplanationCostCalloutBuilder.TryParseDecisionCount(document.RootElement).Should().Be(3);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_decision_count_when_later_duplicate_is_one_numeric_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"decisionCount":3,"DECISIONCOUNT":[1]}""");

        RunExplanationCostCalloutBuilder.TryParseDecisionCount(document.RootElement).Should().Be(3);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_decision_count_when_later_duplicate_is_numeric_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"decisionCount":3,"DECISIONCOUNT":[42]}""");

        RunExplanationCostCalloutBuilder.TryParseDecisionCount(document.RootElement).Should().Be(3);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_compliance_gap_count_when_later_duplicate_is_numeric_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"complianceGapCount":2,"COMPLIANCEGAPCOUNT":[42]}""");

        RunExplanationComplianceCalloutBuilder.TryParseComplianceGapCount(document.RootElement).Should().Be(2);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_unresolved_issue_count_when_later_duplicate_is_numeric_poison_array()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{"unresolvedIssueCount":2,"UNRESOLVEDISSUECOUNT":[42]}""");

        RunExplanationRiskCalloutBuilder.TryParseUnresolvedIssueCount(document.RootElement).Should().Be(2);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_unresolved_issue_count_when_later_duplicate_is_nested_empty_wrapper_object()
    {
        RunExplanationRiskCalloutBuilder.TryParseUnresolvedIssueCount(
            JsonDocument.Parse(
                """{"unresolvedIssueCount":2,"UNRESOLVEDISSUECOUNT":{"wrapper":{}}}""")
                .RootElement).Should().Be(2);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_deterministic_fallback_from_sole_nested_boolean_array_on_legacy_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "usedDeterministicFallback": [[true]],
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_false_when_later_legacy_duplicate_is_nested_boolean_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": false,
              "USEDDETERMINISTICFALLBACK": [[true]],
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_false_when_later_canonical_duplicate_is_nested_boolean_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": false,
              "DETERMINISTICFALLBACKUSED": [[true]],
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_legacy_deterministic_fallback_false_when_later_duplicate_is_nested_boolean_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "usedDeterministicFallback": false,
              "USEDDETERMINISTICFALLBACK": [[true]],
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_prefers_canonical_false_deterministic_fallback_over_legacy_true()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": false,
              "usedDeterministicFallback": true,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_legacy_deterministic_fallback_when_canonical_alias_is_null()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": null,
              "usedDeterministicFallback": true,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_legacy_deterministic_fallback_when_canonical_alias_is_empty_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": [],
              "usedDeterministicFallback": true,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_explicit_false_from_numeric_zero_deterministic_fallback_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": 0,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_prefers_numeric_zero_canonical_deterministic_fallback_over_legacy_true()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": 0,
              "usedDeterministicFallback": true,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_prefers_string_zero_canonical_deterministic_fallback_over_legacy_true()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": "0",
              "usedDeterministicFallback": true,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_explicit_false_from_legacy_numeric_zero_deterministic_fallback_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "usedDeterministicFallback": 0,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_legacy_numeric_zero_when_later_duplicate_is_nested_boolean_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "usedDeterministicFallback": 0,
              "USEDDETERMINISTICFALLBACK": [[true]],
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_false_when_later_duplicate_is_numeric_one_poison_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": false,
              "DETERMINISTICFALLBACKUSED": 1,
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_false_when_later_duplicate_is_string_one_poison_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": false,
              "DETERMINISTICFALLBACKUSED": "1",
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_false_when_later_duplicate_is_numeric_one_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": false,
              "DETERMINISTICFALLBACKUSED": [1],
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_true_when_later_duplicate_is_zero_numeric_poison_array()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": true,
              "DETERMINISTICFALLBACKUSED": [0],
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_false_when_later_duplicate_is_string_true_poison_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": false,
              "DETERMINISTICFALLBACKUSED": "true",
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_deterministic_fallback_true_when_later_duplicate_is_string_false_poison_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "deterministicFallbackUsed": true,
              "DETERMINISTICFALLBACKUSED": "false",
              "faithfulnessSupportRatio": 0.95,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeTrue();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("HOLD");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_ratio_when_later_duplicate_is_on_string_poison_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "FAITHFULNESSSUPPORTRATIO": "on",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessSupportRatio.Should().Be(0.95);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_confidence_when_later_case_variant_is_on_string_poison_alias()
    {
        const string json =
            """{"reasoning":"Main","confidence":0.85,"CONFIDENCE":"on"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.85m);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_citation_count_when_later_duplicate_is_on_string_poison_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "citations": 2,
              "faithfulnessSupportRatio": 0.95,
              "CITATIONS": "on"
            }
            """);

        signals.Should().NotBeNull();
        signals!.CitationCount.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_decision_count_when_later_duplicate_is_on_string_poison_alias()
    {
        int? count = RunExplanationCostCalloutBuilder.TryParseDecisionCount(
            JsonDocument.Parse(
                """
                {
                  "decisionCount": 3,
                  "DECISIONCOUNT": "on"
                }
                """).RootElement);

        count.Should().Be(3);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_faithfulness_warning_when_later_duplicate_is_on_string_poison_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessWarning": "Citations incomplete",
              "faithfulnessSupportRatio": 0.95,
              "FAITHFULNESSWARNING": "on",
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_keeps_risk_posture_when_later_duplicate_is_on_string_poison_alias()
    {
        string? posture = RunExplanationRiskCalloutBuilder.TryParseRiskPosture(
            JsonDocument.Parse(
                """
                {
                  "riskPosture": "elevated",
                  "RISKPOSTURE": "on"
                }
                """).RootElement);

        posture.Should().Be("elevated");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_on_string_poison_alias()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main explanation","REASONING":"on"}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.Reasoning.Should().Be("Main explanation");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_on_string_poison_alias()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":"on"}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_on_string_poison_alias()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":"on"}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_alternatives_when_later_case_variant_is_on_string_poison_alias()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","alternativesConsidered":["Keep monolith"],"ALTERNATIVESCONSIDERED":"on"}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_caveats_when_later_case_variant_is_on_string_poison_alias()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","caveats":["Latency risk"],"CAVEATS":"on"}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.Caveats.Should().Equal("Latency risk");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_on_string_poison_array()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":["on"]}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_ignores_out_of_range_numeric_deterministic_fallback_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "deterministicFallbackUsed": 1e20,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_ignores_negative_numeric_deterministic_fallback_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "deterministicFallbackUsed": -1,
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.DeterministicFallbackUsed.Should().BeFalse();
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("PASS");
    }

    [Fact]
    public void RunExplanation_structured_json_object_evidence_ref_survives_empty_id_duplicate()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","evidenceRefs":[{"id":"dec-1","ID":""}]}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_object_reasoning_survives_empty_text_duplicate()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":{"text":"Recovered explanation","TEXT":""}}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void RunExplanation_structured_json_object_reasoning_accepts_id_only_object_shape()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":{"id":"Recovered via id","ID":""}}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.Reasoning.Should().Be("Recovered via id");
    }

    [Fact]
    public void RunExplanation_structured_json_alternatives_survive_trailing_blank_text_object_with_id()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","alternativesConsidered":["Keep monolith"],"ALTERNATIVESCONSIDERED":{"text":"   ","id":"spoof"}}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void RunExplanation_structured_json_evidence_refs_survive_trailing_blank_text_object_with_id()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":{"text":"   ","id":"spoof"}}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_reasoning_survives_trailing_blank_text_object_array_with_id()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Recovered explanation","Reasoning":[{"text":"   ","id":"spoof"}]}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void RunExplanation_structured_json_alternatives_survive_trailing_blank_text_object_array_with_id()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","alternativesConsidered":["Keep monolith"],"ALTERNATIVESCONSIDERED":[{"text":"   ","id":"spoof"}]}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void RunExplanation_structured_json_evidence_refs_survive_trailing_blank_text_object_array_with_id()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":[{"text":"   ","id":"spoof"}]}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_alternatives_ignore_in_array_blank_text_object_with_id()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","alternativesConsidered":["Keep monolith",{"text":"   ","id":"spoof"}]}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void RunExplanation_structured_json_evidence_refs_ignore_in_array_blank_text_object_with_id()
    {
        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(
            """{"reasoning":"Main","evidenceRefs":["dec-1",{"text":"   ","id":"spoof"}]}""",
            out StructuredExplanation? structured);

        ok.Should().BeTrue();
        structured!.EvidenceRefs.Should().Equal("dec-1");
    }
}

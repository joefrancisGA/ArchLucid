using ArchLucid.Core.Explanation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Explanation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StructuredExplanationParserTests
{
    [Fact]
    public void TryNormalizeStructuredJson_happy_path_all_fields()
    {
        const string json =
            """
            {"schemaVersion":1,"reasoning":"Main text","evidenceRefs":["a"],"confidence":0.5,"alternativesConsidered":["b"],"caveats":["c"]}
            """;

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s.Should().NotBeNull();
        s.Reasoning.Should().Be("Main text");
        s.EvidenceRefs.Should().Equal("a");
        s.Confidence.Should().Be(0.5m);
        s.AlternativesConsidered.Should().Equal("b");
        s.Caveats.Should().Equal("c");
    }

    [Fact]
    public void TryNormalizeStructuredJson_minimal_reasoning_only()
    {
        const string json = """{"reasoning":"Only this"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(1);
        s.Reasoning.Should().Be("Only this");
        s.EvidenceRefs.Should().BeEmpty();
    }

    [Fact]
    public void Parse_plain_text_wraps_as_reasoning()
    {
        StructuredExplanation s = StructuredExplanationParser.Parse("This is a free-text explanation");

        s.Reasoning.Should().Be("This is a free-text explanation");
        s.SchemaVersion.Should().Be(1);
        s.EvidenceRefs.Should().BeEmpty();
        s.Confidence.Should().BeNull();
    }

    [Fact]
    public void Parse_malformed_json_falls_back_to_raw_string()
    {
        const string raw = "{broken";

        StructuredExplanation s = StructuredExplanationParser.Parse(raw);

        s.Reasoning.Should().Be(raw);
    }

    [Fact]
    public void TryNormalizeStructuredJson_empty_reasoning_falls_back_to_Parse()
    {
        const string json = """{"schemaVersion":1,"reasoning":""}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out _);

        ok.Should().BeFalse();

        StructuredExplanation s = StructuredExplanationParser.Parse(json);

        s.Reasoning.Should().Be(json);
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_case_variant_when_first_reasoning_property_is_empty()
    {
        const string json = """{"reasoning":"","REASONING":"Recovered explanation"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void Parse_null_or_whitespace_yields_empty_reasoning()
    {
        StructuredExplanationParser.Parse(null).Reasoning.Should().BeEmpty();
        StructuredExplanationParser.Parse("   ").Reasoning.Should().BeEmpty();
    }

    [Fact]
    public void ClampConfidence_normalizes_percentages_and_rejects_out_of_range()
    {
        StructuredExplanationParser.ClampConfidence(null).Should().BeNull();
        StructuredExplanationParser.ClampConfidence(-0.1m).Should().BeNull();
        StructuredExplanationParser.ClampConfidence(101m).Should().BeNull();
        StructuredExplanationParser.ClampConfidence(0.25m).Should().Be(0.25m);
        StructuredExplanationParser.ClampConfidence(1m).Should().Be(1m);
        StructuredExplanationParser.ClampConfidence(75m).Should().Be(0.75m);
        StructuredExplanationParser.ClampConfidence(100m).Should().Be(1m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_scales_percentage_confidence()
    {
        const string json = """{"reasoning":"x","confidence":75}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.75m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_nulls_invalid_confidence()
    {
        const string json = """{"reasoning":"x","confidence":120}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().BeNull();
    }

    [Fact]
    public void TryNormalizeStructuredJson_nulls_finite_confidence_beyond_decimal_range_without_throwing()
    {
        const string json = """{"reasoning":"x","confidence":1e300}""";

        Action act = () => StructuredExplanationParser.TryNormalizeStructuredJson(json, out _);

        act.Should().NotThrow();
        StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s).Should().BeTrue();
        s!.Confidence.Should().BeNull();
    }

    [Fact]
    public void TryNormalizeStructuredJson_rejects_rounded_decimal_boundary_without_throwing()
    {
        const string json = """{"reasoning":"x","confidence":7.922816251426434e28}""";

        Action act = () => StructuredExplanationParser.TryNormalizeStructuredJson(json, out _);

        act.Should().NotThrow();
        StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s).Should().BeTrue();
        s!.Confidence.Should().BeNull();
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_boolean_confidence()
    {
        const string json = """{"reasoning":"x","confidence":true}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().BeNull();
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_string_boolean_confidence()
    {
        const string json = """{"reasoning":"x","confidence":"true"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().BeNull();
    }

    [Fact]
    public void TryNormalizeStructuredJson_coerces_string_encoded_confidence()
    {
        const string json = """{"reasoning":"Main","confidence":"75"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.75m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_preserves_numeric_one_confidence_string()
    {
        const string json = """{"reasoning":"Main","confidence":"1"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(1m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_coerces_percent_suffixed_confidence()
    {
        const string json = """{"reasoning":"Main","confidence":"75%"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.75m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_coerces_percent_suffixed_confidence_with_trailing_whitespace()
    {
        const string json = """{"reasoning":"Main","confidence":"85% "}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.85m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_scalar_alternatives_considered_id_when_text_property_is_whitespace_only()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":{"text":"   ","id":"Rejected monolith path."}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Rejected monolith path.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_keeps_supported_schema_version_when_later_duplicate_is_unsupported()
    {
        const string json = """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":99}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void TryNormalizeStructuredJson_coerces_string_encoded_schema_version()
    {
        const string json = """{"schemaVersion":"2","reasoning":"Main"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_out_of_range_numeric_evidence_ref_entries()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[1e300,"dec-1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_defaults_schema_version_when_numeric_schema_version_exceeds_int_range()
    {
        const string json = """{"schemaVersion":1e300,"reasoning":"Main"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(1);
    }

    [Fact]
    public void Parse_does_not_treat_json_with_string_encoded_confidence_as_plain_text()
    {
        const string json = """{"reasoning":"Main","confidence":"75"}""";

        StructuredExplanation s = StructuredExplanationParser.Parse(json);

        s.Reasoning.Should().Be("Main");
        s.Confidence.Should().Be(0.75m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_scalar_alternatives_considered_as_single_entry()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":"Keep monolith — rejected for scaling."}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Keep monolith — rejected for scaling.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_scalar_evidence_ref_as_single_entry()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":"dec-1"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_scalar_caveats_as_single_entry()
    {
        const string json = """{"reasoning":"Main","caveats":"Limited manifest coverage."}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Limited manifest coverage.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_prefers_text_over_id_on_object_shaped_alternatives_considered()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":[{"id":"alt-a","text":"Rejected monolith path."}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Rejected monolith path.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_boolean_reasoning_array_entries()
    {
        const string json = """{"reasoning":[true,"Actual paragraph."]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Actual paragraph.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_boolean_evidence_ref_entries()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[true,false,"dec-1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_scalar_boolean_evidence_refs()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":true}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().BeEmpty();
    }

    [Fact]
    public void TryNormalizeStructuredJson_rejects_scalar_boolean_reasoning()
    {
        const string json = """{"reasoning":true,"alternativesConsidered":["Keep monolith"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeFalse();
        s.Should().BeNull();
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_fractional_numeric_evidence_ref_entries()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[42.5,"dec-1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_negative_numeric_evidence_ref_entries()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[-1,"dec-1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_prefers_id_over_text_on_object_shaped_evidence_ref()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[{"id":"dec-1","text":"prose-citation"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_evidence_ref_when_later_case_variant_id_is_empty()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[{"id":"dec-1","ID":""}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_reasoning_when_later_case_variant_text_is_empty()
    {
        const string json = """{"reasoning":{"text":"Recovered explanation","TEXT":""}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_reasoning_when_only_id_property_is_populated()
    {
        const string json = """{"reasoning":{"id":"Recovered via id","ID":""}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered via id");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_evidence_ref_entries()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[{"id":"dec-1"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_evidence_refs_array_entries_with_blank_text_and_id_only_poison_shape()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["dec-1",{"text":"   ","id":"spoof"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_single_evidence_ref_object_with_blank_text_and_id_only_poison_shape()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[{"text":"   ","id":"dec-1"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().BeEmpty();
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_evidence_ref_id_when_text_property_is_whitespace_only()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":{"text":"   ","id":"dec-1"}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_reasoning_id_when_text_property_is_whitespace_only()
    {
        const string json = """{"reasoning":{"text":"   ","id":"Recovered explanation body."}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation body.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_scalar_caveats_id_when_text_property_is_whitespace_only()
    {
        const string json =
            """{"reasoning":"Main","caveats":{"text":"   ","id":"Latency risk on peak traffic."}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Latency risk on peak traffic.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_coerces_string_array_reasoning()
    {
        const string json =
            """{"reasoning":["First paragraph.","Second paragraph."],"evidenceRefs":["dec-1"],"alternativesConsidered":["Keep monolith"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("First paragraph.\n\nSecond paragraph.");
        s.EvidenceRefs.Should().Equal("dec-1");
        s.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void TryNormalizeStructuredJson_prefers_text_over_id_on_object_shaped_reasoning()
    {
        const string json =
            """{"reasoning":{"id":"provider-response-id","text":"Actual explanation body."}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Actual explanation body.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_coerces_object_shaped_reasoning_text()
    {
        const string json =
            """{"reasoning":{"text":"Object-wrapped reasoning."},"evidenceRefs":["dec-1"],"alternativesConsidered":["Keep monolith"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Object-wrapped reasoning.");
        s.EvidenceRefs.Should().Equal("dec-1");
        s.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_alternatives_considered_entries()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":[{"text":"Keep monolith — rejected for scaling."}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Keep monolith — rejected for scaling.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_reasoning_array_entries()
    {
        const string json =
            """{"reasoning":[{"text":"First paragraph."},{"text":"Second paragraph."}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("First paragraph.\n\nSecond paragraph.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_evidence_ref_with_numeric_id()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[{"id":42}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("42");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_numeric_evidence_ref_array_entries()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[42,"dec-1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("42", "dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_coerces_numeric_reasoning_array_entries()
    {
        const string json = """{"reasoning":[42,"Second paragraph."]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("42\n\nSecond paragraph.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_coerces_numeric_scalar_reasoning()
    {
        const string json = """{"reasoning":42,"alternativesConsidered":["Keep monolith"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("42");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_numeric_alternatives_considered_as_single_entry()
    {
        const string json = """{"reasoning":"Main","alternativesConsidered":1}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_reasoning_array_entries_with_id_property()
    {
        const string json =
            """{"reasoning":[{"id":"First paragraph."},{"id":"Second paragraph."}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("First paragraph.\n\nSecond paragraph.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_scalar_alternatives_considered()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":{"text":"Keep monolith — rejected for scaling."}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Keep monolith — rejected for scaling.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_scalar_evidence_ref()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":{"id":"dec-1"}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_flattens_nested_array_reasoning_paragraphs()
    {
        const string json = """{"reasoning":[["First paragraph."],["Second paragraph."]]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("First paragraph.\n\nSecond paragraph.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_flattens_nested_array_evidence_ref_entries()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[["dec-1"]]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_scalar_caveats()
    {
        const string json = """{"reasoning":"Main","caveats":{"text":"Assumes single-region deployment."}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Assumes single-region deployment.");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_confidence_when_later_case_variant_is_empty()
    {
        const string json = """{"reasoning":"Main","confidence":0.8,"CONFIDENCE":""}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.8m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_evidence_refs_when_later_case_variant_is_empty()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":[]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_empty_object()
    {
        const string json = """{"reasoning":"Recovered explanation","Reasoning":{}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_confidence_when_later_case_variant_is_empty_object()
    {
        const string json = """{"reasoning":"Main","confidence":0.8,"CONFIDENCE":{}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.8m);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_confidence_when_later_case_variant_is_nested_empty_wrapper_object()
    {
        const string json = """{"reasoning":"Main","confidence":0.8,"CONFIDENCE":{"wrapper":{}}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.8m);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_nested_empty_wrapper_object()
    {
        const string json = """{"reasoning":"Main","schemaVersion":2,"SCHEMAVERSION":{"wrapper":{}}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_one_numeric()
    {
        const string json = """{"reasoning":"Main","schemaVersion":2,"SCHEMAVERSION":1}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_arbitrary_numeric()
    {
        const string json = """{"reasoning":"Main","schemaVersion":2,"SCHEMAVERSION":42}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_arbitrary_numeric_string()
    {
        const string json = """{"reasoning":"Main","schemaVersion":2,"SCHEMAVERSION":"42"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_one_numeric()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":1}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_arbitrary_numeric()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":42}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_arbitrary_numeric_string()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":"42"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_one_numeric()
    {
        const string json = """{"reasoning":"Main text","REASONING":1}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main text");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_arbitrary_numeric()
    {
        const string json = """{"reasoning":"Main text","REASONING":42}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main text");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_arbitrary_numeric_string()
    {
        const string json = """{"reasoning":"Main text","REASONING":"42"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main text");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_blank_text_object()
    {
        const string json = """{"reasoning":"Recovered explanation","Reasoning":{"text":"   "}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_evidence_refs_when_later_case_variant_is_blank_text_object()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":{"text":"   "}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_whitespace_only_array()
    {
        const string json = """{"reasoning":"Recovered explanation","Reasoning":["   "]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_confidence_when_later_case_variant_is_empty_string_array()
    {
        const string json = """{"reasoning":"Main","confidence":0.75,"CONFIDENCE":[""]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.75m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_boolean_only_array()
    {
        const string json = """{"reasoning":"Recovered explanation","Reasoning":[true]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_confidence_when_later_case_variant_is_boolean_scalar()
    {
        const string json = """{"reasoning":"Main","confidence":0.8,"CONFIDENCE":false}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.8m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_id_only_object()
    {
        const string json = """{"reasoning":"Recovered explanation","Reasoning":{"id":"provider-paragraph-id","text":"   "}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_confidence_when_later_case_variant_is_arbitrary_numeric()
    {
        const string json = """{"reasoning":"Main","confidence":0.85,"CONFIDENCE":42}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.85m);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_confidence_when_later_case_variant_is_arbitrary_numeric_string()
    {
        const string json = """{"reasoning":"Main","confidence":0.85,"CONFIDENCE":"42"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.85m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_confidence_when_later_case_variant_is_zero()
    {
        const string json = """{"reasoning":"Main","confidence":0.75,"CONFIDENCE":0}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.75m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_preserves_explicit_zero_confidence_when_only_value()
    {
        const string json = """{"reasoning":"Main","confidence":0}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_blank_object_array()
    {
        const string json = """{"reasoning":"Recovered explanation","Reasoning":[{"text":"   "}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_evidence_refs_when_later_case_variant_is_zero_numeric_array()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":[0]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_preserves_explicit_zero_evidence_ref_when_only_numeric_array_value()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[0]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("0");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_zero_numeric_scalar()
    {
        const string json = """{"reasoning":"Main explanation","Reasoning":0}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_preserves_explicit_zero_reasoning_when_only_numeric_scalar()
    {
        const string json = """{"reasoning":0}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("0");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_zero_numeric_array()
    {
        const string json = """{"reasoning":"Main explanation","Reasoning":[0]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_alternatives_considered_when_later_case_variant_is_zero_numeric_scalar()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":["Keep monolith"],"ALTERNATIVESCONSIDERED":0}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_caveats_when_later_case_variant_is_blank_text_object_with_id()
    {
        const string json =
            """{"reasoning":"Main","caveats":["Latency risk"],"CAVEATS":{"text":"   ","id":"spoof"}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Latency risk");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_evidence_refs_when_later_case_variant_is_blank_text_object_with_id()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":{"text":"   ","id":"spoof"}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_maps_object_shaped_evidence_ref_array_entry_when_id_property_is_populated()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[{"id":"dec-1","ID":""}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_alternatives_when_later_case_variant_is_one_numeric_poison_array()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":["Keep monolith","Split services"],"ALTERNATIVESCONSIDERED":[1]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Keep monolith", "Split services");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_one_string_poison_array()
    {
        const string json =
            """{"reasoning":"Recovered explanation","REASONING":["1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_confidence_when_later_case_variant_is_one_string_poison_array()
    {
        const string json =
            """{"reasoning":"Main","confidence":0.85,"CONFIDENCE":["1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.85m);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_confidence_when_later_case_variant_is_supported_ratio_poison_array()
    {
        const string json =
            """{"reasoning":"Main","confidence":0.85,"CONFIDENCE":[0.75]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.85m);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_supported_prose_poison_array()
    {
        const string json =
            """{"reasoning":"Main","REASONING":["Alternate prose"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_supported_prose_poison_array()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["a","b"],"EVIDENCEREFS":["c"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("a", "b");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_alternatives_when_later_case_variant_is_supported_prose_poison_array()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":["Keep monolith"],"ALTERNATIVESCONSIDERED":["Split services"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_caveats_when_later_case_variant_is_supported_prose_poison_array()
    {
        const string json =
            """{"reasoning":"Main","caveats":["Latency risk"],"CAVEATS":["Different caveat"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Latency risk");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_caveats_when_later_case_variant_is_multi_entry_object_prose_poison_array()
    {
        const string json =
            """{"reasoning":"Main","caveats":["Latency risk"],"CAVEATS":[{"text":"Spoof one"},{"text":"Spoof two"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Latency risk");
    }

    [Fact]
    public void RunExplanation_structured_json_reads_schema_version_from_sole_nested_numeric_array_alias()
    {
        const string json = """{"schemaVersion":[[2]],"reasoning":"Main"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_nested_numeric_poison_array()
    {
        const string json =
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":[[3]]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_reads_alternatives_from_sole_nested_string_array_alias()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":[["Keep monolith"]]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void RunExplanation_structured_json_reads_reasoning_from_sole_nested_string_array_alias()
    {
        const string json = """{"reasoning":[["Nested paragraph."]]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Nested paragraph.");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_nested_prose_poison_array()
    {
        const string json =
            """{"reasoning":"Main","REASONING":[["Alternate nested prose"]]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_scalar_object_prose_poison_alias()
    {
        const string json =
            """{"reasoning":"Main","REASONING":{"text":"Alternate prose"}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_scalar_object_ref_poison_alias()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":{"id":"dec-spoof"}}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_supported_ref_token_poison_array()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":["dec-2"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_multi_entry_prose_poison_array()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":["spoof-a","spoof-b"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_supported_object_prose_poison_array()
    {
        const string json =
            """{"reasoning":"Main","REASONING":[{"text":"Alternate prose","id":"alias-1"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Main");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_supported_string_poison_array()
    {
        const string json =
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":["2"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_reads_schema_version_from_sole_numeric_array_alias()
    {
        const string json = """{"schemaVersion":[2],"reasoning":"Main"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_supported_numeric_poison_array()
    {
        const string json =
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":[2]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_FromAggregateJson_reads_faithfulness_warning_from_sole_string_array_alias()
    {
        RunExplanationConfidenceSignals? signals = RunExplanationConfidenceCalloutBuilder.FromAggregateJson(
            """
            {
              "faithfulnessSupportRatio": 0.95,
              "faithfulnessWarning": [ "Citations incomplete" ],
              "citations": 1
            }
            """);

        signals.Should().NotBeNull();
        signals!.FaithfulnessWarning.Should().Be("Citations incomplete");
        RunExplanationConfidenceCalloutBuilder.ResolveDisposition(signals).Should().Be("WARN");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_unsupported_string_poison_array()
    {
        const string json =
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":["3"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_string_numeric_poison_array()
    {
        const string json =
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":["42"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_one_string_poison_array()
    {
        const string json =
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":["1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_schema_version_when_later_case_variant_is_numeric_poison_array()
    {
        const string json =
            """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":[42]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_alternatives_when_later_case_variant_is_one_string_poison_array()
    {
        const string json =
            """{"reasoning":"Main","alternativesConsidered":["Keep monolith"],"ALTERNATIVESCONSIDERED":["1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.AlternativesConsidered.Should().Equal("Keep monolith");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_confidence_when_later_case_variant_is_string_numeric_poison_array()
    {
        const string json =
            """{"reasoning":"Main","confidence":0.85,"CONFIDENCE":["42"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.85m);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_one_string_poison_array()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["dec-1","dec-2"],"EVIDENCEREFS":["1"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1", "dec-2");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_one_numeric_poison_array()
    {
        const string json =
            """{"reasoning":"Recovered explanation","REASONING":[1]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_confidence_when_later_case_variant_is_numeric_poison_array()
    {
        const string json =
            """{"reasoning":"Main","confidence":0.85,"CONFIDENCE":[42]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.85m);
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_caveats_when_later_case_variant_is_one_numeric_poison_array()
    {
        const string json =
            """{"reasoning":"Main","caveats":["Latency risk","Scope gap"],"CAVEATS":[1]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Latency risk", "Scope gap");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_string_numeric_poison_array()
    {
        const string json =
            """{"reasoning":"Recovered explanation","REASONING":["42"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_reasoning_when_later_case_variant_is_numeric_poison_array()
    {
        const string json =
            """{"reasoning":"Recovered explanation","REASONING":[42]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void RunExplanation_structured_json_keeps_evidence_refs_when_later_case_variant_is_string_numeric_poison_array()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["dec-1","dec-2"],"EVIDENCEREFS":["42"]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1", "dec-2");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_evidence_refs_when_later_case_variant_is_blank_text_object_array_with_id()
    {
        const string json =
            """{"reasoning":"Main","evidenceRefs":["dec-1"],"EVIDENCEREFS":[{"text":"   ","id":"spoof"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_reasoning_when_later_case_variant_is_blank_text_object_array_with_id()
    {
        const string json =
            """{"reasoning":"Recovered explanation","Reasoning":[{"text":"   ","id":"spoof"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Reasoning.Should().Be("Recovered explanation");
    }

    [Fact]
    public void TryNormalizeStructuredJson_ignores_caveats_array_entries_with_blank_text_and_id_only_poison_shape()
    {
        const string json =
            """{"reasoning":"Main","caveats":["Latency risk",{"text":"   ","id":"spoof"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Latency risk");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_caveats_when_later_case_variant_is_zero_numeric_scalar()
    {
        const string json = """{"reasoning":"Main","caveats":["Latency risk"],"CAVEATS":0}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Caveats.Should().Equal("Latency risk");
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_schema_version_when_later_case_variant_is_zero()
    {
        const string json = """{"schemaVersion":2,"reasoning":"Main","SCHEMAVERSION":0}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.SchemaVersion.Should().Be(2);
    }

    [Fact]
    public void TryNormalizeStructuredJson_uses_non_empty_confidence_when_later_case_variant_is_zero_numeric_array()
    {
        const string json = """{"reasoning":"Main","confidence":0.8,"CONFIDENCE":[0]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.8m);
    }

    [Fact]
    public void TryNormalizeStructuredJson_preserves_explicit_zero_confidence_when_only_numeric_array_value()
    {
        const string json = """{"reasoning":"Main","confidence":[0]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0m);
    }

}

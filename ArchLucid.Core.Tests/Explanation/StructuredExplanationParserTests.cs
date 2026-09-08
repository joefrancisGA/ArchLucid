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
    public void TryNormalizeStructuredJson_coerces_string_encoded_confidence()
    {
        const string json = """{"reasoning":"Main","confidence":"75"}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.Confidence.Should().Be(0.75m);
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
    public void TryNormalizeStructuredJson_maps_object_shaped_evidence_ref_entries()
    {
        const string json = """{"reasoning":"Main","evidenceRefs":[{"id":"dec-1"}]}""";

        bool ok = StructuredExplanationParser.TryNormalizeStructuredJson(json, out StructuredExplanation? s);

        ok.Should().BeTrue();
        s!.EvidenceRefs.Should().Equal("dec-1");
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
}

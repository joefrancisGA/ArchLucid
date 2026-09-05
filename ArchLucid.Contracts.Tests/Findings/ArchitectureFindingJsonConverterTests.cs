using System.Text.Json;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ArchitectureFindingJsonConverterTests
{
    [Fact]
    public void Deserialize_mapsDescriptionAndLegacyHighSeverity()
    {
        const string json = """
                            {
                              "severity": "High",
                              "category": "Compliance",
                              "description": "Private endpoints required."
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.Severity.Should().Be(FindingSeverity.Error);
        finding.Message.Should().Be("Private endpoints required.");
    }

    [Fact]
    public void Deserialize_withoutInsightDensityFields_leavesThemNull()
    {
        const string json = """
                            {
                              "severity": "Warning",
                              "category": "Topology",
                              "message": "Missing subnet for worker pool."
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.InsightDensityScore.Should().BeNull();
        finding.Treatment.Should().BeNull();
        finding.Classification.Should().BeNull();
        finding.WhyThisIsNotGeneric.Should().BeNull();
        finding.PrincipalArchitectValue.Should().BeNull();
        finding.DecisionConsequence.Should().BeNull();
    }

    [Fact]
    public void RoundTrip_preservesInsightDensityFields()
    {
        ArchitectureFinding finding = new()
        {
            Severity = FindingSeverity.Error,
            Category = "Security",
            Message = "Public ingress on api-gateway without WAF.",
            EvidenceRefs = ["doc:architecture.md#L42"],
            InsightDensityScore = 82,
            Treatment = FindingTreatment.Promote,
            Classification = FindingClassification.DecisionGradeFinding,
            WhyThisIsNotGeneric = "Anchored to the uploaded api-gateway ingress rule.",
            PrincipalArchitectValue = "Blocks a principal-architect sign-off on internet exposure.",
            DecisionConsequence = "Without WAF, the team accepts unfiltered internet attack surface."
        };

        JsonSerializerOptions options = CreateOptions();
        string json = JsonSerializer.Serialize(finding, options);
        ArchitectureFinding? roundTripped = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        roundTripped.Should().BeEquivalentTo(finding);
    }

    [Fact]
    public void Deserialize_string_enforcement_tier_maps_advisory()
    {
        const string json = """
                            {
                              "severity": "Warning",
                              "category": "Cost",
                              "message": "Consider reserved capacity for the worker pool.",
                              "enforcementTier": "Advisory"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.EnforcementTier.Should().Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void Deserialize_numeric_enforcement_tier_maps_advisory_ordinal()
    {
        const string json = """
                            {
                              "severity": "Warning",
                              "category": "Cost",
                              "message": "Consider reserved capacity for the worker pool.",
                              "enforcementTier": 1
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.EnforcementTier.Should().Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void Deserialize_pascal_case_enforcement_tier_maps_advisory()
    {
        const string json = """
                            {
                              "severity": "Warning",
                              "category": "Cost",
                              "message": "Consider reserved capacity for the worker pool.",
                              "EnforcementTier": "Advisory"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.EnforcementTier.Should().Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void Deserialize_object_evidence_refs_extracts_id_property()
    {
        const string json = """
                            {
                              "severity": "Warning",
                              "category": "Compliance",
                              "message": "Policy gap on private endpoints.",
                              "evidenceRefs": [{ "id": "pol-123" }]
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.EvidenceRefs.Should().ContainSingle().Which.Should().Be("pol-123");
    }

    [Fact]
    public void Deserialize_integer_enforcement_tier_out_of_range_throws()
    {
        const string json = """
                            {
                              "severity": "Warning",
                              "category": "Cost",
                              "message": "Invalid ordinal must not deserialize as PolicyViolation.",
                              "enforcementTier": 99
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding enforcement tier value*");
    }

    [Fact]
    public void Deserialize_integer_severity_out_of_range_throws()
    {
        const string json = """
                            {
                              "severity": 99,
                              "category": "Compliance",
                              "message": "Invalid ordinal must not deserialize."
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding severity value*");
    }

    [Fact]
    public void Deserialize_numeric_treatment_maps_promote_ordinal()
    {
        const string json = """
                            {
                              "severity": "Warning",
                              "category": "Security",
                              "message": "Promote candidate with numeric treatment.",
                              "treatment": 0
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.Treatment.Should().Be(FindingTreatment.Promote);
    }

    [Fact]
    public void Deserialize_pascal_case_treatment_maps_promote()
    {
        const string json = """
                            {
                              "Severity": "Warning",
                              "category": "Security",
                              "message": "PascalCase treatment must map like enforcement tier.",
                              "Treatment": "Promote"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.Severity.Should().Be(FindingSeverity.Warning);
        finding.Treatment.Should().Be(FindingTreatment.Promote);
    }

    [Fact]
    public void Deserialize_integer_treatment_out_of_range_throws()
    {
        const string json = """
                            {
                              "severity": "Warning",
                              "category": "Security",
                              "message": "Invalid treatment ordinal must not deserialize.",
                              "treatment": 99
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding treatment value*");
    }

    [Fact]
    public void Deserialize_unknown_severity_label_throws()
    {
        const string json = """
                            {
                              "severity": "blocker",
                              "category": "Compliance",
                              "message": "Unknown severity must not downgrade to Info."
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding severity value*");
    }

    [Fact]
    public void Deserialize_pascal_case_description_maps_message()
    {
        const string json = """
                            {
                              "Severity": "High",
                              "Category": "Compliance",
                              "Description": "Private endpoints required."
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.Severity.Should().Be(FindingSeverity.Error);
        finding.Category.Should().Be("Compliance");
        finding.Message.Should().Be("Private endpoints required.");
    }

    [Fact]
    public void Deserialize_pascal_case_evidence_refs_extracts_id_property()
    {
        const string json = """
                            {
                              "Severity": "Warning",
                              "Category": "Compliance",
                              "Message": "Policy gap on private endpoints.",
                              "EvidenceRefs": [{ "id": "pol-456" }]
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.EvidenceRefs.Should().ContainSingle().Which.Should().Be("pol-456");
    }

    private static JsonSerializerOptions CreateOptions()
    {
        return new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            Converters = { new ArchitectureFindingJsonConverter() }
        };
    }
}

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

    private static JsonSerializerOptions CreateOptions()
    {
        return new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            Converters = { new ArchitectureFindingJsonConverter() }
        };
    }
}

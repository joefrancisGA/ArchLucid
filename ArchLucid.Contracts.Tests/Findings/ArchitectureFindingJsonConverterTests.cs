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

    private static JsonSerializerOptions CreateOptions()
    {
        return new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            Converters = { new ArchitectureFindingJsonConverter() }
        };
    }
}

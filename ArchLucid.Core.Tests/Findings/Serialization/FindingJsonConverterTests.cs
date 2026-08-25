using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings.Serialization;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings.Serialization;

[Trait("Category", "Unit")]
public sealed class FindingJsonConverterTests
{
    [Fact]
    public void Deserialize_withoutInsightDensityFields_leavesThemNull()
    {
        const string json = """
                            {
                              "findingSchemaVersion": 2,
                              "findingId": "abc123",
                              "findingType": "TopologyGap",
                              "category": "Topology",
                              "engineType": "TopologyCoverage",
                              "severity": "Warning",
                              "title": "Missing worker subnet",
                              "rationale": "No subnet is defined for worker pool isolation.",
                              "relatedNodeIds": [],
                              "recommendedActions": [],
                              "properties": {},
                              "payloadType": null,
                              "payload": null,
                              "trace": {},
                              "humanReviewStatus": "Pending"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

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
        Finding finding = new()
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingId = "finding-001",
            FindingType = "SecurityControlFinding",
            Category = "Security",
            EngineType = "SecurityCoverage",
            Severity = FindingSeverity.Error,
            Title = "Public storage account",
            Rationale = "Storage account allows anonymous blob access.",
            InsightDensityScore = 91,
            Treatment = FindingTreatment.Promote,
            Classification = FindingClassification.DecisionGradeFinding,
            WhyThisIsNotGeneric = "References the uploaded storage account resource id.",
            PrincipalArchitectValue = "Prevents accidental public data exposure.",
            DecisionConsequence = "Leaving anonymous access enabled violates the data-classification policy."
        };

        JsonSerializerOptions options = CreateOptions();
        string json = JsonSerializer.Serialize(finding, options);
        Finding? roundTripped = JsonSerializer.Deserialize<Finding>(json, options);

        roundTripped.Should().BeEquivalentTo(finding, options => options
            .Excluding(f => f.RelatedNodeIds)
            .Excluding(f => f.RecommendedActions)
            .Excluding(f => f.Properties)
            .Excluding(f => f.Trace));
    }

    [Fact]
    public void Deserialize_numeric_enforcement_tier_maps_advisory_ordinal()
    {
        string json = FindingJson(
            """
            "humanReviewStatus": "Pending",
            "enforcementTier": 1
            """);

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, CreateOptions());

        finding.Should().NotBeNull();
        finding!.EnforcementTier.Should().Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void Deserialize_integer_enforcement_tier_out_of_range_throws()
    {
        string json = FindingJson(
            """
            "humanReviewStatus": "Pending",
            "enforcementTier": 99
            """);

        Action act = () => JsonSerializer.Deserialize<Finding>(json, CreateOptions());

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding enforcement tier value*");
    }

    [Fact]
    public void Deserialize_numeric_human_review_status_maps_pending_ordinal()
    {
        string json = FindingJson("\"humanReviewStatus\": 1");

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, CreateOptions());

        finding.Should().NotBeNull();
        finding!.HumanReviewStatus.Should().Be(FindingHumanReviewStatus.Pending);
    }

    [Fact]
    public void Deserialize_unknown_severity_throws()
    {
        const string json = """
                            {
                              "findingSchemaVersion": 2,
                              "findingId": "abc123",
                              "findingType": "TopologyGap",
                              "category": "Topology",
                              "engineType": "TopologyCoverage",
                              "severity": "blocker",
                              "title": "Missing worker subnet",
                              "rationale": "No subnet is defined for worker pool isolation.",
                              "relatedNodeIds": [],
                              "recommendedActions": [],
                              "properties": {},
                              "payloadType": null,
                              "payload": null,
                              "trace": {},
                              "humanReviewStatus": "Pending"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<Finding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding severity value 'blocker'*");
    }

    private static JsonSerializerOptions CreateOptions()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web)
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        options.Converters.Add(new FindingJsonConverter());

        return options;
    }

    private static string FindingJson(string extraProperties) =>
        $$"""
        {
          "findingSchemaVersion": 2,
          "findingId": "abc123",
          "findingType": "TopologyGap",
          "category": "Topology",
          "engineType": "TopologyCoverage",
          "severity": "Warning",
          "title": "Missing worker subnet",
          "rationale": "No subnet is defined for worker pool isolation.",
          "relatedNodeIds": [],
          "recommendedActions": [],
          "properties": {},
          "payloadType": null,
          "payload": null,
          "trace": {},
          {{extraProperties}}
        }
        """;
}

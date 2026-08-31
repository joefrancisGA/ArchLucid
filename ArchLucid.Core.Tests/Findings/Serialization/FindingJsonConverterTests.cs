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

    [Theory]
    [InlineData(1, FindingHumanReviewStatus.Pending)]
    [InlineData(2, FindingHumanReviewStatus.Approved)]
    public void Deserialize_numeric_humanReviewStatus_maps_defined_ordinals(int ordinal, FindingHumanReviewStatus expected)
    {
        string json = $$"""
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
                          "humanReviewStatus": {{ordinal}}
                        }
                        """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.HumanReviewStatus.Should().Be(expected);
    }

    [Fact]
    public void Deserialize_numeric_enforcementTier_maps_advisory_ordinal()
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
                              "enforcementTier": 1
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.EnforcementTier.Should().Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void Deserialize_enforcementTier_numeric_string_out_of_range_throws()
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
                              "enforcementTier": "99",
                              "humanReviewStatus": "Pending"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<Finding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding enforcement tier value '99'*");
    }

    [Fact]
    public void Deserialize_humanReviewStatus_numeric_string_out_of_range_throws()
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
                              "humanReviewStatus": "99"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<Finding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding human review status value '99'*");
    }

    [Fact]
    public void Deserialize_numeric_treatment_maps_demote_to_checklist_ordinal()
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
                              "treatment": 1
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
    }

    [Fact]
    public void Deserialize_numeric_classification_maps_checklist_coverage_ordinal()
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
                              "classification": 1
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.Classification.Should().Be(FindingClassification.ChecklistCoverage);
    }

    [Fact]
    public void Deserialize_integer_humanReviewStatus_out_of_range_throws()
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
                              "humanReviewStatus": 99
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<Finding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding human review status value '99'*");
    }

    [Fact]
    public void Deserialize_properties_enforcementTier_numeric_string_out_of_range_throws()
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
                              "properties": { "enforcementTier": "99" },
                              "payloadType": null,
                              "payload": null,
                              "trace": {},
                              "humanReviewStatus": "Pending"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<Finding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding enforcement tier value '99'*");
    }

    [Fact]
    public void Deserialize_properties_numeric_values_preserve_string_entries()
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
                              "properties": { "note": "keep", "enforcementTier": 1 },
                              "payloadType": null,
                              "payload": null,
                              "trace": {},
                              "humanReviewStatus": "Pending"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.Properties["note"].Should().Be("keep");
        finding.Properties["enforcementTier"].Should().Be("1");
        finding.EnforcementTier.Should().Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void Deserialize_evaluationConfidenceLevel_numeric_string_out_of_range_throws()
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
                              "humanReviewStatus": "Pending",
                              "evaluationConfidenceLevel": "99"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Action act = () => JsonSerializer.Deserialize<Finding>(json, options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown finding confidence level value '99'*");
    }

    [Fact]
    public void Deserialize_pascal_case_findingSchemaVersion_maps_version()
    {
        const string json = """
                            {
                              "FindingSchemaVersion": 2,
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
        finding!.FindingSchemaVersion.Should().Be(2);
    }

    [Fact]
    public void Deserialize_pascal_case_relatedNodeIds_maps_list()
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
                              "RelatedNodeIds": ["node-a", "node-b"],
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
        finding!.RelatedNodeIds.Should().Equal("node-a", "node-b");
    }

    [Fact]
    public void Deserialize_pascal_case_properties_bag_maps_entries()
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
                              "Properties": { "region": "eastus" },
                              "payloadType": null,
                              "payload": null,
                              "trace": {},
                              "humanReviewStatus": "Pending"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.Properties.Should().ContainKey("region").WhoseValue.Should().Be("eastus");
    }

    [Fact]
    public void Deserialize_pascal_case_treatment_maps_demote_to_checklist()
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
                              "humanReviewStatus": "Pending",
                              "Treatment": "DemoteToChecklist"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
    }

    [Fact]
    public void Deserialize_pascal_case_payloadType_and_payload_map_typed_payload()
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
                              "PayloadType": "TopologyGapFindingPayload",
                              "Payload": {
                                "gapCode": "missing-subnet",
                                "description": "Worker subnet absent",
                                "impact": "Isolation gap"
                              },
                              "trace": {},
                              "humanReviewStatus": "Pending"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.PayloadType.Should().Be("TopologyGapFindingPayload");
        finding.Payload.Should().BeOfType<ArchLucid.Contracts.Findings.Payloads.TopologyGapFindingPayload>();
        ArchLucid.Contracts.Findings.Payloads.TopologyGapFindingPayload payload =
            (ArchLucid.Contracts.Findings.Payloads.TopologyGapFindingPayload)finding.Payload!;
        payload.GapCode.Should().Be("missing-subnet");
    }

    [Fact]
    public void Deserialize_pascal_case_trace_maps_source_agent_execution_trace_id()
    {
        const string traceId = "a1b2c3d4e5f6789012345678abcdef01";

        string json = $$"""
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
                              "Trace": {
                                "sourceAgentExecutionTraceId": "{{traceId}}"
                              },
                              "humanReviewStatus": "Pending"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.Trace.SourceAgentExecutionTraceId.Should().Be(traceId);
        finding.AgentExecutionTraceId.Should().Be(traceId);
    }

    [Fact]
    public void Deserialize_pascal_case_category_maps_value()
    {
        const string json = """
                            {
                              "findingSchemaVersion": 2,
                              "findingId": "abc123",
                              "findingType": "TopologyGap",
                              "Category": "Security",
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
        finding!.Category.Should().Be("Security");
    }

    [Fact]
    public void Deserialize_pascal_case_enforcementTier_maps_advisory()
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
                              "EnforcementTier": "Advisory"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.EnforcementTier.Should().Be(FindingEnforcementTier.Advisory);
    }

    [Fact]
    public void Deserialize_pascal_case_humanReviewStatus_maps_approved()
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
                              "HumanReviewStatus": "Approved"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.HumanReviewStatus.Should().Be(FindingHumanReviewStatus.Approved);
    }

    [Fact]
    public void Deserialize_pascal_case_evaluationConfidenceLevel_maps_high()
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
                              "humanReviewStatus": "Pending",
                              "EvaluationConfidenceLevel": "High"
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.ConfidenceLevel.Should().Be(FindingConfidenceLevel.High);
    }

    [Fact]
    public void Deserialize_numeric_runIdRef_coerces_to_string()
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
                              "humanReviewStatus": "Pending",
                              "runIdRef": 42
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.RunIdRef.Should().Be("42");
    }

    [Fact]
    public void Deserialize_numeric_agentExecutionTraceId_coerces_to_string()
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
                              "humanReviewStatus": "Pending",
                              "agentExecutionTraceId": 9001
                            }
                            """;

        JsonSerializerOptions options = CreateOptions();

        Finding? finding = JsonSerializer.Deserialize<Finding>(json, options);

        finding.Should().NotBeNull();
        finding!.AgentExecutionTraceId.Should().Be("9001");
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
}

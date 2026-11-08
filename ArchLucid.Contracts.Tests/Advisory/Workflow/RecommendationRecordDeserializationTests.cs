using System.Text.Json;

using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Advisory.Workflow;

[Trait("Category", "Unit")]
public sealed class RecommendationRecordDeserializationTests
{
    [Fact]
    public void Deserialize_null_supporting_json_columns_yields_empty_array_literals_not_null()
    {
        const string json = """
            {
              "recommendationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "workspaceId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "projectId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
              "runId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              "title": "t",
              "category": "c",
              "rationale": "r",
              "suggestedAction": "a",
              "urgency": "u",
              "expectedImpact": "e",
              "supportingFindingIdsJson": null,
              "supportingDecisionIdsJson": null,
              "supportingArtifactIdsJson": null,
              "sourceEvidenceLinksJson": null
            }
            """;

        RecommendationRecord? record =
            JsonSerializer.Deserialize<RecommendationRecord>(json, ContractJson.CamelCaseCompact);

        record.Should().NotBeNull();
        record!.SupportingFindingIdsJson.Should().Be("[]");
        record.SupportingDecisionIdsJson.Should().Be("[]");
        record.SupportingArtifactIdsJson.Should().Be("[]");
        record.SourceEvidenceLinksJson.Should().Be("[]");
    }

    [Fact]
    public void Deserialize_null_status_yields_proposed_not_null()
    {
        const string json = """
            {
              "recommendationId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "tenantId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "workspaceId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "projectId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
              "runId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              "title": "t",
              "category": "c",
              "rationale": "r",
              "suggestedAction": "a",
              "urgency": "u",
              "expectedImpact": "e",
              "status": null
            }
            """;

        RecommendationRecord? record =
            JsonSerializer.Deserialize<RecommendationRecord>(json, ContractJson.CamelCaseCompact);

        record.Should().NotBeNull();
        record!.Status.Should().Be(RecommendationStatus.Proposed);
    }
}

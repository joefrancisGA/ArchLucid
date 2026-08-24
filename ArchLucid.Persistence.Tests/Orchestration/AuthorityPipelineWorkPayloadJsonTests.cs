using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.Persistence.Tests.Orchestration;
[Trait("Category", "Unit")]

public sealed class AuthorityPipelineWorkPayloadJsonTests
{
    [SkippableFact]
    public void Serialize_throws_when_payload_null()
    {
        Action act = () => AuthorityPipelineWorkPayloadJson.Serialize(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [SkippableFact]
    public void Deserialize_returns_null_for_null_json()
    {
        AuthorityPipelineWorkPayload? result = AuthorityPipelineWorkPayloadJson.Deserialize(null!);

        result.Should().BeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Deserialize_returns_null_for_blank_json(string json)
    {
        AuthorityPipelineWorkPayload? result = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        result.Should().BeNull();
    }

    [SkippableFact]
    public void Deserialize_returns_null_for_malformed_json()
    {
        AuthorityPipelineWorkPayload? result = AuthorityPipelineWorkPayloadJson.Deserialize("{ not json");

        result.Should().BeNull();
        AuthorityPipelineWorkPayloadJson.TryDeserialize("{ not json", out AuthorityPipelineWorkPayload? tried).Should().BeFalse();
        tried.Should().BeNull();
    }

    [SkippableFact]
    public void IsValidForProcessing_rejects_blank_project_id()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "   ",
            },
            EvidenceBundleId = "bundle-1",
        };

        payload.IsValidForProcessing().Should().BeFalse();
    }

    [SkippableFact]
    public void Deserialize_materializes_null_list_properties()
    {
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "inlineRequirements": null,
                "documents": null,
                "policyReferences": null,
                "topologyHints": null,
                "securityBaselineHints": null,
                "infrastructureDeclarations": null,
                "requiredCapabilities": null,
                "constraints": null,
                "assumptions": null
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InlineRequirements.Should().NotBeNull().And.BeEmpty();
        back.ContextIngestionRequest.Documents.Should().NotBeNull().And.BeEmpty();
        back.ContextIngestionRequest.PolicyReferences.Should().NotBeNull().And.BeEmpty();
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Serialize_round_trips_minimal_payload()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                ProjectId = "default",
            },
            EvidenceBundleId = "bundle-1",
        };

        string json = AuthorityPipelineWorkPayloadJson.Serialize(payload);
        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back.EvidenceBundleId.Should().Be("bundle-1");
        back.ContextIngestionRequest.ProjectId.Should().Be("default");
        back.ContextIngestionRequest.RunId.Should().Be(payload.ContextIngestionRequest.RunId);
    }
}

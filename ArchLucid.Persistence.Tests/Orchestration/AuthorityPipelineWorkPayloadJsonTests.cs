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
    public void IsValidForProcessing_allows_blank_project_id_because_worker_overwrites_from_persisted_run()
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

        payload.IsValidForProcessing().Should().BeTrue(
            "ProjectId in the outbox JSON is not authoritative; AuthorityPipelineWorkProcessor overwrites it from dbo.Runs before orchestration.");
    }

    [SkippableFact]
    public void IsValidForProcessing_rejects_blank_evidence_bundle_id()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "default",
            },
            EvidenceBundleId = "   ",
        };

        payload.IsValidForProcessing().Should().BeFalse();
    }

    [SkippableFact]
    public void IsValidForProcessing_rejects_zero_width_only_evidence_bundle_id()
    {
        // U+200B is not whitespace per string.IsNullOrWhiteSpace; worker would retry/dead-letter instead of discard.
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "default",
            },
            EvidenceBundleId = "\u200B",
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
    public void Deserialize_removes_null_document_elements()
    {
        Guid runId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [ null ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().NotBeNull().And.BeEmpty();
    }

    [SkippableFact]
    public void Deserialize_filters_null_string_list_entries()
    {
        Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "inlineRequirements": [null, "keep-me"],
                "policyReferences": [null],
                "constraints": [null, null]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InlineRequirements.Should().Equal("keep-me");
        back.ContextIngestionRequest.PolicyReferences.Should().BeEmpty();
        back.ContextIngestionRequest.Constraints.Should().BeEmpty();
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

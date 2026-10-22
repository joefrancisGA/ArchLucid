using ArchLucid.Application.Runs.Orchestration.Pipeline;
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
    public void IsValidForProcessing_rejects_combining_mark_only_evidence_bundle_id()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "default",
            },
            EvidenceBundleId = "\u0300",
        };

        payload.IsValidForProcessing().Should().BeFalse(
            "combining marks are not whitespace or format characters but are not usable evidence bundle ids");
    }

    [SkippableFact]
    public void IsValidForProcessing_rejects_embedded_zero_width_in_evidence_bundle_id()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "default",
            },
            EvidenceBundleId = "\u200Bbundle-1",
        };

        payload.IsValidForProcessing().Should().BeFalse(
            "embedded format characters survive Trim() and break evidence bundle lookup after the worker gate");
    }

    [SkippableFact]
    public void IsValidForProcessing_rejects_embedded_nbsp_in_evidence_bundle_id()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "default",
            },
            EvidenceBundleId = "bundle\u00A01",
        };

        payload.IsValidForProcessing().Should().BeFalse(
            "embedded no-break space survives Trim() and breaks evidence bundle lookup after the worker gate");
    }

    [SkippableFact]
    public void IsValidForProcessing_rejects_embedded_combining_mark_in_evidence_bundle_id()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "default",
            },
            EvidenceBundleId = "bundle-1\u0300",
        };

        payload.IsValidForProcessing().Should().BeFalse(
            "embedded combining marks survive Trim() and break evidence bundle lookup after the worker gate");
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
    public void Deserialize_filters_empty_infrastructure_declaration_objects()
    {
        Guid runId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "infrastructureDeclarations": [ {}, { "name": "keep", "format": "json", "content": "{\"resources\":[]}" } ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InfrastructureDeclarations.Should().ContainSingle()
            .Which.Name.Should().Be("keep");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_inline_requirements_when_entry_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "inlineRequirements": ["must-use-https\u0300", "must-use-https"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InlineRequirements.Should().Equal("must-use-https");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_document_when_content_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("10101010-1010-1010-1010-101010101010");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [
                  { "name": "diagram", "contentType": "text/plain", "content": "source\u0300 text" },
                  { "name": "keep", "contentType": "text/plain", "content": "clean source" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().ContainSingle()
            .Which.Name.Should().Be("keep");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_constraints_when_entry_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "constraints": ["https-only\u0300", "https-only"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Constraints.Should().Equal("https-only");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_assumptions_when_entry_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "assumptions": ["single-region\u0300", "single-region"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Assumptions.Should().Equal("single-region");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_required_capabilities_when_entry_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "requiredCapabilities": ["messaging\u0300", "messaging"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.RequiredCapabilities.Should().Equal("messaging");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_reference_string_lists_when_entry_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "policyReferences": ["pci\u0300", "keep-policy"],
                "topologyHints": ["net/subnet\u0300", "keep/hint"],
                "securityBaselineHints": ["cis\u0300", "cis-baseline"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.PolicyReferences.Should().Equal("keep-policy");
        back.ContextIngestionRequest.TopologyHints.Should().Equal("keep/hint");
        back.ContextIngestionRequest.SecurityBaselineHints.Should().Equal("cis-baseline");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_combining_mark_only_string_list_entries()
    {
        Guid runId = Guid.Parse("88888888-8888-8888-8888-888888888888");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "inlineRequirements": ["\u0300", "keep-me"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InlineRequirements.Should().Equal("keep-me");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_format_only_string_list_entries()
    {
        Guid runId = Guid.Parse("77777777-7777-7777-7777-777777777777");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "inlineRequirements": ["\u200B", "keep-me"],
                "topologyHints": ["\u200B"],
                "constraints": ["\u200Bhidden", "visible"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InlineRequirements.Should().Equal("keep-me");
        back.ContextIngestionRequest.TopologyHints.Should().BeEmpty();
        back.ContextIngestionRequest.Constraints.Should().Equal("visible");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_document_when_name_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [
                  { "name": "diagram\u0300", "contentType": "text/plain", "content": "diagram source" },
                  { "name": "keep", "contentType": "text/plain", "content": "diagram source" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().ContainSingle()
            .Which.Name.Should().Be("keep");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_infrastructure_declaration_when_name_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "infrastructureDeclarations": [
                  { "name": "main\u0300", "format": "json", "content": "{\"resources\":[]}" },
                  { "name": "keep", "format": "json", "content": "{\"resources\":[]}" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InfrastructureDeclarations.Should().ContainSingle()
            .Which.Name.Should().Be("keep");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_infrastructure_declaration_when_format_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "infrastructureDeclarations": [
                  { "name": "main", "format": "json\u0300", "content": "{\"resources\":[]}" },
                  { "name": "keep", "format": "json", "content": "{\"resources\":[]}" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InfrastructureDeclarations.Should().ContainSingle()
            .Which.Name.Should().Be("keep");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_document_when_content_type_contains_embedded_combining_mark()
    {
        Guid runId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [
                  { "name": "keep", "contentType": "text/plain\u0300", "content": "diagram source" },
                  { "name": "keep", "contentType": "text/plain", "content": "diagram source" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().ContainSingle()
            .Which.ContentType.Should().Be("text/plain");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_empty_document_objects()
    {
        Guid runId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [
                  {},
                  { "name": "keep", "contentType": "text/plain", "content": "diagram source" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().ContainSingle()
            .Which.Name.Should().Be("keep");
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

    [SkippableFact]
    public void IsValidForProcessing_rejects_undefined_work_kind_values()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "default",
            },
            EvidenceBundleId = "bundle-1",
            WorkKind = (AuthorityPipelineWorkKind)99,
        };

        payload.IsValidForProcessing().Should().BeFalse(
            "undefined workKind values must discard invalid outbox payloads instead of failing handler resolution");
    }

    [SkippableFact]
    public void Deserialize_rejects_undefined_work_kind_numeric_values()
    {
        const string json = """
            {
              "contextIngestionRequest": {
                "runId": "11111111-1111-1111-1111-111111111111",
                "projectId": "default"
              },
              "evidenceBundleId": "bundle-1",
              "workKind": 99
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.IsValidForProcessing().Should().BeFalse();
    }

    [SkippableFact]
    public void Deserialize_keeps_inline_requirements_with_internal_spaces()
    {
        Guid runId = Guid.Parse("15151515-1515-1515-1515-151515151515");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "inlineRequirements": ["must use https"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.InlineRequirements.Should().Equal("must use https");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_policy_reference_when_entry_contains_embedded_nbsp()
    {
        Guid runId = Guid.Parse("16161616-1616-1616-1616-161616161616");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "policyReferences": ["pci\u00A0/dss", "keep-policy"]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.PolicyReferences.Should().Equal("keep-policy");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_filters_document_when_name_contains_embedded_nbsp()
    {
        Guid runId = Guid.Parse("14141414-1414-1414-1414-141414141414");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [
                  { "name": "diag\u00A0ram", "contentType": "text/plain", "content": "body" },
                  { "name": "keep", "contentType": "text/plain", "content": "body" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().ContainSingle()
            .Which.Name.Should().Be("keep");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [SkippableFact]
    public void Deserialize_rejects_evidence_bundle_id_with_embedded_nbsp()
    {
        const string json = """
            {
              "contextIngestionRequest": {
                "runId": "11111111-1111-1111-1111-111111111111",
                "projectId": "default"
              },
              "evidenceBundleId": "bundle\u00A01"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.IsValidForProcessing().Should().BeFalse();
    }

    [SkippableFact]
    public void Deserialize_defaults_work_kind_to_execute_when_json_omits_work_kind()
    {
        const string json = """
            {
              "contextIngestionRequest": {
                "runId": "11111111-1111-1111-1111-111111111111",
                "projectId": "default"
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.WorkKind.Should().Be(AuthorityPipelineWorkKind.Execute);
        back.IsValidForProcessing().Should().BeTrue();
    }
}

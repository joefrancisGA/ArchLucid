using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.Persistence.Tests.Orchestration;
[Trait("Category", "Unit")]

/// <summary>
///     Hunt #259 cheap-disproof regressions for authority-pipeline-payload open candidates.
/// </summary>
public sealed class AuthorityPipelineWorkPayloadHunt259ProbeTests
{
    [SkippableFact]
    public void Deserialize_filters_document_when_content_is_tab_only()
    {
        Guid runId = Guid.Parse("25252525-2525-2525-2525-252525252525");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [
                  { "name": "diag", "contentType": "text/plain", "content": "\t\t" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().BeEmpty(
            "tab-only bodies are not substantive text even though tabs are allowed in multiline guards");
    }

    [SkippableFact]
    public void IsValidForProcessing_allows_evidence_bundle_id_with_ascii_leading_and_trailing_spaces()
    {
        AuthorityPipelineWorkPayload payload = new()
        {
            ContextIngestionRequest = new ContextIngestionRequest
            {
                RunId = Guid.NewGuid(),
                ProjectId = "default",
            },
            EvidenceBundleId = "  bundle-1  ",
        };

        payload.IsValidForProcessing().Should().BeTrue(
            "compact id validation trims only for internal whitespace checks; worker lookup trims before repository fetch");
    }

    [SkippableFact]
    public void Deserialize_keeps_duplicate_documents_with_same_name_and_content_type()
    {
        Guid runId = Guid.Parse("26262626-2626-2626-2626-262626262626");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [
                  { "name": "same", "contentType": "text/plain", "content": "one" },
                  { "name": "same", "contentType": "text/plain", "content": "two" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().HaveCount(2,
            "materialize is filter-only; dedupe belongs at intake or connector normalization");
    }

    [SkippableFact]
    public void Deserialize_keeps_document_when_content_type_is_unsupported_base_with_charset_parameter()
    {
        Guid runId = Guid.Parse("27272727-2727-2727-2727-272727272727");
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [
                  { "name": "legacy", "contentType": "text/unsupported; charset=utf-8", "content": "body" }
                ]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().ContainSingle()
            .Which.ContentType.Should().Be("text/unsupported; charset=utf-8",
                "lookup token is judged after NormalizeContentTypeForLookup; raw value is preserved for connector warnings");
    }

    [SkippableFact]
    public void Deserialize_rejects_negative_work_kind_numeric_values()
    {
        const string json = """
            {
              "contextIngestionRequest": {
                "runId": "11111111-1111-1111-1111-111111111111",
                "projectId": "default"
              },
              "evidenceBundleId": "bundle-1",
              "workKind": -1
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.IsValidForProcessing().Should().BeFalse(
            "omitted workKind defaulting to Execute is legacy-safe; out-of-range numerics must fail the processing gate");
    }
}
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.Persistence.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class AuthorityPipelineWorkPayloadDocumentsNullElementTests
{
    [Fact]
    public void Deserialize_filters_null_document_elements_before_worker_gate()
    {
        Guid runId = Guid.NewGuid();
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "documents": [null]
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? back = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        back.Should().NotBeNull();
        back!.ContextIngestionRequest.Documents.Should().NotBeNull().And.BeEmpty(
            "EnsureMutableCollections must strip null STJ array entries before connector normalizers run");
        back.IsValidForProcessing().Should().BeTrue();
    }

    [Fact]
    public void Document_connector_normalizer_throws_when_payload_documents_contains_null()
    {
        DocumentConnectorPayloadNormalizer sut = new([]);

        DocumentConnectorPayload payload = new() { Documents = [null!] };

        Func<Task> act = async () => await sut.NormalizeAsync(payload, CancellationToken.None);

        act.Should().ThrowAsync<NullReferenceException>();
    }
}

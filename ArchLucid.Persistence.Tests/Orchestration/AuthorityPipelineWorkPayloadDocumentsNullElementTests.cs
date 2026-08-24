using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.Persistence.Tests.Orchestration;

[Trait("Category", "Unit")]
public sealed class AuthorityPipelineWorkPayloadDocumentsNullElementTests
{
    [Fact]
    public void IsValidForProcessing_rejects_documents_with_null_element_after_deserialize()
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
        back!.IsValidForProcessing().Should().BeFalse(
            "null document entries survive EnsureMutableCollections and NRE in DocumentConnectorPayloadNormalizer");
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

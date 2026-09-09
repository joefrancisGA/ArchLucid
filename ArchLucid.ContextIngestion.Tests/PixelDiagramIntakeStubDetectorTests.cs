using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Persistence.Context;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class PixelDiagramIntakeStubDetectorTests
{
    [Fact]
    public void TryDetect_ReturnsTrue_ForPixelDiagramIntakeStubJson()
    {
        ContextDocumentReference document = new()
        {
            Name = "topology.png",
            ContentType = SupportedContextDocumentContentTypes.StructuredDiagramJson,
            Content =
                """
                {
                  "nodes": [],
                  "edges": [],
                  "trustBoundaryLabels": [],
                  "intakeStub": {
                    "kind": "pixel-diagram-not-verifiable",
                    "sourceMimeType": "image/png",
                    "extractionMethod": "None",
                    "verificationStatus": "NotVerifiable",
                    "evidenceItemId": null,
                    "pendingStoredFileMarker": "pending-stored-file:topology.png"
                  }
                }
                """,
        };

        bool detected = PixelDiagramIntakeStubDetector.TryDetect(document, out PixelDiagramIntakeStubMetadata metadata);

        detected.Should().BeTrue();
        metadata.FileName.Should().Be("topology.png");
        metadata.SourceMimeType.Should().Be("image/png");
    }

    [Fact]
    public async Task DocumentConnector_NormalizeAsync_MintsCanonicalObjects_ForNativeDiagramJson()
    {
        DocumentConnectorPayloadNormalizer normalizer = new(
        [
            new ArchLucidDiagramJsonContextDocumentParser(),
            new PlainTextContextDocumentParser(),
        ]);

        DocumentConnectorPayload payload = new()
        {
            Documents =
            [
                new ContextDocumentReference
                {
                    DocumentId = "doc-native-json",
                    Name = "topology.diagram.json",
                    ContentType = SupportedContextDocumentContentTypes.StructuredDiagramJson,
                    Content =
                        """
                        {
                          "nodes": [
                            { "id": "api", "label": "API Gateway", "kind": "system" }
                          ],
                          "edges": [],
                          "trustBoundaryLabels": []
                        }
                        """,
                },
            ],
        };

        NormalizedContextBatch batch = await normalizer.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.CanonicalObjects[0].Properties["inferenceConfidence"].Should().Be("1");
        batch.Warnings.Should().BeEmpty();
    }

    [Fact]
    public async Task DocumentConnector_NormalizeAsync_DoesNotMintCanonicalObjects_ForPixelStub()
    {
        DocumentConnectorPayloadNormalizer normalizer = new(
        [
            new PlainTextContextDocumentParser(),
        ]);

        DocumentConnectorPayload payload = new()
        {
            Documents =
            [
                new ContextDocumentReference
                {
                    Name = "topology.png",
                    ContentType = SupportedContextDocumentContentTypes.StructuredDiagramJson,
                    Content =
                        """
                        {
                          "nodes": [],
                          "edges": [],
                          "trustBoundaryLabels": [],
                          "intakeStub": {
                            "kind": "pixel-diagram-not-verifiable",
                            "sourceMimeType": "image/png",
                            "extractionMethod": "None",
                            "verificationStatus": "NotVerifiable",
                            "evidenceItemId": null,
                            "pendingStoredFileMarker": "pending-stored-file:topology.png"
                          }
                        }
                        """,
                },
            ],
        };

        NormalizedContextBatch batch = await normalizer.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().BeEmpty();
        batch.Warnings.Should().ContainSingle()
            .Which.Should().StartWith(PixelDiagramNotVerifiableWarnings.Prefix);
    }
}

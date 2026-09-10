using ArchLucid.ContextIngestion;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     AS-045 / R5 matrix — diagram ingest must not invent topology CanonicalObject resources.
///     Cited by AS-100 wave close audit.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineR5DiagramNeverMintsResourcesMatrixTests
{
    public static TheoryData<string, Action> MatrixCases => new()
    {
        { "unlabeled_diagram_nodes_skipped_by_mapper", AssertUnlabeledDiagramNodesSkippedByMapper },
        { "unlabeled_diagram_nodes_skipped_by_compiler", AssertUnlabeledDiagramNodesSkippedByCompiler },
        { "pixel_stub_normalized_batch_mints_zero_canonical_objects", AssertPixelStubNormalizedBatchMintsZeroCanonicalObjects },
    };

    [Theory]
    [MemberData(nameof(MatrixCases))]
    public void As045_r5_matrix_case(string caseName, Action assert)
    {
        caseName.Should().NotBeNullOrWhiteSpace();
        assert();
    }

    private static void AssertUnlabeledDiagramNodesSkippedByMapper()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "rect-1",
                    Label = string.Empty,
                    Kind = ArchitectureDiagramNodeKinds.System,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "rect-2",
                    Label = "rect-2",
                    Kind = ArchitectureDiagramNodeKinds.System,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        IReadOnlyList<CanonicalObject> objects = ArchitectureDiagramCanonicalObjectMapper.Map(
            model,
            "doc-as045-unlabeled",
            labelOnlyInferenceConfidence: 0.7d);

        objects.Should().BeEmpty();
    }

    private static void AssertUnlabeledDiagramNodesSkippedByCompiler()
    {
        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult result = compiler.Compile(
            new ArchitectureDiagramModelRecord
            {
                Nodes =
                [
                    new ArchitectureDiagramNodeRecord
                    {
                        Id = "rect-1",
                        Label = string.Empty,
                        Kind = ArchitectureDiagramNodeKinds.System,
                    },
                    new ArchitectureDiagramNodeRecord
                    {
                        Id = "rect-2",
                        Label = "rect-2",
                        Kind = ArchitectureDiagramNodeKinds.System,
                    },
                ],
                ExtractionMethod = DiagramExtractionMethods.StructuredParse,
            },
            CreateCompileOptions());

        result.Snapshot.Nodes.Should().BeEmpty();
        result.UnlabeledShapeCount.Should().BeGreaterThan(0);
    }

    private static void AssertPixelStubNormalizedBatchMintsZeroCanonicalObjects()
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

        NormalizedContextBatch batch = normalizer.NormalizeAsync(payload, CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        batch.CanonicalObjects.Should().BeEmpty();
        batch.CanonicalObjects.Should().NotContain(obj =>
            string.Equals(obj.ObjectType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase));
        batch.Warnings.Should().ContainSingle()
            .Which.Should().StartWith(PixelDiagramNotVerifiableWarnings.Prefix);
    }

    private static StructuredDiagramGraphCompileOptions CreateCompileOptions()
    {
        return new StructuredDiagramGraphCompileOptions
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            GraphSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            CreatedUtc = DateTime.Parse("2026-01-01T00:00:00Z"),
        };
    }
}

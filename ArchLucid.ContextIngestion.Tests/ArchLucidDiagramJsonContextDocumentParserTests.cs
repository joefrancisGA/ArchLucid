using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class ArchLucidDiagramJsonContextDocumentParserTests
{
    private readonly ArchLucidDiagramJsonContextDocumentParser parser = new();

    [Fact]
    public async Task ParseAsync_ProductJson_YieldsAssertedTopologyWithFullConfidence()
    {
        ContextDocumentReference document = new()
        {
            DocumentId = "doc-diagram-json",
            Name = "topology.diagram.json",
            ContentType = SupportedContextDocumentContentTypes.StructuredDiagramJson,
            Content =
                """
                {
                  "nodes": [
                    { "id": "api", "label": "API Gateway", "kind": "system" },
                    { "id": "db", "label": "SQL Database", "kind": "system" }
                  ],
                  "edges": [
                    { "id": "e1", "sourceId": "api", "targetId": "db", "label": "queries" }
                  ],
                  "trustBoundaryLabels": ["Private subnet"],
                  "extractionMethod": "StructuredParse"
                }
                """,
        };

        IReadOnlyList<CanonicalObject> objects = await this.parser.ParseAsync(document, CancellationToken.None);

        objects.Should().HaveCount(2);
        objects.Should().OnlyContain(obj => obj.SourceType == ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType);
        objects.Should().OnlyContain(obj => obj.Properties["inferenceConfidence"] == "1");
        objects.Should().OnlyContain(obj => obj.Properties["extractionMethod"] == DiagramExtractionMethods.StructuredParse);

        CanonicalObject api = objects.Single(obj => obj.Properties["diagramNodeId"] == "api");
        api.Properties.Should().ContainKey("connectedToNodeIds");
        api.Properties["connectedToNodeIds"].Should().StartWith("obj-");
    }

    [Fact]
    public async Task ParseAsync_ProductJson_CompilesToGraphSnapshotWithoutLabelOnlyPenalty()
    {
        const string json =
            """
            {
              "nodes": [
                { "id": "api", "label": "API Gateway", "kind": "system" },
                { "id": "db", "label": "SQL Database", "kind": "system" }
              ],
              "edges": [
                { "id": "e1", "sourceId": "api", "targetId": "db", "label": "queries" }
              ],
              "extractionMethod": "StructuredParse"
            }
            """;

        ContextDocumentReference document = new()
        {
            DocumentId = "doc-graph-roundtrip",
            Name = "topology.diagram.json",
            ContentType = SupportedContextDocumentContentTypes.StructuredDiagramJson,
            Content = json,
        };

        IReadOnlyList<CanonicalObject> objects = await this.parser.ParseAsync(document, CancellationToken.None);
        objects.Should().HaveCount(2);

        ArchLucidDiagramJsonParser sourceParser = new();
        DiagramParseResult parseResult = sourceParser.Parse(new DiagramSourceReference
        {
            Name = document.Name,
            Format = DiagramSourceFormats.ArchLucidDiagramJson,
            Content = json,
        });

        ArchitectureDiagramModelRecord model = parseResult.Model;
        model.ExtractionMethod = DiagramExtractionMethods.StructuredParse;

        foreach (ArchitectureDiagramNodeRecord node in model.Nodes)
        {
            node.Provenance = ArchitectureDiagramProvenanceKinds.Asserted;
        }

        foreach (ArchitectureDiagramEdgeRecord edge in model.Edges)
        {
            edge.Provenance = ArchitectureDiagramProvenanceKinds.Asserted;
        }

        ArchitectureDiagramToGraphCompiler compiler = new();
        StructuredDiagramGraphCompileResult compileResult = compiler.Compile(
            model,
            new StructuredDiagramGraphCompileOptions
            {
                RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                ContextSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                GraphSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                CreatedUtc = DateTime.Parse("2026-01-01T00:00:00Z"),
                LabelOnlyInferenceConfidence = 0.35,
            });

        compileResult.Warnings.Should().BeEmpty();
        compileResult.Snapshot.Nodes.Should().HaveCount(2);
        compileResult.Snapshot.Nodes.Should().OnlyContain(
            node => node.Properties[StructuredDiagramGraphPropertyKeys.InferenceConfidence] == "1");
        compileResult.Snapshot.Edges.Should().ContainSingle()
            .Which.Weight.Should().Be(1d);
    }

    [Fact]
    public async Task ParseAsync_InvalidJson_ReturnsEmptyWithoutThrowing()
    {
        ContextDocumentReference document = new()
        {
            DocumentId = "doc-garbage",
            Name = "garbage.json",
            ContentType = SupportedContextDocumentContentTypes.StructuredDiagramJson,
            Content = "{ not valid diagram json",
        };

        IReadOnlyList<CanonicalObject> objects = await this.parser.ParseAsync(document, CancellationToken.None);

        objects.Should().BeEmpty();
    }

    [Fact]
    public void CanParse_OnlyAcceptsStructuredDiagramJsonMimeType()
    {
        this.parser.CanParse(SupportedContextDocumentContentTypes.StructuredDiagramJson).Should().BeTrue();
        this.parser.CanParse("text/plain").Should().BeFalse();
        this.parser.CanParse("text/vnd.mermaid").Should().BeFalse();
    }
}

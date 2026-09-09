using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class DrawIoContextDocumentParserTests
{
    private readonly DrawIoContextDocumentParser parser = new();

    [Fact]
    public async Task ParseAsync_DrawIoFixture_YieldsTopologyNodes()
    {
        const string drawIo = """
            <mxfile host="app.diagrams.net">
              <diagram id="page-1" name="Page-1">
                <mxGraphModel>
                  <root>
                    <mxCell id="0"/>
                    <mxCell id="1" parent="0"/>
                    <mxCell id="2" value="API Gateway" vertex="1" parent="1"/>
                  </root>
                </mxGraphModel>
              </diagram>
            </mxfile>
            """;

        ContextDocumentReference document = new()
        {
            DocumentId = "doc-drawio-fixture",
            Name = "topology.drawio",
            ContentType = SupportedContextDocumentContentTypes.DrawIoXml,
            Content = drawIo,
        };

        IReadOnlyList<CanonicalObject> objects = await this.parser.ParseAsync(document, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be(GraphNodeTypes.TopologyResource);
        objects[0].SourceType.Should().Be(ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType);
        objects[0].Properties["extractionMethod"].Should().Be(DiagramExtractionMethods.StructuredParse);
    }
}

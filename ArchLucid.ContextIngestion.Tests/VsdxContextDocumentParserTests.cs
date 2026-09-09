using System.IO.Compression;
using System.Text;

using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class VsdxContextDocumentParserTests
{
    private readonly VsdxContextDocumentParser parser = new();

    [Fact]
    public async Task ParseAsync_VsdxFixture_YieldsTopologyNodes()
    {
        const string pageXml = """
            <?xml version="1.0" encoding="utf-8"?>
            <PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main">
              <Shapes>
                <Shape ID="1" NameU="API Gateway" Type="Shape">
                  <Text>API Gateway</Text>
                </Shape>
              </Shapes>
            </PageContents>
            """;

        byte[] packageBytes = BuildMinimalVsdxPackage(pageXml);

        ContextDocumentReference document = new()
        {
            DocumentId = "doc-vsdx-fixture",
            Name = "topology.vsdx",
            ContentType = SupportedContextDocumentContentTypes.VisioVsdx,
            Content = Convert.ToBase64String(packageBytes),
        };

        IReadOnlyList<CanonicalObject> objects = await this.parser.ParseAsync(document, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].ObjectType.Should().Be(GraphNodeTypes.TopologyResource);
        objects[0].SourceType.Should().Be(ArchitectureDiagramCanonicalObjectMapper.StructuredDiagramSourceType);
        objects[0].Properties["extractionMethod"].Should().Be(DiagramExtractionMethods.StructuredParse);
    }

    private static byte[] BuildMinimalVsdxPackage(string pageXml)
    {
        using MemoryStream stream = new();
        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry pageEntry = archive.CreateEntry("visio/pages/page1.xml");
            using (StreamWriter writer = new(pageEntry.Open(), Encoding.UTF8))
            {
                writer.Write(pageXml);
            }
        }

        return stream.ToArray();
    }
}

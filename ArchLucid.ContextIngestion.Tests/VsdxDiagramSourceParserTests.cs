using System.IO.Compression;
using System.Text;

using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class VsdxDiagramSourceParserTests
{
    private const string PageXml = """
        <?xml version="1.0" encoding="utf-8"?>
        <PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main">
          <Shapes>
            <Shape ID="1" NameU="API Gateway" Type="Shape">
              <Text>API Gateway</Text>
            </Shape>
            <Shape ID="2" NameU="SQL Database" Type="Shape">
              <Text>SQL Database</Text>
            </Shape>
          </Shapes>
          <Connects>
            <Connect FromSheet="1" ToSheet="2"/>
          </Connects>
        </PageContents>
        """;

    private readonly VsdxDiagramSourceParser parser = new();

    [Fact]
    public void Parse_MinimalVsdxFixture_YieldsNodesAndEdges()
    {
        byte[] packageBytes = BuildMinimalVsdxPackage(PageXml);
        string base64 = Convert.ToBase64String(packageBytes);

        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "topology.vsdx",
            Format = DiagramSourceFormats.Vsdx,
            Content = base64,
        });

        result.Model.Nodes.Should().HaveCount(2);
        result.Model.Nodes.Should().Contain(node => node.Label == "API Gateway");
        result.Model.Nodes.Should().Contain(node => node.Label == "SQL Database");
        result.Model.Edges.Should().ContainSingle(edge => edge.SourceId == "1" && edge.TargetId == "2");
        result.LabelOnlyInferenceConfidence.Should().Be(0.7d);
    }

    [Fact]
    public void Parse_UnsafeZipEntry_IsRejectedButValidPageStillParses()
    {
        byte[] packageBytes = BuildVsdxPackageWithUnsafeEntry(PageXml);
        string base64 = Convert.ToBase64String(packageBytes);

        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "unsafe.vsdx",
            Format = DiagramSourceFormats.Vsdx,
            Content = base64,
        });

        result.Model.Nodes.Should().HaveCount(2);
        result.Warnings.Should().Contain(warning =>
            warning.Contains("Rejected unsafe Visio zip entry", StringComparison.Ordinal));
    }

    [Fact]
    public void Parse_PageWithoutConnects_StillYieldsNodes()
    {
        const string pageWithoutConnects = """
            <?xml version="1.0" encoding="utf-8"?>
            <PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main">
              <Shapes>
                <Shape ID="1" NameU="Worker" Type="Shape">
                  <Text>Worker</Text>
                </Shape>
              </Shapes>
            </PageContents>
            """;

        byte[] packageBytes = BuildMinimalVsdxPackage(pageWithoutConnects);
        string base64 = Convert.ToBase64String(packageBytes);

        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "nodes-only.vsdx",
            Format = DiagramSourceFormats.Vsdx,
            Content = base64,
        });

        result.Model.Nodes.Should().ContainSingle(node => node.Label == "Worker");
        result.Model.Edges.Should().BeEmpty();
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

    private static byte[] BuildVsdxPackageWithUnsafeEntry(string pageXml)
    {
        using MemoryStream stream = new();
        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry unsafeEntry = archive.CreateEntry("../evil.xml");
            using (StreamWriter unsafeWriter = new(unsafeEntry.Open(), Encoding.UTF8))
            {
                unsafeWriter.Write("<evil/>");
            }

            ZipArchiveEntry pageEntry = archive.CreateEntry("visio/pages/page1.xml");
            using (StreamWriter writer = new(pageEntry.Open(), Encoding.UTF8))
            {
                writer.Write(pageXml);
            }
        }

        return stream.ToArray();
    }
}

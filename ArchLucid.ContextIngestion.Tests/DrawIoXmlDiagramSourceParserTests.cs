using System.IO.Compression;
using System.Text;

using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class DrawIoXmlDiagramSourceParserTests
{
    private const string UncompressedMxFile = """
        <mxfile host="app.diagrams.net">
          <diagram id="page-1" name="Page-1">
            <mxGraphModel>
              <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
                <mxCell id="2" value="API Gateway" vertex="1" parent="1">
                  <mxGeometry x="0" y="0" width="120" height="60" as="geometry"/>
                </mxCell>
                <mxCell id="3" value="SQL Database" vertex="1" parent="1">
                  <mxGeometry x="200" y="0" width="120" height="60" as="geometry"/>
                </mxCell>
                <mxCell id="4" value="queries" edge="1" parent="1" source="2" target="3">
                  <mxGeometry relative="1" as="geometry"/>
                </mxCell>
              </root>
            </mxGraphModel>
          </diagram>
        </mxfile>
        """;

    private readonly DrawIoXmlDiagramSourceParser parser = new();

    [Fact]
    public void Parse_UncompressedMxFile_YieldsNodesAndEdges()
    {
        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "topology.drawio",
            Format = DiagramSourceFormats.DrawIoXml,
            Content = UncompressedMxFile,
        });

        result.Model.Nodes.Should().HaveCountGreaterThanOrEqualTo(2);
        result.Model.Nodes.Should().Contain(node => node.Label == "API Gateway");
        result.Model.Nodes.Should().Contain(node => node.Label == "SQL Database");
        result.Model.Edges.Should().ContainSingle(edge =>
            edge.SourceId == "2"
            && edge.TargetId == "3"
            && edge.Label == "queries");
        result.LabelOnlyInferenceConfidence.Should().Be(0.7d);
    }

    [Fact]
    public void Parse_CompressedMxFileWithoutDecompress_WarnsHonestly()
    {
        string compressedPayload = Convert.ToBase64String(Encoding.UTF8.GetBytes("not-deflate-payload"));

        string mxFile = $"""
            <mxfile host="app.diagrams.net">
              <diagram id="page-1" name="Page-1">{compressedPayload}</diagram>
            </mxfile>
            """;

        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "compressed.drawio",
            Format = DiagramSourceFormats.DrawIoXml,
            Content = mxFile,
        });

        result.Model.Nodes.Should().BeEmpty();
        result.Warnings.Should().Contain(warning =>
            warning.Contains("Compressed draw.io diagram was not extracted", StringComparison.Ordinal));
    }

    [Fact]
    public void Parse_CompressedMxFile_DecompressesWhenDeflatePayloadIsValid()
    {
        string innerGraph = """
            <mxGraphModel>
              <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
                <mxCell id="2" value="Worker" vertex="1" parent="1"/>
              </root>
            </mxGraphModel>
            """;

        string compressedPayload = CompressDrawIoDiagramPayload(innerGraph);
        string mxFile = $"""
            <mxfile host="app.diagrams.net">
              <diagram id="page-1" name="Page-1">{compressedPayload}</diagram>
            </mxfile>
            """;

        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "compressed-valid.drawio",
            Format = DiagramSourceFormats.DrawIoXml,
            Content = mxFile,
        });

        result.Model.Nodes.Should().ContainSingle(node => node.Label == "Worker");
        result.Warnings.Should().NotContain(warning =>
            warning.Contains("Compressed draw.io diagram was not extracted", StringComparison.Ordinal));
    }

    private static string CompressDrawIoDiagramPayload(string xml)
    {
        byte[] sourceBytes = Encoding.UTF8.GetBytes(xml);
        using MemoryStream output = new();

        using (DeflateStream deflate = new(output, CompressionMode.Compress, leaveOpen: true))
        {
            deflate.Write(sourceBytes, 0, sourceBytes.Length);
        }

        return Convert.ToBase64String(output.ToArray());
    }
}

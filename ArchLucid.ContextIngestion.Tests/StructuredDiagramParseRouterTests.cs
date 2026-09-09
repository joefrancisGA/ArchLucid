using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class StructuredDiagramParseRouterTests
{
    private readonly StructuredDiagramParseRouter router = new(
    [
        new MermaidDiagramSourceParser(),
        new ArchLucidDiagramJsonParser(),
        new DrawIoXmlDiagramSourceParser(),
        new SvgDiagramSourceParser(),
    ]);

    [Fact]
    public void Parse_MermaidFixture_YieldsNodesAndEdges()
    {
        const string mermaid = """
            flowchart LR
                api["API Gateway"]
                db["SQL Database"]
                api -->|"queries"| db
            """;

        DiagramParseResult result = this.router.Parse(new DiagramSourceReference
        {
            Name = "fixture",
            Format = DiagramSourceFormats.Mermaid,
            Content = mermaid,
        });

        result.Warnings.Should().BeEmpty();
        result.Model.Nodes.Should().HaveCount(2);
        result.Model.Nodes.Select(node => node.Id).Should().BeEquivalentTo(["api", "db"]);
        result.Model.Edges.Should().ContainSingle(edge =>
            edge.SourceId == "api"
            && edge.TargetId == "db"
            && edge.Label == "queries");
        result.LabelOnlyInferenceConfidence.Should().Be(0.7d);
    }

    [Fact]
    public void Parse_GarbageMermaid_DoesNotThrowAndReturnsWarnings()
    {
        DiagramParseResult result = this.router.Parse(new DiagramSourceReference
        {
            Name = "garbage",
            Format = DiagramSourceFormats.Mermaid,
            Content = "%%% not valid mermaid @@@",
        });

        result.Model.Nodes.Should().BeEmpty();
        result.Model.Edges.Should().BeEmpty();
        result.Warnings.Should().ContainSingle(warning =>
            warning.Contains("No Mermaid nodes were recognized", StringComparison.Ordinal));
    }

    [Fact]
    public void Parse_UnsupportedFormat_DoesNotThrow()
    {
        DiagramParseResult result = this.router.Parse(new DiagramSourceReference
        {
            Name = "unknown",
            Format = "png",
            Content = "binary",
        });

        result.Model.Nodes.Should().BeEmpty();
        result.Warnings.Should().ContainSingle(warning =>
            warning.Contains("Unsupported diagram format", StringComparison.Ordinal));
    }

    [Fact]
    public void Parse_SvgFixture_YieldsLabeledNodes()
    {
        const string svg = """
            <svg xmlns="http://www.w3.org/2000/svg">
              <g id="api">
                <rect x="0" y="0" width="100" height="40"/>
                <text x="50" y="25">API Gateway</text>
              </g>
            </svg>
            """;

        DiagramParseResult result = this.router.Parse(new DiagramSourceReference
        {
            Name = "fixture.svg",
            Format = DiagramSourceFormats.Svg,
            Content = svg,
        });

        result.Model.Nodes.Should().ContainSingle(node => node.Id == "api" && node.Label == "API Gateway");
    }

    [Fact]
    public void Parse_DrawIoFixture_YieldsNodesAndEdges()
    {
        const string drawIo = """
            <mxfile host="app.diagrams.net">
              <diagram id="page-1" name="Page-1">
                <mxGraphModel>
                  <root>
                    <mxCell id="0"/>
                    <mxCell id="1" parent="0"/>
                    <mxCell id="2" value="API Gateway" vertex="1" parent="1"/>
                    <mxCell id="3" value="SQL Database" vertex="1" parent="1"/>
                    <mxCell id="4" edge="1" parent="1" source="2" target="3"/>
                  </root>
                </mxGraphModel>
              </diagram>
            </mxfile>
            """;

        DiagramParseResult result = this.router.Parse(new DiagramSourceReference
        {
            Name = "fixture.drawio",
            Format = DiagramSourceFormats.DrawIoXml,
            Content = drawIo,
        });

        result.Model.Nodes.Should().HaveCountGreaterThanOrEqualTo(2);
        result.Model.Edges.Should().ContainSingle();
    }
}

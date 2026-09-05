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
}

using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class SvgDiagramSourceParserTests
{
    private readonly SvgDiagramSourceParser parser = new();

    [Fact]
    public void Parse_LabeledBoxes_YieldsNodes()
    {
        const string svg = """
            <svg xmlns="http://www.w3.org/2000/svg">
              <g id="api">
                <rect x="0" y="0" width="100" height="40"/>
                <text x="50" y="25">API Gateway</text>
              </g>
              <g id="db">
                <rect x="0" y="0" width="100" height="40"/>
                <text x="50" y="25">SQL Database</text>
              </g>
            </svg>
            """;

        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "topology.svg",
            Format = DiagramSourceFormats.Svg,
            Content = svg,
        });

        result.Model.Nodes.Should().HaveCount(2);
        result.Model.Nodes.Select(node => node.Id).Should().BeEquivalentTo(["api", "db"]);
        result.Model.Nodes.Should().Contain(node => node.Label == "API Gateway");
        result.Model.Nodes.Should().Contain(node => node.Label == "SQL Database");
        result.LabelOnlyInferenceConfidence.Should().Be(0.7d);
    }

    [Fact]
    public void Parse_MaliciousOnclick_StillExtractsNodesAfterSanitize()
    {
        const string svg = """
            <svg xmlns="http://www.w3.org/2000/svg">
              <g id="api">
                <rect onclick="evil()" x="0" y="0" width="100" height="40"/>
                <text x="50" y="25">API Gateway</text>
              </g>
            </svg>
            """;

        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "unsafe.svg",
            Format = DiagramSourceFormats.Svg,
            Content = svg,
        });

        result.Model.Nodes.Should().ContainSingle(node => node.Id == "api" && node.Label == "API Gateway");
        result.Warnings.Should().Contain(warning => warning.Contains("onclick", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Parse_GarbageSvg_DoesNotThrow()
    {
        DiagramParseResult result = this.parser.Parse(new DiagramSourceReference
        {
            Name = "garbage.svg",
            Format = DiagramSourceFormats.Svg,
            Content = "not xml",
        });

        result.Model.Nodes.Should().BeEmpty();
        result.Warnings.Should().NotBeEmpty();
    }
}

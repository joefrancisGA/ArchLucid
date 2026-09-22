using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class AzureArchitectureIconForestSvgTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void Render_mapped_resource_uses_embedded_azure_icon_and_keeps_accent()
    {
        DiagramForestLayoutResult result = renderer.Render(CreateAst("Microsoft.Compute/virtualMachines"));

        result.Succeeded.Should().BeTrue();
        XElement node = GetNode(result.Svg!);
        node.ToString().Should().Contain("class=\"azure-icon\"");
        node.ToString().Should().Contain("data-file=\"virtual-machine.png\"");
        node.ToString().Should().Contain("data:image/png;base64,");
        node.ToString().Should().NotContain("class=\"pictogram\"");
        node.ToString().Should().Contain("class=\"node-accent\"");
    }

    [Fact]
    public void Render_unmapped_resource_keeps_category_pictogram()
    {
        DiagramForestLayoutResult result = renderer.Render(CreateAst("Microsoft.Compute/galleries"));

        result.Succeeded.Should().BeTrue();
        XElement node = GetNode(result.Svg!);
        node.ToString().Should().Contain("class=\"pictogram\"");
        node.ToString().Should().NotContain("class=\"azure-icon\"");
        node.ToString().Should().Contain("class=\"node-accent\"");
    }

    private static DiagramAst CreateAst(string armResourceType)
    {
        return new DiagramAst
        {
            Title = "Azure inventory",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "resource",
                    Label = "resource",
                    NodeType = "TopologyResource",
                    ArmResourceType = armResourceType,
                    ArmResourceGroup = "rg-app",
                    OrderKey = 0,
                },
            ],
        };
    }

    private static XElement GetNode(string svg)
    {
        XDocument document = XDocument.Parse(svg);
        XNamespace svgNamespace = "http://www.w3.org/2000/svg";

        return document.Root!
            .Elements(svgNamespace + "g")
            .Single(element => (string?)element.Attribute("class") == "node");
    }
}

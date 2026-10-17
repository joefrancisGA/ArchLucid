using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestSubscriptionFrameLayoutTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void Render_full_subscription_draws_subscription_outer_frame()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (FullSubscription)",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                },
                new DiagramNode
                {
                    NodeId = "storage",
                    Label = "st-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    ArmResourceGroup = "rg-app",
                },
            ],
            Edges = [],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue(result.Error);
        XDocument svg = XDocument.Parse(result.Svg!);
        svg.Descendants()
            .Any(element =>
                (element.Attribute("class")?.Value ?? string.Empty).Contains("sub-frame", StringComparison.Ordinal))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Render_resource_group_mode_has_no_subscription_outer_frame()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (ResourceGroup) — rg-app",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm",
                    Label = "vm-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                },
            ],
            Edges = [],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue(result.Error);
        result.Svg.Should().NotContain("class=\"sub-frame");
    }
}

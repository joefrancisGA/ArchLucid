using System.Globalization;
using System.Text.RegularExpressions;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestRoleColumnLayoutTests
{
    private static readonly Regex TranslateRegex = new(
        @"translate\(([-\d.]+),([-\d.]+)\)",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void Render_mixed_resource_group_orders_nodes_by_role_columns()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (ResourceGroup)",
            Nodes =
            [
                Node("nsg", "edge-nsg", "Microsoft.Network/networkSecurityGroups", "rg-app"),
                Node("vm", "app-vm", "Microsoft.Compute/virtualMachines", "rg-app"),
                Node("kv", "app-kv", "Microsoft.KeyVault/vaults", "rg-app"),
                Node("storage", "app-st", "Microsoft.Storage/storageAccounts", "rg-app"),
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "nsg", ToNodeId = "vm", Label = "applies" },
                new DiagramEdge { FromNodeId = "vm", ToNodeId = "kv", Label = "uses" },
                new DiagramEdge { FromNodeId = "vm", ToNodeId = "storage", Label = "uses" },
            ],
        };

        XDocument svg = Render(ast);
        double nsgX = NodeCenterX(svg, "nsg");
        double vmX = NodeCenterX(svg, "vm");
        double kvX = NodeCenterX(svg, "kv");
        double storageX = NodeCenterX(svg, "storage");

        nsgX.Should().BeLessThan(vmX);
        vmX.Should().BeLessThan(kvX);
        kvX.Should().BeLessThan(storageX);

        svg.Descendants()
            .Where(element => element.Attribute("data-role-column") is not null)
            .Should()
            .HaveCountGreaterThanOrEqualTo(4);
    }

    [Fact]
    public void Render_data_flow_stage_with_three_nodes_does_not_assign_role_columns()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = "stage-source", Label = "Source" },
            ],
            Nodes =
            [
                Node("adf", "etl", "Microsoft.DataFactory/factories", "rg-data", "stage-source"),
                Node("sql", "sql-db", "Microsoft.Sql/servers/databases", "rg-data", "stage-source"),
                Node("storage", "landing", "Microsoft.Storage/storageAccounts", "rg-data", "stage-source"),
                Node("extra", "extra", "Microsoft.Storage/storageAccounts", "rg-data", "stage-source"),
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "adf", ToNodeId = "sql", Label = "writes" },
            ],
        };

        XDocument svg = Render(ast);
        svg.Descendants()
            .Any(element => element.Attribute("data-role-column") is not null)
            .Should()
            .BeFalse("DataFlow stage nodes keep LR layout instead of RG role columns");
    }

    private XDocument Render(DiagramAst ast)
    {
        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue(result.Error);
        return XDocument.Parse(result.Svg!);
    }

    private static double NodeCenterX(XDocument svg, string nodeId)
    {
        XElement? node = svg.Descendants()
            .FirstOrDefault(element =>
                element.Attribute("id")?.Value == $"node-{nodeId}");
        node.Should().NotBeNull(nodeId);

        string? transform = node!.Attribute("transform")?.Value;
        transform.Should().NotBeNull();
        Match match = TranslateRegex.Match(transform!);
        match.Success.Should().BeTrue();
        double x = double.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
        double width = double.Parse(
            node.Descendants().First(element => element.Attribute("class")?.Value == "node-card").Attribute("width")!.Value,
            CultureInfo.InvariantCulture);

        return x + (width / 2.0d);
    }

    private static DiagramNode Node(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string? subgraphId = null)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            ArmResourceType = armType,
            ArmResourceGroup = resourceGroup,
            SubgraphId = subgraphId,
            OrderKey = 0,
        };
    }
}

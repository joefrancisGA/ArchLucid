using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestVnetFrameLayoutTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();
    private readonly DiagramAstGraphvizDotEmitter emitter = new();

    [Fact]
    public void Render_packs_cited_members_inside_one_vnet_frame_and_leaves_key_vault_outside()
    {
        const string vnetArmId = "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet", "app-vnet", vnetArmId, "rg-app"),
                Subnet("subnet-a", vnetArmId, "a"),
                Subnet("subnet-b", vnetArmId, "b"),
                Workload("vm-a", "vm-a", "Microsoft.Compute/virtualMachines", "rg-app"),
                Workload("vm-b", "vm-b", "Microsoft.Compute/virtualMachines", "rg-app"),
                Workload("vault", "vault-app", "Microsoft.KeyVault/vaults", "rg-app"),
            ],
            [
                Cited("vm-a", "subnet-a"),
                Cited("vm-b", "subnet-b"),
            ]);

        XDocument svg = Render(ast);
        List<XElement> frames = VnetFrames(svg);
        frames.Should().ContainSingle();
        (double x, double y, double width, double height) box = Box(frames[0]);
        Contains(svg, box, "vm-a").Should().BeTrue();
        Contains(svg, box, "a").Should().BeTrue();
        Contains(svg, box, "vault-app").Should().BeFalse();
        frames[0].Descendants().Any(element =>
            element.Name.LocalName == "text"
            && element.Attribute("font-weight")?.Value == "700"
            && element.Value == "app-vnet").Should().BeTrue();
        svg.Descendants().Any(element =>
            element.Attribute("class")?.Value == "azure-icon"
            && element.Attribute("data-file")?.Value == "Svg/virtual-network.svg"
            && element.Ancestors().Any(ancestor => ancestor.Attribute("class")?.Value == "vnet-frame")).Should().BeTrue();
        svg.Descendants().Any(element => element.Attribute("id")?.Value == "node-vnet").Should().BeFalse();
        IconDrawnSide(svg, "Svg/virtual-network.svg").Should().Be(DiagramForestNestedFrameSvgEmitter.VnetCaptionFontSize);
    }

    [Fact]
    public void Render_two_vnets_in_one_resource_group_do_not_overlap()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet-a", "vnet-a", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/a", "rg-app"),
                Vnet("vnet-b", "vnet-b", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/b", "rg-app"),
                Workload("vm-a", "vm-a", "Microsoft.Compute/virtualMachines", "rg-app"),
                Workload("vm-b", "vm-b", "Microsoft.Compute/virtualMachines", "rg-app"),
            ],
            [
                Cited("vm-a", "vnet-a"),
                Cited("vm-b", "vnet-b"),
            ]);

        List<XElement> frames = VnetFrames(Render(ast));
        frames.Should().HaveCount(2);
        (double x, double y, double width, double height) first = Box(frames[0]);
        (double x, double y, double width, double height) second = Box(frames[1]);
        Overlaps(first, second).Should().BeFalse();
    }

    [Fact]
    public void Render_vnet_without_same_group_member_stays_a_card()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet", "lonely-vnet", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/lonely", "rg-app"),
            ],
            []);

        XDocument svg = Render(ast);
        VnetFrames(svg).Should().BeEmpty();
        svg.Descendants().Any(element => element.Attribute("id")?.Value == "node-vnet").Should().BeTrue();
    }

    [Fact]
    public void Render_cross_group_vm_moves_inside_the_vnet_box_and_keeps_its_group_label()
    {
        const string vnetArmId = "/subscriptions/s/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/net";
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet", "net", vnetArmId, "rg-net"),
                Subnet("subnet", vnetArmId, "app", "rg-net"),
                Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-app"),
            ],
            [
                Cited("vm", "subnet"),
            ]);

        XDocument svg = Render(ast);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "rg-frame").Should().Be(0);
        List<XElement> frames = VnetFrames(svg);
        frames.Should().ContainSingle();
        Contains(svg, Box(frames[0]), "vm-app").Should().BeTrue();
        svg.ToString().Should().Contain("rg-app");
        svg.ToString().Should().NotContain(">in<");
    }

    [Fact]
    public void Render_same_group_in_edge_is_not_drawn_inside_the_box()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app", "rg-app"),
                Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-app"),
            ],
            [
                Cited("vm", "vnet"),
            ]);

        XDocument svg = Render(ast);
        VnetFrames(svg).Should().ContainSingle();
        Contains(svg, Box(VnetFrames(svg)[0]), "vm").Should().BeTrue();
        svg.ToString().Should().NotContain(">in<");
    }

    [Fact]
    public void Render_peering_edge_between_vnets_stays_drawn()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet-a", "vnet-a", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/a", "rg-app"),
                Vnet("vnet-b", "vnet-b", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/b", "rg-app"),
                Workload("vm-a", "vm-a", "Microsoft.Compute/virtualMachines", "rg-app"),
                Workload("vm-b", "vm-b", "Microsoft.Compute/virtualMachines", "rg-app"),
            ],
            [
                Cited("vm-a", "vnet-a"),
                Cited("vm-b", "vnet-b"),
                new DiagramEdge { FromNodeId = "vnet-a", ToNodeId = "vnet-b", Label = "peering" },
            ]);

        Render(ast).ToString().Should().Contain(">peering<");
    }

    [Fact]
    public void Render_vnet_primary_frame_uses_the_stronger_stroke()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app", "rg-app"),
                Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-app"),
            ],
            [
                Cited("vm", "vnet"),
            ]);

        XDocument svg = Render(ast);
        XElement frame = svg.Descendants().First(element => element.Attribute("class")?.Value == "vnet-frame");
        frame.Elements().First(element => element.Name.LocalName == "rect").Attribute("stroke-width")?.Value.Should().Be("2.5");
    }

    [Fact]
    public void Emit_boxed_vnet_is_a_named_cluster_without_a_node_statement()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (FullSubscription)",
            [
                Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app", "rg-app"),
                Workload("vm-a", "vm-a", "Microsoft.Compute/virtualMachines", "rg-app"),
                Workload("vm-b", "vm-b", "Microsoft.Compute/virtualMachines", "rg-app"),
                Workload("vault", "vault", "Microsoft.KeyVault/vaults", "rg-app"),
            ],
            [
                Cited("vm-a", "vnet"),
                Cited("vm-b", "vnet"),
            ]);

        string dot = emitter.Emit(ast);
        dot.Should().Contain("subgraph cluster_vnet_");
        dot.Should().Contain("label=\"app-vnet\"");
        dot.Should().NotContain("VNet / subnet");
        dot.Split('\n').Should().NotContain(line =>
            line.Contains("[label=", StringComparison.Ordinal)
            && !line.Contains("->", StringComparison.Ordinal)
            && line.Contains("vnet", StringComparison.Ordinal));
    }

    [Fact]
    public void Render_full_subscription_seats_connected_resource_group_beside_vnet()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (FullSubscription)",
            [
                Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/app", "rg-net"),
                Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-net"),
                Workload("vault", "vault-app", "Microsoft.KeyVault/vaults", "rg-sec"),
            ],
            [
                Cited("vm", "vnet"),
                new DiagramEdge { FromNodeId = "vault", ToNodeId = "vnet", Label = "private endpoint" },
            ]);

        XDocument svg = Render(ast);
        XElement vnetFrame = VnetFrames(svg).Should().ContainSingle().Subject;
        XElement resourceGroupFrame = ResourceGroupFrames(svg)
            .Single(frame => frame.Elements().First(element => element.Name.LocalName == "title").Value == "rg-sec");
        (double vnetX, double vnetY, double vnetWidth, double vnetHeight) = Box(vnetFrame);
        (double groupX, double groupY, double groupWidth, double groupHeight) = Box(resourceGroupFrame);
        DiagramForestLayoutOptions options = new();

        Math.Abs(groupX - (vnetX + vnetWidth + options.ComponentHorizontalGap)).Should().BeLessThan(1.0d);
        Math.Abs(groupY - vnetY).Should().BeLessThan(1.0d);
        Contains(svg, (vnetX, vnetY, vnetWidth, vnetHeight), "vault").Should().BeFalse();
    }

    [Fact]
    public void Render_shared_resource_group_sits_between_two_vnets()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet-a", "vnet-a", "/subscriptions/s/resourceGroups/rg-a/providers/Microsoft.Network/virtualNetworks/a", "rg-a"),
                Vnet("vnet-b", "vnet-b", "/subscriptions/s/resourceGroups/rg-b/providers/Microsoft.Network/virtualNetworks/b", "rg-b"),
                Workload("vm-a", "vm-a", "Microsoft.Compute/virtualMachines", "rg-a"),
                Workload("vm-b", "vm-b", "Microsoft.Compute/virtualMachines", "rg-b"),
                Workload("vault", "vault-shared", "Microsoft.KeyVault/vaults", "rg-sec"),
            ],
            [
                Cited("vm-a", "vnet-a"),
                Cited("vm-b", "vnet-b"),
                new DiagramEdge { FromNodeId = "vault", ToNodeId = "vnet-a", Label = "private endpoint" },
                new DiagramEdge { FromNodeId = "vault", ToNodeId = "vnet-b", Label = "private endpoint" },
            ]);

        XDocument svg = Render(ast);
        List<XElement> vnetFrames = VnetFrames(svg);
        vnetFrames.Should().HaveCount(2);
        XElement sharedFrame = ResourceGroupFrames(svg)
            .Single(frame => frame.Elements().First(element => element.Name.LocalName == "title").Value == "rg-sec");
        (double sharedX, double sharedY, double sharedWidth, double sharedHeight) = Box(sharedFrame);
        List<(double X, double Y, double Width, double Height)> boxes = vnetFrames.Select(Box).ToList();
        (double X, double Y, double Width, double Height) left = boxes.OrderBy(box => box.X).First();
        (double X, double Y, double Width, double Height) right = boxes.OrderBy(box => box.X).Last();
        DiagramForestLayoutOptions options = new();

        (sharedX > left.X + left.Width).Should().BeTrue();
        (sharedX + sharedWidth < right.X).Should().BeTrue();
        Math.Abs(sharedX - (left.X + left.Width + options.ComponentHorizontalGap)).Should().BeLessThan(1.0d);
        Math.Abs(right.X - (sharedX + sharedWidth + options.ComponentHorizontalGap)).Should().BeLessThan(1.0d);
        Math.Abs(sharedY - left.Y).Should().BeLessThan(1.0d);
        Math.Abs(sharedY - right.Y).Should().BeLessThan(1.0d);
    }

    private XDocument Render(DiagramAst ast)
    {
        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue(result.Error);
        return XDocument.Parse(result.Svg!);
    }

    private static List<XElement> VnetFrames(XDocument svg)
    {
        return svg.Descendants()
            .Where(element => element.Attribute("class")?.Value == "vnet-frame")
            .ToList();
    }

    private static List<XElement> ResourceGroupFrames(XDocument svg)
    {
        return svg.Descendants()
            .Where(element => element.Attribute("class")?.Value == "rg-frame")
            .ToList();
    }

    private static (double X, double Y, double Width, double Height) Box(XElement frame)
    {
        XElement rect = frame.Elements().First(element => element.Name.LocalName == "rect");
        return (
            double.Parse(rect.Attribute("x")!.Value, CultureInfo.InvariantCulture),
            double.Parse(rect.Attribute("y")!.Value, CultureInfo.InvariantCulture),
            double.Parse(rect.Attribute("width")!.Value, CultureInfo.InvariantCulture),
            double.Parse(rect.Attribute("height")!.Value, CultureInfo.InvariantCulture));
    }

    private static bool Contains(XDocument svg, (double X, double Y, double Width, double Height) box, string nodeId)
    {
        XElement node = svg.Descendants().First(element =>
            element.Attribute("class")?.Value == "node"
            && element.Elements().Any(child =>
                child.Name.LocalName == "title"
                && child.Value.Contains(nodeId, StringComparison.Ordinal)));
        string transform = node.Attribute("transform")?.Value ?? string.Empty;
        string numbers = transform.Replace("translate(", string.Empty, StringComparison.Ordinal).TrimEnd(')');
        string[] parts = numbers.Split(',');
        double x = double.Parse(parts[0], CultureInfo.InvariantCulture);
        double y = double.Parse(parts[1], CultureInfo.InvariantCulture);
        XElement card = node.Descendants().First(element => element.Attribute("class")?.Value == "node-card");
        double width = double.Parse(card.Attribute("width")!.Value, CultureInfo.InvariantCulture);
        double height = double.Parse(card.Attribute("height")!.Value, CultureInfo.InvariantCulture);
        return x >= box.X - 0.5d
            && y >= box.Y - 0.5d
            && x + width <= box.X + box.Width + 0.5d
            && y + height <= box.Y + box.Height + 0.5d;
    }

    private static bool Overlaps(
        (double X, double Y, double Width, double Height) first,
        (double X, double Y, double Width, double Height) second)
    {
        return first.X < second.X + second.Width - 0.5d
            && second.X < first.X + first.Width - 0.5d
            && first.Y < second.Y + second.Height - 0.5d
            && second.Y < first.Y + first.Height - 0.5d;
    }

    private static double IconDrawnSide(XDocument svg, string file)
    {
        XElement icon = svg.Descendants().First(element =>
            element.Attribute("class")?.Value == "azure-icon"
            && element.Attribute("data-file")?.Value == file);
        string transform = icon.Attribute("transform")?.Value ?? string.Empty;
        int scaleIndex = transform.IndexOf("scale(", StringComparison.Ordinal);
        string scaleBody = transform[(scaleIndex + 6)..].TrimEnd(')');
        string[] parts = scaleBody.Split(',');
        double scale = double.Parse(parts[0], CultureInfo.InvariantCulture);
        return Math.Round(18.0d * scale, 3);
    }

    private static DiagramAst Inventory(string title, DiagramNode[] nodes, DiagramEdge[] edges)
    {
        return new DiagramAst
        {
            Title = title,
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
        };
    }

    private static DiagramNode Vnet(string nodeId, string label, string armId, string resourceGroup)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            NodeType = "TopologyResource",
            ArmResourceType = "Microsoft.Network/virtualNetworks",
            ArmResourceId = armId,
            ArmResourceGroup = resourceGroup,
        };
    }

    private static DiagramNode Subnet(string nodeId, string vnetArmId, string name, string resourceGroup = "rg-app")
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = name,
            NodeType = "TopologyResource",
            ArmResourceType = "Microsoft.Network/virtualNetworks/subnets",
            ArmResourceId = $"{vnetArmId}/subnets/{name}",
            ArmResourceGroup = resourceGroup,
        };
    }

    private static DiagramNode Workload(string nodeId, string label, string armType, string resourceGroup)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            NodeType = "TopologyResource",
            ArmResourceType = armType,
            ArmResourceId = $"/subscriptions/s/resourceGroups/{resourceGroup}/providers/{armType}/{nodeId}",
            ArmResourceGroup = resourceGroup,
        };
    }

    private static DiagramEdge Cited(string fromNodeId, string toNodeId)
    {
        return new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = "in",
            InferenceSource = GraphEdgeInferenceSources.InventoryLayoutVmVnet,
        };
    }
}

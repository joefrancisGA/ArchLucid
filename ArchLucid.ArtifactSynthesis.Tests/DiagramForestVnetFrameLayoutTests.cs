using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
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
                Workload("storage", "st-sec", "Microsoft.Storage/storageAccounts", "rg-sec"),
            ],
            [
                Cited("vm", "vnet"),
                new DiagramEdge { FromNodeId = "storage", ToNodeId = "vnet", Label = InventoryDiagramRelationshipLabelTexts.PrivateAccess },
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
        Contains(svg, (vnetX, vnetY, vnetWidth, vnetHeight), "st-sec").Should().BeFalse();
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
                Workload("storage", "st-shared", "Microsoft.Storage/storageAccounts", "rg-sec"),
            ],
            [
                Cited("vm-a", "vnet-a"),
                Cited("vm-b", "vnet-b"),
                new DiagramEdge { FromNodeId = "storage", ToNodeId = "vnet-a", Label = InventoryDiagramRelationshipLabelTexts.PrivateAccess },
                new DiagramEdge { FromNodeId = "storage", ToNodeId = "vnet-b", Label = InventoryDiagramRelationshipLabelTexts.PrivateAccess },
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

    [Fact]
    public void Render_network_mode_emits_neighborhood_metadata_and_frame_membership()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/app", "rg-net"),
                Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-net"),
                Workload("workspace", "workspace-app", "Microsoft.OperationalInsights/workspaces", "rg-sec"),
            ],
            [
                Cited("vm", "vnet"),
                new DiagramEdge { FromNodeId = "workspace", ToNodeId = "vnet", Label = InventoryDiagramRelationshipLabelTexts.PrivateAccess },
            ]);

        XDocument svg = Render(ast);
        XElement metadata = svg.Descendants().Single(element =>
            element.Name.LocalName == "metadata"
            && element.Attribute("id")?.Value == "diagram-neighborhoods");
        XElement vnetNeighborhood = metadata.Elements()
            .Single(element =>
                element.Name.LocalName == "neighborhood"
                && element.Attribute("kind")?.Value == "vnet");
        XElement sharedNeighborhood = metadata.Elements()
            .Single(element =>
                element.Name.LocalName == "neighborhood"
                && element.Attribute("kind")?.Value == "shared-services");

        vnetNeighborhood.Attribute("resource-count")?.Value.Should().Be("1");
        vnetNeighborhood.Elements().Where(element => element.Name.LocalName == "member")
            .Select(element => element.Attribute("id")?.Value)
            .Should().ContainSingle()
            .Which.Should().Be("vm");
        vnetNeighborhood.Elements().Single(element => element.Name.LocalName == "type")
            .Attribute("name")?.Value.Should().Be("virtualMachines");
        sharedNeighborhood.Elements().Where(element => element.Name.LocalName == "member")
            .Select(element => element.Attribute("id")?.Value)
            .Should().ContainSingle()
            .Which.Should().Be("workspace");
        VnetFrames(svg).Single().Attribute("data-neighborhood-id")?.Value
            .Should().Be(vnetNeighborhood.Attribute("id")?.Value);
        svg.Descendants()
            .Single(element =>
                element.Attribute("data-frame-cell-id")?.Value == "shared-services")
            .Attribute("data-neighborhood-id")?.Value
            .Should().Be(sharedNeighborhood.Attribute("id")?.Value);
    }

    [Fact]
    public void Render_vnet_caption_stays_above_member_cards()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (FullSubscription)",
            [
                Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/app", "rg-net"),
                Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-net"),
            ],
            [Cited("vm", "vnet")]);

        XDocument svg = Render(ast);
        XElement frame = VnetFrames(svg).Should().ContainSingle().Subject;
        (double frameX, double frameY, double frameWidth, double frameHeight) = Box(frame);
        XElement vm = svg.Descendants().First(element =>
            element.Attribute("class")?.Value == "node"
            && element.Elements().Any(child =>
                child.Name.LocalName == "title"
                && child.Value.Contains("vm", StringComparison.Ordinal)));
        string transform = vm.Attribute("transform")!.Value;
        string[] coordinates = transform.Replace("translate(", string.Empty, StringComparison.Ordinal).TrimEnd(')').Split(',');
        double vmY = double.Parse(coordinates[1], CultureInfo.InvariantCulture);
        XElement caption = frame.Descendants().First(element =>
            element.Name.LocalName == "text"
            && element.Value == "app-vnet");

        vmY.Should().BeGreaterThanOrEqualTo(frameY + DiagramForestResourceGroupFrameStyle.LabelBand - 0.5d);
        vmY.Should().BeLessThan(frameY + frameHeight);
        caption.Attribute("font-size")!.Value.Should().Be("14");
        caption.Attribute("fill")!.Value.Should().Be("#334155");
        frameX.Should().BeGreaterThanOrEqualTo(0);
        frameWidth.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Render_wide_vnet_neighborhood_wraps_connected_groups_under_vnet()
    {
        DiagramNode[] nodes =
        [
            Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/app", "rg-net"),
            Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-net"),
            PrivateWorkload("st-a", "st-a", "rg-a", "Microsoft.Storage/storageAccounts"),
            PrivateWorkload("st-b", "st-b", "rg-b", "Microsoft.Storage/storageAccounts"),
            PrivateWorkload("st-c", "st-c", "rg-c", "Microsoft.Storage/storageAccounts"),
            PrivateWorkload("st-d", "st-d", "rg-d", "Microsoft.Storage/storageAccounts"),
            PrivateWorkload("st-e", "st-e", "rg-e", "Microsoft.Storage/storageAccounts"),
            PrivateWorkload("st-f", "st-f", "rg-f", "Microsoft.Storage/storageAccounts"),
        ];

        XDocument svg = Render(Inventory(
            "Azure inventory (FullSubscription)",
            nodes,
            [
                Cited("vm", "vnet"),
                PrivateEndpoint("st-a", "vnet"),
                PrivateEndpoint("st-b", "vnet"),
                PrivateEndpoint("st-c", "vnet"),
                PrivateEndpoint("st-d", "vnet"),
                PrivateEndpoint("st-e", "vnet"),
                PrivateEndpoint("st-f", "vnet"),
            ]));

        XElement vnetFrame = VnetFrames(svg).Should().ContainSingle().Subject;
        (double vnetX, double vnetY, double vnetWidth, _) = Box(vnetFrame);
        List<(double X, double Y, double Width, double Height)> connectedFrames =
            ResourceGroupFrames(svg)
                .Where(frame => frame.Elements().First(element => element.Name.LocalName == "title").Value.StartsWith("rg-", StringComparison.Ordinal)
                    && frame.Elements().First(element => element.Name.LocalName == "title").Value != "rg-net")
                .Select(Box)
                .ToList();
        DiagramForestLayoutOptions options = new();

        connectedFrames.Should().HaveCount(6);
        connectedFrames.Should().Contain(frame => Math.Abs(frame.Y - vnetY) < 1.0d);
        connectedFrames.Should().Contain(frame => frame.Y > vnetY + 1.0d);
        connectedFrames.Should().OnlyContain(frame => frame.X >= vnetX - 1.0d);
        connectedFrames.Should().OnlyContain(frame => frame.X + frame.Width - vnetX <= options.MaxNodeWidth * 3 + frame.Width + 1.0d);
        vnetWidth.Should().BeGreaterThan(0);
    }

    [Fact]
    public void Render_unplaced_resource_groups_wrap_into_multiple_rows()
    {
        DiagramNode[] nodes =
        [
            Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/app", "rg-net"),
            Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-net"),
            Workload("st-a", "st-a", "Microsoft.Storage/storageAccounts", "rg-a"),
            Workload("st-b", "st-b", "Microsoft.Storage/storageAccounts", "rg-b"),
            Workload("st-c", "st-c", "Microsoft.Storage/storageAccounts", "rg-c"),
            Workload("st-d", "st-d", "Microsoft.Storage/storageAccounts", "rg-d"),
            Workload("st-e", "st-e", "Microsoft.Storage/storageAccounts", "rg-e"),
            Workload("st-f", "st-f", "Microsoft.Storage/storageAccounts", "rg-f"),
        ];

        XDocument svg = Render(Inventory(
            "Azure inventory (FullSubscription)",
            nodes,
            [Cited("vm", "vnet")]));

        List<double> remainderY = ResourceGroupFrames(svg)
            .Where(frame => frame.Attribute("data-frame-cell-id")?.Value != "shared-services")
            .Select(frame => Box(frame).Y)
            .Distinct()
            .ToList();

        remainderY.Should().HaveCountGreaterThan(1);
    }

    [Fact]
    public void Render_bundles_private_endpoint_edges_to_one_vnet()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (FullSubscription)",
            [
                Vnet("vnet", "app-vnet", "/subscriptions/s/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/app", "rg-net"),
                Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-net"),
                PrivateWorkload("vault-a", "vault-a", "rg-sec"),
                PrivateWorkload("vault-b", "vault-b", "rg-sec"),
                PrivateWorkload("vault-c", "vault-c", "rg-sec"),
            ],
            [
                Cited("vm", "vnet"),
                PrivateEndpoint("vault-a", "vnet"),
                PrivateEndpoint("vault-b", "vnet"),
                PrivateEndpoint("vault-c", "vnet"),
            ]);

        XDocument svg = Render(ast);
        string bundledTitle = $"{InventoryDiagramRelationshipLabelTexts.PrivateAccess} × 3";
        EdgeTitles(svg).Should().ContainSingle(title =>
            title.Equals(bundledTitle, StringComparison.OrdinalIgnoreCase));
        EdgeTitles(svg).Should().NotContain(title =>
            title.Equals(InventoryDiagramRelationshipLabelTexts.PrivateAccess, StringComparison.OrdinalIgnoreCase));
        XElement bundledEdge = svg
            .Descendants()
            .Single(element =>
                element.Attribute("class")?.Value == "edge"
                && element.Elements().Any(child =>
                    child.Name.LocalName == "title"
                    && child.Value.Equals(bundledTitle, StringComparison.OrdinalIgnoreCase)));
        bundledEdge.Attribute("data-bundle-from")?.Value
            .Should().Be(string.Join(
                ' ',
                new[] { "vault-a", "vault-b", "vault-c" }
                    .Select(MermaidIdSanitizer.Sanitize)
                    .OrderBy(id => id, StringComparer.Ordinal)));
        bundledEdge.Attribute("data-bundle-to")?.Value.Should().Be(MermaidIdSanitizer.Sanitize("vnet"));
        svg.Descendants().Count(element =>
                element.Attribute("class")?.Value == "private-endpoint-access"
                && element.Ancestors().Any(ancestor => ancestor.Attribute("class")?.Value == "node"))
            .Should().Be(3);
    }

    [Fact]
    public void Render_does_not_bundle_private_endpoint_edges_to_different_vnets()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet-a", "vnet-a", "/subscriptions/s/resourceGroups/rg-a/providers/Microsoft.Network/virtualNetworks/a", "rg-a"),
                Vnet("vnet-b", "vnet-b", "/subscriptions/s/resourceGroups/rg-b/providers/Microsoft.Network/virtualNetworks/b", "rg-b"),
                Workload("vm-a", "vm-a", "Microsoft.Compute/virtualMachines", "rg-a"),
                Workload("vm-b", "vm-b", "Microsoft.Compute/virtualMachines", "rg-b"),
                PrivateWorkload("vault-a", "vault-a", "rg-sec"),
                PrivateWorkload("vault-b", "vault-b", "rg-sec"),
            ],
            [
                Cited("vm-a", "vnet-a"),
                Cited("vm-b", "vnet-b"),
                PrivateEndpoint("vault-a", "vnet-a"),
                PrivateEndpoint("vault-b", "vnet-b"),
            ]);

        List<string> titles = EdgeTitles(Render(ast));
        titles.Count(title =>
                title.Equals(InventoryDiagramRelationshipLabelTexts.PrivateAccess, StringComparison.OrdinalIgnoreCase))
            .Should()
            .Be(2);
        titles.Should().NotContain(title => title.StartsWith($"{InventoryDiagramRelationshipLabelTexts.PrivateAccess} ×", StringComparison.Ordinal));
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

    private static List<string> EdgeTitles(XDocument svg)
    {
        return svg.Descendants()
            .Where(element => element.Attribute("class")?.Value == "edge")
            .Select(element => element.Elements().First(child => child.Name.LocalName == "title").Value)
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

    private static DiagramNode PrivateWorkload(
        string nodeId,
        string label,
        string resourceGroup,
        string armType = "Microsoft.KeyVault/vaults")
    {
        DiagramNode node = Workload(nodeId, label, armType, resourceGroup);
        node.HasPrivateEndpointAccess = true;
        return node;
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

    private static DiagramEdge PrivateEndpoint(string fromNodeId, string toNodeId)
    {
        return new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = InventoryDiagramRelationshipLabelTexts.PrivateAccess,
            InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
        };
    }

    [Fact]
    public void Render_places_shared_service_types_in_shared_services_frame()
    {
        const string vnetArmId = "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet", "app-vnet", vnetArmId, "rg-app"),
                Subnet("subnet", vnetArmId, "app", "rg-app"),
                Workload("vm", "vm-app", "Microsoft.Compute/virtualMachines", "rg-app"),
                Workload("workspace", "law-app", "Microsoft.OperationalInsights/workspaces", "rg-app"),
                Workload("vault", "vault-app", "Microsoft.KeyVault/vaults", "rg-app"),
                Workload("recovery-vault", "recovery-vault-app", "Microsoft.RecoveryServices/vaults", "rg-app"),
            ],
            [
                Cited("vm", "subnet"),
                PrivateEndpoint("vault", "vnet"),
            ]);

        XDocument svg = Render(ast);
        XElement sharedFrame = svg.Descendants()
            .First(element =>
                element.Attribute("data-frame-cell-id")?.Value == "shared-services"
                && element.Attribute("data-frame-kind")?.Value == "shared-services");
        (double x, double y, double width, double height) box = Box(sharedFrame);
        Contains(svg, box, "law-app").Should().BeTrue();
        Contains(svg, box, "vault-app").Should().BeFalse();
        Contains(svg, box, "vm-app").Should().BeFalse();
        XElement resourceGroupFrame = svg.Descendants().First(element =>
            element.Attribute("class")?.Value == "rg-frame"
            && element.Attribute("data-frame-cell-id")?.Value != "shared-services");
        (double x, double y, double width, double height) resourceGroupBox = Box(resourceGroupFrame);
        Contains(svg, resourceGroupBox, "vault-app").Should().BeTrue();
        Contains(svg, resourceGroupBox, "recovery-vault-app").Should().BeTrue();
        svg.Descendants().First(element => element.Attribute("id")?.Value == "diagram-neighborhoods")
            .Descendants().Any(element =>
                element.Name.LocalName == "neighborhood"
                && element.Attribute("kind")?.Value == "shared-services").Should().BeTrue();
    }

    [Fact]
    public void Render_neighborhood_metadata_distinguishes_key_and_recovery_vaults()
    {
        string vnetArmId = "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Vnet("vnet", "app-vnet", vnetArmId, "rg-app"),
                Subnet("subnet", vnetArmId, "app", "rg-app"),
                Workload("key-vault", "key-vault-app", "Microsoft.KeyVault/vaults", "rg-app"),
                Workload("recovery-vault", "recovery-vault-app", "Microsoft.RecoveryServices/vaults", "rg-app"),
            ],
            [
                Cited("key-vault", "subnet"),
                Cited("recovery-vault", "subnet"),
            ]);

        XDocument svg = Render(ast);
        XElement metadata = svg.Descendants().Single(element =>
            element.Attribute("id")?.Value == "diagram-neighborhoods");
        metadata.Descendants().Any(element =>
            element.Name.LocalName == "type"
            && element.Attribute("name")?.Value == "key vaults").Should().BeTrue();
        metadata.Descendants().Any(element =>
            element.Name.LocalName == "type"
            && element.Attribute("name")?.Value == "recovery vaults").Should().BeTrue();
    }

    [Fact]
    public void Render_non_catalog_resource_stays_in_resource_group_not_shared_services()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Network)",
            [
                Workload("storage", "st-app", "Microsoft.Storage/storageAccounts", "rg-app"),
            ],
            []);

        XDocument svg = Render(ast);
        svg.Descendants().Any(element => element.Attribute("data-frame-cell-id")?.Value == "shared-services")
            .Should().BeFalse();
    }

    [Fact]
    public void Render_executive_title_has_no_shared_services_frame()
    {
        DiagramAst ast = Inventory(
            "Azure inventory (Executive)",
            [
                Workload("vault", "vault-app", "Microsoft.KeyVault/vaults", "rg-app"),
            ],
            []);

        XDocument svg = Render(ast);
        svg.Descendants().Any(element => element.Attribute("data-frame-cell-id")?.Value == "shared-services")
            .Should().BeFalse();
    }
}

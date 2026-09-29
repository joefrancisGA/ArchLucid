using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class MermaidDiagramDeterministicRepairerPlacementSourceTests
{
    [Fact]
    public void Repair_keeps_hidden_subnet_vnet_placement_source()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (FullSubscription)",
            Nodes =
            [
                Workload("vm", "vm-bam-test-01", "Microsoft.Compute/virtualMachines", "anly-aep-dev-hi"),
                Vnet("vnet", "vnet-aep-hi-test-wus-001", "anly-aep-test-hi"),
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vm",
                    ToNodeId = "vnet",
                    Label = "in",
                    IsLayoutOnly = false,
                    InferenceSource = GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement,
                    ProvenanceKind = ProvenanceKind.DerivedFact.ToString(),
                },
            ],
        };

        DiagramEdge edge = Repair(ast).Edges.Should().ContainSingle().Subject;
        edge.Label.Should().Be("in");
        edge.IsLayoutOnly.Should().BeFalse();
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement);
        edge.ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact.ToString());
    }

    [Fact]
    public void Repair_keeps_private_endpoint_source_without_citing_vnet_membership()
    {
        DiagramAst ast = new()
        {
            Title = "Azure inventory (FullSubscription)",
            Nodes =
            [
                Workload("vault", "kv-aep-hi-dev", "Microsoft.KeyVault/vaults", "anly-aep-dev-hi"),
                Vnet("vnet", "vnet-aep-hi-test-wus-001", "anly-aep-test-hi"),
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vault",
                    ToNodeId = "vnet",
                    Label = "private endpoint",
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    ProvenanceKind = ProvenanceKind.DerivedFact.ToString(),
                },
            ],
        };

        DiagramEdge edge = Repair(ast).Edges.Should().ContainSingle().Subject;
        edge.Label.Should().Be("private endpoint");
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryPrivateEndpoint);
        edge.ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact.ToString());
        DiagramForestVnetMembership.IsCitedPlacementEdge(edge).Should().BeFalse();
    }

    [Fact]
    public void Repair_full_subscription_places_cross_group_vm_inside_vnet_frame_and_leaves_key_vault_outside()
    {
        const string vnetArmId =
            "/subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/resourceGroups/anly-aep-test-hi/providers/Microsoft.Network/virtualNetworks/vnet-aep-hi-test-wus-001";
        DiagramAst ast = new()
        {
            Title = "Azure inventory (FullSubscription)",
            Nodes =
            [
                Vnet("vnet", "vnet-aep-hi-test-wus-001", "anly-aep-test-hi", vnetArmId),
                Workload("vm", "vm-bam-test-01", "Microsoft.Compute/virtualMachines", "anly-aep-dev-hi"),
                Workload("vault", "kv-aep-hi-dev", "Microsoft.KeyVault/vaults", "anly-aep-dev-hi"),
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vm",
                    ToNodeId = "vnet",
                    Label = "in",
                    InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                },
                new DiagramEdge
                {
                    FromNodeId = "vault",
                    ToNodeId = "vnet",
                    Label = "private endpoint",
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    ProvenanceKind = ProvenanceKind.DerivedFact.ToString(),
                },
            ],
        };

        DiagramAst repaired = Repair(ast);
        repaired.Edges.Should().Contain(edge =>
            edge.FromNodeId == "vm"
            && edge.ToNodeId == "vnet"
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet);
        repaired.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryPrivateEndpoint
            && !DiagramForestVnetMembership.IsCitedPlacementEdge(edge));

        DiagramForestLayoutResult result = new DiagramForestLayoutSvgRenderer().Render(repaired);
        result.Succeeded.Should().BeTrue(result.Error);
        XDocument svg = XDocument.Parse(result.Svg!);
        List<XElement> frames = svg.Descendants()
            .Where(element => element.Attribute("class")?.Value == "vnet-frame")
            .ToList();
        frames.Should().ContainSingle();
        (double X, double Y, double Width, double Height) box = Box(frames[0]);
        Contains(svg, box, "vm-bam-test-01").Should().BeTrue();
        Contains(svg, box, "kv-aep-hi-dev").Should().BeFalse();
    }

    private static DiagramAst Repair(DiagramAst ast)
    {
        return new MermaidDiagramDeterministicRepairer().Repair(ast, out _);
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

    private static bool Contains(XDocument svg, (double X, double Y, double Width, double Height) box, string label)
    {
        XElement node = svg.Descendants().First(element =>
            element.Attribute("class")?.Value == "node"
            && element.Elements().Any(child =>
                child.Name.LocalName == "title"
                && child.Value.Contains(label, StringComparison.Ordinal)));
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

    private static DiagramNode Vnet(string nodeId, string label, string resourceGroup, string? armId = null)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            NodeType = "TopologyResource",
            ArmResourceType = "Microsoft.Network/virtualNetworks",
            ArmResourceId = armId ?? $"/subscriptions/s/resourceGroups/{resourceGroup}/providers/Microsoft.Network/virtualNetworks/{nodeId}",
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
}

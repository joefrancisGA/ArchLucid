using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Resolves non-empty VNet and subnet frames from visible nodes and cited placement edges.</summary>
public static class DiagramForestNestedFrameResolver
{
    public static IReadOnlyList<DiagramForestNestedFrameBounds> Resolve(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramResourceGroupPacker.NodePlacementBounds> placements,
        IReadOnlyList<DiagramEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(placements);
        ArgumentNullException.ThrowIfNull(edges);

        Dictionary<string, DiagramResourceGroupPacker.NodePlacementBounds> placementByNodeId =
            placements.ToDictionary(placement => placement.Node.NodeId, StringComparer.Ordinal);
        Dictionary<string, DiagramNode> nodesById =
            nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal);
        List<DiagramForestNestedFrameBounds> frames = [];

        foreach (DiagramNode vnet in nodes.Where(IsVnet))
        {
            IReadOnlySet<string> memberIds = DiagramForestVnetMembership.ResolveMembers(
                vnet,
                nodes,
                edges,
                sameResourceGroupOnly: true);
            List<DiagramNode> members = memberIds
                .Where(placementByNodeId.ContainsKey)
                .Select(nodesById.GetValueOrDefault)
                .Where(node => node is not null)
                .Cast<DiagramNode>()
                .ToList();

            if (members.Count < 2 || !placementByNodeId.ContainsKey(vnet.NodeId))
            {
                continue;
            }

            frames.Add(BuildFrame("vnet", vnet, members, placementByNodeId));
        }

        foreach (DiagramNode subnet in nodes.Where(IsSubnet))
        {
            HashSet<string> subnetMemberIds = edges
                .Where(DiagramForestVnetMembership.IsCitedPlacementEdge)
                .Where(edge => string.Equals(edge.ToNodeId, subnet.NodeId, StringComparison.Ordinal))
                .Select(edge => edge.FromNodeId)
                .Where(placementByNodeId.ContainsKey)
                .ToHashSet(StringComparer.Ordinal);
            subnetMemberIds.Add(subnet.NodeId);
            List<DiagramNode> members = subnetMemberIds
                .Select(nodesById.GetValueOrDefault)
                .Where(node => node is not null)
                .Cast<DiagramNode>()
                .ToList();

            if (members.Count < 2 || !placementByNodeId.ContainsKey(subnet.NodeId))
            {
                continue;
            }

            frames.Add(BuildFrame("subnet", subnet, members, placementByNodeId));
        }

        return frames;
    }

    private static DiagramForestNestedFrameBounds BuildFrame(
        string kind,
        DiagramNode container,
        IReadOnlyList<DiagramNode> members,
        IReadOnlyDictionary<string, DiagramResourceGroupPacker.NodePlacementBounds> placements)
    {
        IReadOnlyList<DiagramResourceGroupPacker.NodePlacementBounds> bounds =
            members.Select(member => placements[member.NodeId]).ToList();
        double minX = bounds.Min(bound => bound.X);
        double minY = bounds.Min(bound => bound.Y);
        double maxX = bounds.Max(bound => bound.X + bound.Width);
        double maxY = bounds.Max(bound => bound.Y + bound.Height);
        double pad = kind == "vnet" ? 8.0d : 5.0d;

        return new DiagramForestNestedFrameBounds(
            kind,
            container.Label,
            $"{kind}-{container.NodeId}",
            minX - pad,
            minY - pad,
            maxX - minX + (pad * 2.0d),
            maxY - minY + (pad * 2.0d));
    }

    private static bool IsVnet(DiagramNode node)
    {
        return (node.ArmResourceType ?? string.Empty).Equals(
            "Microsoft.Network/virtualNetworks",
            StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSubnet(DiagramNode node)
    {
        return (node.ArmResourceType ?? string.Empty).Contains(
            "Microsoft.Network/virtualNetworks/subnets",
            StringComparison.OrdinalIgnoreCase);
    }

}

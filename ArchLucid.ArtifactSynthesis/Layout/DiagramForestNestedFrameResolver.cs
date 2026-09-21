using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Resolves non-empty VNet and subnet frames from visible nodes and placement edges.</summary>
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
            List<DiagramNode> members = ResolveMembers(vnet, nodesById, edges, placementByNodeId);

            if (members.Count < 2 || !placementByNodeId.ContainsKey(vnet.NodeId))
            {
                continue;
            }

            frames.Add(BuildFrame("vnet", vnet, members, placementByNodeId));
        }

        foreach (DiagramNode subnet in nodes.Where(IsSubnet))
        {
            List<DiagramNode> members = ResolveMembers(subnet, nodesById, edges, placementByNodeId);

            if (members.Count < 2 || !placementByNodeId.ContainsKey(subnet.NodeId))
            {
                continue;
            }

            frames.Add(BuildFrame("subnet", subnet, members, placementByNodeId));
        }

        return frames;
    }

    private static List<DiagramNode> ResolveMembers(
        DiagramNode container,
        IReadOnlyDictionary<string, DiagramNode> nodesById,
        IReadOnlyList<DiagramEdge> edges,
        IReadOnlyDictionary<string, DiagramResourceGroupPacker.NodePlacementBounds> placements)
    {
        HashSet<string> memberIds = edges
            .Where(edge => IsPlacementEdge(edge) && string.Equals(edge.ToNodeId, container.NodeId, StringComparison.Ordinal))
            .Select(edge => edge.FromNodeId)
            .Where(placements.ContainsKey)
            .ToHashSet(StringComparer.Ordinal);
        memberIds.Add(container.NodeId);

        string armId = ReadArmId(container);

        if (!string.IsNullOrWhiteSpace(armId))
        {
            foreach (DiagramNode candidate in nodesById.Values)
            {
                if (!string.IsNullOrWhiteSpace(ReadArmId(candidate))
                    && ReadArmId(candidate).StartsWith(armId.TrimEnd('/') + "/subnets/", StringComparison.OrdinalIgnoreCase)
                    && placements.ContainsKey(candidate.NodeId))
                {
                    memberIds.Add(candidate.NodeId);
                }
            }
        }

        return memberIds
            .Select(nodesById.GetValueOrDefault)
            .Where(node => node is not null)
            .Cast<DiagramNode>()
            .ToList();
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

    private static bool IsPlacementEdge(DiagramEdge edge)
    {
        return string.Equals(edge.Label, "in", StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, "likely · in", StringComparison.OrdinalIgnoreCase);
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

    private static string ReadArmId(DiagramNode node)
    {
        return node.CloudResourceId?.ToString() ?? string.Empty;
    }
}

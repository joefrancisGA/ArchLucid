using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Packs forest nodes that share a resource group into layout super-cells.</summary>
public static class DiagramResourceGroupPacker
{
    public sealed record ResourceGroupCell(
        string? GroupName,
        IReadOnlyList<DiagramNode> Nodes);

    public static IReadOnlyList<ResourceGroupCell> PartitionCells(IReadOnlyList<DiagramNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        Dictionary<string, List<DiagramNode>> grouped = new(StringComparer.OrdinalIgnoreCase);
        List<DiagramNode> ungrouped = [];

        foreach (DiagramNode node in nodes)
        {
            string? groupName = NormalizeGroupName(node.ArmResourceGroup);

            if (groupName is null)
            {
                ungrouped.Add(node);
                continue;
            }

            if (!grouped.TryGetValue(groupName, out List<DiagramNode>? members))
            {
                members = [];
                grouped[groupName] = members;
            }

            members.Add(node);
        }

        List<ResourceGroupCell> cells = [];

        foreach ((string groupName, List<DiagramNode> members) in grouped)
        {
            if (members.Count >= 2)
            {
                cells.Add(new ResourceGroupCell(
                    groupName,
                    members
                        .OrderBy(node => node.OrderKey)
                        .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                        .ToList()));
            }
            else
            {
                ungrouped.AddRange(members);
            }
        }

        foreach (DiagramNode node in ungrouped
                     .OrderBy(node => node.OrderKey)
                     .ThenBy(node => node.NodeId, StringComparer.Ordinal))
        {
            cells.Add(new ResourceGroupCell(null, [node]));
        }

        return cells
            .OrderByDescending(cell => cell.Nodes.Count)
            .ThenBy(cell => cell.Nodes.Min(node => node.OrderKey))
            .ThenBy(cell => cell.GroupName ?? string.Empty, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static HashSet<string> ResolveNodesWithSuppressedCaption(IReadOnlyList<DiagramNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        HashSet<string> suppressed = new(StringComparer.Ordinal);

        foreach (ResourceGroupCell cell in PartitionCells(nodes))
        {
            if (cell.GroupName is null || cell.Nodes.Count < 2)
            {
                continue;
            }

            foreach (DiagramNode node in cell.Nodes)
            {
                suppressed.Add(node.NodeId);
            }
        }

        return suppressed;
    }

    public static IReadOnlyList<ResourceGroupFrameBounds> ResolveFrameBounds(
        IReadOnlyList<NodePlacementBounds> nodeBounds)
    {
        ArgumentNullException.ThrowIfNull(nodeBounds);

        Dictionary<string, List<NodePlacementBounds>> grouped = new(StringComparer.OrdinalIgnoreCase);

        foreach (NodePlacementBounds bounds in nodeBounds)
        {
            string? groupName = NormalizeGroupName(bounds.Node.ArmResourceGroup);

            if (groupName is null)
            {
                continue;
            }

            if (!grouped.TryGetValue(groupName, out List<NodePlacementBounds>? members))
            {
                members = [];
                grouped[groupName] = members;
            }

            members.Add(bounds);
        }

        List<ResourceGroupFrameBounds> frames = [];

        foreach ((string groupName, List<NodePlacementBounds> members) in grouped)
        {
            if (members.Count < 2)
            {
                continue;
            }

            double minX = members.Min(member => member.X);
            double minY = members.Min(member => member.Y);
            double maxX = members.Max(member => member.X + member.Width);
            double maxY = members.Max(member => member.Y + member.Height);
            const double pad = 12.0d;

            frames.Add(new ResourceGroupFrameBounds(
                groupName,
                minX - pad,
                minY - pad,
                (maxX - minX) + (pad * 2.0d),
                (maxY - minY) + (pad * 2.0d)));
        }

        return frames;
    }

    private static string? NormalizeGroupName(string? armResourceGroup)
    {
        if (string.IsNullOrWhiteSpace(armResourceGroup))
        {
            return null;
        }

        return armResourceGroup.Trim();
    }

    public sealed record NodePlacementBounds(
        DiagramNode Node,
        double X,
        double Y,
        double Width,
        double Height);

    public sealed record ResourceGroupFrameBounds(
        string GroupName,
        double X,
        double Y,
        double Width,
        double Height);
}

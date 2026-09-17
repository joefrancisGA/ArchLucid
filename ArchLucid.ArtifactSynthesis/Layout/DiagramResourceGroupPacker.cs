using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Packs forest nodes that share a resource group into layout super-cells.</summary>
public static class DiagramResourceGroupPacker
{
    public sealed record ResourceGroupCell(
        string? GroupName,
        IReadOnlyList<DiagramNode> Nodes);

    public static string BuildFrameCellId(string componentKey, int cellIndex)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(componentKey);

        return $"{componentKey}-c{cellIndex}";
    }

    public static bool ShouldDrawFrame(ResourceGroupCell cell)
    {
        ArgumentNullException.ThrowIfNull(cell);

        return !string.IsNullOrWhiteSpace(cell.GroupName) && cell.Nodes.Count >= 2;
    }

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
            if (!ShouldDrawFrame(cell))
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

        Dictionary<string, List<NodePlacementBounds>> grouped = new(StringComparer.Ordinal);

        foreach (NodePlacementBounds bounds in nodeBounds)
        {
            if (string.IsNullOrWhiteSpace(bounds.FrameCellId))
            {
                continue;
            }

            if (!grouped.TryGetValue(bounds.FrameCellId, out List<NodePlacementBounds>? members))
            {
                members = [];
                grouped[bounds.FrameCellId] = members;
            }

            members.Add(bounds);
        }

        List<ResourceGroupFrameBounds> frames = [];

        foreach ((string frameCellId, List<NodePlacementBounds> members) in grouped)
        {
            if (members.Count < 2)
            {
                continue;
            }

            string? groupName = members
                .Select(member => NormalizeGroupName(member.Node.ArmResourceGroup))
                .FirstOrDefault(name => name is not null);

            if (groupName is null)
            {
                continue;
            }

            double minX = members.Min(member => member.X);
            double minY = members.Min(member => member.Y);
            double maxX = members.Max(member => member.X + member.Width);
            double maxY = members.Max(member => member.Y + member.Height);

            frames.Add(new ResourceGroupFrameBounds(
                groupName,
                frameCellId,
                minX - DiagramForestResourceGroupFrameStyle.Pad,
                minY - DiagramForestResourceGroupFrameStyle.LabelBand,
                (maxX - minX) + DiagramForestResourceGroupFrameStyle.HorizontalChrome,
                (maxY - minY) + DiagramForestResourceGroupFrameStyle.VerticalChrome));
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
        double Height,
        string? FrameCellId = null);

    public sealed record ResourceGroupFrameBounds(
        string GroupName,
        string FrameCellId,
        double X,
        double Y,
        double Width,
        double Height);
}

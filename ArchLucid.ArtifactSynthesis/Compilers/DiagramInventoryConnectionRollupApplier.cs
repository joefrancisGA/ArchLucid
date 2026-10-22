using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Collapses duplicate inventory connector cards while preserving their cited edges.</summary>
internal static class DiagramInventoryConnectionRollupApplier
{
    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        List<DiagramNode> connectionNodes = ast.Nodes
            .Where(IsWebConnection)
            .ToList();
        IEnumerable<IGrouping<string, DiagramNode>> groups = connectionNodes
            .GroupBy(BuildGroupKey, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1);

        foreach (IGrouping<string, DiagramNode> group in groups)
        {
            List<DiagramNode> members = group.ToList();
            DiagramNode first = members[0];
            string rollupId =
                $"connection-rollup-{MermaidIdSanitizer.Sanitize(first.Label)}-{members.Count}";
            DiagramNode rollup = new()
            {
                NodeId = rollupId,
                Label = $"{first.Label} ({members.Count})",
                NodeType = first.NodeType,
                SubgraphId = first.SubgraphId,
                OrderKey = members.Min(member => member.OrderKey),
                ArmResourceType = first.ArmResourceType,
                ArmResourceGroup = first.ArmResourceGroup,
            };
            HashSet<string> memberIds = members.Select(member => member.NodeId).ToHashSet(StringComparer.Ordinal);

            ast.Nodes.RemoveAll(member => memberIds.Contains(member.NodeId));
            ast.Nodes.Add(rollup);

            foreach (DiagramEdge edge in ast.Edges)
            {
                if (memberIds.Contains(edge.FromNodeId))
                {
                    edge.FromNodeId = rollupId;
                }

                if (memberIds.Contains(edge.ToNodeId))
                {
                    edge.ToNodeId = rollupId;
                }
            }

            ast.Edges = ast.Edges
                .GroupBy(edge => $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.Label}", StringComparer.Ordinal)
                .Select(grouped => grouped.First())
                .ToList();
        }
    }

    private static bool IsWebConnection(DiagramNode node)
    {
        return (node.ArmResourceType ?? string.Empty).Equals(
            "Microsoft.Web/connections",
            StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildGroupKey(DiagramNode node)
    {
        return $"{node.ArmResourceGroup}|{node.ArmResourceType}|{node.Label}";
    }
}

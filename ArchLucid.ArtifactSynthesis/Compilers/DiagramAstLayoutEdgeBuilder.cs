using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramAstLayoutEdgeBuilder
{
    public static void EnsureLayoutEdgesWhenEmpty(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (ast.Edges.Count > 0 || ast.Nodes.Count <= 1)
        {
            return;
        }

        List<DiagramNode> orderedNodes = ast.Nodes
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        for (int index = 0; index < orderedNodes.Count - 1; index++)
        {
            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = orderedNodes[index].NodeId,
                ToNodeId = orderedNodes[index + 1].NodeId,
                Label = string.Empty,
            });
        }
    }
}

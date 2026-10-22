using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Drops private-endpoint cards once their PaaS target already shows the lock.
/// </summary>
internal static class DiagramPrivateEndpointCanvasPruner
{
    public static void RemoveNodes(DiagramAst ast, IReadOnlySet<string> diagramNodeIds)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(diagramNodeIds);

        if (diagramNodeIds.Count == 0 || ast.Nodes.Count == 0)
        {
            return;
        }

        ast.Nodes = ast.Nodes
            .Where(node => !diagramNodeIds.Contains(node.NodeId))
            .ToList();

        if (ast.Edges.Count == 0)
        {
            return;
        }

        ast.Edges = ast.Edges
            .Where(edge => !diagramNodeIds.Contains(edge.FromNodeId) && !diagramNodeIds.Contains(edge.ToNodeId))
            .ToList();
    }
}

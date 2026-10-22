using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Counts the connected components represented by the painted diagram AST (NR-30).</summary>
public static class DiagramAstVisibleComponentCounter
{
    public static int Count(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        Dictionary<string, List<string>> adjacency = ast.Nodes
            .Select(node => node.NodeId)
            .Distinct(StringComparer.Ordinal)
            .ToDictionary(nodeId => nodeId, _ => new List<string>(), StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly))
        {
            if (adjacency.TryGetValue(edge.FromNodeId, out List<string>? from)
                && adjacency.TryGetValue(edge.ToNodeId, out List<string>? to))
            {
                from.Add(edge.ToNodeId);
                to.Add(edge.FromNodeId);
            }
        }

        HashSet<string> visited = new(StringComparer.Ordinal);
        int componentCount = 0;

        foreach (string nodeId in adjacency.Keys)
        {
            if (!visited.Add(nodeId))
            {
                continue;
            }

            componentCount++;
            Queue<string> pending = new();
            pending.Enqueue(nodeId);

            while (pending.Count > 0)
            {
                string currentNodeId = pending.Dequeue();

                foreach (string neighborNodeId in adjacency[currentNodeId])
                {
                    if (visited.Add(neighborNodeId))
                    {
                        pending.Enqueue(neighborNodeId);
                    }
                }
            }
        }

        return componentCount;
    }
}

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class DiagramAstSubgraphPruner
{
    public static void PruneUnusedSubgraphs(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (ast.Subgraphs.Count == 0)
        {
            return;
        }

        Dictionary<string, DiagramSubgraph> subgraphById = ast.Subgraphs
            .ToDictionary(subgraph => subgraph.SubgraphId, StringComparer.Ordinal);

        HashSet<string> keepSubgraphIds = new(StringComparer.Ordinal);

        foreach (DiagramNode node in ast.Nodes)
        {
            if (string.IsNullOrWhiteSpace(node.SubgraphId))
            {
                continue;
            }

            string? currentSubgraphId = node.SubgraphId;

            while (!string.IsNullOrWhiteSpace(currentSubgraphId))
            {
                if (!keepSubgraphIds.Add(currentSubgraphId))
                {
                    break;
                }

                if (!subgraphById.TryGetValue(currentSubgraphId, out DiagramSubgraph? subgraph))
                {
                    break;
                }

                currentSubgraphId = subgraph.ParentSubgraphId;
            }
        }

        ast.Subgraphs = ast.Subgraphs
            .Where(subgraph => keepSubgraphIds.Contains(subgraph.SubgraphId))
            .ToList();
    }
}

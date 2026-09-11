using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Executive inventory diagrams group nodes by subscription/RG swimlanes. When many swimlanes each hold
/// a single node, Mermaid emits a wide canvas of mostly empty boxes — unreadable in the browser.
/// </summary>
internal static class DiagramAstExecutiveLayoutSimplifier
{
    private const int SparseSubgraphFlattenThreshold = 8;

    public static void FlattenSparseSubgraphs(DiagramAst ast, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (mode != DiagramMode.Executive || ast.Subgraphs.Count == 0)
        {
            return;
        }

        bool shouldFlatten = ast.Subgraphs.Count >= SparseSubgraphFlattenThreshold;

        if (!shouldFlatten)
        {
            return;
        }

        foreach (DiagramNode node in ast.Nodes)
        {
            node.SubgraphId = null;
        }

        ast.Subgraphs.Clear();
    }
}

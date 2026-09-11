using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Focused inventory diagrams group nodes by subscription/RG swimlanes. When many swimlanes each hold
/// a single node, Mermaid emits a canvas of mostly empty boxes — unreadable in the browser.
/// Executive, Network, Data, and Identity hit this shape (one resource per RG across many groups).
/// </summary>
internal static class DiagramAstExecutiveLayoutSimplifier
{
    private const int SparseSubgraphFlattenThreshold = 8;

    public static void FlattenSparseSubgraphs(DiagramAst ast, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (!ModeFlattensSparseSubgraphs(mode) || ast.Subgraphs.Count == 0)
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

    private static bool ModeFlattensSparseSubgraphs(DiagramMode mode)
    {
        return mode is DiagramMode.Executive or DiagramMode.Data or DiagramMode.Network or DiagramMode.Identity;
    }
}

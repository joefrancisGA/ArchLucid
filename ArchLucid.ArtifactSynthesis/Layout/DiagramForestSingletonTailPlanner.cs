using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Preserves one renderable node for every resource group.</summary>
public static class DiagramForestSingletonTailPlanner
{
    public const int SingletonThreshold = 8;

    public sealed record Result(
        IReadOnlyList<DiagramNode> Nodes,
        IReadOnlyList<DiagramEdge> Edges);

    public static Result Apply(
        string title,
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(title);
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        // A rollup hides the resource-group title that gives a small group its
        // context. Keep the source graph intact; the packer already creates one
        // labeled frame for each non-empty ArmResourceGroup.
        return new Result(nodes, edges);
    }
}

using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

public interface IGraphMaterializationStage
{
    string Name { get; }

    Task ApplyAsync(GraphMaterializationContext context, CancellationToken cancellationToken);
}

public sealed class GraphMaterializationContext
{
    private bool _stageSkipped;

    public GraphMaterializationContext(ContextSnapshot snapshot, List<GraphNode> nodes)
    {
        Snapshot = snapshot ?? throw new ArgumentNullException(nameof(snapshot));
        Nodes = nodes ?? throw new ArgumentNullException(nameof(nodes));
    }

    public ContextSnapshot Snapshot { get; }

    public List<GraphNode> Nodes { get; }

    public bool HasCanonicalCostConstraints { get; set; }

    public bool HasCanonicalActors { get; set; }

    public bool HasCanonicalAssumptions { get; set; }

    public bool HasCanonicalQualityAttributes { get; set; }

    public bool HasCanonicalFailureModes { get; set; }

    internal void BeginStage()
    {
        _stageSkipped = false;
    }

    internal void MarkStageSkipped()
    {
        _stageSkipped = true;
    }

    internal bool WasStageSkipped => _stageSkipped;
}

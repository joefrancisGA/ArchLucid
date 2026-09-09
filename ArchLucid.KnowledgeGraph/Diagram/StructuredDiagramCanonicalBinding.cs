namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Records a successful diagram-node to canonical-graph-node bind (AS-018).
/// </summary>
public sealed class StructuredDiagramCanonicalBinding
{
    public required string DiagramGraphNodeId
    {
        get;
        init;
    }

    public required string DiagramSourceId
    {
        get;
        init;
    }

    public required string CanonicalGraphNodeId
    {
        get;
        init;
    }
}

using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Diagram;

public sealed class StructuredDiagramGraphCompileResult
{
    public GraphSnapshot Snapshot
    {
        get;
        init;
    } = new();

    public List<string> Warnings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<StructuredDiagramCanonicalBinding> CanonicalBindings
    {
        get;
        init;
    } = [];

    /// <summary>Diagram shapes skipped because they had no text and no bound id (AS-019).</summary>
    public int UnlabeledShapeCount
    {
        get;
        init;
    }
}

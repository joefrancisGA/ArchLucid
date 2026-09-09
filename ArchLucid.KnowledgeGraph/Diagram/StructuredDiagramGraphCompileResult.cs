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
}

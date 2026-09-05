namespace ArchLucid.Contracts.Architecture;

public sealed class StructuredDiagramIngestRequest
{
    public IReadOnlyList<DiagramSourceReference> Sources
    {
        get;
        init;
    } = [];
}

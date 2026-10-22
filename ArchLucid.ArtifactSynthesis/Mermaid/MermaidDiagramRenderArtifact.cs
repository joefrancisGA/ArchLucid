namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramRenderArtifact
{
    public string Key
    {
        get;
        init;
    } = string.Empty;

    public string Label
    {
        get;
        init;
    } = string.Empty;

    public string Mermaid
    {
        get;
        init;
    } = string.Empty;

    public MermaidDiagramRenderStatus Status
    {
        get;
        init;
    }

    public MermaidDiagramComplexityMetrics? Metrics
    {
        get;
        init;
    }
}

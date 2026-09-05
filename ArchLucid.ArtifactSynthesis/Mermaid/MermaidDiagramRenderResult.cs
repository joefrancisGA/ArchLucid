namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramRenderResult
{
    public MermaidDiagramRenderStatus Status
    {
        get;
        init;
    }

    public string? PrimaryMermaid
    {
        get;
        init;
    }

    public MermaidDiagramComplexityMetrics Metrics
    {
        get;
        init;
    } = new();

    public IReadOnlyList<MermaidDiagramRenderArtifact> FallbackArtifacts
    {
        get;
        init;
    } = [];

    public string? IndexMarkdown
    {
        get;
        init;
    }

    public MermaidDiagramCollapseReport? CollapseReport
    {
        get;
        init;
    }

    public IReadOnlyList<string> ValidationErrors
    {
        get;
        init;
    } = [];
}

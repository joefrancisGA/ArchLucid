using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramRenderRequest
{
    public DiagramAst Ast
    {
        get;
        init;
    } = null!;

    public MermaidDiagramReadabilityThresholds Thresholds
    {
        get;
        init;
    } = new();

    public IReadOnlyList<Guid> RequiredCloudResourceIds
    {
        get;
        init;
    } = [];

    public bool AllowAiRepair
    {
        get;
        init;
    }

    public IMermaidDiagramAiRepairer? AiRepairer
    {
        get;
        init;
    }
}

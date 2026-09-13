using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

internal sealed class InfraEvidenceInventoryLayoutResult
{
    public static InfraEvidenceInventoryLayoutResult MermaidDagreFallback { get; } = new()
    {
        LayoutEngine = "mermaid-dagre",
    };

    public string? LayoutSvg
    {
        get;
        init;
    }

    public string LayoutEngine
    {
        get;
        init;
    } = "mermaid-dagre";

    public DiagramAst? RepairedAst
    {
        get;
        init;
    }
}

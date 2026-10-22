using ArchLucid.ArtifactSynthesis.Mermaid;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Suppresses header-only Mermaid the browser cannot render when the compiled graph has no topology nodes.</summary>
public static class InfraEvidenceMermaidResponseContent
{
    public static string? SelectMermaidForClient(
        bool includeMermaid,
        string? primaryMermaid,
        MermaidDiagramComplexityMetrics metrics)
    {
        ArgumentNullException.ThrowIfNull(metrics);

        if (!includeMermaid || metrics.NodeCount == 0)
        {
            return null;
        }

        return primaryMermaid;
    }
}

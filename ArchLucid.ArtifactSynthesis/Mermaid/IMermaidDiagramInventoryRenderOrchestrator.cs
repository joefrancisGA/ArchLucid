using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public interface IMermaidDiagramInventoryRenderOrchestrator
{
    Task<MermaidDiagramRenderResult> RenderFromGraphAsync(
        GraphSnapshot graph,
        DiagramMode mode,
        DiagramAstCompileOptions? compileOptions,
        MermaidDiagramReadabilityThresholds thresholds,
        CancellationToken cancellationToken = default);

    MermaidDiagramRenderArtifact BuildFallbackArtifact(
        GraphSnapshot graph,
        DiagramMode mode,
        string key,
        string label,
        MermaidDiagramReadabilityThresholds thresholds,
        DiagramAstCompileOptions? compileOptions);
}

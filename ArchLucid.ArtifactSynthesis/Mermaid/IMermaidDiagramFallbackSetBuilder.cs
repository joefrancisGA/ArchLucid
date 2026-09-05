using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public interface IMermaidDiagramFallbackSetBuilder
{
    IReadOnlyList<MermaidDiagramRenderArtifact> BuildFallbackSet(
        GraphSnapshot graph,
        MermaidDiagramReadabilityThresholds thresholds);
}

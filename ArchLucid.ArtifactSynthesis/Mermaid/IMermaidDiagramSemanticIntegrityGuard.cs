using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public interface IMermaidDiagramSemanticIntegrityGuard
{
    bool TryValidateRepair(
        DiagramAst original,
        DiagramAst repaired,
        IReadOnlyList<Guid> requiredCloudResourceIds,
        out MermaidDiagramCollapseReport collapseReport);
}

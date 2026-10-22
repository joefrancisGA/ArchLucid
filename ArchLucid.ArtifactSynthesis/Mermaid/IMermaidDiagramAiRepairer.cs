using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public interface IMermaidDiagramAiRepairer
{
    Task<DiagramAst?> TryRepairAsync(
        DiagramAst ast,
        IReadOnlyList<string> validationErrors,
        CancellationToken cancellationToken = default);
}

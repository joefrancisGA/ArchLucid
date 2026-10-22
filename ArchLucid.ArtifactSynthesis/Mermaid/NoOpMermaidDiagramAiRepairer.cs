using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class NoOpMermaidDiagramAiRepairer : IMermaidDiagramAiRepairer
{
    public Task<DiagramAst?> TryRepairAsync(
        DiagramAst ast,
        IReadOnlyList<string> validationErrors,
        CancellationToken cancellationToken = default)
    {
        _ = ast;
        _ = validationErrors;
        _ = cancellationToken;

        return Task.FromResult<DiagramAst?>(null);
    }
}

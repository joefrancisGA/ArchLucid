using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public interface IMermaidDiagramRenderPipeline
{
    Task<MermaidDiagramRenderResult> RenderAsync(
        MermaidDiagramRenderRequest request,
        GraphSnapshot? sourceGraph = null,
        CancellationToken cancellationToken = default);
}

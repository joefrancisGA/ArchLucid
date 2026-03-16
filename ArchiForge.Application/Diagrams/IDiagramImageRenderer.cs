namespace ArchiForge.Application.Diagrams;

public interface IDiagramImageRenderer
{
    Task<byte[]?> RenderMermaidPngAsync(
        string mermaidDiagram,
        CancellationToken cancellationToken = default);
}

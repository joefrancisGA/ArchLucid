namespace ArchiForge.Application.Diagrams;

public sealed class NullDiagramImageRenderer : IDiagramImageRenderer
{
    public Task<byte[]?> RenderMermaidPngAsync(
        string mermaidDiagram,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<byte[]?>(null);
    }
}

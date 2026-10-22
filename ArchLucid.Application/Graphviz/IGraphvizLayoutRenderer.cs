namespace ArchLucid.Application.Graphviz;

public interface IGraphvizLayoutRenderer
{
    Task<GraphvizLayoutRenderResult> RenderSvgAsync(string dot, CancellationToken cancellationToken = default);

    Task<GraphvizLayoutRenderResult> RenderPngAsync(string dot, CancellationToken cancellationToken = default);
}

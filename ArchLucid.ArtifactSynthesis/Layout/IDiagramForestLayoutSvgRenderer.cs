using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

public interface IDiagramForestLayoutSvgRenderer
{
    DiagramForestLayoutResult Render(DiagramAst ast, DiagramForestLayoutOptions? options = null);
}

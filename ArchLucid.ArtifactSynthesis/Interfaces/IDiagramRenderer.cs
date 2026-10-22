using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Interfaces;

public interface IDiagramRenderer
{
    string Format
    {
        get;
    }

    string Render(DiagramAst ast);
}

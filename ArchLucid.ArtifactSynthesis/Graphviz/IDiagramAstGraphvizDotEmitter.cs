using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Graphviz;

public interface IDiagramAstGraphvizDotEmitter
{
    string Emit(DiagramAst ast, GraphvizDotEmitOptions? options = null);
}

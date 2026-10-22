using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Interfaces;

public interface IDiagramAstFromGraphCompiler
{
    DiagramAst Compile(GraphSnapshot graph, DiagramMode mode, DiagramAstCompileOptions? options = null);
}

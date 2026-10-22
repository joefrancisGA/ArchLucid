using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Diagram;

public interface IArchitectureDiagramToGraphCompiler
{
    StructuredDiagramGraphCompileResult Compile(
        ArchitectureDiagramModelRecord model,
        StructuredDiagramGraphCompileOptions options);
}

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public interface IMermaidDiagramComplexityAnalyzer
{
    MermaidDiagramComplexityMetrics Analyze(DiagramAst ast, string? renderedMermaid);
}

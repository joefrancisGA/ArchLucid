using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public interface IMermaidDiagramDeterministicRepairer
{
    DiagramAst Repair(DiagramAst ast, out MermaidDiagramCollapseReport collapseReport);
}

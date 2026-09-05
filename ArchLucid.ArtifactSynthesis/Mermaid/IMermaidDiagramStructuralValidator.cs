namespace ArchLucid.ArtifactSynthesis.Mermaid;

public interface IMermaidDiagramStructuralValidator
{
    bool TryValidate(string mermaid, out IReadOnlyList<string> errors);
}

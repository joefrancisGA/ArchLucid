using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Packaging;

/// <summary>Shared selection of synthesized Mermaid source from an artifact bundle (run export ZIP, DOCX pipeline).</summary>
public static class MermaidDiagramArtifactExtractor
{
    /// <summary>Returns the first Mermaid diagram source in <paramref name="artifacts" /> when present.</summary>
    /// <param name="maxChars">When set, trims source to keep downstream consumers bounded.</param>
    public static string? TryGetDiagramSource(IReadOnlyList<SynthesizedArtifact> artifacts, int? maxChars = null)
    {
        ArgumentNullException.ThrowIfNull(artifacts);

        foreach (SynthesizedArtifact a in artifacts)
        {
            if (string.IsNullOrWhiteSpace(a.Content))
                continue;

            bool isMermaidType = string.Equals(a.ArtifactType, ArtifactType.MermaidDiagram, StringComparison.Ordinal);
            bool isMermaidFormat = a.Format.Equals("mermaid", StringComparison.OrdinalIgnoreCase);
            bool isMmdName = a.Name.EndsWith(".mmd", StringComparison.OrdinalIgnoreCase);

            if (!isMermaidType && !isMermaidFormat && !isMmdName)
                continue;

            string s = a.Content;

            if (maxChars is { } mc && s.Length > mc)
                return s[..mc] + "\n\n… (truncated)";

            return s;
        }

        return null;
    }
}

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Graphviz;

/// <summary>Graphviz HTML label: bold resource name, optional type on the next line.</summary>
public static class DiagramGraphvizHtmlNodeLabel
{
    public static string Format(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);
        string name = Escape(caption.ResourceName);
        List<string> parts = [$"<B>{name}</B>"];

        if (!string.IsNullOrWhiteSpace(caption.TypeCaption))
        {
            parts.Add($"({Escape(caption.TypeCaption)})");
        }

        if (!string.IsNullOrWhiteSpace(caption.ResourceGroupCaption))
        {
            parts.Add(Escape(caption.ResourceGroupCaption));
        }

        return $"<{string.Join("<BR/>", parts)}>";
    }

    private static string Escape(string value)
    {
        return value
            .Replace("&", "&amp;", StringComparison.Ordinal)
            .Replace("<", "&lt;", StringComparison.Ordinal)
            .Replace(">", "&gt;", StringComparison.Ordinal);
    }
}

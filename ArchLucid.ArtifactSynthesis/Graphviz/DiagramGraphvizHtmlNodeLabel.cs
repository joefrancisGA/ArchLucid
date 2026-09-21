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
        DiagramInventoryPictogramKind kind = DiagramInventoryPictogramKindResolver.Resolve(node.ArmResourceType);
        string accentColor = DiagramInventoryPictogramKindColors.FillFor(kind);
        string name = Escape(caption.ResourceName);
        List<string> rightCellLines = [$"<B>{name}</B>"];

        if (!string.IsNullOrWhiteSpace(caption.TypeCaption))
        {
            rightCellLines.Add($"({Escape(caption.TypeCaption)})");
        }

        if (!string.IsNullOrWhiteSpace(caption.ResourceGroupCaption))
        {
            rightCellLines.Add(Escape(caption.ResourceGroupCaption));
        }

        string rightCell = string.Join("<BR/>", rightCellLines);

        return "<"
            + "<TABLE BORDER=\"0\" CELLBORDER=\"0\" CELLSPACING=\"0\" CELLPADDING=\"2\">"
            + "<TR>"
            + $"<TD WIDTH=\"8\" BGCOLOR=\"{accentColor}\"></TD>"
            + $"<TD ALIGN=\"LEFT\" BALIGN=\"LEFT\">{rightCell}</TD>"
            + "</TR>"
            + "</TABLE>"
            + ">";
    }

    private static string Escape(string value)
    {
        return value
            .Replace("&", "&amp;", StringComparison.Ordinal)
            .Replace("<", "&lt;", StringComparison.Ordinal)
            .Replace(">", "&gt;", StringComparison.Ordinal);
    }
}

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramForestNodeMetricsCalculator
{
    public static DiagramForestNodeMetrics Measure(DiagramNode node, DiagramForestLayoutOptions options)
    {
        ArgumentNullException.ThrowIfNull(node);
        ArgumentNullException.ThrowIfNull(options);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(node);
        int wrapWidth = Math.Max(48, options.MaxNodeWidth - (options.NodePaddingX * 2));
        IReadOnlyList<string> nameLines = DiagramLabelLineWrapper.Wrap(
            caption.ResourceName,
            wrapWidth,
            options.CharacterWidth);
        double longestLinePx = nameLines.Max(line => line.Length * options.CharacterWidth);
        double contentWidth = Math.Max(options.PictogramSize, longestLinePx);
        double width = Math.Clamp(
            contentWidth + (options.NodePaddingX * 2),
            options.MinNodeWidth,
            options.MaxNodeWidth);
        double height = options.NodePaddingY
            + options.PictogramSize
            + options.IconToLabelGap
            + (nameLines.Count * options.LineHeight)
            + options.NodePaddingY;

        return new DiagramForestNodeMetrics(
            Width: width,
            Height: height,
            NameLines: nameLines,
            Caption: caption,
            PictogramKind: DiagramInventoryPictogramKindResolver.Resolve(node.ArmResourceType));
    }
}

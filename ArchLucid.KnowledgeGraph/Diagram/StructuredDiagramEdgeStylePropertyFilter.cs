namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Drops draw.io / Visio style-only edge metadata so line color is never treated as protocol (AS-021).
/// </summary>
public static class StructuredDiagramEdgeStylePropertyFilter
{
    private static readonly string[] StyleOnlyKeys =
    [
        "stroke",
        "strokecolor",
        "strokeColor",
        "stroke-width",
        "strokeWidth",
        "fill",
        "fillcolor",
        "fillColor",
        "color",
        "linecolor",
        "lineColor",
        "dashed",
        "dashpattern",
        "dashPattern",
        "html",
        "style",
        "rounded",
        "shadow",
        "fontcolor",
        "fontColor",
        "fontSize",
        "endarrow",
        "startarrow",
        "startArrow",
        "endArrow",
        "curved",
        "opacity",
        "perimeter",
    ];

    public static bool IsStyleOnlyProperty(string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return true;
        }

        string normalized = key.Trim();

        foreach (string styleKey in StyleOnlyKeys)
        {
            if (string.Equals(normalized, styleKey, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}

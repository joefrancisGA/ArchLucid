using System.Globalization;
using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Arrow marker definition for directed forest edges.</summary>
public static class DiagramForestEdgeArrowMarkerSvgEmitter
{
    public const string MarkerId = "al-edge-arrow";

    public static void EmitDefs(XNamespace svgNamespace, XElement root)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(root);

        XElement defs = new(svgNamespace + "defs");
        defs.Add(new XElement(
            svgNamespace + "marker",
            new XAttribute("id", MarkerId),
            new XAttribute("viewBox", "0 0 10 10"),
            new XAttribute("refX", "9"),
            new XAttribute("refY", "5"),
            new XAttribute("markerWidth", "6"),
            new XAttribute("markerHeight", "6"),
            new XAttribute("orient", "auto"),
            new XElement(
                svgNamespace + "path",
                new XAttribute("d", "M 0 0 L 10 5 L 0 10 z"),
                new XAttribute("fill", FormatColor("#111827")))));
        root.Add(defs);
    }

    private static string FormatColor(string value)
    {
        return value;
    }
}

using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Core.Diagrams;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Replaces a connector that crosses many frame rows with a short stub at each end.</summary>
internal static class DiagramForestLongEdgeStub
{
    public const int MaxFullLineCrossedRows = 2;
    private const int MaxPartnerLabelLength = 32;
    private const double LabelFontSize = 11.0d;
    private const double AxisEpsilon = 0.001d;

    public readonly record struct RowBand(double Y, double Bottom);

    public static IReadOnlyList<RowBand> BuildRowBands(IEnumerable<(double Y, double Height)> frames)
    {
        ArgumentNullException.ThrowIfNull(frames);

        List<RowBand> bands = [];
        foreach ((double y, double height) in frames.OrderBy(frame => frame.Y).ThenBy(frame => frame.Height))
        {
            if (height <= 0)
            {
                continue;
            }

            double bottom = y + height;
            if (bands.Count == 0 || y >= bands[^1].Bottom)
            {
                bands.Add(new RowBand(y, bottom));
                continue;
            }

            RowBand current = bands[^1];
            bands[^1] = current with { Bottom = Math.Max(current.Bottom, bottom) };
        }

        return bands;
    }

    public static int CountCrossedRows(double fromY, double toY, IReadOnlyList<RowBand> bands)
    {
        ArgumentNullException.ThrowIfNull(bands);

        double low = Math.Min(fromY, toY);
        double high = Math.Max(fromY, toY);
        int crossed = 0;

        foreach (RowBand band in bands)
        {
            bool endpointSitsInBand = Contains(band, fromY) || Contains(band, toY);
            bool overlapsOpenInterval = band.Y < high && band.Bottom > low;
            if (!endpointSitsInBand && overlapsOpenInterval)
            {
                crossed++;
            }
        }

        return crossed;
    }

    public static bool ShouldStub(double fromY, double toY, IReadOnlyList<RowBand> bands)
    {
        return CountCrossedRows(fromY, toY, bands) > MaxFullLineCrossedRows;
    }

    public static IReadOnlyList<(double X1, double Y1, double X2, double Y2)> BuildStubSegments(
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments,
        double stubLength)
    {
        ArgumentNullException.ThrowIfNull(segments);

        if (segments.Count == 0)
        {
            return [];
        }

        (double X1, double Y1, double X2, double Y2) first = segments[0];
        (double X1, double Y1, double X2, double Y2) last = segments[^1];
        return
        [
            Step(first.X1, first.Y1, first.X2, first.Y2, stubLength),
            Step(last.X2, last.Y2, last.X1, last.Y1, stubLength),
        ];
    }

    public static IReadOnlyList<XElement> Emit(
        XNamespace svgNamespace,
        DiagramEdge edge,
        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> segments,
        string sourceLabel,
        string targetLabel,
        string sourceNodeId,
        string targetNodeId,
        double stubLength)
    {
        ArgumentNullException.ThrowIfNull(svgNamespace);
        ArgumentNullException.ThrowIfNull(edge);
        ArgumentNullException.ThrowIfNull(segments);
        ArgumentNullException.ThrowIfNull(sourceLabel);
        ArgumentNullException.ThrowIfNull(targetLabel);
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceNodeId);
        ArgumentException.ThrowIfNullOrWhiteSpace(targetNodeId);

        IReadOnlyList<(double X1, double Y1, double X2, double Y2)> stubs = BuildStubSegments(segments, stubLength);
        if (stubs.Count < 2)
        {
            return [];
        }

        string relationship = edge.Label?.Trim().ToLowerInvariant() ?? string.Empty;
        if (relationship.Length == 0)
        {
            relationship = "connector";
        }

        string sourceChip = ChipText(sourceEnd: true, FormatPartnerLabel(targetLabel));
        string targetChip = ChipText(sourceEnd: false, FormatPartnerLabel(sourceLabel));
        string fromId = MermaidIdSanitizer.Sanitize(sourceNodeId);
        string toId = MermaidIdSanitizer.Sanitize(targetNodeId);

        return
        [
            EmitStub(svgNamespace, edge, stubs[0], relationship, sourceChip, fromId, toId, toId),
            EmitStub(svgNamespace, edge, stubs[1], relationship, targetChip, fromId, toId, fromId),
        ];
    }

    public static string FormatPartnerLabel(string label)
    {
        string trimmed = label.Trim();
        if (trimmed.Length <= MaxPartnerLabelLength)
        {
            return trimmed;
        }

        return trimmed[..MaxPartnerLabelLength] + "…";
    }

    private static XElement EmitStub(
        XNamespace svgNamespace,
        DiagramEdge edge,
        (double X1, double Y1, double X2, double Y2) segment,
        string relationship,
        string chip,
        string fromId,
        string toId,
        string focusNodeId)
    {
        bool isPeering = DiagramForestEdgeLabelCollapse.IsPeeringEdge(edge);
        DiagramEdgeVisualKind visualKind = DiagramEdgeVisualKindResolver.From(edge.ProvenanceKind, edge.InferenceSource);
        List<XAttribute> pathAttributes =
        [
            new XAttribute("d", PathData(segment)),
            new XAttribute("fill", "none"),
            new XAttribute("stroke", ArchitectureDiagramMermaidPalette.LightEdgeStroke),
            new XAttribute("stroke-width", "1.5"),
            new XAttribute("stroke-linejoin", "round"),
            new XAttribute("class", "edge-path"),
            new XAttribute("marker-end", $"url(#{DiagramForestEdgeArrowMarkerSvgEmitter.MarkerId})"),
        ];

        if (isPeering)
        {
            pathAttributes.Add(new XAttribute("stroke-dasharray", "6 4"));
        }
        else if (visualKind == DiagramEdgeVisualKind.Declared || visualKind == DiagramEdgeVisualKind.Probable)
        {
            pathAttributes.Add(new XAttribute("stroke-dasharray", "4 3"));
        }
        else if (visualKind == DiagramEdgeVisualKind.AiInferred || visualKind == DiagramEdgeVisualKind.Inferred)
        {
            pathAttributes.Add(new XAttribute("stroke-dasharray", "1 3"));
        }

        return new XElement(
            svgNamespace + "g",
            new XAttribute("class", "edge-stub"),
            new XAttribute("data-from", fromId),
            new XAttribute("data-to", toId),
            new XAttribute("data-focus-node", focusNodeId),
            new XElement(svgNamespace + "title", $"{relationship} {chip}"),
            new XElement(svgNamespace + "path", pathAttributes),
            new XElement(
                svgNamespace + "text",
                new XAttribute("x", FormatCoordinate(segment.X2)),
                new XAttribute("y", FormatCoordinate(segment.Y2)),
                new XAttribute("text-anchor", "middle"),
                new XAttribute("dominant-baseline", "middle"),
                new XAttribute("font-size", FormatCoordinate(LabelFontSize)),
                new XAttribute("font-family", "system-ui, sans-serif"),
                new XAttribute("fill", ArchitectureDiagramMermaidPalette.LightEdgeStroke),
                chip));
    }

    private static string ChipText(bool sourceEnd, string partnerLabel)
    {
        return sourceEnd ? $"→ {partnerLabel}" : $"← {partnerLabel}";
    }

    private static (double X1, double Y1, double X2, double Y2) Step(
        double x,
        double y,
        double towardX,
        double towardY,
        double length)
    {
        double deltaX = towardX - x;
        double deltaY = towardY - y;
        double magnitude = Math.Sqrt((deltaX * deltaX) + (deltaY * deltaY));
        if (magnitude < AxisEpsilon)
        {
            return (x, y, x + length, y);
        }

        return (x, y, x + (deltaX / magnitude * length), y + (deltaY / magnitude * length));
    }

    private static string PathData((double X1, double Y1, double X2, double Y2) segment)
    {
        string start = $"M {FormatCoordinate(segment.X1)} {FormatCoordinate(segment.Y1)}";
        if (Math.Abs(segment.Y1 - segment.Y2) < AxisEpsilon)
        {
            return $"{start} H {FormatCoordinate(segment.X2)}";
        }

        if (Math.Abs(segment.X1 - segment.X2) < AxisEpsilon)
        {
            return $"{start} V {FormatCoordinate(segment.Y2)}";
        }

        return $"{start} L {FormatCoordinate(segment.X2)} {FormatCoordinate(segment.Y2)}";
    }

    private static bool Contains(RowBand band, double y)
    {
        return y >= band.Y && y < band.Bottom;
    }

    private static string FormatCoordinate(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }
}

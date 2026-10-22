namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Shared inventory-forest resource-group frame geometry and ink (IDF-02–03).</summary>
public static class DiagramForestResourceGroupFrameStyle
{
    public const double Pad = 12.0d;

    public const double LabelBand = 18.0d;

    public const double LabelFontSize = 12.0d;

    public const double LabelInsetX = 8.0d;

    public const double LabelBaselineY = 14.0d;

    public const double CornerRadius = 8.0d;

    public const double StrokeWidth = 2.0d;

    public const string Fill = "#f1f5f9";

    public const string Stroke = "#64748b";

    public const string LabelFill = "#334155";

    public const string HaloFill = "#ffffff";

    public const string HaloStroke = "#cbd5e1";

    public const double HaloStrokeWidth = 1.0d;

    public const double HaloRadius = 3.0d;

    public const double HaloPaddingX = 4.0d;

    public const double HaloPaddingY = 2.0d;

    public static double HorizontalChrome => Pad * 2.0d;

    public static double VerticalChrome => LabelBand + Pad;
}

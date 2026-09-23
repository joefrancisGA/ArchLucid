namespace ArchLucid.Core.Diagrams;

/// <summary>
/// Shared inventory/architecture diagram node colors for Mermaid, Graphviz, and forest SVG emitters.
/// Keep in sync with <c>architecture-diagram-mermaid-config.ts</c>.
/// Honey <c>#D4A84B</c> is retired as a node fill; attention/status uses <c>StatusTag</c>, not diagram cards.
/// </summary>
public static class ArchitectureDiagramMermaidPalette
{
    public const string LightNodeFill = "#f8fafc";

    public const string LightNodeBorder = "#cbd5e1";

    public const string LightNodeText = "#0f172a";

    public const string LightNodeCaption = "#475569";

    public const string LightEdgeStroke = "#111827";

    public const string LightResourceGroupFrameStroke = "#64748b";

    public const string DarkNodeFill = "#334155";

    public const string DarkNodeBorder = "#cbd5e1";

    public const string DarkNodeText = "#f8fafc";

    public const string DarkNodeCaption = "#cbd5e1";

    public const string DarkEdgeStroke = "#e2e8f0";

    public const string DarkResourceGroupFrameStroke = "#64748b";
}

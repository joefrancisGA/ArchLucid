namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Reading-strip copy for inventory diagram PNG export (client strip must match).</summary>
public static class InfraEvidenceInventoryPngExportHonesty
{
    public const string LayoutEngineNotStored = "Layout engine was not stored.";
    public const string LayoutEngineStoredEmpty = "Layout engine was stored empty.";

    public static bool UsesGraphvizInventoryPngRaster(string? layoutEngine) =>
        string.Equals(layoutEngine, "inventory-forest", StringComparison.Ordinal)
        || string.Equals(layoutEngine, "graphviz-fdp", StringComparison.Ordinal);

    public static string DescribeGraphvizPngRaster(string layoutEngine) =>
        $"This PNG was redrawn with Graphviz (layout engine: {layoutEngine.Trim()}).";

    public static string DescribeMermaidCliPngRaster(string layoutEngine) =>
        $"This PNG was rasterized from Mermaid export layout (layout engine: {layoutEngine.Trim()}).";
}

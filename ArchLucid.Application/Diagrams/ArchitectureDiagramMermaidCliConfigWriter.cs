using System.Text.Json;

using ArchLucid.Core.Diagrams;

namespace ArchLucid.Application.Diagrams;

/// <summary>
/// Writes the Mermaid CLI config that mirrors browser <c>createArchitectureDiagramMermaidConfig(false)</c>.
/// </summary>
internal static class ArchitectureDiagramMermaidCliConfigWriter
{
    public static async Task WriteLightModeConfigAsync(string configPath, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(configPath);

        Dictionary<string, object?> config = new()
        {
            ["startOnLoad"] = false,
            ["suppressErrorRendering"] = true,
            ["theme"] = "neutral",
            ["securityLevel"] = "strict",
            ["fontFamily"] = "ui-sans-serif, system-ui, sans-serif",
            ["flowchart"] = new Dictionary<string, object?>
            {
                ["htmlLabels"] = false,
                ["curve"] = "linear",
                ["padding"] = 6,
                ["nodeSpacing"] = 16,
                ["rankSpacing"] = 20,
                ["wrappingWidth"] = 280,
                ["useMaxWidth"] = false,
            },
            ["themeVariables"] = new Dictionary<string, string>
            {
                ["fontSize"] = "15px",
                ["background"] = "transparent",
                ["primaryColor"] = ArchitectureDiagramMermaidPalette.LightNodeFill,
                ["mainBkg"] = ArchitectureDiagramMermaidPalette.LightNodeFill,
                ["clusterBkg"] = "transparent",
                ["clusterBorder"] = "#475569",
                ["primaryBorderColor"] = ArchitectureDiagramMermaidPalette.LightNodeBorder,
                ["lineColor"] = ArchitectureDiagramMermaidPalette.LightEdgeStroke,
                ["primaryTextColor"] = ArchitectureDiagramMermaidPalette.LightNodeText,
                ["secondaryTextColor"] = "#1e293b",
            },
        };

        string json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(configPath, json, cancellationToken);
    }
}

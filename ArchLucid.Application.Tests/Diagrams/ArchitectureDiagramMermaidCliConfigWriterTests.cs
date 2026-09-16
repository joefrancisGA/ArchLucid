using System.Text.Json;

using ArchLucid.Application.Diagrams;
using ArchLucid.Core.Diagrams;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Diagrams;

public sealed class ArchitectureDiagramMermaidCliConfigWriterTests
{
    [Fact]
    public async Task WriteLightModeConfigAsync_emits_neutral_theme_variables()
    {
        string configPath = Path.Combine(Path.GetTempPath(), $"mermaid-config-{Guid.NewGuid():N}.json");

        try
        {
            await ArchitectureDiagramMermaidCliConfigWriter.WriteLightModeConfigAsync(configPath, CancellationToken.None);

            using JsonDocument document = JsonDocument.Parse(await File.ReadAllTextAsync(configPath));
            JsonElement themeVariables = document.RootElement.GetProperty("themeVariables");

            themeVariables.GetProperty("primaryColor").GetString().Should().Be(ArchitectureDiagramMermaidPalette.LightNodeFill);
            themeVariables.GetProperty("mainBkg").GetString().Should().Be(ArchitectureDiagramMermaidPalette.LightNodeFill);
            themeVariables.GetProperty("primaryBorderColor").GetString().Should().Be(ArchitectureDiagramMermaidPalette.LightNodeBorder);
            themeVariables.GetProperty("lineColor").GetString().Should().Be(ArchitectureDiagramMermaidPalette.LightEdgeStroke);
        }
        finally
        {
            if (File.Exists(configPath))
            {
                File.Delete(configPath);
            }
        }
    }
}
